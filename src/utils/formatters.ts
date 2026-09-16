export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

export function getElapsedTimeMinutes(isoString: string): number {
  try {
    const start = new Date(isoString).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / (1000 * 60)));
  } catch {
    return 0;
  }
}
