/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Siswa.gs
 * Manajemen Master Data Siswa & Sinkronisasi Saldo Awal
 */

/**
 * Mengambil daftar siswa beserta saldo terkini
 */
function getSiswa(params) {
  params = params || {};
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);

  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa <= 1) {
    return { success: true, data: [] };
  }

  // Ambil mapping nama kelas
  var kelasMap = {};
  var lastRowKelas = sheetKelas.getLastRow();
  if (lastRowKelas > 1) {
    var kValues = sheetKelas.getRange(2, 1, lastRowKelas - 1, 2).getValues();
    for (var k = 0; k < kValues.length; k++) {
      kelasMap[kValues[k][0]] = kValues[k][1];
    }
  }

  // Ambil mapping saldo
  var saldoMap = {};
  var lastRowSaldo = sheetSaldo.getLastRow();
  if (lastRowSaldo > 1) {
    var sValues = sheetSaldo.getRange(2, 1, lastRowSaldo - 1, 7).getValues();
    // [0] id_siswa, [4] total_setoran, [5] total_penarikan, [6] saldo
    for (var s = 0; s < sValues.length; s++) {
      saldoMap[sValues[s][0]] = {
        total_setoran: Number(sValues[s][4]) || 0,
        total_penarikan: Number(sValues[s][5]) || 0,
        saldo: Number(sValues[s][6]) || 0
      };
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

    // Filter Kelas
    if (filterKelas && idKelas !== filterKelas) continue;

    // Filter Status
    if (filterStatus && status.toUpperCase() !== filterStatus) continue;

    // Search (NIS, NISN, Nama, No Tabungan)
    if (search) {
      var match = nis.toLowerCase().indexOf(search) !== -1 ||
                  nisn.toLowerCase().indexOf(search) !== -1 ||
                  namaSiswa.toLowerCase().indexOf(search) !== -1 ||
                  noTabungan.toLowerCase().indexOf(search) !== -1;
      if (!match) continue;
    }

    var studentSaldo = saldoMap[idSiswa] || { total_setoran: 0, total_penarikan: 0, saldo: 0 };

    result.push({
      id_siswa: idSiswa,
      nis: nis,
      nisn: nisn,
      nama_siswa: namaSiswa,
      jenis_kelamin: jk,
      tanggal_lahir: tglLahir,
      alamat: alamat,
      id_kelas: idKelas,
      nama_kelas: kelasMap[idKelas] || idKelas,
      nama_orang_tua: namaOrtu,
      no_hp_orang_tua: noHpOrtu,
      no_tabungan: noTabungan,
      status: status,
      total_setoran: studentSaldo.total_setoran,
      total_penarikan: studentSaldo.total_penarikan,
      saldo: studentSaldo.saldo,
      created_at: createdAt,
      updated_at: updatedAt
    });
  }

  return { success: true, data: result };
}

/**
 * Mengambil detail satu siswa beserta ringkasan saldo
 */
function getSiswaById(idSiswa) {
  if (!idSiswa) return { success: false, message: "ID Siswa wajib disertakan." };

  var res = getSiswa({ search: "" });
  if (!res.success) return res;

  for (var i = 0; i < res.data.length; i++) {
    if (res.data[i].id_siswa === idSiswa || res.data[i].nis === idSiswa) {
      return { success: true, data: res.data[i] };
    }
  }

  return { success: false, message: "Siswa tidak ditemukan." };
}

/**
 * Menambahkan data siswa baru dan menginisialisasi baris di sheet SALDO
 */
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

  if (!nis || !namaSiswa || !idKelas) {
    return { success: false, message: "NIS, Nama Siswa, dan Kelas wajib diisi." };
  }

  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var lastRow = sheetSiswa.getLastRow();

  // Validasi keunikan NIS
  if (lastRow > 1) {
    var existingNis = sheetSiswa.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingNis.length; i++) {
      if (String(existingNis[i][0]).trim() === nis) {
        return { success: false, message: "NIS '" + nis + "' sudah terdaftar untuk siswa lain." };
      }
    }
  }

  // Generate nomor tabungan otomatis jika kosong
  if (!noTabungan) {
    var randCode = Math.floor(1000 + Math.random() * 9000);
    noTabungan = "TAB-" + (idKelas.replace("KLS-", "") || "SCH") + "-" + nis.slice(-4) + "-" + randCode;
  }

  var idSiswa = generateId("SISWA");
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  // 1. Simpan ke SISWA
  sheetSiswa.appendRow([
    idSiswa,
    nis,
    nisn,
    namaSiswa,
    jk,
    tglLahir,
    alamat,
    idKelas,
    namaOrtu,
    noHpOrtu,
    noTabungan,
    status,
    now,
    now
  ]);

  // 2. Inisialisasi baris di SALDO
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  sheetSaldo.appendRow([
    idSiswa,
    nis,
    namaSiswa,
    idKelas,
    0, // total_setoran
    0, // total_penarikan
    0, // saldo
    now
  ]);

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Petugas",
    "CREATE_SISWA",
    "SISWA",
    idSiswa,
    "Mendaftarkan siswa baru: " + namaSiswa + " (NIS: " + nis + ", No. Tabungan: " + noTabungan + ")"
  );

  return {
    success: true,
    message: "Data siswa berhasil ditambahkan.",
    data: { id_siswa: idSiswa, nis: nis, nama_siswa: namaSiswa, no_tabungan: noTabungan }
  };
}

/**
 * Memperbarui data siswa dan sinkronisasi ke tabel SALDO
 */
function updateSiswa(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  if (!idSiswa) {
    return { success: false, message: "ID Siswa wajib disertakan." };
  }

  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var rowIndex = findRowById(sheetSiswa, 1, idSiswa);
  if (rowIndex === -1) {
    return { success: false, message: "Data siswa tidak ditemukan." };
  }

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

  sheetSiswa.getRange(rowIndex, 2, 1, 13).setValues([[
    nis,
    nisn,
    namaSiswa,
    jk,
    tglLahir,
    alamat,
    idKelas,
    namaOrtu,
    noHpOrtu,
    noTabungan,
    status,
    rowData[12], // created_at
    now          // updated_at
  ]]);

  // Sinkronisasi ke SALDO
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var saldoRow = findRowById(sheetSaldo, 1, idSiswa);
  if (saldoRow !== -1) {
    sheetSaldo.getRange(saldoRow, 2, 1, 3).setValues([[nis, namaSiswa, idKelas]]);
  }

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Petugas",
    "UPDATE_SISWA",
    "SISWA",
    idSiswa,
    "Memperbarui profil siswa: " + namaSiswa
  );

  return { success: true, message: "Data siswa berhasil diperbarui." };
}

/**
 * Menonaktifkan siswa
 */
function deleteSiswa(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  if (!idSiswa) return { success: false, message: "ID Siswa wajib disertakan." };

  return updateSiswa({ id_siswa: idSiswa, status: "NONAKTIF" }, operatorUser);
}
