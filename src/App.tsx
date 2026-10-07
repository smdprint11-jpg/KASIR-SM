import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { CustomersView } from './components/customers/CustomersView';
import { CustomerReportView } from './components/customers/CustomerReportView';
import { CashflowView } from './components/cashflow/CashflowView';
import { ProductsView } from './components/products/ProductsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { FinancialReportView } from './components/finance/FinancialReportView';
import { UserManagementView } from './components/users/UserManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { AlertUnpaidModal } from './components/modals/AlertUnpaidModal';
import { ReceiptModal } from './components/receipt/ReceiptModal';
import { PublicOrderTrackerModal } from './components/modals/PublicOrderTrackerModal';
import { ToastContainer } from './components/layout/ToastContainer';

function AppContent() {
  const {
    currentUser,
    currentPage,
    setCurrentPage,
    selectedReceiptTransaction,
    setSelectedReceiptTransaction,
  } = useApp();

  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerInvoice, setTrackerInvoice] = useState<string | undefined>(undefined);

  // Check URL hash for tracking QR code scans e.g. #track?nota=SM-202610-001
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('track')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        const nota = params.get('nota');
        if (nota) {
          setTrackerInvoice(nota);
          setIsTrackerOpen(true);
        } else {
          setIsTrackerOpen(true);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenTracker = (invoice?: string) => {
    setTrackerInvoice(invoice);
    setIsTrackerOpen(true);
  };

  // If user is on landing page or not authenticated, render public Landing Page
  if (currentPage === 'landing' || !currentUser) {
    return (
      <>
        <LandingPage onOpenTracker={handleOpenTracker} />
        <PublicOrderTrackerModal
          isOpen={isTrackerOpen}
          initialInvoice={trackerInvoice}
          onClose={() => setIsTrackerOpen(false)}
        />
        {selectedReceiptTransaction && (
          <ReceiptModal
            transaction={selectedReceiptTransaction}
            onClose={() => setSelectedReceiptTransaction(null)}
          />
        )}
        <ToastContainer />
      </>
    );
  }

  // Authenticated App Workspace
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <div className="no-print">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-0 lg:pl-64 transition-all">
        {/* Top Header */}
        <div className="no-print">
          <Header onOpenQuickTrack={() => handleOpenTracker()} />
        </div>

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && <DashboardView />}
          {currentPage === 'pos' && <PosView />}
          {currentPage === 'transactions' && <TransactionsView />}
          {currentPage === 'customers' && <CustomersView />}
          {currentPage === 'customer-reports' && <CustomerReportView />}
          {currentPage === 'cashflow' && <CashflowView />}
          {currentPage === 'products' && <ProductsView />}
          {currentPage === 'expenses' && <ExpensesView />}
          {currentPage === 'financial-reports' && <FinancialReportView />}
          {currentPage === 'users' && <UserManagementView />}
          {currentPage === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <AlertUnpaidModal />
      <ToastContainer />

      {selectedReceiptTransaction && (
        <ReceiptModal
          transaction={selectedReceiptTransaction}
          onClose={() => setSelectedReceiptTransaction(null)}
        />
      )}

      <PublicOrderTrackerModal
        isOpen={isTrackerOpen}
        initialInvoice={trackerInvoice}
        onClose={() => setIsTrackerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
