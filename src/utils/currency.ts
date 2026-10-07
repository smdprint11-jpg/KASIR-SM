export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function parseRupiahInput(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export function applyRounding(amount: number, rule: 'none' | '500' | '1000' | 'manual', manualRounding = 0): { roundedTotal: number; roundingDiff: number } {
  if (rule === 'manual') {
    return {
      roundedTotal: amount + manualRounding,
      roundingDiff: manualRounding,
    };
  }

  if (rule === 'none') {
    return { roundedTotal: amount, roundingDiff: 0 };
  }

  const factor = rule === '500' ? 500 : 1000;
  const remainder = amount % factor;
  if (remainder === 0) {
    return { roundedTotal: amount, roundingDiff: 0 };
  }

  const roundedTotal = amount + (factor - remainder);
  const roundingDiff = roundedTotal - amount;
  return { roundedTotal, roundingDiff };
}
