/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Utils.gs
 * Utility Functions & Database Helpers
 */

/**
 * Mengambil Spreadsheet aktif
 */
function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    // Alternatif jika menggunakan standalone script dengan SPREADSHEET_ID di Script Properties
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty("SPREADSHEET_ID");
    if (sheetId) {
      ss = SpreadsheetApp.openById(sheetId);
    }
  }
  if (!ss) {
    throw new Error("Spreadsheet tidak ditemukan. Pastikan script terhubung dengan Google Sheets.");
  }
  return ss;
}

/**
 * Mengambil Sheet berdasarkan nama tabel
 */
function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error("Sheet '" + name + "' tidak ditemukan. Jalankan setupDatabase() terlebih dahulu.");
  }
  return sheet;
}

/**
 * Generate ID unik dengan prefix
 */
function generateId(prefix) {
  var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMddHHmmss");
  var randomNum = Math.floor(1000 + Math.random() * 9000);
  return (prefix || "ID") + "-" + timestamp + "-" + randomNum;
}

/**
 * Generate nomor transaksi otomatis (ST-YYYYMMDD-XXXX atau WD-YYYYMMDD-XXXX)
 */
function generateTransactionNumber(type) {
  var prefix = type === "PENARIKAN" ? "WD" : "ST";
  var dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
  
  var sheet = getSheet(CONFIG.SHEETS.TRANSAKSI);
  var lastRow = sheet.getLastRow();
  var countToday = 1;

  if (lastRow > 1) {
    var data = sheet.getRange(2, 2, lastRow - 1, 2).getValues(); // Kolom 2: no_transaksi, Kolom 3: tanggal
    var todayFormatted = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    
    for (var i = 0; i < data.length; i++) {
      var noTrx = String(data[i][0] || "");
      if (noTrx.indexOf(prefix + "-" + dateStr) === 0) {
        countToday++;
      }
    }
  }

  var sequence = ("0000" + countToday).slice(-4);
  return prefix + "-" + dateStr + "-" + sequence;
}

/**
 * Mengembalikan HTTP JSON Output yang kompatibel dengan browser & CORS
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mencari baris data berdasarkan nilai ID (1-indexed row number)
 */
function findRowById(sheet, idColumnIndex, idValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  
  var columnValues = sheet.getRange(2, idColumnIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < columnValues.length; i++) {
    if (String(columnValues[i][0]) === String(idValue)) {
      return i + 2; // Return actual row index (1-based, +2 offset for header)
    }
  }
  return -1;
}

/**
 * Mencatat aktivitas pengguna ke sheet LOG_AKTIVITAS
 */
function logActivity(userId, userName, activity, modul, reference, detail) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.LOG_AKTIVITAS);
    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var logId = generateId("LOG");
    sheet.appendRow([
      logId,
      now,
      userId || "ANONYMOUS",
      userName || "Pengguna",
      activity || "UNKNOWN_ACTION",
      modul || "GENERAL",
      reference || "-",
      typeof detail === "object" ? JSON.stringify(detail) : String(detail || "")
    ]);
  } catch (err) {
    Logger.log("Gagal menulis log aktivitas: " + err.message);
  }
}

/**
 * Format angka ke mata uang Rupiah
 */
function formatCurrency(val) {
  var num = Number(val) || 0;
  return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Format tanggal ke format standar YYYY-MM-DD
 */
function formatDate(d) {
  if (!d) return "";
  var dateObj = (d instanceof Date) ? d : new Date(d);
  return Utilities.formatDate(dateObj, "Asia/Jakarta", "yyyy-MM-dd");
}

/**
 * Parse data POST body dari request e
 */
function parseBody(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return {};
    }
  }
  if (e.parameter) {
    return e.parameter;
  }
  return {};
}
