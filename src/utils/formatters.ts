/**
 * Utilitas Formatting & Export
 * Sistem Manajemen Keuangan Tabungan Siswa
 */

/**
 * Format angka nominal ke format mata uang Rupiah Indonesia
 * Contoh: 1250000 -> "Rp 1.250.000"
 */
export function formatRupiah(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return 'Rp 0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Dapatkan tanggal hari ini dalam format YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format tanggal ke format Indonesia DD/MM/YYYY
 * Contoh: "2026-08-27" -> "27/08/2026"
 */
export function formatTanggal(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) {
      // Jika format sudah YYYY-MM-DD
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const parts = dateStr.slice(0, 10).split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return String(dateStr);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Format tanggal dan waktu lengkap
 * Contoh: "27/08/2026 14:30:00"
 */
export function formatTanggalWaktu(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Export data array of objects ke CSV file yang siap diunduh
 */
export function exportToCsv(filename: string, data: Record<string, any>[]) {
  if (!data || !data.length) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = (val === null || val === undefined ? '' : String(val)).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // Add BOM for Excel UTF-8
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
