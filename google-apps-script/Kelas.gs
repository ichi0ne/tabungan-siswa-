/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Kelas.gs
 * Manajemen Data Kelas & Rekap Saldo Per Kelas
 */

/**
 * Mengambil daftar kelas beserta statistik siswa dan total saldo per kelas
 */
function getKelas(params) {
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);

  var lastRowKelas = sheetKelas.getLastRow();
  if (lastRowKelas <= 1) {
    return { success: true, data: [] };
  }

  // Hitung jumlah siswa per kelas
  var countSiswaMap = {};
  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa > 1) {
    var siswaValues = sheetSiswa.getRange(2, 8, lastRowSiswa - 1, 5).getValues(); // [0] id_kelas, [4] status
    for (var s = 0; s < siswaValues.length; s++) {
      var kId = siswaValues[s][0];
      var st = String(siswaValues[s][4]).toUpperCase();
      if (st === "AKTIF") {
        countSiswaMap[kId] = (countSiswaMap[kId] || 0) + 1;
      }
    }
  }

  // Hitung total saldo per kelas
  var totalSaldoMap = {};
  var totalSetoranMap = {};
  var totalPenarikanMap = {};
  var lastRowSaldo = sheetSaldo.getLastRow();
  if (lastRowSaldo > 1) {
    var saldoValues = sheetSaldo.getRange(2, 4, lastRowSaldo - 1, 4).getValues(); // [0] id_kelas, [1] setoran, [2] penarikan, [3] saldo
    for (var b = 0; b < saldoValues.length; b++) {
      var salKelas = saldoValues[b][0];
      var setoran = Number(saldoValues[b][1]) || 0;
      var penarikan = Number(saldoValues[b][2]) || 0;
      var sal = Number(saldoValues[b][3]) || 0;

      totalSaldoMap[salKelas] = (totalSaldoMap[salKelas] || 0) + sal;
      totalSetoranMap[salKelas] = (totalSetoranMap[salKelas] || 0) + setoran;
      totalPenarikanMap[salKelas] = (totalPenarikanMap[salKelas] || 0) + penarikan;
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

/**
 * Menambahkan kelas baru
 */
function createKelas(payload, operatorUser) {
  var namaKelas = String(payload.nama_kelas || "").trim();
  var tingkat = String(payload.tingkat || "").trim();
  var idWali = String(payload.id_wali_kelas || "").trim();
  var namaWali = String(payload.nama_wali_kelas || "").trim();
  var tahunAjaran = String(payload.tahun_ajaran || "2025/2026").trim();
  var status = String(payload.status || "AKTIF").trim().toUpperCase();

  if (!namaKelas) {
    return { success: false, message: "Nama kelas wajib diisi." };
  }

  var sheet = getSheet(CONFIG.SHEETS.KELAS);
  var idKelas = generateId("KLS");

  sheet.appendRow([
    idKelas,
    namaKelas,
    tingkat,
    idWali,
    namaWali,
    tahunAjaran,
    status
  ]);

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Petugas",
    "UPDATE_KELAS",
    "KELAS",
    idKelas,
    "Menambahkan kelas baru: " + namaKelas
  );

  return {
    success: true,
    message: "Kelas berhasil ditambahkan.",
    data: { id_kelas: idKelas, nama_kelas: namaKelas }
  };
}

/**
 * Memperbarui data kelas
 */
function updateKelas(payload, operatorUser) {
  var idKelas = String(payload.id_kelas || "").trim();
  if (!idKelas) {
    return { success: false, message: "ID Kelas wajib disertakan." };
  }

  var sheet = getSheet(CONFIG.SHEETS.KELAS);
  var rowIndex = findRowById(sheet, 1, idKelas);
  if (rowIndex === -1) {
    return { success: false, message: "Kelas tidak ditemukan." };
  }

  var rowData = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];

  var namaKelas = payload.nama_kelas !== undefined ? String(payload.nama_kelas).trim() : rowData[1];
  var tingkat = payload.tingkat !== undefined ? String(payload.tingkat).trim() : rowData[2];
  var idWali = payload.id_wali_kelas !== undefined ? String(payload.id_wali_kelas).trim() : rowData[3];
  var namaWali = payload.nama_wali_kelas !== undefined ? String(payload.nama_wali_kelas).trim() : rowData[4];
  var tahunAjaran = payload.tahun_ajaran !== undefined ? String(payload.tahun_ajaran).trim() : rowData[5];
  var status = payload.status !== undefined ? String(payload.status).trim() : rowData[6];

  sheet.getRange(rowIndex, 2, 1, 6).setValues([[
    namaKelas,
    tingkat,
    idWali,
    namaWali,
    tahunAjaran,
    status
  ]]);

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Petugas",
    "UPDATE_KELAS",
    "KELAS",
    idKelas,
    "Memperbarui data kelas: " + namaKelas
  );

  return { success: true, message: "Data kelas berhasil diperbarui." };
}

/**
 * Menghapus atau menonaktifkan data kelas
 */
function deleteKelas(payload, operatorUser) {
  var idKelas = String(payload.id_kelas || "").trim();
  if (!idKelas) {
    return { success: false, message: "ID Kelas wajib disertakan." };
  }

  var sheet = getSheet(CONFIG.SHEETS.KELAS);
  var rowIndex = findRowById(sheet, 1, idKelas);
  if (rowIndex === -1) {
    return { success: false, message: "Kelas tidak ditemukan." };
  }

  var rowData = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
  var namaKelas = rowData[1];

  if (payload.permanent === true) {
    sheet.deleteRow(rowIndex);
    logActivity(
      operatorUser ? operatorUser.id_user : "SYSTEM",
      operatorUser ? operatorUser.nama : "Admin",
      "DELETE_KELAS",
      "KELAS",
      idKelas,
      "Menghapus permanen kelas: " + namaKelas
    );
    return { success: true, message: "Kelas '" + namaKelas + "' berhasil dihapus permanen." };
  }

  // Nonaktifkan status kelas
  sheet.getRange(rowIndex, 7).setValue("NONAKTIF");

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Petugas",
    "UPDATE_KELAS",
    "KELAS",
    idKelas,
    "Menonaktifkan kelas: " + namaKelas
  );

  return { success: true, message: "Kelas '" + namaKelas + "' berhasil dinonaktifkan." };
}
