/**
 * File raw source untuk Google Apps Script All-In-One
 * Digunakan untuk fitur 1-Klik Salin Kode di halaman Pengaturan
 */
export const APPS_SCRIPT_ALL_IN_ONE_CODE = `/**
 * SISTEM MANAJEMEN KEUANGAN TABUNGAN SISWA - GOOGLE APPS SCRIPT (ALL-IN-ONE SINGLE FILE)
 * Salin dan tempelkan (PASTE) seluruh kode ini ke Google Apps Script Editor.
 */

var CONFIG = {
  APP_NAME: "Aplikasi Tabungan Siswa",
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
    password: "admin123",
    nama: "Administrator Utama",
    role: "ADMIN"
  }
};

function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty("SPREADSHEET_ID");
    if (sheetId) ss = SpreadsheetApp.openById(sheetId);
  }
  if (!ss) throw new Error("Spreadsheet tidak ditemukan. Pastikan script terhubung dengan Google Sheets.");
  return ss;
}

function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("Sheet '" + name + "' tidak ditemukan. Jalankan setupDatabase() terlebih dahulu.");
  return sheet;
}

function generateId(prefix) {
  var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMddHHmmss");
  var randomNum = Math.floor(1000 + Math.random() * 9000);
  return (prefix || "ID") + "-" + timestamp + "-" + randomNum;
}

function generateTransactionNumber(type) {
  var prefix = type === "PENARIKAN" ? "WD" : "ST";
  var dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
  var sheet = getSheet(CONFIG.SHEETS.TRANSAKSI);
  var lastRow = sheet.getLastRow();
  var countToday = 1;

  if (lastRow > 1) {
    var data = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      var noTrx = String(data[i][0] || "");
      if (noTrx.indexOf(prefix + "-" + dateStr) === 0) countToday++;
    }
  }

  var sequence = ("0000" + countToday).slice(-4);
  return prefix + "-" + dateStr + "-" + sequence;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRowById(sheet, idColumnIndex, idValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var columnValues = sheet.getRange(2, idColumnIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < columnValues.length; i++) {
    if (String(columnValues[i][0]) === String(idValue)) return i + 2;
  }
  return -1;
}

function logActivity(userId, userName, activity, modul, reference, detail) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.LOG_AKTIVITAS);
    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var logId = generateId("LOG");
    sheet.appendRow([
      logId, now, userId || "ANONYMOUS", userName || "Pengguna",
      activity || "UNKNOWN_ACTION", modul || "GENERAL", reference || "-",
      typeof detail === "object" ? JSON.stringify(detail) : String(detail || "")
    ]);
  } catch (err) {
    Logger.log("Gagal menulis log aktivitas: " + err.message);
  }
}

function formatCurrency(val) {
  var num = Number(val) || 0;
  return "Rp " + num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
}

function formatDate(d) {
  if (!d) return "";
  var dateObj = (d instanceof Date) ? d : new Date(d);
  return Utilities.formatDate(dateObj, "Asia/Jakarta", "yyyy-MM-dd");
}

function parseBody(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { return {}; }
  }
  if (e.parameter) return e.parameter;
  return {};
}

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Jalankan fungsi ini pada Spreadsheet Google aktif.");

  var usersHeaders = ["id_user", "username", "nama", "password", "role", "id_kelas", "status", "created_at", "updated_at"];
  var sheetUsers = initSheetWithHeaders(ss, CONFIG.SHEETS.USERS, usersHeaders);
  if (sheetUsers.getLastRow() === 1) {
    var nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    sheetUsers.appendRow(["USR-ADMIN-01", CONFIG.DEFAULT_ADMIN.username, CONFIG.DEFAULT_ADMIN.nama, CONFIG.DEFAULT_ADMIN.password, CONFIG.DEFAULT_ADMIN.role, "", "AKTIF", nowStr, nowStr]);
    sheetUsers.appendRow(["USR-BENDAHARA-01", "bendahara", "Ibu Siti Rahmawati, S.Pd", "bendahara123", "BENDAHARA", "", "AKTIF", nowStr, nowStr]);
    sheetUsers.appendRow(["USR-WALI-01", "walikelas7a", "Bpk. Ahmad Fauzi, M.Pd", "wali123", "WALI_KELAS", "KLS-01", "AKTIF", nowStr, nowStr]);
  }

  var kelasHeaders = ["id_kelas", "nama_kelas", "tingkat", "id_wali_kelas", "nama_wali_kelas", "tahun_ajaran", "status"];
  var sheetKelas = initSheetWithHeaders(ss, CONFIG.SHEETS.KELAS, kelasHeaders);
  if (sheetKelas.getLastRow() === 1) {
    sheetKelas.appendRow(["KLS-01", "VII-A", "7", "USR-WALI-01", "Bpk. Ahmad Fauzi, M.Pd", "2025/2026", "AKTIF"]);
    sheetKelas.appendRow(["KLS-02", "VII-B", "7", "", "Ibu Nurul Hidayah, S.Pd", "2025/2026", "AKTIF"]);
    sheetKelas.appendRow(["KLS-03", "VIII-A", "8", "", "Bpk. Budi Santoso, S.Si", "2025/2026", "AKTIF"]);
    sheetKelas.appendRow(["KLS-04", "IX-A", "9", "", "Ibu Dewi Lestari, M.Pd", "2025/2026", "AKTIF"]);
  }

  var taHeaders = ["id", "tahun_ajaran", "tanggal_mulai", "tanggal_selesai", "status"];
  var sheetTA = initSheetWithHeaders(ss, CONFIG.SHEETS.TAHUN_AJARAN, taHeaders);
  if (sheetTA.getLastRow() === 1) {
    sheetTA.appendRow(["TA-01", "2025/2026", "2025-07-15", "2026-06-20", "AKTIF"]);
    sheetTA.appendRow(["TA-02", "2024/2025", "2024-07-15", "2025-06-20", "SELESAI"]);
  }

  var siswaHeaders = ["id_siswa", "nis", "nisn", "nama_siswa", "jenis_kelamin", "tanggal_lahir", "alamat", "id_kelas", "nama_orang_tua", "no_hp_orang_tua", "no_tabungan", "status", "created_at", "updated_at"];
  var sheetSiswa = initSheetWithHeaders(ss, CONFIG.SHEETS.SISWA, siswaHeaders);
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  if (sheetSiswa.getLastRow() === 1) {
    sheetSiswa.appendRow(["SISWA-001", "2025001", "0081234561", "Muhammad Rizky Pratama", "Laki-laki", "2012-05-12", "Jl. Melati No. 12, Kel. Sukamaju", "KLS-01", "Bpk. Bambang Pratama", "081234567890", "TAB-7A-001", "AKTIF", now, now]);
    sheetSiswa.appendRow(["SISWA-002", "2025002", "0081234562", "Siti Aisyah Azzahra", "Perempuan", "2012-08-20", "Jl. Kenanga No. 45, Kel. Harapan", "KLS-01", "Bpk. Joko Susilo", "081298765432", "TAB-7A-002", "AKTIF", now, now]);
    sheetSiswa.appendRow(["SISWA-003", "2025003", "0081234563", "Dimas Arya Nugraha", "Laki-laki", "2012-02-14", "Jl. Mawar No. 8, Kel. Sukamaju", "KLS-02", "Ibu Rina Wati", "081345678901", "TAB-7B-003", "AKTIF", now, now]);
    sheetSiswa.appendRow(["SISWA-004", "2025004", "0081234564", "Anisa Nur Rahmah", "Perempuan", "2011-11-30", "Jl. Dahlia No. 19, Kel. Cempaka", "KLS-03", "Bpk. Hendra Wijaya", "081567890123", "TAB-8A-004", "AKTIF", now, now]);
  }

  var saldoHeaders = ["id_siswa", "nis", "nama_siswa", "id_kelas", "total_setoran", "total_penarikan", "saldo", "updated_at"];
  var sheetSaldo = initSheetWithHeaders(ss, CONFIG.SHEETS.SALDO, saldoHeaders);
  if (sheetSaldo.getLastRow() === 1) {
    sheetSaldo.appendRow(["SISWA-001", "2025001", "Muhammad Rizky Pratama", "KLS-01", 350000, 50000, 300000, now]);
    sheetSaldo.appendRow(["SISWA-002", "2025002", "Siti Aisyah Azzahra", "KLS-01", 500000, 0, 500000, now]);
    sheetSaldo.appendRow(["SISWA-003", "2025003", "Dimas Arya Nugraha", "KLS-02", 200000, 50000, 150000, now]);
    sheetSaldo.appendRow(["SISWA-004", "2025004", "Anisa Nur Rahmah", "KLS-03", 750000, 100000, 650000, now]);
  }

  var transaksiHeaders = ["id_transaksi", "no_transaksi", "tanggal", "waktu", "id_siswa", "nis", "nama_siswa", "id_kelas", "jenis_transaksi", "nominal", "saldo_sebelum", "saldo_sesudah", "keterangan", "id_user", "nama_petugas", "status", "created_at"];
  var sheetTransaksi = initSheetWithHeaders(ss, CONFIG.SHEETS.TRANSAKSI, transaksiHeaders);
  if (sheetTransaksi.getLastRow() === 1) {
    var todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    var timeStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");
    sheetTransaksi.appendRow(["TRX-001", "ST-20260827-0001", todayStr, timeStr, "SISWA-001", "2025001", "Muhammad Rizky Pratama", "KLS-01", "SETORAN", 350000, 0, 350000, "Setoran awal tabungan", "USR-ADMIN-01", "Administrator Utama", "AKTIF", now]);
    sheetTransaksi.appendRow(["TRX-002", "WD-20260827-0002", todayStr, timeStr, "SISWA-001", "2025001", "Muhammad Rizky Pratama", "KLS-01", "PENARIKAN", 50000, 350000, 300000, "Pembelian buku", "USR-BENDAHARA-01", "Ibu Siti Rahmawati, S.Pd", "AKTIF", now]);
    sheetTransaksi.appendRow(["TRX-003", "ST-20260827-0003", todayStr, timeStr, "SISWA-002", "2025002", "Siti Aisyah Azzahra", "KLS-01", "SETORAN", 500000, 0, 500000, "Setoran rutin", "USR-ADMIN-01", "Administrator Utama", "AKTIF", now]);
  }

  var logHeaders = ["id_log", "timestamp", "id_user", "nama_user", "aktivitas", "modul", "referensi", "detail"];
  var sheetLog = initSheetWithHeaders(ss, CONFIG.SHEETS.LOG_AKTIVITAS, logHeaders);
  if (sheetLog.getLastRow() === 1) {
    sheetLog.appendRow(["LOG-INIT-01", now, "SYSTEM", "Sistem Database", "SETUP_DATABASE", "SYSTEM", "ALL_SHEETS", "Inisialisasi tabel Google Sheets berhasil."]);
  }

  Logger.log("Database Google Sheets berhasil disiapkan!");
}

function initSheetWithHeaders(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
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

function handleLogin(payload) {
  var username = String(payload.username || "").trim();
  var password = String(payload.password || "").trim();
  if (!username || !password) return { success: false, message: "Username dan password wajib diisi." };

  var sheetUsers = getSheet(CONFIG.SHEETS.USERS);
  var lastRow = sheetUsers.getLastRow();
  if (lastRow > 1) {
    var values = sheetUsers.getRange(2, 1, lastRow - 1, 9).getValues();
    for (var i = 0; i < values.length; i++) {
      var uId = values[i][0];
      var uName = String(values[i][1]).trim();
      var uPass = String(values[i][3]).trim();
      var uNamaLengkap = values[i][2];
      var uRole = values[i][4];
      var uIdKelas = values[i][5];
      var uStatus = values[i][6];

      if (uName.toLowerCase() === username.toLowerCase()) {
        if (uPass !== password) return { success: false, message: "Password yang Anda masukkan salah." };
        if (String(uStatus).toUpperCase() !== "AKTIF") return { success: false, message: "Akun non-aktif." };

        logActivity(uId, uNamaLengkap, "LOGIN", "AUTH", uName, "Login berhasil sebagai " + uRole);
        return {
          success: true,
          message: "Login berhasil.",
          data: {
            user: { id_user: uId, username: uName, nama: uNamaLengkap, role: uRole, id_kelas: uIdKelas, status: uStatus },
            token: "SESSION-" + Utilities.base64Encode(uId + ":" + new Date().getTime())
          }
        };
      }
    }
  }

  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa > 1) {
    var siswaValues = sheetSiswa.getRange(2, 1, lastRowSiswa - 1, 12).getValues();
    for (var j = 0; j < siswaValues.length; j++) {
      var sId = siswaValues[j][0];
      var sNis = String(siswaValues[j][1]).trim();
      var sNama = siswaValues[j][3];
      var sIdKelas = siswaValues[j][7];
      var sNoTab = siswaValues[j][10];
      var sStatus = siswaValues[j][11];

      if (sNis.toLowerCase() === username.toLowerCase() && (password === sNis || password === "siswa123")) {
        if (String(sStatus).toUpperCase() !== "AKTIF") return { success: false, message: "Status siswa tidak aktif." };
        logActivity(sId, sNama, "LOGIN", "AUTH", sNis, "Siswa login");
        return {
          success: true,
          message: "Login siswa berhasil.",
          data: {
            user: { id_user: sId, id_siswa: sId, username: sNis, nama: sNama, role: "SISWA", id_kelas: sIdKelas, no_tabungan: sNoTab, status: sStatus },
            token: "SESSION-SISWA-" + Utilities.base64Encode(sId + ":" + new Date().getTime())
          }
        };
      }
    }
  }
  return { success: false, message: "Username atau NIS tidak ditemukan." };
}

function getUsers(payload) {
  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, data: [] };
  var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var users = [];
  for (var i = 0; i < values.length; i++) {
    users.push({ id_user: values[i][0], username: values[i][1], nama: values[i][2], role: values[i][4], id_kelas: values[i][5], status: values[i][6], created_at: values[i][7], updated_at: values[i][8] });
  }
  return { success: true, data: users };
}

function createUser(payload, operatorUser) {
  var username = String(payload.username || "").trim();
  var nama = String(payload.nama || "").trim();
  var password = String(payload.password || "").trim();
  var role = String(payload.role || "WALI_KELAS").trim().toUpperCase();
  var idKelas = String(payload.id_kelas || "").trim();
  var status = String(payload.status || "AKTIF").trim().toUpperCase();

  if (!username || !nama || !password) return { success: false, message: "Form belum lengkap." };
  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var idUser = generateId("USR");
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([idUser, username, nama, password, role, idKelas, status, now, now]);
  logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Admin", "CREATE_USER", "PENGGUNA", idUser, "Tambah user: " + username);
  return { success: true, message: "Pengguna berhasil ditambahkan.", data: { id_user: idUser } };
}

function updateUser(payload, operatorUser) {
  var idUser = String(payload.id_user || "").trim();
  if (!idUser) return { success: false, message: "ID Pengguna wajib disertakan." };
  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var rowIndex = findRowById(sheet, 1, idUser);
  if (rowIndex === -1) return { success: false, message: "Pengguna tidak ditemukan." };
  var rowData = sheet.getRange(rowIndex, 1, 1, 9).getValues()[0];
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  var username = payload.username !== undefined ? String(payload.username).trim() : rowData[1];
  var nama = payload.nama !== undefined ? String(payload.nama).trim() : rowData[2];
  var password = payload.password ? String(payload.password).trim() : rowData[3];
  var role = payload.role !== undefined ? String(payload.role).trim() : rowData[4];
  var idKelas = payload.id_kelas !== undefined ? String(payload.id_kelas).trim() : rowData[5];
  var status = payload.status !== undefined ? String(payload.status).trim() : rowData[6];
  sheet.getRange(rowIndex, 2, 1, 8).setValues([[username, nama, password, role, idKelas, status, rowData[7], now]]);
  logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Admin", "UPDATE_USER", "PENGGUNA", idUser, "Update user: " + username);
  return { success: true, message: "Data pengguna berhasil diperbarui." };
}

function deleteUser(payload, operatorUser) {
  var idUser = String(payload.id_user || "").trim();
  if (!idUser) return { success: false, message: "ID Pengguna wajib disertakan." };
  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var rowIndex = findRowById(sheet, 1, idUser);
  if (rowIndex === -1) return { success: false, message: "Pengguna tidak ditemukan." };
  var rowData = sheet.getRange(rowIndex, 1, 1, 9).getValues()[0];
  var username = rowData[1];
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  if (payload.permanent === true) {
    sheet.deleteRow(rowIndex);
    logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Admin", "DELETE_USER", "PENGGUNA", idUser, "Hapus permanen user: " + username);
    return { success: true, message: "Akun pengguna '" + username + "' berhasil dihapus permanen." };
  }

  sheet.getRange(rowIndex, 7, 1, 3).setValues([["NONAKTIF", rowData[7], now]]);
  logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Admin", "UPDATE_USER", "PENGGUNA", idUser, "Nonaktifkan user: " + username);
  return { success: true, message: "Akun pengguna '" + username + "' berhasil dinonaktifkan." };
}

function getSiswa(params) {
  params = params || {};
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);
  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa <= 1) return { success: true, data: [] };

  var kelasMap = {};
  var lastRowKelas = sheetKelas.getLastRow();
  if (lastRowKelas > 1) {
    var kValues = sheetKelas.getRange(2, 1, lastRowKelas - 1, 2).getValues();
    for (var k = 0; k < kValues.length; k++) kelasMap[kValues[k][0]] = kValues[k][1];
  }

  var saldoMap = {};
  var lastRowSaldo = sheetSaldo.getLastRow();
  if (lastRowSaldo > 1) {
    var sValues = sheetSaldo.getRange(2, 1, lastRowSaldo - 1, 7).getValues();
    for (var s = 0; s < sValues.length; s++) {
      saldoMap[sValues[s][0]] = { total_setoran: Number(sValues[s][4]) || 0, total_penarikan: Number(sValues[s][5]) || 0, saldo: Number(sValues[s][6]) || 0 };
    }
  }

  var values = sheetSiswa.getRange(2, 1, lastRowSiswa - 1, 14).getValues();
  var result = [];
  var filterKelas = params.id_kelas ? String(params.id_kelas).trim() : "";
  var filterStatus = params.status ? String(params.status).trim().toUpperCase() : "";
  var search = params.search ? String(params.search).trim().toLowerCase() : "";

  for (var i = 0; i < values.length; i++) {
    var idSiswa = values[i][0];
    var nis = String(values[i][1]);
    var nisn = String(values[i][2]);
    var namaSiswa = String(values[i][3]);
    var jk = values[i][4];
    var tglLahir = formatDate(values[i][5]);
    var alamat = values[i][6];
    var idKelas = String(values[i][7]);
    var namaOrtu = values[i][8];
    var noHpOrtu = String(values[i][9]);
    var noTabungan = String(values[i][10]);
    var status = String(values[i][11]);
    var createdAt = values[i][12];
    var updatedAt = values[i][13];

    if (filterKelas && idKelas !== filterKelas) continue;
    if (filterStatus && status.toUpperCase() !== filterStatus) continue;
    if (search) {
      var match = nis.toLowerCase().indexOf(search) !== -1 || nisn.toLowerCase().indexOf(search) !== -1 || namaSiswa.toLowerCase().indexOf(search) !== -1 || noTabungan.toLowerCase().indexOf(search) !== -1;
      if (!match) continue;
    }

    var studentSaldo = saldoMap[idSiswa] || { total_setoran: 0, total_penarikan: 0, saldo: 0 };
    result.push({
      id_siswa: idSiswa, nis: nis, nisn: nisn, nama_siswa: namaSiswa, jenis_kelamin: jk,
      tanggal_lahir: tglLahir, alamat: alamat, id_kelas: idKelas, nama_kelas: kelasMap[idKelas] || idKelas,
      nama_orang_tua: namaOrtu, no_hp_orang_tua: noHpOrtu, no_tabungan: noTabungan, status: status,
      total_setoran: studentSaldo.total_setoran, total_penarikan: studentSaldo.total_penarikan, saldo: studentSaldo.saldo,
      created_at: createdAt, updated_at: updatedAt
    });
  }
  return { success: true, data: result };
}

function getSiswaById(idSiswa) {
  if (!idSiswa) return { success: false, message: "ID Siswa wajib disertakan." };
  var res = getSiswa({ search: "" });
  if (!res.success) return res;
  for (var i = 0; i < res.data.length; i++) {
    if (res.data[i].id_siswa === idSiswa || res.data[i].nis === idSiswa) return { success: true, data: res.data[i] };
  }
  return { success: false, message: "Siswa tidak ditemukan." };
}

function createSiswa(payload, operatorUser) {
  var nis = String(payload.nis || "").trim();
  var nisn = String(payload.nisn || "").trim();
  var namaSiswa = String(payload.nama_siswa || "").trim();
  var jk = String(payload.jenis_kelamin || "Laki-laki").trim();
  var tglLahir = String(payload.tanggal_lahir || "").trim();
  var alamat = String(payload.alamat || "").trim();
  var idKelas = String(payload.id_kelas || "").trim();
  var namaOrtu = String(payload.nama_orang_tua || "").trim();
  var noHpOrtu = String(payload.no_hp_orang_tua || "").trim();
  var noTabungan = String(payload.no_tabungan || "").trim();
  var status = String(payload.status || "AKTIF").trim().toUpperCase();

  if (!nis || !namaSiswa || !idKelas) return { success: false, message: "NIS, Nama Siswa, dan Kelas wajib diisi." };
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var lastRow = sheetSiswa.getLastRow();

  if (lastRow > 1) {
    var existingNis = sheetSiswa.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingNis.length; i++) {
      if (String(existingNis[i][0]).trim() === nis) return { success: false, message: "NIS '" + nis + "' sudah terdaftar." };
    }
  }

  if (!noTabungan) {
    var randCode = Math.floor(1000 + Math.random() * 9000);
    noTabungan = "TAB-" + (idKelas.replace("KLS-", "") || "SCH") + "-" + nis.slice(-4) + "-" + randCode;
  }

  var idSiswa = generateId("SISWA");
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  sheetSiswa.appendRow([idSiswa, nis, nisn, namaSiswa, jk, tglLahir, alamat, idKelas, namaOrtu, noHpOrtu, noTabungan, status, now, now]);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  sheetSaldo.appendRow([idSiswa, nis, namaSiswa, idKelas, 0, 0, 0, now]);

  logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Petugas", "CREATE_SISWA", "SISWA", idSiswa, "Tambah siswa: " + namaSiswa);
  return { success: true, message: "Data siswa berhasil ditambahkan.", data: { id_siswa: idSiswa, nis: nis, nama_siswa: namaSiswa, no_tabungan: noTabungan } };
}

function updateSiswa(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  if (!idSiswa) return { success: false, message: "ID Siswa wajib disertakan." };

  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var rowIndex = findRowById(sheetSiswa, 1, idSiswa);
  if (rowIndex === -1) return { success: false, message: "Data siswa tidak ditemukan." };

  var rowData = sheetSiswa.getRange(rowIndex, 1, 1, 14).getValues()[0];
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  var nis = payload.nis !== undefined ? String(payload.nis).trim() : rowData[1];
  var nisn = payload.nisn !== undefined ? String(payload.nisn).trim() : rowData[2];
  var namaSiswa = payload.nama_siswa !== undefined ? String(payload.nama_siswa).trim() : rowData[3];
  var jk = payload.jenis_kelamin !== undefined ? String(payload.jenis_kelamin).trim() : rowData[4];
  var tglLahir = payload.tanggal_lahir !== undefined ? String(payload.tanggal_lahir).trim() : rowData[5];
  var alamat = payload.alamat !== undefined ? String(payload.alamat).trim() : rowData[6];
  var idKelas = payload.id_kelas !== undefined ? String(payload.id_kelas).trim() : rowData[7];
  var namaOrtu = payload.nama_orang_tua !== undefined ? String(payload.nama_orang_tua).trim() : rowData[8];
  var noHpOrtu = payload.no_hp_orang_tua !== undefined ? String(payload.no_hp_orang_tua).trim() : rowData[9];
  var noTabungan = payload.no_tabungan !== undefined ? String(payload.no_tabungan).trim() : rowData[10];
  var status = payload.status !== undefined ? String(payload.status).trim() : rowData[11];

  sheetSiswa.getRange(rowIndex, 2, 1, 13).setValues([[nis, nisn, namaSiswa, jk, tglLahir, alamat, idKelas, namaOrtu, noHpOrtu, noTabungan, status, rowData[12], now]]);

  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var saldoRow = findRowById(sheetSaldo, 1, idSiswa);
  if (saldoRow !== -1) {
    sheetSaldo.getRange(saldoRow, 2, 1, 3).setValues([[nis, namaSiswa, idKelas]]);
  }

  logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Petugas", "UPDATE_SISWA", "SISWA", idSiswa, "Update siswa: " + namaSiswa);
  return { success: true, message: "Data siswa berhasil diperbarui." };
}

function deleteSiswa(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  if (!idSiswa) return { success: false, message: "ID Siswa wajib disertakan." };
  return updateSiswa({ id_siswa: idSiswa, status: "NONAKTIF" }, operatorUser);
}

function getKelas(params) {
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var lastRowKelas = sheetKelas.getLastRow();
  if (lastRowKelas <= 1) return { success: true, data: [] };

  var countSiswaMap = {};
  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa > 1) {
    var siswaValues = sheetSiswa.getRange(2, 8, lastRowSiswa - 1, 5).getValues();
    for (var s = 0; s < siswaValues.length; s++) {
      if (String(siswaValues[s][4]).toUpperCase() === "AKTIF") {
        countSiswaMap[siswaValues[s][0]] = (countSiswaMap[siswaValues[s][0]] || 0) + 1;
      }
    }
  }

  var totalSaldoMap = {};
  var totalSetoranMap = {};
  var totalPenarikanMap = {};
  var lastRowSaldo = sheetSaldo.getLastRow();
  if (lastRowSaldo > 1) {
    var saldoValues = sheetSaldo.getRange(2, 4, lastRowSaldo - 1, 4).getValues();
    for (var b = 0; b < saldoValues.length; b++) {
      var salKelas = saldoValues[b][0];
      totalSaldoMap[salKelas] = (totalSaldoMap[salKelas] || 0) + (Number(saldoValues[b][3]) || 0);
      totalSetoranMap[salKelas] = (totalSetoranMap[salKelas] || 0) + (Number(saldoValues[b][1]) || 0);
      totalPenarikanMap[salKelas] = (totalPenarikanMap[salKelas] || 0) + (Number(saldoValues[b][2]) || 0);
    }
  }

  var values = sheetKelas.getRange(2, 1, lastRowKelas - 1, 7).getValues();
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var idKelas = values[i][0];
    result.push({
      id_kelas: idKelas,
      nama_kelas: values[i][1],
      tingkat: values[i][2],
      id_wali_kelas: values[i][3],
      nama_wali_kelas: values[i][4],
      tahun_ajaran: values[i][5],
      status: values[i][6],
      jumlah_siswa: countSiswaMap[idKelas] || 0,
      total_setoran: totalSetoranMap[idKelas] || 0,
      total_penarikan: totalPenarikanMap[idKelas] || 0,
      total_saldo: totalSaldoMap[idKelas] || 0
    });
  }
  return { success: true, data: result };
}

function createKelas(payload, operatorUser) {
  var namaKelas = String(payload.nama_kelas || "").trim();
  var tingkat = String(payload.tingkat || "").trim();
  var idWali = String(payload.id_wali_kelas || "").trim();
  var namaWali = String(payload.nama_wali_kelas || "").trim();
  var tahunAjaran = String(payload.tahun_ajaran || "2025/2026").trim();
  var status = String(payload.status || "AKTIF").trim().toUpperCase();

  if (!namaKelas) return { success: false, message: "Nama kelas wajib diisi." };
  var sheet = getSheet(CONFIG.SHEETS.KELAS);
  var idKelas = generateId("KLS");
  sheet.appendRow([idKelas, namaKelas, tingkat, idWali, namaWali, tahunAjaran, status]);
  return { success: true, message: "Kelas berhasil ditambahkan.", data: { id_kelas: idKelas } };
}

function updateKelas(payload, operatorUser) {
  var idKelas = String(payload.id_kelas || "").trim();
  if (!idKelas) return { success: false, message: "ID Kelas wajib disertakan." };
  var sheet = getSheet(CONFIG.SHEETS.KELAS);
  var rowIndex = findRowById(sheet, 1, idKelas);
  if (rowIndex === -1) return { success: false, message: "Kelas tidak ditemukan." };
  var rowData = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
  var namaKelas = payload.nama_kelas !== undefined ? String(payload.nama_kelas).trim() : rowData[1];
  var tingkat = payload.tingkat !== undefined ? String(payload.tingkat).trim() : rowData[2];
  var idWali = payload.id_wali_kelas !== undefined ? String(payload.id_wali_kelas).trim() : rowData[3];
  var namaWali = payload.nama_wali_kelas !== undefined ? String(payload.nama_wali_kelas).trim() : rowData[4];
  var tahunAjaran = payload.tahun_ajaran !== undefined ? String(payload.tahun_ajaran).trim() : rowData[5];
  var status = payload.status !== undefined ? String(payload.status).trim() : rowData[6];
  sheet.getRange(rowIndex, 2, 1, 6).setValues([[namaKelas, tingkat, idWali, namaWali, tahunAjaran, status]]);
  logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Petugas", "UPDATE_KELAS", "KELAS", idKelas, "Update kelas: " + namaKelas);
  return { success: true, message: "Data kelas berhasil diperbarui." };
}

function deleteKelas(payload, operatorUser) {
  var idKelas = String(payload.id_kelas || "").trim();
  if (!idKelas) return { success: false, message: "ID Kelas wajib disertakan." };
  var sheet = getSheet(CONFIG.SHEETS.KELAS);
  var rowIndex = findRowById(sheet, 1, idKelas);
  if (rowIndex === -1) return { success: false, message: "Kelas tidak ditemukan." };
  var rowData = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
  var namaKelas = rowData[1];

  if (payload.permanent === true) {
    sheet.deleteRow(rowIndex);
    logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Admin", "DELETE_KELAS", "KELAS", idKelas, "Hapus permanen kelas: " + namaKelas);
    return { success: true, message: "Kelas '" + namaKelas + "' berhasil dihapus permanen." };
  }

  sheet.getRange(rowIndex, 7).setValue("NONAKTIF");
  logActivity(operatorUser ? operatorUser.id_user : "SYSTEM", operatorUser ? operatorUser.nama : "Petugas", "UPDATE_KELAS", "KELAS", idKelas, "Nonaktifkan kelas: " + namaKelas);
  return { success: true, message: "Kelas '" + namaKelas + "' berhasil dinonaktifkan." };
}

function createSetoran(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  var nominal = Number(payload.nominal) || 0;
  var tanggal = payload.tanggal ? String(payload.tanggal).trim() : Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  var keterangan = String(payload.keterangan || "Setoran tabungan").trim();

  if (!idSiswa) return { success: false, message: "Pilih siswa terlebih dahulu." };
  if (nominal <= 0) return { success: false, message: "Nominal setoran harus lebih besar dari 0." };

  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: "Server sibuk. Coba lagi." }; }

  try {
    var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
    var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
    var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

    var siswaRow = findRowById(sheetSiswa, 1, idSiswa);
    if (siswaRow === -1) return { success: false, message: "Data siswa tidak ditemukan." };

    var siswaData = sheetSiswa.getRange(siswaRow, 1, 1, 12).getValues()[0];
    var nis = siswaData[1];
    var namaSiswa = siswaData[3];
    var idKelas = siswaData[7];

    var saldoRow = findRowById(sheetSaldo, 1, idSiswa);
    var saldoSebelum = 0;
    var totalSetoranLama = 0;
    var totalPenarikanLama = 0;
    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    if (saldoRow !== -1) {
      var saldoData = sheetSaldo.getRange(saldoRow, 1, 1, 8).getValues()[0];
      totalSetoranLama = Number(saldoData[4]) || 0;
      totalPenarikanLama = Number(saldoData[5]) || 0;
      saldoSebelum = Number(saldoData[6]) || 0;
    } else {
      sheetSaldo.appendRow([idSiswa, nis, namaSiswa, idKelas, 0, 0, 0, now]);
      saldoRow = sheetSaldo.getLastRow();
    }

    var saldoSesudah = saldoSebelum + nominal;
    var totalSetoranBaru = totalSetoranLama + nominal;
    var noTransaksi = generateTransactionNumber("SETORAN");
    var idTransaksi = generateId("TRX");
    var waktu = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");

    var petId = operatorUser ? operatorUser.id_user : "SYSTEM";
    var petNama = operatorUser ? operatorUser.nama : "Petugas Tabungan";

    sheetTransaksi.appendRow([idTransaksi, noTransaksi, tanggal, waktu, idSiswa, nis, namaSiswa, idKelas, "SETORAN", nominal, saldoSebelum, saldoSesudah, keterangan, petId, petNama, "AKTIF", now]);
    sheetSaldo.getRange(saldoRow, 5, 1, 4).setValues([[totalSetoranBaru, totalPenarikanLama, saldoSesudah, now]]);

    logActivity(petId, petNama, "CREATE_SETORAN", "TABUNGAN", noTransaksi, "Setoran " + formatCurrency(nominal) + " untuk " + namaSiswa);

    return {
      success: true,
      message: "Setoran tabungan berhasil disimpan.",
      data: {
        id_transaksi: idTransaksi, no_transaksi: noTransaksi, tanggal: tanggal, waktu: waktu,
        id_siswa: idSiswa, nis: nis, nama_siswa: namaSiswa, id_kelas: idKelas,
        jenis_transaksi: "SETORAN", nominal: nominal, saldo_sebelum: saldoSebelum, saldo_sesudah: saldoSesudah,
        keterangan: keterangan, nama_petugas: petNama
      }
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses setoran: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function createPenarikan(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  var nominal = Number(payload.nominal) || 0;
  var tanggal = payload.tanggal ? String(payload.tanggal).trim() : Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  var keterangan = String(payload.keterangan || "Penarikan tabungan").trim();

  if (!idSiswa) return { success: false, message: "Pilih siswa terlebih dahulu." };
  if (nominal <= 0) return { success: false, message: "Nominal penarikan harus lebih besar dari 0." };

  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: "Server sibuk. Coba lagi." }; }

  try {
    var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
    var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
    var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

    var siswaRow = findRowById(sheetSiswa, 1, idSiswa);
    if (siswaRow === -1) return { success: false, message: "Data siswa tidak ditemukan." };

    var siswaData = sheetSiswa.getRange(siswaRow, 1, 1, 12).getValues()[0];
    var nis = siswaData[1];
    var namaSiswa = siswaData[3];
    var idKelas = siswaData[7];

    var saldoRow = findRowById(sheetSaldo, 1, idSiswa);
    var saldoSebelum = 0;
    var totalSetoranLama = 0;
    var totalPenarikanLama = 0;
    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    if (saldoRow !== -1) {
      var saldoData = sheetSaldo.getRange(saldoRow, 1, 1, 8).getValues()[0];
      totalSetoranLama = Number(saldoData[4]) || 0;
      totalPenarikanLama = Number(saldoData[5]) || 0;
      saldoSebelum = Number(saldoData[6]) || 0;
    } else {
      return { success: false, message: "Saldo tidak mencukupi" };
    }

    if (nominal > saldoSebelum) {
      return { success: false, message: "Saldo tidak mencukupi. Saldo saat ini: " + formatCurrency(saldoSebelum) };
    }

    var saldoSesudah = saldoSebelum - nominal;
    var totalPenarikanBaru = totalPenarikanLama + nominal;
    var noTransaksi = generateTransactionNumber("PENARIKAN");
    var idTransaksi = generateId("TRX");
    var waktu = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");

    var petId = operatorUser ? operatorUser.id_user : "SYSTEM";
    var petNama = operatorUser ? operatorUser.nama : "Petugas Tabungan";

    sheetTransaksi.appendRow([idTransaksi, noTransaksi, tanggal, waktu, idSiswa, nis, namaSiswa, idKelas, "PENARIKAN", nominal, saldoSebelum, saldoSesudah, keterangan, petId, petNama, "AKTIF", now]);
    sheetSaldo.getRange(saldoRow, 5, 1, 4).setValues([[totalSetoranLama, totalPenarikanBaru, saldoSesudah, now]]);

    logActivity(petId, petNama, "CREATE_PENARIKAN", "TABUNGAN", noTransaksi, "Penarikan " + formatCurrency(nominal) + " untuk " + namaSiswa);

    return {
      success: true,
      message: "Penarikan tabungan berhasil diproses.",
      data: {
        id_transaksi: idTransaksi, no_transaksi: noTransaksi, tanggal: tanggal, waktu: waktu,
        id_siswa: idSiswa, nis: nis, nama_siswa: namaSiswa, id_kelas: idKelas,
        jenis_transaksi: "PENARIKAN", nominal: nominal, saldo_sebelum: saldoSebelum, saldo_sesudah: saldoSesudah,
        keterangan: keterangan, nama_petugas: petNama
      }
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses penarikan: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function cancelTransaksi(payload, operatorUser) {
  var idTransaksi = String(payload.id_transaksi || "").trim();
  var alasan = String(payload.alasan || "Pembatalan oleh petugas").trim();
  if (!idTransaksi) return { success: false, message: "ID Transaksi wajib disertakan." };

  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: "Server sibuk." }; }

  try {
    var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);
    var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
    var trxRow = findRowById(sheetTransaksi, 1, idTransaksi);
    if (trxRow === -1) return { success: false, message: "Transaksi tidak ditemukan." };

    var trxData = sheetTransaksi.getRange(trxRow, 1, 1, 17).getValues()[0];
    var noTrx = trxData[1];
    var idSiswa = trxData[4];
    var namaSiswa = trxData[6];
    var jenisTrx = String(trxData[8]).toUpperCase();
    var nominal = Number(trxData[9]) || 0;
    var statusTrx = String(trxData[15]).toUpperCase();

    if (statusTrx === "DIBATALKAN") return { success: false, message: "Transaksi sudah dibatalkan." };

    var saldoRow = findRowById(sheetSaldo, 1, idSiswa);
    if (saldoRow === -1) return { success: false, message: "Data saldo tidak ditemukan." };

    var saldoData = sheetSaldo.getRange(saldoRow, 1, 1, 8).getValues()[0];
    var totalSetoran = Number(saldoData[4]) || 0;
    var totalPenarikan = Number(saldoData[5]) || 0;
    var currentSaldo = Number(saldoData[6]) || 0;

    var newTotalSetoran = totalSetoran;
    var newTotalPenarikan = totalPenarikan;
    var newSaldo = currentSaldo;

    if (jenisTrx === "SETORAN") {
      if (currentSaldo < nominal) return { success: false, message: "Saldo tidak mencukupi untuk membatalkan setoran." };
      newTotalSetoran = Math.max(0, totalSetoran - nominal);
      newSaldo = currentSaldo - nominal;
    } else if (jenisTrx === "PENARIKAN") {
      newTotalPenarikan = Math.max(0, totalPenarikan - nominal);
      newSaldo = currentSaldo + nominal;
    }

    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var cancellerName = operatorUser ? operatorUser.nama : "Petugas";

    sheetTransaksi.getRange(trxRow, 13).setValue(trxData[12] + " [DIBATALKAN: " + alasan + " oleh " + cancellerName + " pada " + now + "]");
    sheetTransaksi.getRange(trxRow, 16).setValue("DIBATALKAN");
    sheetSaldo.getRange(saldoRow, 5, 1, 4).setValues([[newTotalSetoran, newTotalPenarikan, newSaldo, now]]);

    return { success: true, message: "Transaksi berhasil dibatalkan.", data: { no_transaksi: noTrx, saldo_baru: newSaldo } };
  } catch (err) {
    return { success: false, message: "Gagal membatalkan transaksi: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function getBukuTabungan(params) {
  var idSiswa = params.id_siswa ? String(params.id_siswa).trim() : "";
  if (!idSiswa) return { success: false, message: "ID Siswa wajib disertakan." };

  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

  var siswaRow = findRowById(sheetSiswa, 1, idSiswa);
  if (siswaRow === -1) return { success: false, message: "Data siswa tidak ditemukan." };

  var siswaData = sheetSiswa.getRange(siswaRow, 1, 1, 12).getValues()[0];
  var idKelas = siswaData[7];
  var namaKelas = idKelas;
  var kelasRow = findRowById(sheetKelas, 1, idKelas);
  if (kelasRow !== -1) namaKelas = sheetKelas.getRange(kelasRow, 2).getValue() || idKelas;

  var saldoTerkini = 0;
  var totalSetoran = 0;
  var totalPenarikan = 0;
  var saldoRow = findRowById(sheetSaldo, 1, idSiswa);
  if (saldoRow !== -1) {
    var salVal = sheetSaldo.getRange(saldoRow, 5, 1, 3).getValues()[0];
    totalSetoran = Number(salVal[0]) || 0;
    totalPenarikan = Number(salVal[1]) || 0;
    saldoTerkini = Number(salVal[2]) || 0;
  }

  var lastRowTrx = sheetTransaksi.getLastRow();
  var transaksiList = [];
  var filterStart = params.start_date ? String(params.start_date).trim() : "";
  var filterEnd = params.end_date ? String(params.end_date).trim() : "";

  if (lastRowTrx > 1) {
    var trxValues = sheetTransaksi.getRange(2, 1, lastRowTrx - 1, 17).getValues();
    for (var i = 0; i < trxValues.length; i++) {
      var row = trxValues[i];
      if (String(row[4]) === idSiswa) {
        var tgl = formatDate(row[2]);
        if (filterStart && tgl < filterStart) continue;
        if (filterEnd && tgl > filterEnd) continue;
        var jenis = String(row[8]).toUpperCase();
        var nominal = Number(row[9]) || 0;

        transaksiList.push({
          id_transaksi: row[0], no_transaksi: row[1], tanggal: tgl, waktu: row[3],
          jenis_transaksi: jenis, setoran: jenis === "SETORAN" ? nominal : 0, penarikan: jenis === "PENARIKAN" ? nominal : 0,
          nominal: nominal, saldo_sebelum: Number(row[10]) || 0, saldo_sesudah: Number(row[11]) || 0,
          keterangan: row[12], nama_petugas: row[14], status: row[15], created_at: row[16]
        });
      }
    }
  }

  return {
    success: true,
    data: {
      siswa: {
        id_siswa: siswaData[0], nis: siswaData[1], nisn: siswaData[2], nama_siswa: siswaData[3],
        id_kelas: idKelas, nama_kelas: namaKelas, no_tabungan: siswaData[10],
        total_setoran: totalSetoran, total_penarikan: totalPenarikan, saldo: saldoTerkini, status: siswaData[11]
      },
      transaksi: transaksiList
    }
  };
}

function getTransaksi(params) {
  params = params || {};
  var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);
  var lastRow = sheetTransaksi.getLastRow();
  if (lastRow <= 1) return { success: true, data: [] };

  var values = sheetTransaksi.getRange(2, 1, lastRow - 1, 17).getValues();
  var result = [];
  var filterKelas = params.id_kelas ? String(params.id_kelas).trim() : "";
  var filterSiswa = params.id_siswa ? String(params.id_siswa).trim() : "";
  var filterJenis = params.jenis_transaksi ? String(params.jenis_transaksi).trim().toUpperCase() : "";
  var filterStatus = params.status ? String(params.status).trim().toUpperCase() : "";
  var filterStart = params.start_date ? String(params.start_date).trim() : "";
  var filterEnd = params.end_date ? String(params.end_date).trim() : "";
  var search = params.search ? String(params.search).trim().toLowerCase() : "";

  for (var i = values.length - 1; i >= 0; i--) {
    var row = values[i];
    var tgl = formatDate(row[2]);
    var idSiswa = String(row[4]);
    var nis = String(row[5]);
    var namaSiswa = String(row[6]);
    var idKelas = String(row[7]);
    var jenis = String(row[8]).toUpperCase();
    var noTrx = String(row[1]);
    var status = String(row[15]).toUpperCase();

    if (filterKelas && idKelas !== filterKelas) continue;
    if (filterSiswa && idSiswa !== filterSiswa && nis !== filterSiswa) continue;
    if (filterJenis && jenis !== filterJenis) continue;
    if (filterStatus && status !== filterStatus) continue;
    if (filterStart && tgl < filterStart) continue;
    if (filterEnd && tgl > filterEnd) continue;
    if (search) {
      var match = noTrx.toLowerCase().indexOf(search) !== -1 || namaSiswa.toLowerCase().indexOf(search) !== -1 || nis.toLowerCase().indexOf(search) !== -1;
      if (!match) continue;
    }

    result.push({
      id_transaksi: row[0], no_transaksi: noTrx, tanggal: tgl, waktu: row[3],
      id_siswa: idSiswa, nis: nis, nama_siswa: namaSiswa, id_kelas: idKelas,
      jenis_transaksi: jenis, nominal: Number(row[9]) || 0,
      saldo_sebelum: Number(row[10]) || 0, saldo_sesudah: Number(row[11]) || 0,
      keterangan: row[12], nama_petugas: row[14], status: status, created_at: row[16]
    });
  }
  return { success: true, data: result };
}

function getDashboard(params) {
  params = params || {};
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

  var now = new Date();
  var todayStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
  var currentYearMonth = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM");

  var totalSiswa = 0;
  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa > 1) {
    var siswaStatus = sheetSiswa.getRange(2, 12, lastRowSiswa - 1, 1).getValues();
    for (var s = 0; s < siswaStatus.length; s++) {
      if (String(siswaStatus[s][0]).toUpperCase() === "AKTIF") totalSiswa++;
    }
  }

  var totalSaldo = 0;
  var top10Siswa = [];
  var lastRowSaldo = sheetSaldo.getLastRow();
  if (lastRowSaldo > 1) {
    var saldoValues = sheetSaldo.getRange(2, 1, lastRowSaldo - 1, 7).getValues();
    var allSaldoList = [];
    for (var b = 0; b < saldoValues.length; b++) {
      var sal = Number(saldoValues[b][6]) || 0;
      totalSaldo += sal;
      allSaldoList.push({ id_siswa: saldoValues[b][0], nis: saldoValues[b][1], nama_siswa: saldoValues[b][2], id_kelas: saldoValues[b][3], saldo: sal });
    }
    allSaldoList.sort(function(a, b) { return b.saldo - a.saldo; });
    top10Siswa = allSaldoList.slice(0, 10);
  }

  var kelasMap = {};
  var saldoPerKelasMap = {};
  var lastRowKelas = sheetKelas.getLastRow();
  if (lastRowKelas > 1) {
    var kelasValues = sheetKelas.getRange(2, 1, lastRowKelas - 1, 2).getValues();
    for (var k = 0; k < kelasValues.length; k++) {
      kelasMap[kelasValues[k][0]] = kelasValues[k][1];
      saldoPerKelasMap[kelasValues[k][0]] = 0;
    }
  }

  if (lastRowSaldo > 1) {
    var sVal = sheetSaldo.getRange(2, 4, lastRowSaldo - 1, 4).getValues();
    for (var sv = 0; sv < sVal.length; sv++) {
      var kId = sVal[sv][0];
      saldoPerKelasMap[kId] = (saldoPerKelasMap[kId] || 0) + (Number(sVal[sv][3]) || 0);
    }
  }

  var grafikSaldoKelas = [];
  for (var kKey in saldoPerKelasMap) {
    grafikSaldoKelas.push({ id_kelas: kKey, nama_kelas: kelasMap[kKey] || kKey, total_saldo: saldoPerKelasMap[kKey] });
  }

  var totalSetoranBulanIni = 0;
  var totalPenarikanBulanIni = 0;
  var jumlahTransaksiHariIni = 0;
  var monthlyMap = {};
  var recentTransaksi = [];

  for (var m = 5; m >= 0; m--) {
    var d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    var ym = Utilities.formatDate(d, "Asia/Jakarta", "yyyy-MM");
    var label = Utilities.formatDate(d, "Asia/Jakarta", "MMM yyyy");
    monthlyMap[ym] = { bulan: label, ym: ym, setoran: 0, penarikan: 0 };
  }

  var lastRowTrx = sheetTransaksi.getLastRow();
  if (lastRowTrx > 1) {
    var trxValues = sheetTransaksi.getRange(2, 1, lastRowTrx - 1, 17).getValues();
    for (var t = 0; t < trxValues.length; t++) {
      var row = trxValues[t];
      var tgl = formatDate(row[2]);
      var jenis = String(row[8]).toUpperCase();
      var nominal = Number(row[9]) || 0;
      var status = String(row[15]).toUpperCase();

      if (status === "AKTIF") {
        if (tgl === todayStr) jumlahTransaksiHariIni++;
        var ymTrx = tgl.slice(0, 7);
        if (ymTrx === currentYearMonth) {
          if (jenis === "SETORAN") totalSetoranBulanIni += nominal;
          if (jenis === "PENARIKAN") totalPenarikanBulanIni += nominal;
        }
        if (monthlyMap[ymTrx]) {
          if (jenis === "SETORAN") monthlyMap[ymTrx].setoran += nominal;
          if (jenis === "PENARIKAN") monthlyMap[ymTrx].penarikan += nominal;
        }
      }
    }

    for (var r = trxValues.length - 1; r >= Math.max(0, trxValues.length - 10); r--) {
      var tr = trxValues[r];
      recentTransaksi.push({
        id_transaksi: tr[0], no_transaksi: tr[1], tanggal: formatDate(tr[2]), waktu: tr[3],
        nama_siswa: tr[6], id_kelas: tr[7], nama_kelas: kelasMap[tr[7]] || tr[7],
        jenis_transaksi: tr[8], nominal: Number(tr[9]) || 0, nama_petugas: tr[14], status: tr[15]
      });
    }
  }

  var grafikBulanan = [];
  for (var ymKey in monthlyMap) grafikBulanan.push(monthlyMap[ymKey]);

  return {
    success: true,
    data: {
      statistik: {
        total_siswa: totalSiswa, total_saldo: totalSaldo,
        total_setoran_bulan_ini: totalSetoranBulanIni, total_penarikan_bulan_ini: totalPenarikanBulanIni,
        jumlah_transaksi_hari_ini: jumlahTransaksiHariIni
      },
      grafik_bulanan: grafikBulanan,
      grafik_saldo_kelas: grafikSaldoKelas,
      top_siswa: top10Siswa,
      transaksi_terbaru: recentTransaksi
    }
  };
}

function getLaporan(params) {
  params = params || {};
  var tipe = params.tipe || "bulanan";
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);

  var trxResult = getTransaksi(params);
  var allTrx = trxResult.success ? trxResult.data : [];
  var filteredTrx = [];
  var title = "Laporan Keuangan Tabungan";
  var rekapSiswa = null;

  var totalSaldoMengendap = 0;
  var lastRowSaldo = sheetSaldo.getLastRow();
  if (lastRowSaldo > 1) {
    var salVals = sheetSaldo.getRange(2, 7, lastRowSaldo - 1, 1).getValues();
    for (var s = 0; s < salVals.length; s++) {
      totalSaldoMengendap += Number(salVals[s][0]) || 0;
    }
  }

  if (tipe === "harian") {
    var dateTarget = params.tanggal ? String(params.tanggal).trim() : Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    for (var i = 0; i < allTrx.length; i++) {
      if (allTrx[i].tanggal === dateTarget) {
        filteredTrx.push(allTrx[i]);
      }
    }
    title = "Laporan Harian (" + dateTarget + ")";
  } else if (tipe === "bulanan") {
    var now = new Date();
    var b = params.bulan ? Number(params.bulan) : now.getMonth() + 1;
    var y = params.tahun ? Number(params.tahun) : now.getFullYear();
    var prefix = y + "-" + (b < 10 ? "0" + b : b);
    for (var j = 0; j < allTrx.length; j++) {
      if (allTrx[j].tanggal && allTrx[j].tanggal.indexOf(prefix) === 0) {
        filteredTrx.push(allTrx[j]);
      }
    }
    title = "Laporan Bulanan (" + prefix + ")";
  } else if (tipe === "kelas") {
    var kId = params.id_kelas ? String(params.id_kelas).trim() : "";
    for (var k = 0; k < allTrx.length; k++) {
      if (!kId || allTrx[k].id_kelas === kId) {
        filteredTrx.push(allTrx[k]);
      }
    }
    var siswaRes = getSiswa({ id_kelas: kId });
    if (siswaRes.success) rekapSiswa = siswaRes.data;
    title = "Laporan Tabungan Kelas " + (kId || "Semua");
  } else if (tipe === "rekap_saldo" || tipe === "SALDO") {
    title = "Rekapitulasi Saldo Seluruh Siswa";
    var sRes = getSiswa(params);
    if (sRes.success) rekapSiswa = sRes.data;
    filteredTrx = allTrx;
  } else {
    filteredTrx = allTrx;
  }

  var totalSetoran = 0;
  var totalPenarikan = 0;
  for (var m = 0; m < filteredTrx.length; m++) {
    var tItem = filteredTrx[m];
    if (String(tItem.status).toUpperCase() === "AKTIF") {
      if (String(tItem.jenis_transaksi).toUpperCase() === "SETORAN") totalSetoran += Number(tItem.nominal) || 0;
      if (String(tItem.jenis_transaksi).toUpperCase() === "PENARIKAN") totalPenarikan += Number(tItem.nominal) || 0;
    }
  }

  return {
    success: true,
    data: {
      judul: title,
      tipe: tipe,
      ringkasan: {
        total_setoran: totalSetoran,
        total_penarikan: totalPenarikan,
        selisih: totalSetoran - totalPenarikan,
        jumlah_transaksi: filteredTrx.length,
        total_saldo_mengendap: totalSaldoMengendap
      },
      transaksi: filteredTrx,
      rekap_siswa: rekapSiswa
    }
  };
}

function getLogs(params) {
  var sheet = getSheet(CONFIG.SHEETS.LOG_AKTIVITAS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, data: [] };
  var values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var logs = [];
  for (var i = values.length - 1; i >= Math.max(0, values.length - 100); i--) {
    logs.push({
      id_log: values[i][0], timestamp: values[i][1], id_user: values[i][2],
      nama_user: values[i][3], aktivitas: values[i][4], modul: values[i][5],
      referensi: values[i][6], detail: values[i][7]
    });
  }
  return { success: true, data: logs };
}

function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || "";
    var responseData;

    switch (action) {
      case "ping":
      case "health":
        responseData = { success: true, message: "API Google Apps Script Tabungan Siswa aktif & siap digunakan.", version: CONFIG.VERSION, timestamp: new Date().toISOString() };
        break;
      case "getDashboard": responseData = getDashboard(params); break;
      case "getSiswa": responseData = getSiswa(params); break;
      case "getSiswaById": responseData = getSiswaById(params.id_siswa || params.id); break;
      case "getKelas": responseData = getKelas(params); break;
      case "getTransaksi": responseData = getTransaksi(params); break;
      case "getSaldo": responseData = getSiswa(params); break;
      case "getBukuTabungan": responseData = getBukuTabungan(params); break;
      case "getLaporan": responseData = getLaporan(params); break;
      case "getUsers": responseData = getUsers(params); break;
      case "getLogs": responseData = getLogs(params); break;
      case "setup":
      case "setupDatabase":
        setupDatabase();
        responseData = { success: true, message: "Inisialisasi tabel Google Sheets berhasil." };
        break;
      default:
        responseData = { success: false, message: "Parameter 'action' tidak dikenali." };
    }
    return jsonResponse(responseData);
  } catch (err) {
    return jsonResponse({ success: false, message: "Terjadi kesalahan server: " + err.message, stack: err.stack });
  }
}

function doPost(e) {
  try {
    var body = parseBody(e);
    var action = (e && e.parameter && e.parameter.action) || body.action || "";
    var operatorUser = body.operator_user || null;
    var responseData;

    switch (action) {
      case "login": responseData = handleLogin(body); break;
      case "createSiswa": responseData = createSiswa(body, operatorUser); break;
      case "updateSiswa": responseData = updateSiswa(body, operatorUser); break;
      case "deleteSiswa": responseData = deleteSiswa(body, operatorUser); break;
      case "createKelas": responseData = createKelas(body, operatorUser); break;
      case "updateKelas": responseData = updateKelas(body, operatorUser); break;
      case "deleteKelas": responseData = deleteKelas(body, operatorUser); break;
      case "createSetoran": responseData = createSetoran(body, operatorUser); break;
      case "createPenarikan": responseData = createPenarikan(body, operatorUser); break;
      case "cancelTransaksi":
      case "batalTransaksi": responseData = cancelTransaksi(body, operatorUser); break;
      case "createUser": responseData = createUser(body, operatorUser); break;
      case "updateUser": responseData = updateUser(body, operatorUser); break;
      case "deleteUser": responseData = deleteUser(body, operatorUser); break;
      case "setupDatabase":
        setupDatabase();
        responseData = { success: true, message: "Inisialisasi tabel database berhasil dijalankan." };
        break;
      default:
        responseData = { success: false, message: "Action POST '" + action + "' tidak valid." };
    }
    return jsonResponse(responseData);
  } catch (err) {
    return jsonResponse({ success: false, message: "Terjadi kesalahan pada request: " + err.message, stack: err.stack });
  }
}
`;
