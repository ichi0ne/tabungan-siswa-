/**
 * Mock Data Initializer for Seamless Offline & Live Preview
 * Berisi dataset awal yang sinkron persis dengan skema Google Sheets
 */
import { User, Siswa, Kelas, Transaksi, LogAktivitas } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id_user: 'USR-ADMIN-01',
    username: 'admin',
    nama: 'Administrator Utama',
    role: 'ADMIN',
    status: 'AKTIF',
    created_at: '2026-08-01 08:00:00',
    updated_at: '2026-08-01 08:00:00'
  },
  {
    id_user: 'USR-BENDAHARA-01',
    username: 'bendahara',
    nama: 'Ibu Siti Rahmawati, S.Pd',
    role: 'BENDAHARA',
    status: 'AKTIF',
    created_at: '2026-08-01 08:00:00',
    updated_at: '2026-08-01 08:00:00'
  },
  {
    id_user: 'USR-WALI-01',
    username: 'walikelas7a',
    nama: 'Bpk. Ahmad Fauzi, M.Pd',
    role: 'WALI_KELAS',
    id_kelas: 'KLS-01',
    status: 'AKTIF',
    created_at: '2026-08-01 08:00:00',
    updated_at: '2026-08-01 08:00:00'
  }
];

export const INITIAL_KELAS: Kelas[] = [
  {
    id_kelas: 'KLS-01',
    nama_kelas: 'VII-A',
    tingkat: '7',
    id_wali_kelas: 'USR-WALI-01',
    nama_wali_kelas: 'Bpk. Ahmad Fauzi, M.Pd',
    tahun_ajaran: '2025/2026',
    status: 'AKTIF',
    jumlah_siswa: 2,
    total_setoran: 850000,
    total_penarikan: 50000,
    total_saldo: 800000
  },
  {
    id_kelas: 'KLS-02',
    nama_kelas: 'VII-B',
    tingkat: '7',
    nama_wali_kelas: 'Ibu Nurul Hidayah, S.Pd',
    tahun_ajaran: '2025/2026',
    status: 'AKTIF',
    jumlah_siswa: 1,
    total_setoran: 200000,
    total_penarikan: 50000,
    total_saldo: 150000
  },
  {
    id_kelas: 'KLS-03',
    nama_kelas: 'VIII-A',
    tingkat: '8',
    nama_wali_kelas: 'Bpk. Budi Santoso, S.Si',
    tahun_ajaran: '2025/2026',
    status: 'AKTIF',
    jumlah_siswa: 1,
    total_setoran: 750000,
    total_penarikan: 100000,
    total_saldo: 650000
  },
  {
    id_kelas: 'KLS-04',
    nama_kelas: 'IX-A',
    tingkat: '9',
    nama_wali_kelas: 'Ibu Dewi Lestari, M.Pd',
    tahun_ajaran: '2025/2026',
    status: 'AKTIF',
    jumlah_siswa: 0,
    total_setoran: 0,
    total_penarikan: 0,
    total_saldo: 0
  }
];

export const INITIAL_SISWA: Siswa[] = [
  {
    id_siswa: 'SISWA-001',
    nis: '2025001',
    nisn: '0081234561',
    nama_siswa: 'Muhammad Rizky Pratama',
    jenis_kelamin: 'Laki-laki',
    tanggal_lahir: '2012-05-12',
    alamat: 'Jl. Melati No. 12, Kel. Sukamaju',
    id_kelas: 'KLS-01',
    nama_kelas: 'VII-A',
    nama_orang_tua: 'Bpk. Bambang Pratama',
    no_hp_orang_tua: '081234567890',
    no_tabungan: 'TAB-7A-001',
    status: 'AKTIF',
    total_setoran: 350000,
    total_penarikan: 50000,
    saldo: 300000,
    created_at: '2026-08-01 08:30:00',
    updated_at: '2026-08-27 09:15:00'
  },
  {
    id_siswa: 'SISWA-002',
    nis: '2025002',
    nisn: '0081234562',
    nama_siswa: 'Siti Aisyah Azzahra',
    jenis_kelamin: 'Perempuan',
    tanggal_lahir: '2012-08-20',
    alamat: 'Jl. Kenanga No. 45, Kel. Harapan',
    id_kelas: 'KLS-01',
    nama_kelas: 'VII-A',
    nama_orang_tua: 'Bpk. Joko Susilo',
    no_hp_orang_tua: '081298765432',
    no_tabungan: 'TAB-7A-002',
    status: 'AKTIF',
    total_setoran: 500000,
    total_penarikan: 0,
    saldo: 500000,
    created_at: '2026-08-01 08:35:00',
    updated_at: '2026-08-27 10:00:00'
  },
  {
    id_siswa: 'SISWA-003',
    nis: '2025003',
    nisn: '0081234563',
    nama_siswa: 'Dimas Arya Nugraha',
    jenis_kelamin: 'Laki-laki',
    tanggal_lahir: '2012-02-14',
    alamat: 'Jl. Mawar No. 8, Kel. Sukamaju',
    id_kelas: 'KLS-02',
    nama_kelas: 'VII-B',
    nama_orang_tua: 'Ibu Rina Wati',
    no_hp_orang_tua: '081345678901',
    no_tabungan: 'TAB-7B-003',
    status: 'AKTIF',
    total_setoran: 200000,
    total_penarikan: 50000,
    saldo: 150000,
    created_at: '2026-08-02 09:00:00',
    updated_at: '2026-08-26 14:00:00'
  },
  {
    id_siswa: 'SISWA-004',
    nis: '2025004',
    nisn: '0081234564',
    nama_siswa: 'Anisa Nur Rahmah',
    jenis_kelamin: 'Perempuan',
    tanggal_lahir: '2011-11-30',
    alamat: 'Jl. Dahlia No. 19, Kel. Cempaka',
    id_kelas: 'KLS-03',
    nama_kelas: 'VIII-A',
    nama_orang_tua: 'Bpk. Hendra Wijaya',
    no_hp_orang_tua: '081567890123',
    no_tabungan: 'TAB-8A-004',
    status: 'AKTIF',
    total_setoran: 750000,
    total_penarikan: 100000,
    saldo: 650000,
    created_at: '2026-08-02 09:15:00',
    updated_at: '2026-08-27 11:20:00'
  }
];

export const INITIAL_TRANSAKSI: Transaksi[] = [
  {
    id_transaksi: 'TRX-001',
    no_transaksi: 'ST-20260827-0001',
    tanggal: '2026-08-27',
    waktu: '08:30:15',
    id_siswa: 'SISWA-001',
    nis: '2025001',
    nama_siswa: 'Muhammad Rizky Pratama',
    id_kelas: 'KLS-01',
    nama_kelas: 'VII-A',
    jenis_transaksi: 'SETORAN',
    nominal: 350000,
    saldo_sebelum: 0,
    saldo_sesudah: 350000,
    keterangan: 'Setoran awal tabungan tahun ajaran baru',
    id_user: 'USR-ADMIN-01',
    nama_petugas: 'Administrator Utama',
    status: 'AKTIF',
    created_at: '2026-08-27 08:30:15'
  },
  {
    id_transaksi: 'TRX-002',
    no_transaksi: 'WD-20260827-0002',
    tanggal: '2026-08-27',
    waktu: '09:15:20',
    id_siswa: 'SISWA-001',
    nis: '2025001',
    nama_siswa: 'Muhammad Rizky Pratama',
    id_kelas: 'KLS-01',
    nama_kelas: 'VII-A',
    jenis_transaksi: 'PENARIKAN',
    nominal: 50000,
    saldo_sebelum: 350000,
    saldo_sesudah: 300000,
    keterangan: 'Pembelian buku paket sekolah',
    id_user: 'USR-BENDAHARA-01',
    nama_petugas: 'Ibu Siti Rahmawati, S.Pd',
    status: 'AKTIF',
    created_at: '2026-08-27 09:15:20'
  },
  {
    id_transaksi: 'TRX-003',
    no_transaksi: 'ST-20260827-0003',
    tanggal: '2026-08-27',
    waktu: '10:00:00',
    id_siswa: 'SISWA-002',
    nis: '2025002',
    nama_siswa: 'Siti Aisyah Azzahra',
    id_kelas: 'KLS-01',
    nama_kelas: 'VII-A',
    jenis_transaksi: 'SETORAN',
    nominal: 500000,
    saldo_sebelum: 0,
    saldo_sesudah: 500000,
    keterangan: 'Setoran tabungan rutin mingguan',
    id_user: 'USR-ADMIN-01',
    nama_petugas: 'Administrator Utama',
    status: 'AKTIF',
    created_at: '2026-08-27 10:00:00'
  },
  {
    id_transaksi: 'TRX-004',
    no_transaksi: 'ST-20260826-0001',
    tanggal: '2026-08-26',
    waktu: '11:20:45',
    id_siswa: 'SISWA-004',
    nis: '2025004',
    nama_siswa: 'Anisa Nur Rahmah',
    id_kelas: 'KLS-03',
    nama_kelas: 'VIII-A',
    jenis_transaksi: 'SETORAN',
    nominal: 750000,
    saldo_sebelum: 0,
    saldo_sesudah: 750000,
    keterangan: 'Tabungan persiapan study tour',
    id_user: 'USR-BENDAHARA-01',
    nama_petugas: 'Ibu Siti Rahmawati, S.Pd',
    status: 'AKTIF',
    created_at: '2026-08-26 11:20:45'
  },
  {
    id_transaksi: 'TRX-005',
    no_transaksi: 'WD-20260826-0002',
    tanggal: '2026-08-26',
    waktu: '14:05:10',
    id_siswa: 'SISWA-004',
    nis: '2025004',
    nama_siswa: 'Anisa Nur Rahmah',
    id_kelas: 'KLS-03',
    nama_kelas: 'VIII-A',
    jenis_transaksi: 'PENARIKAN',
    nominal: 100000,
    saldo_sebelum: 750000,
    saldo_sesudah: 650000,
    keterangan: 'Iuran kegiatan kepramukaan',
    id_user: 'USR-BENDAHARA-01',
    nama_petugas: 'Ibu Siti Rahmawati, S.Pd',
    status: 'AKTIF',
    created_at: '2026-08-26 14:05:10'
  }
];

export const INITIAL_LOGS: LogAktivitas[] = [
  {
    id_log: 'LOG-INIT-01',
    timestamp: '2026-08-27 08:00:00',
    id_user: 'SYSTEM',
    nama_user: 'Sistem Database',
    role: 'ADMIN',
    aksi: 'SETUP_DATABASE',
    aktivitas: 'SETUP_DATABASE',
    modul: 'SYSTEM',
    referensi: 'ALL_SHEETS',
    detail: 'Inisialisasi tabel database Google Sheets berhasil.',
    ip_address: '127.0.0.1'
  },
  {
    id_log: 'LOG-INIT-02',
    timestamp: '2026-08-27 08:30:15',
    id_user: 'USR-ADMIN-01',
    nama_user: 'Administrator Utama',
    role: 'ADMIN',
    aksi: 'CREATE_SETORAN',
    aktivitas: 'CREATE_SETORAN',
    modul: 'TABUNGAN',
    referensi: 'ST-20260827-0001',
    detail: 'Setoran Rp 350.000 untuk Muhammad Rizky Pratama (2025001)',
    ip_address: '192.168.1.10'
  },
  {
    id_log: 'LOG-INIT-03',
    timestamp: '2026-08-27 09:15:20',
    id_user: 'USR-BENDAHARA-01',
    nama_user: 'Ibu Siti Rahmawati, S.Pd',
    role: 'BENDAHARA',
    aksi: 'CREATE_PENARIKAN',
    aktivitas: 'CREATE_PENARIKAN',
    modul: 'TABUNGAN',
    referensi: 'WD-20260827-0002',
    detail: 'Penarikan Rp 50.000 untuk Muhammad Rizky Pratama (2025001)',
    ip_address: '192.168.1.12'
  }
];
