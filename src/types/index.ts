/**
 * Tipe Data & Definisi TypeScript
 * Sistem Manajemen Keuangan Tabungan Siswa
 */

export type UserRole = 'ADMIN' | 'BENDAHARA' | 'WALI_KELAS' | 'SISWA';

export interface User {
  id_user: string;
  username: string;
  nama: string;
  role: UserRole;
  id_kelas?: string;
  status: 'AKTIF' | 'NONAKTIF' | string;
  no_tabungan?: string;
  id_siswa?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Siswa {
  id_siswa: string;
  nis: string;
  nisn: string;
  nama_siswa: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan' | string;
  tanggal_lahir: string;
  alamat: string;
  id_kelas: string;
  nama_kelas?: string;
  nama_orang_tua: string;
  no_hp_orang_tua: string;
  no_tabungan: string;
  status: 'AKTIF' | 'NONAKTIF' | string;
  total_setoran?: number;
  total_penarikan?: number;
  saldo: number;
  created_at?: string;
  updated_at?: string;
}

export interface Kelas {
  id_kelas: string;
  nama_kelas: string;
  tingkat: string;
  id_wali_kelas?: string;
  nama_wali_kelas?: string;
  wali_kelas?: string;
  tahun_ajaran: string;
  status: 'AKTIF' | 'NONAKTIF' | string;
  jumlah_siswa?: number;
  total_setoran?: number;
  total_penarikan?: number;
  total_saldo?: number;
}

export type JenisTransaksi = 'SETORAN' | 'PENARIKAN';
export type StatusTransaksi = 'AKTIF' | 'DIBATALKAN';

export interface Transaksi {
  id_transaksi: string;
  no_transaksi: string;
  tanggal: string;
  waktu: string;
  id_siswa: string;
  nis: string;
  nama_siswa: string;
  id_kelas: string;
  nama_kelas?: string;
  jenis_transaksi: JenisTransaksi;
  nominal: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  keterangan: string;
  id_user?: string;
  nama_petugas: string;
  status: StatusTransaksi;
  created_at?: string;
  setoran?: number;
  penarikan?: number;
}

export interface DashboardStats {
  total_siswa: number;
  total_saldo: number;
  total_setoran_bulan_ini: number;
  total_penarikan_bulan_ini: number;
  jumlah_transaksi_hari_ini: number;
}

export interface MonthlyChartData {
  bulan: string;
  ym: string;
  setoran: number;
  penarikan: number;
}

export interface ClassBalanceChartData {
  id_kelas: string;
  nama_kelas: string;
  total_saldo: number;
}

export interface TopStudentData {
  id_siswa: string;
  nis: string;
  nama_siswa: string;
  id_kelas: string;
  saldo: number;
}

export interface DashboardData {
  statistik: DashboardStats;
  grafik_bulanan: MonthlyChartData[];
  grafik_saldo_kelas: ClassBalanceChartData[];
  top_siswa: TopStudentData[];
  transaksi_terbaru: Transaksi[];
}

export interface BukuTabunganData {
  siswa: Siswa;
  transaksi: Transaksi[];
}

export interface LaporanKeuanganData {
  judul: string;
  tipe: string;
  periode?: string;
  ringkasan: {
    total_setoran: number;
    total_penarikan: number;
    selisih: number;
    jumlah_transaksi: number;
    total_saldo_mengendap: number;
  };
  transaksi: Transaksi[];
  rekap_siswa?: Siswa[];
  rekap_kelas?: Kelas[];
}

export interface LogAktivitas {
  id_log: string;
  timestamp: string;
  id_user: string;
  nama_user: string;
  role: string;
  aksi: string;
  aktivitas?: string;
  modul?: string;
  referensi?: string;
  detail: string;
  ip_address?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface SchoolProfile {
  nama_sekolah: string;
  alamat: string;
  alamat_sekolah?: string;
  telepon: string;
  email?: string;
  npsn?: string;
  kota?: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  tahun_ajaran_aktif?: string;
  bendahara: string;
  nip_bendahara: string;
  tampilkan_demo_login?: boolean;
}
