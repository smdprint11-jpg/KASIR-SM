import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Key,
  Phone,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAccount, UserRole } from '../../types';

export const UserManagementView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, showToast } = useApp();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('kasir');
  const [phone, setPhone] = useState('');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setUsername('');
    setPassword('123456');
    setRole('kasir');
    setPhone('');
    setIsOpenModal(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setPhone(user.phone || '');
    setIsOpenModal(true);
  };

  const handleSave = () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      showToast('Nama, Username, dan Password wajib diisi!', 'error');
      return;
    }

    if (editingId) {
      updateUser(editingId, {
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role,
        phone: phone.trim() || '-',
      });
      showToast(`Akun "${username.trim()}" berhasil diperbarui!`, 'success');
    } else {
      addUser({
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role,
        phone: phone.trim() || '-',
      });
      showToast(`Akun baru "${username.trim()}" (${role.toUpperCase()}) berhasil dibuat!`, 'success');
    }

    setIsOpenModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Kelola Akun & Hak Akses Pengguna
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Atur staf kasir, operator cetak, dan pemilik toko SM DIGITAL PRINTING
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>+ Tambah Akun Pengguna</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map(u => {
          const isMe = currentUser?.id === u.id;
          return (
            <div
              key={u.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${
                isMe
                  ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-sm font-black text-white dark:bg-blue-600">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">@{u.username}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      u.role === 'pemilik'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : u.role === 'kasir'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Password:</span>
                    <span className="font-mono font-bold">•••••• ({u.password})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Telepon:</span>
                    <span className="font-mono">{u.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terdaftar:</span>
                    <span>{u.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                {isMe ? (
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    ● Sedang Login
                  </span>
                ) : (
                  <span></span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus pengguna "${u.name}"?`)) {
                          deleteUser(u.id);
                          showToast(`Akun "${u.username}" berhasil dihapus.`, 'info');
                        }
                      }}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded dark:hover:bg-rose-950/40"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE & EDIT USER MODAL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}
              </h4>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Siti Rahmawati..."
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Username (Untuk Login):
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="kasir1..."
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Password:
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ketik password baru..."
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Peran & Hak Akses (Role):
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold capitalize dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="pemilik">👑 Pemilik (Full Akses Keuangan, Akun, Pengaturan & POS)</option>
                  <option value="kasir">💼 Kasir (POS Buat Nota, Pembayaran, Pelanggan, Kas Harian)</option>
                  <option value="operator">⚙️ Operator (Antrean Produksi, Cetak & Status Pengerjaan)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  No. WhatsApp:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsOpenModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Simpan Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
