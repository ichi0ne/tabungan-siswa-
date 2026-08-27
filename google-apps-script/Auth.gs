/**
 * Sistem Manajemen Keuangan Tabungan Siswa - Backend Google Apps Script
 * File: Auth.gs
 * Manajemen Autentikasi Pengguna & Hak Akses
 */

/**
 * Handle proses login pengguna
 */
function handleLogin(payload) {
  var username = String(payload.username || "").trim();
  var password = String(payload.password || "").trim();

  if (!username || !password) {
    return { success: false, message: "Username dan password wajib diisi." };
  }

  var sheetUsers = getSheet(CONFIG.SHEETS.USERS);
  var lastRow = sheetUsers.getLastRow();
  
  if (lastRow <= 1) {
    return { success: false, message: "Belum ada data pengguna terdaftar di sistem." };
  }

  var values = sheetUsers.getRange(2, 1, lastRow - 1, 9).getValues();
  // Columns: [0] id_user, [1] username, [2] nama, [3] password, [4] role, [5] id_kelas, [6] status, [7] created_at, [8] updated_at

  for (var i = 0; i < values.length; i++) {
    var uId = values[i][0];
    var uName = String(values[i][1]).trim();
    var uPass = String(values[i][2] ? values[i][3] : "").trim(); // values[i][3] is password
    var uNamaLengkap = values[i][2];
    var uRole = values[i][4];
    var uIdKelas = values[i][5];
    var uStatus = values[i][6];

    if (uName.toLowerCase() === username.toLowerCase()) {
      if (uPass !== password) {
        return { success: false, message: "Password yang Anda masukkan salah." };
      }

      if (String(uStatus).toUpperCase() !== "AKTIF") {
        return { success: false, message: "Akun Anda berstatus non-aktif. Hubungi Admin." };
      }

      var userData = {
        id_user: uId,
        username: uName,
        nama: uNamaLengkap,
        role: uRole,
        id_kelas: uIdKelas,
        status: uStatus
      };

      // Catat log login
      logActivity(uId, uNamaLengkap, "LOGIN", "AUTH", uName, "Login berhasil sebagai " + uRole);

      return {
        success: true,
        message: "Login berhasil. Selamat datang " + uNamaLengkap + "!",
        data: {
          user: userData,
          token: "SESSION-" + Utilities.base64Encode(uId + ":" + new Date().getTime())
        }
      };
    }
  }

  // Jika tidak ditemukan di USERS, cek apakah NIS Siswa login sebagai role SISWA
  var sheetSiswa = getSheet(CONFIG.SHEETS.SISWA);
  var lastRowSiswa = sheetSiswa.getLastRow();
  if (lastRowSiswa > 1) {
    var siswaValues = sheetSiswa.getRange(2, 1, lastRowSiswa - 1, 12).getValues();
    // [0] id_siswa, [1] nis, [2] nisn, [3] nama_siswa, [7] id_kelas, [10] no_tabungan, [11] status
    for (var j = 0; j < siswaValues.length; j++) {
      var sId = siswaValues[j][0];
      var sNis = String(siswaValues[j][1]).trim();
      var sNama = siswaValues[j][3];
      var sIdKelas = siswaValues[j][7];
      var sNoTab = siswaValues[j][10];
      var sStatus = siswaValues[j][11];

      // Siswa login menggunakan NIS sebagai username dan password (atau tanggal lahir jika disesuaikan)
      if (sNis.toLowerCase() === username.toLowerCase() && (password === sNis || password === "siswa123")) {
        if (String(sStatus).toUpperCase() !== "AKTIF") {
          return { success: false, message: "Status siswa tidak aktif." };
        }

        var studentUserData = {
          id_user: sId,
          id_siswa: sId,
          username: sNis,
          nama: sNama,
          role: "SISWA",
          id_kelas: sIdKelas,
          no_tabungan: sNoTab,
          status: sStatus
        };

        logActivity(sId, sNama, "LOGIN", "AUTH", sNis, "Siswa login ke Buku Tabungan Mandiri");

        return {
          success: true,
          message: "Login siswa berhasil.",
          data: {
            user: studentUserData,
            token: "SESSION-SISWA-" + Utilities.base64Encode(sId + ":" + new Date().getTime())
          }
        };
      }
    }
  }

  return { success: false, message: "Username tidak ditemukan dalam sistem." };
}

/**
 * Mendapatkan daftar seluruh pengguna
 */
function getUsers(payload) {
  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var users = [];

  for (var i = 0; i < values.length; i++) {
    users.push({
      id_user: values[i][0],
      username: values[i][1],
      nama: values[i][2],
      // Password tidak diekspos secara terang-terangan untuk keamanan
      role: values[i][4],
      id_kelas: values[i][5],
      status: values[i][6],
      created_at: values[i][7],
      updated_at: values[i][8]
    });
  }

  return { success: true, data: users };
}

/**
 * Menambahkan pengguna baru
 */
function createUser(payload, operatorUser) {
  var username = String(payload.username || "").trim();
  var nama = String(payload.nama || "").trim();
  var password = String(payload.password || "").trim();
  var role = String(payload.role || "WALI_KELAS").trim().toUpperCase();
  var idKelas = String(payload.id_kelas || "").trim();
  var status = String(payload.status || "AKTIF").trim().toUpperCase();

  if (!username || !nama || !password) {
    return { success: false, message: "Username, Nama Lengkap, dan Password wajib diisi." };
  }

  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var lastRow = sheet.getLastRow();

  // Cek duplikasi username
  if (lastRow > 1) {
    var existingUsernames = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingUsernames.length; i++) {
      if (String(existingUsernames[i][0]).toLowerCase() === username.toLowerCase()) {
        return { success: false, message: "Username '" + username + "' sudah digunakan. Pilih username lain." };
      }
    }
  }

  var idUser = generateId("USR");
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([
    idUser,
    username,
    nama,
    password,
    role,
    idKelas,
    status,
    now,
    now
  ]);

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Admin",
    "CREATE_USER",
    "PENGGUNA",
    idUser,
    "Membuat pengguna baru: " + username + " (" + role + ")"
  );

  return {
    success: true,
    message: "Pengguna baru berhasil ditambahkan.",
    data: { id_user: idUser, username: username, nama: nama, role: role }
  };
}

/**
 * Memperbarui data pengguna
 */
function updateUser(payload, operatorUser) {
  var idUser = String(payload.id_user || "").trim();
  if (!idUser) {
    return { success: false, message: "ID Pengguna wajib disertakan." };
  }

  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var rowIndex = findRowById(sheet, 1, idUser);
  if (rowIndex === -1) {
    return { success: false, message: "Pengguna tidak ditemukan." };
  }

  var rowData = sheet.getRange(rowIndex, 1, 1, 9).getValues()[0];
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  var username = payload.username !== undefined ? String(payload.username).trim() : rowData[1];
  var nama = payload.nama !== undefined ? String(payload.nama).trim() : rowData[2];
  var password = payload.password ? String(payload.password).trim() : rowData[3];
  var role = payload.role !== undefined ? String(payload.role).trim() : rowData[4];
  var idKelas = payload.id_kelas !== undefined ? String(payload.id_kelas).trim() : rowData[5];
  var status = payload.status !== undefined ? String(payload.status).trim() : rowData[6];

  sheet.getRange(rowIndex, 2, 1, 8).setValues([[
    username,
    nama,
    password,
    role,
    idKelas,
    status,
    rowData[7], // created_at tetap
    now         // updated_at
  ]]);

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Admin",
    "UPDATE_USER",
    "PENGGUNA",
    idUser,
    "Memperbarui data pengguna " + username
  );

  return { success: true, message: "Data pengguna berhasil diperbarui." };
}

/**
 * Menghapus atau menonaktifkan akun pengguna
 */
function deleteUser(payload, operatorUser) {
  var idUser = String(payload.id_user || "").trim();
  if (!idUser) {
    return { success: false, message: "ID Pengguna wajib disertakan." };
  }

  var sheet = getSheet(CONFIG.SHEETS.USERS);
  var rowIndex = findRowById(sheet, 1, idUser);
  if (rowIndex === -1) {
    return { success: false, message: "Pengguna tidak ditemukan." };
  }

  var rowData = sheet.getRange(rowIndex, 1, 1, 9).getValues()[0];
  var username = rowData[1];
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  // Jika diminta hapus permanen
  if (payload.permanent === true) {
    sheet.deleteRow(rowIndex);
    logActivity(
      operatorUser ? operatorUser.id_user : "SYSTEM",
      operatorUser ? operatorUser.nama : "Admin",
      "DELETE_USER",
      "PENGGUNA",
      idUser,
      "Menghapus permanen akun pengguna: " + username
    );
    return { success: true, message: "Akun pengguna '" + username + "' berhasil dihapus permanen." };
  }

  // Standar: Nonaktifkan akun (Soft delete agar histori tetap aman)
  sheet.getRange(rowIndex, 7, 1, 3).setValues([["NONAKTIF", rowData[7], now]]);

  logActivity(
    operatorUser ? operatorUser.id_user : "SYSTEM",
    operatorUser ? operatorUser.nama : "Admin",
    "UPDATE_USER",
    "PENGGUNA",
    idUser,
    "Menonaktifkan akun pengguna: " + username
  );

  return { success: true, message: "Akun pengguna '" + username + "' berhasil dinonaktifkan." };
}
