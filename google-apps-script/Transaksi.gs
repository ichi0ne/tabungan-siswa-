/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Transaksi.gs
 * Manajemen Setoran, Penarikan, Pembatalan Reversal, & Integritas Saldo dengan Concurrency Lock
 */

/**
 * Mencatat Transaksi Setoran Tabungan Siswa
 */
function createSetoran(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  var nominal = Number(payload.nominal) || 0;
  var tanggal = payload.tanggal ? String(payload.tanggal).trim() : Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  var keterangan = String(payload.keterangan || "Setoran tabungan").trim();

  if (!idSiswa) {
    return { success: false, message: "Pilih siswa terlebih dahulu." };
  }
  if (nominal <= 0) {
    return { success: false, message: "Nominal setoran harus lebih besar dari 0 (Nol)." };
  }

  // Gunakan LockService untuk mencegah race condition
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Tunggu hingga 30 detik
  } catch (e) {
    return { success: false, message: "Server sedang sibuk memproses transaksi lain. Silakan coba sesaat lagi." };
  }

  try {
    var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
    var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
    var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

    // Cari data siswa
    var siswaRow = findRowById(sheetSiswa, 1, idSiswa);
    if (siswaRow === -1) {
      return { success: false, message: "Data siswa tidak ditemukan." };
    }
    var siswaData = sheetSiswa.getRange(siswaRow, 1, 1, 12).getValues()[0];
    var nis = siswaData[1];
    var namaSiswa = siswaData[3];
    var idKelas = siswaData[7];

    // Ambil saldo terkini dari sheet SALDO
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
      // Jika baris saldo belum ada, buat baru
      sheetSaldo.appendRow([idSiswa, nis, namaSiswa, idKelas, 0, 0, 0, now]);
      saldoRow = sheetSaldo.getLastRow();
    }

    var saldoSesudah = saldoSebelum + nominal;
    var totalSetoranBaru = totalSetoranLama + nominal;

    // Generate No Transaksi & ID
    var noTransaksi = generateTransactionNumber("SETORAN");
    var idTransaksi = generateId("TRX");
    var waktu = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");

    var petId = operatorUser ? operatorUser.id_user : "SYSTEM";
    var petNama = operatorUser ? operatorUser.nama : "Petugas Tabungan";

    // Simpan ke sheet TRANSAKSI
    sheetTransaksi.appendRow([
      idTransaksi,
      noTransaksi,
      tanggal,
      waktu,
      idSiswa,
      nis,
      namaSiswa,
      idKelas,
      "SETORAN",
      nominal,
      saldoSebelum,
      saldoSesudah,
      keterangan,
      petId,
      petNama,
      "AKTIF",
      now
    ]);

    // Update sheet SALDO
    sheetSaldo.getRange(saldoRow, 5, 1, 4).setValues([[
      totalSetoranBaru,
      totalPenarikanLama,
      saldoSesudah,
      now
    ]]);

    // Catat log
    logActivity(
      petId,
      petNama,
      "CREATE_SETORAN",
      "TABUNGAN",
      noTransaksi,
      "Setoran " + formatCurrency(nominal) + " untuk siswa " + namaSiswa + " (" + nis + "). Saldo baru: " + formatCurrency(saldoSesudah)
    );

    return {
      success: true,
      message: "Setoran tabungan berhasil disimpan.",
      data: {
        id_transaksi: idTransaksi,
        no_transaksi: noTransaksi,
        tanggal: tanggal,
        waktu: waktu,
        id_siswa: idSiswa,
        nis: nis,
        nama_siswa: namaSiswa,
        id_kelas: idKelas,
        jenis_transaksi: "SETORAN",
        nominal: nominal,
        saldo_sebelum: saldoSebelum,
        saldo_sesudah: saldoSesudah,
        keterangan: keterangan,
        nama_petugas: petNama
      }
    };

  } catch (err) {
    return { success: false, message: "Gagal memproses setoran: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mencatat Transaksi Penarikan Tabungan Siswa
 */
function createPenarikan(payload, operatorUser) {
  var idSiswa = String(payload.id_siswa || "").trim();
  var nominal = Number(payload.nominal) || 0;
  var tanggal = payload.tanggal ? String(payload.tanggal).trim() : Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  var keterangan = String(payload.keterangan || "Penarikan tabungan").trim();

  if (!idSiswa) {
    return { success: false, message: "Pilih siswa terlebih dahulu." };
  }
  if (nominal <= 0) {
    return { success: false, message: "Nominal penarikan harus lebih besar dari 0 (Nol)." };
  }

  // Gunakan LockService
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return { success: false, message: "Server sedang sibuk. Silakan coba sesaat lagi." };
  }

  try {
    var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
    var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
    var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

    var siswaRow = findRowById(sheetSiswa, 1, idSiswa);
    if (siswaRow === -1) {
      return { success: false, message: "Data siswa tidak ditemukan." };
    }
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

    // VALIDASI SALDO: Penarikan tidak boleh melebihi saldo tersedia
    if (nominal > saldoSebelum) {
      return {
        success: false,
        message: "Saldo tidak mencukupi. Saldo saat ini: " + formatCurrency(saldoSebelum) + ", permintaan: " + formatCurrency(nominal)
      };
    }

    var saldoSesudah = saldoSebelum - nominal;
    var totalPenarikanBaru = totalPenarikanLama + nominal;

    var noTransaksi = generateTransactionNumber("PENARIKAN");
    var idTransaksi = generateId("TRX");
    var waktu = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss");

    var petId = operatorUser ? operatorUser.id_user : "SYSTEM";
    var petNama = operatorUser ? operatorUser.nama : "Petugas Tabungan";

    // Simpan ke sheet TRANSAKSI
    sheetTransaksi.appendRow([
      idTransaksi,
      noTransaksi,
      tanggal,
      waktu,
      idSiswa,
      nis,
      namaSiswa,
      idKelas,
      "PENARIKAN",
      nominal,
      saldoSebelum,
      saldoSesudah,
      keterangan,
      petId,
      petNama,
      "AKTIF",
      now
    ]);

    // Update sheet SALDO
    sheetSaldo.getRange(saldoRow, 5, 1, 4).setValues([[
      totalSetoranLama,
      totalPenarikanBaru,
      saldoSesudah,
      now
    ]]);

    logActivity(
      petId,
      petNama,
      "CREATE_PENARIKAN",
      "TABUNGAN",
      noTransaksi,
      "Penarikan " + formatCurrency(nominal) + " untuk siswa " + namaSiswa + " (" + nis + "). Sisa saldo: " + formatCurrency(saldoSesudah)
    );

    return {
      success: true,
      message: "Penarikan tabungan berhasil diproses.",
      data: {
        id_transaksi: idTransaksi,
        no_transaksi: noTransaksi,
        tanggal: tanggal,
        waktu: waktu,
        id_siswa: idSiswa,
        nis: nis,
        nama_siswa: namaSiswa,
        id_kelas: idKelas,
        jenis_transaksi: "PENARIKAN",
        nominal: nominal,
        saldo_sebelum: saldoSebelum,
        saldo_sesudah: saldoSesudah,
        keterangan: keterangan,
        nama_petugas: petNama
      }
    };

  } catch (err) {
    return { success: false, message: "Gagal memproses penarikan: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Pembatalan Transaksi dengan Reversal Akuntansi Aman
 */
function cancelTransaksi(payload, operatorUser) {
  var idTransaksi = String(payload.id_transaksi || "").trim();
  var alasan = String(payload.alasan || "Pembatalan oleh petugas").trim();

  if (!idTransaksi) {
    return { success: false, message: "ID Transaksi wajib disertakan." };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return { success: false, message: "Server sedang sibuk. Silakan coba lagi." };
  }

  try {
    var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);
    var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);

    var trxRow = findRowById(sheetTransaksi, 1, idTransaksi);
    if (trxRow === -1) {
      return { success: false, message: "Transaksi tidak ditemukan." };
    }

    var trxData = sheetTransaksi.getRange(trxRow, 1, 1, 17).getValues()[0];
    var noTrx = trxData[1];
    var idSiswa = trxData[4];
    var nis = trxData[5];
    var namaSiswa = trxData[6];
    var jenisTrx = String(trxData[8]).toUpperCase();
    var nominal = Number(trxData[9]) || 0;
    var statusTrx = String(trxData[15]).toUpperCase();

    if (statusTrx === "DIBATALKAN") {
      return { success: false, message: "Transaksi ini sudah pernah dibatalkan sebelumnya." };
    }

    // Ambil saldo saat ini
    var saldoRow = findRowById(sheetSaldo, 1, idSiswa);
    if (saldoRow === -1) {
      return { success: false, message: "Data saldo siswa tidak ditemukan." };
    }

    var saldoData = sheetSaldo.getRange(saldoRow, 1, 1, 8).getValues()[0];
    var totalSetoran = Number(saldoData[4]) || 0;
    var totalPenarikan = Number(saldoData[5]) || 0;
    var currentSaldo = Number(saldoData[6]) || 0;

    var newTotalSetoran = totalSetoran;
    var newTotalPenarikan = totalPenarikan;
    var newSaldo = currentSaldo;

    if (jenisTrx === "SETORAN") {
      // Membatalkan setoran = mengurangi saldo. Pastikan saldo saat ini cukup untuk ditarik kembali
      if (currentSaldo < nominal) {
        return {
          success: false,
          message: "Tidak dapat membatalkan setoran karena saldo siswa saat ini (" + formatCurrency(currentSaldo) + ") lebih kecil dari nominal yang ingin dibatalkan (" + formatCurrency(nominal) + ")."
        };
      }
      newTotalSetoran = Math.max(0, totalSetoran - nominal);
      newSaldo = currentSaldo - nominal;
    } else if (jenisTrx === "PENARIKAN") {
      // Membatalkan penarikan = mengembalikan saldo
      newTotalPenarikan = Math.max(0, totalPenarikan - nominal);
      newSaldo = currentSaldo + nominal;
    }

    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var cancellerName = operatorUser ? operatorUser.nama : "Petugas";

    // 1. Ubah status transaksi menjadi DIBATALKAN dan catat alasan
    sheetTransaksi.getRange(trxRow, 13).setValue(trxData[12] + " [DIBATALKAN: " + alasan + " oleh " + cancellerName + " pada " + now + "]");
    sheetTransaksi.getRange(trxRow, 16).setValue("DIBATALKAN");

    // 2. Perbarui sheet SALDO
    sheetSaldo.getRange(saldoRow, 5, 1, 4).setValues([[
      newTotalSetoran,
      newTotalPenarikan,
      newSaldo,
      now
    ]]);

    logActivity(
      operatorUser ? operatorUser.id_user : "SYSTEM",
      cancellerName,
      "CANCEL_TRANSAKSI",
      "TABUNGAN",
      noTrx,
      "Membatalkan " + jenisTrx + " senilai " + formatCurrency(nominal) + " untuk siswa " + namaSiswa + ". Alasan: " + alasan + ". Saldo disesuaikan menjadi " + formatCurrency(newSaldo)
    );

    return {
      success: true,
      message: "Transaksi " + noTrx + " berhasil dibatalkan. Saldo siswa telah dikoreksi.",
      data: {
        no_transaksi: noTrx,
        saldo_baru: newSaldo
      }
    };

  } catch (err) {
    return { success: false, message: "Gagal membatalkan transaksi: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil Riwayat Buku Tabungan Siswa
 */
function getBukuTabungan(params) {
  var idSiswa = params.id_siswa ? String(params.id_siswa).trim() : "";
  if (!idSiswa) {
    return { success: false, message: "ID Siswa wajib disertakan." };
  }

  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

  // Ambil detail siswa
  var siswaRow = findRowById(sheetSiswa, 1, idSiswa);
  if (siswaRow === -1) {
    return { success: false, message: "Data siswa tidak ditemukan." };
  }
  var siswaData = sheetSiswa.getRange(siswaRow, 1, 1, 12).getValues()[0];
  var idKelas = siswaData[7];

  // Cari nama kelas
  var namaKelas = idKelas;
  var kelasRow = findRowById(sheetKelas, 1, idKelas);
  if (kelasRow !== -1) {
    namaKelas = sheetKelas.getRange(kelasRow, 2).getValue() || idKelas;
  }

  // Ambil saldo terkini
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

  // Ambil seluruh transaksi siswa
  var lastRowTrx = sheetTransaksi.getLastRow();
  var transaksiList = [];

  var filterStart = params.start_date ? String(params.start_date).trim() : "";
  var filterEnd = params.end_date ? String(params.end_date).trim() : "";

  if (lastRowTrx > 1) {
    var trxValues = sheetTransaksi.getRange(2, 1, lastRowTrx - 1, 17).getValues();
    for (var i = 0; i < trxValues.length; i++) {
      var row = trxValues[i];
      if (String(row[4]) === idSiswa) { // id_siswa match
        var tgl = formatDate(row[2]);

        if (filterStart && tgl < filterStart) continue;
        if (filterEnd && tgl > filterEnd) continue;

        var jenis = String(row[8]).toUpperCase();
        var nominal = Number(row[9]) || 0;

        transaksiList.push({
          id_transaksi: row[0],
          no_transaksi: row[1],
          tanggal: tgl,
          waktu: row[3],
          jenis_transaksi: jenis,
          setoran: jenis === "SETORAN" ? nominal : 0,
          penarikan: jenis === "PENARIKAN" ? nominal : 0,
          nominal: nominal,
          saldo_sebelum: Number(row[10]) || 0,
          saldo_sesudah: Number(row[11]) || 0,
          keterangan: row[12],
          nama_petugas: row[14],
          status: row[15],
          created_at: row[16]
        });
      }
    }
  }

  return {
    success: true,
    data: {
      siswa: {
        id_siswa: siswaData[0],
        nis: siswaData[1],
        nisn: siswaData[2],
        nama_siswa: siswaData[3],
        id_kelas: idKelas,
        nama_kelas: namaKelas,
        no_tabungan: siswaData[10],
        total_setoran: totalSetoran,
        total_penarikan: totalPenarikan,
        saldo: saldoTerkini,
        status: siswaData[11]
      },
      transaksi: transaksiList
    }
  };
}

/**
 * Mengambil daftar transaksi umum dengan filter
 */
function getTransaksi(params) {
  params = params || {};
  var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);
  var lastRow = sheetTransaksi.getLastRow();

  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  var values = sheetTransaksi.getRange(2, 1, lastRow - 1, 17).getValues();
  var result = [];

  var filterKelas = params.id_kelas ? String(params.id_kelas).trim() : "";
  var filterSiswa = params.id_siswa ? String(params.id_siswa).trim() : "";
  var filterJenis = params.jenis_transaksi ? String(params.jenis_transaksi).trim().toUpperCase() : "";
  var filterStatus = params.status ? String(params.status).trim().toUpperCase() : "";
  var filterStart = params.start_date ? String(params.start_date).trim() : "";
  var filterEnd = params.end_date ? String(params.end_date).trim() : "";
  var search = params.search ? String(params.search).trim().toLowerCase() : "";

  for (var i = values.length - 1; i >= 0; i--) { // Reverse urutan agar yang terbaru muncul pertama
    var row = values[i];
    var idTrx = row[0];
    var noTrx = String(row[1]);
    var tgl = formatDate(row[2]);
    var waktu = row[3];
    var idSiswa = String(row[4]);
    var nis = String(row[5]);
    var namaSiswa = String(row[6]);
    var idKelas = String(row[7]);
    var jenis = String(row[8]).toUpperCase();
    var nominal = Number(row[9]) || 0;
    var saldoSebelum = Number(row[10]) || 0;
    var saldoSesudah = Number(row[11]) || 0;
    var keterangan = row[12];
    var namaPetugas = row[14];
    var status = String(row[15]).toUpperCase();
    var createdAt = row[16];

    if (filterKelas && idKelas !== filterKelas) continue;
    if (filterSiswa && idSiswa !== filterSiswa && nis !== filterSiswa) continue;
    if (filterJenis && jenis !== filterJenis) continue;
    if (filterStatus && status !== filterStatus) continue;
    if (filterStart && tgl < filterStart) continue;
    if (filterEnd && tgl > filterEnd) continue;

    if (search) {
      var match = noTrx.toLowerCase().indexOf(search) !== -1 ||
                  namaSiswa.toLowerCase().indexOf(search) !== -1 ||
                  nis.toLowerCase().indexOf(search) !== -1 ||
                  String(keterangan).toLowerCase().indexOf(search) !== -1;
      if (!match) continue;
    }

    result.push({
      id_transaksi: idTrx,
      no_transaksi: noTrx,
      tanggal: tgl,
      waktu: waktu,
      id_siswa: idSiswa,
      nis: nis,
      nama_siswa: namaSiswa,
      id_kelas: idKelas,
      jenis_transaksi: jenis,
      nominal: nominal,
      saldo_sebelum: saldoSebelum,
      saldo_sesudah: saldoSesudah,
      keterangan: keterangan,
      nama_petugas: namaPetugas,
      status: status,
      created_at: createdAt
    });
  }

  return { success: true, data: result };
}
