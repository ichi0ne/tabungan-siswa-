/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Laporan.gs
 * Endpoint Dashboard Eksekutif, Laporan Keuangan, Rekap Kelas & Audit Trail
 */

/**
 * Mengambil ringkasan statistik dan data grafik untuk Dashboard
 */
function getDashboard(params) {
  params = params || {};
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var sheetKelas = getSheet(CONFIG.SHEETS.KELAS);
  var sheetSaldo = getSheet(CONFIG.SHEETS.SALDO);
  var sheetTransaksi = getSheet(CONFIG.SHEETS.TRANSAKSI);

  var now = new Date();
  var todayStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
  var currentYearMonth = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM");

  // 1. Total Siswa Aktif
  var totalSiswa = 0;
  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa > 1) {
    var siswaStatus = sheetSiswa.getRange(2, 12, lastRowSiswa - 1, 1).getValues();
    for (var s = 0; s < siswaStatus.length; s++) {
      if (String(siswaStatus[s][0]).toUpperCase() === "AKTIF") {
        totalSiswa++;
      }
    }
  }

  // 2. Total Saldo Tabungan & Data Top 10 Siswa
  var totalSaldo = 0;
  var top10Siswa = [];
  var lastRowSaldo = sheetSaldo.getLastRow();
  if (lastRowSaldo > 1) {
    var saldoValues = sheetSaldo.getRange(2, 1, lastRowSaldo - 1, 7).getValues();
    // [0] id_siswa, [1] nis, [2] nama_siswa, [3] id_kelas, [6] saldo
    var allSaldoList = [];
    for (var b = 0; b < saldoValues.length; b++) {
      var sal = Number(saldoValues[b][6]) || 0;
      totalSaldo += sal;
      allSaldoList.push({
        id_siswa: saldoValues[b][0],
        nis: saldoValues[b][1],
        nama_siswa: saldoValues[b][2],
        id_kelas: saldoValues[b][3],
        saldo: sal
      });
    }

    allSaldoList.sort(function(a, b) { return b.saldo - a.saldo; });
    top10Siswa = allSaldoList.slice(0, 10);
  }

  // 3. Mapping Nama Kelas & Saldo Per Kelas
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
    var sVal = sheetSaldo.getRange(2, 4, lastRowSaldo - 1, 4).getValues(); // [0] id_kelas, [3] saldo
    for (var sv = 0; sv < sVal.length; sv++) {
      var kId = sVal[sv][0];
      var sAmt = Number(sVal[sv][3]) || 0;
      saldoPerKelasMap[kId] = (saldoPerKelasMap[kId] || 0) + sAmt;
    }
  }

  var grafikSaldoKelas = [];
  for (var kKey in saldoPerKelasMap) {
    grafikSaldoKelas.push({
      id_kelas: kKey,
      nama_kelas: kelasMap[kKey] || kKey,
      total_saldo: saldoPerKelasMap[kKey]
    });
  }

  // 4. Perhitungan Transaksi Bulan Ini, Hari Ini, dan Grafik Bulanan
  var totalSetoranBulanIni = 0;
  var totalPenarikanBulanIni = 0;
  var jumlahTransaksiHariIni = 0;
  var monthlyMap = {}; // "YYYY-MM": { setoran: 0, penarikan: 0 }
  var recentTransaksi = [];

  // Inisialisasi 6 bulan terakhir
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
        if (tgl === todayStr) {
          jumlahTransaksiHariIni++;
        }

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

    // Ambil 10 transaksi terbaru
    for (var r = trxValues.length - 1; r >= Math.max(0, trxValues.length - 10); r--) {
      var tr = trxValues[r];
      recentTransaksi.push({
        id_transaksi: tr[0],
        no_transaksi: tr[1],
        tanggal: formatDate(tr[2]),
        waktu: tr[3],
        nama_siswa: tr[6],
        id_kelas: tr[7],
        nama_kelas: kelasMap[tr[7]] || tr[7],
        jenis_transaksi: tr[8],
        nominal: Number(tr[9]) || 0,
        nama_petugas: tr[14],
        status: tr[15]
      });
    }
  }

  var grafikBulanan = [];
  for (var ymKey in monthlyMap) {
    grafikBulanan.push(monthlyMap[ymKey]);
  }

  return {
    success: true,
    data: {
      statistik: {
        total_siswa: totalSiswa,
        total_saldo: totalSaldo,
        total_setoran_bulan_ini: totalSetoranBulanIni,
        total_penarikan_bulan_ini: totalPenarikanBulanIni,
        jumlah_transaksi_hari_ini: jumlahTransaksiHariIni
      },
      grafik_bulanan: grafikBulanan,
      grafik_saldo_kelas: grafikSaldoKelas,
      top_siswa: top10Siswa,
      transaksi_terbaru: recentTransaksi
    }
  };
}

/**
 * Mengambil Laporan Transaksi / Bulanan / Harian / Per Kelas / Rekap Saldo
 */
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

/**
 * Mengambil Log Aktivitas (Audit Trail)
 */
function getLogs(params) {
  var sheet = getSheet(CONFIG.SHEETS.LOG_AKTIVITAS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  var values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var logs = [];

  for (var i = values.length - 1; i >= Math.max(0, values.length - 100); i--) {
    logs.push({
      id_log: values[i][0],
      timestamp: values[i][1],
      id_user: values[i][2],
      nama_user: values[i][3],
      aktivitas: values[i][4],
      modul: values[i][5],
      referensi: values[i][6],
      detail: values[i][7]
    });
  }

  return { success: true, data: logs };
}
