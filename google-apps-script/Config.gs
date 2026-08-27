/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Config.gs
 * Pengaturan Umum, Nama Sheet, dan Inisialisasi Database Otomatis
 */

// Konfigurasi Nama Sheet Database Google Spreadsheet
var CONFIG = {
  APP_NAME: "Sistem Manajemen Keuangan Tabungan Siswa",
  VERSION: "1.0.0",
  SHEETS: {
    USERS: "USERS",
    SISWA: "SISWA",
    KELAS: "KELAS",
    TRANSAKSI: "TRANSAKSI",
    SALDO: "SALDO",
    TAHUN_AJARAN: "TAHUN_AJARAN",
    LOG_AKTIVITAS: "LOG_AKTIVITAS"
  },
  DEFAULT_ADMIN: {
    username: "admin",
    password: "admin123", // Catatan: Harap ubah password setelah instalasi
    nama: "Administrator Utama",
    role: "ADMIN"
  }
};

/**
 * Inisialisasi struktur database Google Sheets secara otomatis
 * Jalankan fungsi ini satu kali di Apps Script Editor saat instalasi awal.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Jalankan fungsi ini pada Spreadsheet Google aktif.");
  }

  // 1. Sheet USERS
  var usersHeaders = [
    "id_user", "username", "nama", "password", "role", "id_kelas", "status", "created_at", "updated_at"
  ];
  var sheetUsers = initSheetWithHeaders(ss, CONFIG.SHEETS.USERS, usersHeaders);
  
  // Masukkan admin default jika belum ada
  if (sheetUsers.getLastRow() === 1) {
    var nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    sheetUsers.appendRow([
      "USR-ADMIN-01",
      CONFIG.DEFAULT_ADMIN.username,
      CONFIG.DEFAULT_ADMIN.nama,
      CONFIG.DEFAULT_ADMIN.password,
      CONFIG.DEFAULT_ADMIN.role,
      "",
      "AKTIF",
      nowStr,
      nowStr
    ]);
    sheetUsers.appendRow([
      "USR-BENDAHARA-01",
      "bendahara",
      "Ibu Siti Rahmawati, S.Pd",
      "bendahara123",
      "BENDAHARA",
      "",
      "AKTIF",
      nowStr,
      nowStr
    ]);
    sheetUsers.appendRow([
      "USR-WALI-01",
      "walikelas7a",
      "Bpk. Ahmad Fauzi, M.Pd",
      "wali123",
      "WALI_KELAS",
      "KLS-01",
      "AKTIF",
      nowStr,
      nowStr
    ]);
  }

  // 2. Sheet KELAS
  var kelasHeaders = [
    "id_kelas", "nama_kelas", "tingkat", "id_wali_kelas", "nama_wali_kelas", "tahun_ajaran", "status"
  ];
  var sheetKelas = initSheetWithHeaders(ss, CONFIG.SHEETS.KELAS, kelasHeaders);
  if (sheetKelas.getLastRow() === 1) {
    sheetKelas.appendRow(["KLS-01", "VII-A", "7", "USR-WALI-01", "Bpk. Ahmad Fauzi, M.Pd", "2025/2026", "AKTIF"]);
    sheetKelas.appendRow(["KLS-02", "VII-B", "7", "", "Ibu Nurul Hidayah, S.Pd", "2025/2026", "AKTIF"]);
    sheetKelas.appendRow(["KLS-03", "VIII-A", "8", "", "Bpk. Budi Santoso, S.Si", "2025/2026", "AKTIF"]);
    sheetKelas.appendRow(["KLS-04", "IX-A", "9", "", "Ibu Dewi Lestari, M.Pd", "2025/2026", "AKTIF"]);
  }

  // 3. Sheet TAHUN_AJARAN
  var taHeaders = ["id", "tahun_ajaran", "tanggal_mulai", "tanggal_selesai", "status"];
  var sheetTA = initSheetWithHeaders(ss, CONFIG.SHEETS.TAHUN_AJARAN, taHeaders);
  if (sheetTA.getLastRow() === 1) {
    sheetTA.appendRow(["TA-01", "2025/2026", "2025-07-15", "2026-06-20", "AKTIF"]);
    sheetTA.appendRow(["TA-02", "2024/2025", "2024-07-15", "2025-06-20", "SELESAI"]);
  }

  // 4. Sheet SISWA
  var siswaHeaders = [
    "id_siswa", "nis", "nisn", "nama_siswa", "jenis_kelamin", "tanggal_lahir",
    "alamat", "id_kelas", "nama_orang_tua", "no_hp_orang_tua", "no_tabungan", "status", "created_at", "updated_at"
  ];
  var sheetSiswa = initSheetWithHeaders(ss, CONFIG.SHEETS.SISWA, siswaHeaders);
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  if (sheetSiswa.getLastRow() === 1) {
    sheetSiswa.appendRow([
      "SISWA-001", "2025001", "0081234561", "Muhammad Rizky Pratama", "Laki-laki", "2012-05-12",
      "Jl. Melati No. 12, Kel. Sukamaju", "KLS-01", "Bpk. Bambang Pratama", "081234567890", "TAB-7A-001", "AKTIF", now, now
    ]);
    sheetSiswa.appendRow([
      "SISWA-002", "2025002", "0081234562", "Siti Aisyah Azzahra", "Perempuan", "2012-08-20",
      "Jl. Kenanga No. 45, Kel. Harapan", "KLS-01", "Bpk. Joko Susilo", "081298765432", "TAB-7A-002", "AKTIF", now, now
    ]);
    sheetSiswa.appendRow([
      "SISWA-003", "2025003", "0081234563", "Dimas Arya Nugraha", "Laki-laki", "2012-02-14",
      "Jl. Mawar No. 8, Kel. Sukamaju", "KLS-02", "Ibu Rina Wati", "081345678901", "TAB-7B-003", "AKTIF", now, now
    ]);
    sheetSiswa.appendRow([
      "SISWA-004", "2025004", "0081234564", "Anisa Nur Rahmah", "Perempuan", "2011-11-30",
      "Jl. Dahlia No. 19, Kel. Cempaka", "KLS-03", "Bpk. Hendra Wijaya", "081567890123", "TAB-8A-004", "AKTIF", now, now
    ]);
  }

  // 5. Sheet SALDO
  var saldoHeaders = [
    "id_siswa", "nis", "nama_siswa", "id_kelas", "total_setoran", "total_penarikan", "saldo", "updated_at"
  ];
  var sheetSaldo = initSheetWithHeaders(ss, CONFIG.SHEETS.SALDO, saldoHeaders);
  if (sheetSaldo.getLastRow() === 1) {
    sheetSaldo.appendRow(["SISWA-001", "2025001", "Muhammad Rizky Pratama", "KLS-01", 350000, 50000, 300000, now]);
    sheetSaldo.appendRow(["SISWA-002", "2025002", "Siti Aisyah Azzahra", "KLS-01", 500000, 0, 500000, now]);
    sheetSaldo.appendRow(["SISWA-003", "2025003", "Dimas Arya Nugraha", "KLS-02", 200000, 50000, 150000, now]);
    sheetSaldo.appendRow(["SISWA-004", "2025004", "Anisa Nur Rahmah", "KLS-03", 750000, 100000, 650000, now]);
  }

  // 6. Sheet TRANSAKSI
  var transaksiHeaders = [
    "id_transaksi", "no_transaksi", "tanggal", "waktu", "id_siswa", "nis",
    "nama_siswa", "id_kelas", "jenis_transaksi", "nominal", "saldo_sebelum",
    "saldo_sesudah", "keterangan", "id_user", "nama_petugas", "status", "created_at"
  ];
  var sheetTransaksi = initSheetWithHeaders(ss, CONFIG.SHEETS.TRANSAKSI, transaksiHeaders);
  if (sheetTransaksi.getLastRow() === 1) {
    var todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    var timeStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");
    
    sheetTransaksi.appendRow([
      "TRX-001", "ST-20260827-0001", todayStr, timeStr, "SISWA-001", "2025001",
      "Muhammad Rizky Pratama", "KLS-01", "SETORAN", 350000, 0, 350000,
      "Setoran awal tabungan tahun ajaran baru", "USR-ADMIN-01", "Administrator Utama", "AKTIF", now
    ]);
    sheetTransaksi.appendRow([
      "TRX-002", "WD-20260827-0002", todayStr, timeStr, "SISWA-001", "2025001",
      "Muhammad Rizky Pratama", "KLS-01", "PENARIKAN", 50000, 350000, 300000,
      "Pembelian buku paket sekolah", "USR-BENDAHARA-01", "Ibu Siti Rahmawati, S.Pd", "AKTIF", now
    ]);
    sheetTransaksi.appendRow([
      "TRX-003", "ST-20260827-0003", todayStr, timeStr, "SISWA-002", "2025002",
      "Siti Aisyah Azzahra", "KLS-01", "SETORAN", 500000, 0, 500000,
      "Setoran tabungan rutin", "USR-ADMIN-01", "Administrator Utama", "AKTIF", now
    ]);
  }

  // 7. Sheet LOG_AKTIVITAS
  var logHeaders = [
    "id_log", "timestamp", "id_user", "nama_user", "aktivitas", "modul", "referensi", "detail"
  ];
  var sheetLog = initSheetWithHeaders(ss, CONFIG.SHEETS.LOG_AKTIVITAS, logHeaders);
  if (sheetLog.getLastRow() === 1) {
    sheetLog.appendRow([
      "LOG-INIT-01", now, "SYSTEM", "Sistem Database", "SETUP_DATABASE", "SYSTEM", "ALL_SHEETS", "Inisialisasi tabel Google Sheets berhasil."
    ]);
  }

  Logger.log("Database Google Sheets berhasil disiapkan sepenuhnya!");
}

/**
 * Helper pembuat sheet dan format header baris pertama
 */
function initSheetWithHeaders(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e293b");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}
