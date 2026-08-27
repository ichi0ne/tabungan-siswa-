/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Code.gs
 * Entry Point Utama (doGet & doPost) & Router REST API
 */

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || "";

    var responseData;

    switch (action) {
      case "ping":
      case "health":
        responseData = {
          success: true,
          message: "API Google Apps Script Tabungan Siswa aktif & siap digunakan.",
          version: CONFIG.VERSION,
          timestamp: new Date().toISOString()
        };
        break;

      case "getDashboard":
        responseData = getDashboard(params);
        break;

      case "getSiswa":
        responseData = getSiswa(params);
        break;

      case "getSiswaById":
        responseData = getSiswaById(params.id_siswa || params.id);
        break;

      case "getKelas":
        responseData = getKelas(params);
        break;

      case "getTransaksi":
        responseData = getTransaksi(params);
        break;

      case "getSaldo":
        responseData = getSiswa(params);
        break;

      case "getBukuTabungan":
        responseData = getBukuTabungan(params);
        break;

      case "getLaporan":
        responseData = getLaporan(params);
        break;

      case "getUsers":
        responseData = getUsers(params);
        break;

      case "getLogs":
        responseData = getLogs(params);
        break;

      case "setup":
      case "setupDatabase":
        setupDatabase();
        responseData = { success: true, message: "Inisialisasi tabel Google Sheets berhasil." };
        break;

      default:
        responseData = {
          success: false,
          message: "Parameter 'action' tidak dikenali atau kosong. Dapatkan panduan di dokumentasi API."
        };
    }

    return jsonResponse(responseData);

  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Terjadi kesalahan server: " + err.message,
      stack: err.stack
    });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    var body = parseBody(e);
    var action = (e && e.parameter && e.parameter.action) || body.action || "";
    var operatorUser = body.operator_user || null;

    var responseData;

    switch (action) {
      case "login":
        responseData = handleLogin(body);
        break;

      case "createSiswa":
        responseData = createSiswa(body, operatorUser);
        break;

      case "updateSiswa":
        responseData = updateSiswa(body, operatorUser);
        break;

      case "deleteSiswa":
        responseData = deleteSiswa(body, operatorUser);
        break;

      case "createKelas":
        responseData = createKelas(body, operatorUser);
        break;

      case "updateKelas":
        responseData = updateKelas(body, operatorUser);
        break;

      case "deleteKelas":
        responseData = deleteKelas(body, operatorUser);
        break;

      case "createSetoran":
        responseData = createSetoran(body, operatorUser);
        break;

      case "createPenarikan":
        responseData = createPenarikan(body, operatorUser);
        break;

      case "cancelTransaksi":
      case "batalTransaksi":
        responseData = cancelTransaksi(body, operatorUser);
        break;

      case "createUser":
        responseData = createUser(body, operatorUser);
        break;

      case "updateUser":
        responseData = updateUser(body, operatorUser);
        break;

      case "deleteUser":
        responseData = deleteUser(body, operatorUser);
        break;

      case "setupDatabase":
        setupDatabase();
        responseData = { success: true, message: "Inisialisasi tabel database berhasil dijalankan." };
        break;

      default:
        responseData = {
          success: false,
          message: "Action POST '" + action + "' tidak valid."
        };
    }

    return jsonResponse(responseData);

  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Terjadi kesalahan pada request: " + err.message,
      stack: err.stack
    });
  }
}
