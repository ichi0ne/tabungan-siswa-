/**
 * API Service Wrapper untuk Komunikasi Frontend ke Google Apps Script Web App API
 * Mendukung integrasi LIVE Google Apps Script & fallback simulator offline.
 */
import {
  ApiResponse,
  User,
  Siswa,
  Kelas,
  Transaksi,
  DashboardData,
  BukuTabunganData,
  LaporanKeuanganData,
  LogAktivitas
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_KELAS,
  INITIAL_SISWA,
  INITIAL_TRANSAKSI,
  INITIAL_LOGS
} from './mockData';

// Ambil URL Google Apps Script dari Environment Variables Vite atau Local Storage Setting
export const getApiUrl = (): string => {
  const customUrl = localStorage.getItem('CUSTOM_GAS_API_URL');
  if (customUrl && customUrl.trim() !== '') {
    return customUrl.trim();
  }
  const envUrl = (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('https://script.google.com')) {
    return envUrl.trim();
  }
  return '';
};

export const setCustomApiUrl = (url: string) => {
  if (url && url.trim() !== '') {
    localStorage.setItem('CUSTOM_GAS_API_URL', url.trim());
  } else {
    localStorage.removeItem('CUSTOM_GAS_API_URL');
  }
};

export const setApiUrl = setCustomApiUrl;

// Ambil session user aktif
export const getAuthUser = (): User | null => {
  try {
    const raw = localStorage.getItem('AUTH_USER');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('AUTH_USER', JSON.stringify(user));
  } else {
    localStorage.removeItem('AUTH_USER');
  }
};

// -------------------------------------------------------------
// LOCAL STATE STORAGE FOR FALLBACK & OFFLINE-COMPLIANT PREVIEWS
// -------------------------------------------------------------
const STORAGE_KEYS = {
  USERS: 'TABUNGAN_USERS_DB',
  KELAS: 'TABUNGAN_KELAS_DB',
  SISWA: 'TABUNGAN_SISWA_DB',
  TRANSAKSI: 'TABUNGAN_TRANSAKSI_DB',
  LOGS: 'TABUNGAN_LOGS_DB'
};

const getLocalDb = () => {
  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(INITIAL_USERS));
  const kelas: Kelas[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.KELAS) || JSON.stringify(INITIAL_KELAS));
  const siswa: Siswa[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SISWA) || JSON.stringify(INITIAL_SISWA));
  const transaksi: Transaksi[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSAKSI) || JSON.stringify(INITIAL_TRANSAKSI));
  const logs: LogAktivitas[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || JSON.stringify(INITIAL_LOGS));
  return { users, kelas, siswa, transaksi, logs };
};

const saveLocalDb = (data: Partial<ReturnType<typeof getLocalDb>>) => {
  if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
  if (data.kelas) localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(data.kelas));
  if (data.siswa) localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(data.siswa));
  if (data.transaksi) localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(data.transaksi));
  if (data.logs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
};

const localLog = (action: string, modul: string, ref: string, detail: string) => {
  const user = getAuthUser();
  const db = getLocalDb();
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const newLog: LogAktivitas = {
    id_log: `LOG-${Date.now()}`,
    timestamp: nowStr,
    id_user: user ? user.id_user : 'SYSTEM',
    nama_user: user ? user.nama : 'Pengguna',
    role: user ? user.role : 'ADMIN',
    aksi: action,
    modul: modul,
    referensi: ref,
    detail: detail
  };
  db.logs.unshift(newLog);
  saveLocalDb({ logs: db.logs });
};

// -------------------------------------------------------------
// CORE FETCH CLIENT UNTUK GOOGLE APPS SCRIPT WEB APP
// -------------------------------------------------------------
export async function apiGet<T = any>(action: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl();
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null) {
          url.searchParams.set(k, String(params[k]));
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn(`[GAS Live API GET Error: ${action}] Fallback ke state internal:`, err);
    }
  }

  // Fallback Internal Handlers
  return simulateGet<T>(action, params);
}

export async function apiPost<T = any>(action: string, payload: Record<string, any> = {}): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl();
  const operatorUser = getAuthUser();
  const requestBody = { ...payload, action, operator_user: operatorUser };

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn(`[GAS Live API POST Error: ${action}] Fallback ke state internal:`, err);
    }
  }

  // Fallback Internal Handlers
  return simulatePost<T>(action, payload);
}

// -------------------------------------------------------------
// HIGH-LEVEL API FUNCTIONS
// -------------------------------------------------------------

export async function testConnection(urlToCheck?: string): Promise<ApiResponse<{ version: string }>> {
  const targetUrl = urlToCheck || getApiUrl();
  if (!targetUrl) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }
  try {
    const url = new URL(targetUrl);
    url.searchParams.set('action', 'ping');
    const response = await fetch(url.toString());
    const data = await response.json();
    return data;
  } catch (err: any) {
    return { success: false, message: 'Gagal terhubung ke Google Apps Script: ' + (err.message || 'CORS / URL Invalid') };
  }
}

export async function setupDatabase(): Promise<ApiResponse<void>> {
  return apiPost('setupDatabase', {});
}

export async function login(username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
  return apiPost('login', { username, password });
}

export async function getDashboard(): Promise<ApiResponse<DashboardData>> {
  return apiGet('getDashboard');
}

export async function getSiswa(params?: { id_kelas?: string; status?: string; search?: string }): Promise<ApiResponse<Siswa[]>> {
  return apiGet('getSiswa', params);
}

export async function getSiswaById(id_siswa: string): Promise<ApiResponse<Siswa>> {
  return apiGet('getSiswaById', { id_siswa });
}

export async function createSiswa(data: Partial<Siswa>): Promise<ApiResponse<Siswa>> {
  return apiPost('createSiswa', data);
}

export async function updateSiswa(data: Partial<Siswa>): Promise<ApiResponse<void>> {
  return apiPost('updateSiswa', data);
}

export async function deleteSiswa(id_siswa: string): Promise<ApiResponse<void>> {
  return apiPost('deleteSiswa', { id_siswa });
}

export async function getKelas(): Promise<ApiResponse<Kelas[]>> {
  return apiGet('getKelas');
}

export async function createKelas(data: Partial<Kelas>): Promise<ApiResponse<Kelas>> {
  return apiPost('createKelas', data);
}

export async function updateKelas(data: Partial<Kelas>): Promise<ApiResponse<void>> {
  return apiPost('updateKelas', data);
}

export async function deleteKelas(id_kelas: string): Promise<ApiResponse<void>> {
  return apiPost('deleteKelas', { id_kelas });
}

export async function getTransaksi(params?: {
  id_kelas?: string;
  id_siswa?: string;
  jenis_transaksi?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
}): Promise<ApiResponse<Transaksi[]>> {
  return apiGet('getTransaksi', params);
}

export async function createSetoran(data: {
  id_siswa: string;
  nominal: number;
  tanggal?: string;
  keterangan?: string;
}): Promise<ApiResponse<Transaksi>> {
  return apiPost('createSetoran', data);
}

export async function createPenarikan(data: {
  id_siswa: string;
  nominal: number;
  tanggal?: string;
  keterangan?: string;
}): Promise<ApiResponse<Transaksi>> {
  return apiPost('createPenarikan', data);
}

export async function cancelTransaksi(id_transaksi: string, alasan: string): Promise<ApiResponse<{ no_transaksi: string; saldo_baru: number }>> {
  return apiPost('cancelTransaksi', { id_transaksi, alasan });
}

export async function getBukuTabungan(id_siswa: string, start_date?: string, end_date?: string): Promise<ApiResponse<BukuTabunganData>> {
  return apiGet('getBukuTabungan', { id_siswa, start_date, end_date });
}

export async function getLaporan(params: {
  tipe?: 'harian' | 'bulanan' | 'kelas' | 'rekap_saldo' | string;
  tanggal?: string;
  bulan?: number;
  tahun?: number;
  id_kelas?: string;
  id_siswa?: string;
}): Promise<ApiResponse<LaporanKeuanganData>> {
  const res = await apiGet<any>('getLaporan', params);
  if (!res.success) {
    return res;
  }

  const rawData = res.data;

  // 1. If rawData is already a structured object
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const transaksi = Array.isArray(rawData.transaksi) ? rawData.transaksi : [];
    const rekapSiswa = Array.isArray(rawData.rekap_siswa) ? rawData.rekap_siswa : undefined;
    const rekapKelas = Array.isArray(rawData.rekap_kelas) ? rawData.rekap_kelas : undefined;

    let totalSetoran = rawData.ringkasan?.total_setoran;
    let totalPenarikan = rawData.ringkasan?.total_penarikan;
    let totalSaldoMengendap = rawData.ringkasan?.total_saldo_mengendap;

    if (totalSetoran === undefined || isNaN(totalSetoran)) {
      if (rekapSiswa && params.tipe === 'rekap_saldo') {
        totalSetoran = rekapSiswa.reduce((a: number, s: any) => a + (Number(s.total_setoran) || 0), 0);
      } else {
        totalSetoran = transaksi
          .filter((t: any) => t.jenis_transaksi === 'SETORAN' && t.status !== 'DIBATALKAN')
          .reduce((a: number, b: any) => a + (Number(b.nominal) || 0), 0);
      }
    }

    if (totalPenarikan === undefined || isNaN(totalPenarikan)) {
      if (rekapSiswa && params.tipe === 'rekap_saldo') {
        totalPenarikan = rekapSiswa.reduce((a: number, s: any) => a + (Number(s.total_penarikan) || 0), 0);
      } else {
        totalPenarikan = transaksi
          .filter((t: any) => t.jenis_transaksi === 'PENARIKAN' && t.status !== 'DIBATALKAN')
          .reduce((a: number, b: any) => a + (Number(b.nominal) || 0), 0);
      }
    }

    if (totalSaldoMengendap === undefined || isNaN(totalSaldoMengendap)) {
      if (rekapSiswa) {
        totalSaldoMengendap = rekapSiswa.reduce((a: number, s: any) => a + (Number(s.saldo) || 0), 0);
      } else {
        totalSaldoMengendap = totalSetoran - totalPenarikan;
      }
    }

    return {
      success: true,
      data: {
        judul: rawData.judul || 'Laporan Keuangan Tabungan',
        tipe: rawData.tipe || params.tipe || 'bulanan',
        periode: rawData.periode || '',
        ringkasan: {
          total_setoran: Number(totalSetoran) || 0,
          total_penarikan: Number(totalPenarikan) || 0,
          selisih: (Number(totalSetoran) || 0) - (Number(totalPenarikan) || 0),
          jumlah_transaksi: rawData.ringkasan?.jumlah_transaksi ?? transaksi.length,
          total_saldo_mengendap: Number(totalSaldoMengendap) || 0
        },
        transaksi,
        rekap_siswa: rekapSiswa,
        rekap_kelas: rekapKelas
      }
    };
  }

  // 2. If rawData is an Array (from legacy GAS returning array of students or transactions)
  if (Array.isArray(rawData)) {
    const isStudentArray = rawData.length > 0 && ('id_siswa' in rawData[0]) && ('saldo' in rawData[0]) && !('jenis_transaksi' in rawData[0]);
    if (isStudentArray || params.tipe === 'rekap_saldo' || params.tipe === 'SALDO') {
      const students = rawData;
      const totalSaldo = students.reduce((a: number, s: any) => a + (Number(s.saldo) || 0), 0);
      const totalSetoran = students.reduce((a: number, s: any) => a + (Number(s.total_setoran) || 0), 0);
      const totalPenarikan = students.reduce((a: number, s: any) => a + (Number(s.total_penarikan) || 0), 0);

      return {
        success: true,
        data: {
          judul: 'Rekapitulasi Saldo Seluruh Siswa',
          tipe: 'rekap_saldo',
          ringkasan: {
            total_setoran: totalSetoran,
            total_penarikan: totalPenarikan,
            selisih: totalSetoran - totalPenarikan,
            jumlah_transaksi: 0,
            total_saldo_mengendap: totalSaldo
          },
          transaksi: [],
          rekap_siswa: students
        }
      };
    } else {
      const trxList = rawData;
      const totalSetoran = trxList
        .filter((t: any) => t.jenis_transaksi === 'SETORAN' && t.status !== 'DIBATALKAN')
        .reduce((a: number, b: any) => a + (Number(b.nominal) || 0), 0);
      const totalPenarikan = trxList
        .filter((t: any) => t.jenis_transaksi === 'PENARIKAN' && t.status !== 'DIBATALKAN')
        .reduce((a: number, b: any) => a + (Number(b.nominal) || 0), 0);

      return {
        success: true,
        data: {
          judul: 'Laporan Transaksi Keuangan',
          tipe: params.tipe || 'bulanan',
          ringkasan: {
            total_setoran: totalSetoran,
            total_penarikan: totalPenarikan,
            selisih: totalSetoran - totalPenarikan,
            jumlah_transaksi: trxList.length,
            total_saldo_mengendap: 0
          },
          transaksi: trxList
        }
      };
    }
  }

  // 3. Fallback safe empty structure
  return {
    success: true,
    data: {
      judul: 'Laporan Keuangan',
      tipe: params.tipe || 'bulanan',
      ringkasan: {
        total_setoran: 0,
        total_penarikan: 0,
        selisih: 0,
        jumlah_transaksi: 0,
        total_saldo_mengendap: 0
      },
      transaksi: [],
      rekap_siswa: []
    }
  };
}

export async function getUsers(): Promise<ApiResponse<User[]>> {
  return apiGet('getUsers');
}

export async function createUser(data: Partial<User & { password?: string }>): Promise<ApiResponse<User>> {
  return apiPost('createUser', data);
}

export async function updateUser(data: Partial<User & { password?: string }>): Promise<ApiResponse<void>> {
  return apiPost('updateUser', data);
}

export async function deleteUser(id_user: string): Promise<ApiResponse<void>> {
  return apiPost('deleteUser', { id_user });
}

export async function getLogs(): Promise<ApiResponse<LogAktivitas[]>> {
  return apiGet('getLogs');
}

// -------------------------------------------------------------
// INTERNAL SIMULATOR (Identical logic to Google Apps Script backend)
// -------------------------------------------------------------
function simulateGet<T>(action: string, params: Record<string, any>): ApiResponse<T> {
  const db = getLocalDb();

  if (action === 'getDashboard') {
    const totalSiswa = db.siswa.filter(s => s.status === 'AKTIF').length;
    const totalSaldo = db.siswa.reduce((acc, s) => acc + (s.saldo || 0), 0);
    const now = new Date();
    const currentYm = now.toISOString().slice(0, 7);
    const todayStr = now.toISOString().slice(0, 10);

    let totalSetoranBulanIni = 0;
    let totalPenarikanBulanIni = 0;
    let jumlahTransaksiHariIni = 0;

    db.transaksi.forEach(t => {
      if (t.status === 'AKTIF') {
        if (t.tanggal === todayStr) jumlahTransaksiHariIni++;
        if (t.tanggal.startsWith(currentYm)) {
          if (t.jenis_transaksi === 'SETORAN') totalSetoranBulanIni += t.nominal;
          if (t.jenis_transaksi === 'PENARIKAN') totalPenarikanBulanIni += t.nominal;
        }
      }
    });

    // 6-Month Chart Data
    const monthlyMap: Record<string, { bulan: string; ym: string; setoran: number; penarikan: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      monthlyMap[ym] = {
        bulan: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        ym,
        setoran: 0,
        penarikan: 0
      };
    }

    db.transaksi.forEach(t => {
      if (t.status === 'AKTIF') {
        const ym = t.tanggal.slice(0, 7);
        if (monthlyMap[ym]) {
          if (t.jenis_transaksi === 'SETORAN') monthlyMap[ym].setoran += t.nominal;
          if (t.jenis_transaksi === 'PENARIKAN') monthlyMap[ym].penarikan += t.nominal;
        }
      }
    });

    // Saldo per Kelas
    const kelasMap: Record<string, string> = {};
    const saldoKelasMap: Record<string, number> = {};
    db.kelas.forEach(k => {
      kelasMap[k.id_kelas] = k.nama_kelas;
      saldoKelasMap[k.id_kelas] = 0;
    });
    db.siswa.forEach(s => {
      saldoKelasMap[s.id_kelas] = (saldoKelasMap[s.id_kelas] || 0) + (s.saldo || 0);
    });

    const grafikSaldoKelas = Object.keys(saldoKelasMap).map(kId => ({
      id_kelas: kId,
      nama_kelas: kelasMap[kId] || kId,
      total_saldo: saldoKelasMap[kId]
    }));

    // Top 10 Siswa
    const topSiswa = [...db.siswa]
      .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
      .slice(0, 10)
      .map(s => ({
        id_siswa: s.id_siswa,
        nis: s.nis,
        nama_siswa: s.nama_siswa,
        id_kelas: s.id_kelas,
        saldo: s.saldo || 0
      }));

    const dashboard: DashboardData = {
      statistik: {
        total_siswa: totalSiswa,
        total_saldo: totalSaldo,
        total_setoran_bulan_ini: totalSetoranBulanIni,
        total_penarikan_bulan_ini: totalPenarikanBulanIni,
        jumlah_transaksi_hari_ini: jumlahTransaksiHariIni
      },
      grafik_bulanan: Object.values(monthlyMap),
      grafik_saldo_kelas: grafikSaldoKelas,
      top_siswa: topSiswa,
      transaksi_terbaru: db.transaksi.slice(0, 10)
    };

    return { success: true, data: dashboard as any };
  }

  if (action === 'getSiswa') {
    let result = [...db.siswa];
    if (params.id_kelas) result = result.filter(s => s.id_kelas === params.id_kelas);
    if (params.status) result = result.filter(s => s.status.toUpperCase() === params.status.toUpperCase());
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(s =>
        s.nama_siswa.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.no_tabungan.toLowerCase().includes(q)
      );
    }
    return { success: true, data: result as any };
  }

  if (action === 'getSiswaById') {
    const found = db.siswa.find(s => s.id_siswa === params.id_siswa || s.nis === params.id_siswa);
    if (!found) return { success: false, message: 'Siswa tidak ditemukan.' };
    return { success: true, data: found as any };
  }

  if (action === 'getKelas') {
    const kList = db.kelas.map(k => {
      const siswaInClass = db.siswa.filter(s => s.id_kelas === k.id_kelas && s.status === 'AKTIF');
      const totalSaldo = siswaInClass.reduce((acc, s) => acc + (s.saldo || 0), 0);
      const totalSetoran = siswaInClass.reduce((acc, s) => acc + (s.total_setoran || 0), 0);
      const totalPenarikan = siswaInClass.reduce((acc, s) => acc + (s.total_penarikan || 0), 0);
      return {
        ...k,
        wali_kelas: k.wali_kelas || k.nama_wali_kelas,
        jumlah_siswa: siswaInClass.length,
        total_saldo: totalSaldo,
        total_setoran: totalSetoran,
        total_penarikan: totalPenarikan
      };
    });
    return { success: true, data: kList as any };
  }

  if (action === 'getTransaksi') {
    let result = [...db.transaksi];
    if (params.id_kelas) result = result.filter(t => t.id_kelas === params.id_kelas);
    if (params.id_siswa) result = result.filter(t => t.id_siswa === params.id_siswa || t.nis === params.id_siswa);
    if (params.jenis_transaksi) result = result.filter(t => t.jenis_transaksi === params.jenis_transaksi);
    if (params.status) result = result.filter(t => t.status === params.status);
    if (params.start_date) result = result.filter(t => t.tanggal >= params.start_date);
    if (params.end_date) result = result.filter(t => t.tanggal <= params.end_date);
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(t =>
        t.no_transaksi.toLowerCase().includes(q) ||
        t.nama_siswa.toLowerCase().includes(q) ||
        t.nis.toLowerCase().includes(q) ||
        t.keterangan.toLowerCase().includes(q)
      );
    }
    if (params.limit && typeof params.limit === 'number') {
      result = result.slice(0, params.limit);
    }
    return { success: true, data: result as any };
  }

  if (action === 'getBukuTabungan') {
    const student = db.siswa.find(s => s.id_siswa === params.id_siswa || s.nis === params.id_siswa);
    if (!student) return { success: false, message: 'Siswa tidak ditemukan.' };

    let trxList = db.transaksi.filter(t => t.id_siswa === student.id_siswa);
    if (params.start_date) trxList = trxList.filter(t => t.tanggal >= params.start_date);
    if (params.end_date) trxList = trxList.filter(t => t.tanggal <= params.end_date);

    return {
      success: true,
      data: {
        siswa: student,
        transaksi: trxList
      } as any
    };
  }

  if (action === 'getLaporan') {
    const tipe = params.tipe || 'bulanan';
    let filtered = [...db.transaksi];
    let title = 'Laporan Keuangan Tabungan';
    let rekapSiswa: Siswa[] | undefined = undefined;
    let rekapKelas: Kelas[] | undefined = undefined;

    const totalSaldoMengendap = db.siswa.reduce((a, b) => a + (b.saldo || 0), 0);

    if (tipe === 'harian') {
      const dateTarget = params.tanggal || new Date().toISOString().slice(0, 10);
      filtered = filtered.filter(t => t.tanggal === dateTarget);
      title = `Laporan Harian (${dateTarget})`;
    } else if (tipe === 'bulanan') {
      const b = params.bulan || new Date().getMonth() + 1;
      const y = params.tahun || new Date().getFullYear();
      const prefix = `${y}-${String(b).padStart(2, '0')}`;
      filtered = filtered.filter(t => t.tanggal.startsWith(prefix));
      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      title = `Laporan Bulanan (${namaBulan[Number(b) - 1] || b} ${y})`;
    } else if (tipe === 'kelas') {
      const kId = params.id_kelas;
      if (kId) {
        filtered = filtered.filter(t => t.id_kelas === kId);
        rekapSiswa = db.siswa.filter(s => s.id_kelas === kId);
        const kObj = db.kelas.find(k => k.id_kelas === kId);
        title = `Laporan Tabungan Kelas ${kObj?.nama_kelas || kId}`;
      } else {
        title = 'Laporan Tabungan Semua Kelas';
      }
    } else if (tipe === 'rekap_saldo') {
      title = 'Rekapitulasi Saldo Seluruh Siswa';
      rekapSiswa = [...db.siswa];
      if (params.id_kelas) {
        rekapSiswa = rekapSiswa.filter(s => s.id_kelas === params.id_kelas);
      }
    }

    const totalSetoran = filtered.filter(t => t.jenis_transaksi === 'SETORAN' && t.status === 'AKTIF').reduce((a, b) => a + b.nominal, 0);
    const totalPenarikan = filtered.filter(t => t.jenis_transaksi === 'PENARIKAN' && t.status === 'AKTIF').reduce((a, b) => a + b.nominal, 0);

    const reportData: LaporanKeuanganData = {
      judul: title,
      tipe,
      ringkasan: {
        total_setoran: totalSetoran,
        total_penarikan: totalPenarikan,
        selisih: totalSetoran - totalPenarikan,
        jumlah_transaksi: filtered.length,
        total_saldo_mengendap: totalSaldoMengendap
      },
      transaksi: filtered,
      rekap_siswa: rekapSiswa,
      rekap_kelas: rekapKelas
    };

    return { success: true, data: reportData as any };
  }

  if (action === 'getUsers') {
    return { success: true, data: db.users as any };
  }

  if (action === 'getLogs') {
    return { success: true, data: db.logs as any };
  }

  return { success: false, message: 'Action tidak ditemukan.' };
}

function simulatePost<T>(action: string, payload: Record<string, any>): ApiResponse<T> {
  const db = getLocalDb();
  const operatorUser = getAuthUser();
  const now = new Date();
  const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const todayStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8);

  if (action === 'setupDatabase') {
    localLog('SETUP_DB', 'SYSTEM', 'DATABASE', 'Inisialisasi struktur sheet Google Sheets');
    return { success: true, message: 'Database Google Sheets berhasil diinisialisasi.' };
  }

  if (action === 'login') {
    const { username, password } = payload;
    const foundUser = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase().trim());
    if (foundUser) {
      if (foundUser.status !== 'AKTIF') {
        return { success: false, message: 'Akun Anda berstatus non-aktif. Hubungi Admin.' };
      }
      localLog('LOGIN', 'AUTH', foundUser.username, `Login berhasil sebagai ${foundUser.role}`);
      return {
        success: true,
        message: `Login berhasil. Selamat datang ${foundUser.nama}!`,
        data: { user: foundUser, token: `TOKEN-${Date.now()}` } as any
      };
    }

    // Cek apakah siswa
    const foundSiswa = db.siswa.find(s => s.nis.toLowerCase() === String(username).toLowerCase().trim());
    if (foundSiswa && (password === foundSiswa.nis || password === 'siswa123' || password === 'admin123')) {
      const studentUser: User = {
        id_user: foundSiswa.id_siswa,
        id_siswa: foundSiswa.id_siswa,
        username: foundSiswa.nis,
        nama: foundSiswa.nama_siswa,
        role: 'SISWA',
        id_kelas: foundSiswa.id_kelas,
        no_tabungan: foundSiswa.no_tabungan,
        status: foundSiswa.status
      };
      localLog('LOGIN', 'AUTH', foundSiswa.nis, 'Siswa login ke Buku Tabungan Mandiri');
      return {
        success: true,
        message: 'Login siswa berhasil.',
        data: { user: studentUser, token: `TOKEN-SISWA-${Date.now()}` } as any
      };
    }

    return { success: false, message: 'Username atau password salah.' };
  }

  if (action === 'createSiswa') {
    const { nis, nisn, nama_siswa, jenis_kelamin, tanggal_lahir, alamat, id_kelas, nama_orang_tua, no_hp_orang_tua, no_tabungan, status } = payload;
    if (!nis || !nama_siswa || !id_kelas) {
      return { success: false, message: 'NIS, Nama Siswa, dan Kelas wajib diisi.' };
    }
    if (db.siswa.some(s => s.nis === nis)) {
      return { success: false, message: `NIS '${nis}' sudah terdaftar untuk siswa lain.` };
    }

    const kelasObj = db.kelas.find(k => k.id_kelas === id_kelas);
    const autoTabungan = no_tabungan || `TAB-${(kelasObj?.nama_kelas || 'SCH').replace('-', '')}-${nis.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = `SISWA-${Date.now().toString().slice(-4)}`;

    const newSiswa: Siswa = {
      id_siswa: newId,
      nis,
      nisn: nisn || '',
      nama_siswa,
      jenis_kelamin: jenis_kelamin || 'Laki-laki',
      tanggal_lahir: tanggal_lahir || '',
      alamat: alamat || '',
      id_kelas,
      nama_kelas: kelasObj?.nama_kelas || id_kelas,
      nama_orang_tua: nama_orang_tua || '',
      no_hp_orang_tua: no_hp_orang_tua || '',
      no_tabungan: autoTabungan,
      status: status || 'AKTIF',
      total_setoran: 0,
      total_penarikan: 0,
      saldo: 0,
      created_at: nowStr,
      updated_at: nowStr
    };

    db.siswa.push(newSiswa);
    saveLocalDb({ siswa: db.siswa });
    localLog('CREATE_SISWA', 'SISWA', newId, `Mendaftarkan siswa: ${nama_siswa} (NIS: ${nis})`);

    return { success: true, message: 'Data siswa berhasil ditambahkan.', data: newSiswa as any };
  }

  if (action === 'updateSiswa') {
    const { id_siswa } = payload;
    const index = db.siswa.findIndex(s => s.id_siswa === id_siswa);
    if (index === -1) return { success: false, message: 'Data siswa tidak ditemukan.' };

    const kelasObj = payload.id_kelas ? db.kelas.find(k => k.id_kelas === payload.id_kelas) : undefined;
    db.siswa[index] = {
      ...db.siswa[index],
      ...payload,
      nama_kelas: kelasObj ? kelasObj.nama_kelas : db.siswa[index].nama_kelas,
      updated_at: nowStr
    };
    saveLocalDb({ siswa: db.siswa });
    localLog('UPDATE_SISWA', 'SISWA', id_siswa, `Memperbarui data siswa: ${db.siswa[index].nama_siswa}`);

    return { success: true, message: 'Data siswa berhasil diperbarui.' };
  }

  if (action === 'deleteSiswa') {
    const { id_siswa } = payload;
    const index = db.siswa.findIndex(s => s.id_siswa === id_siswa);
    if (index === -1) return { success: false, message: 'Data siswa tidak ditemukan.' };

    db.siswa[index].status = 'NONAKTIF';
    db.siswa[index].updated_at = nowStr;
    saveLocalDb({ siswa: db.siswa });
    localLog('UPDATE_SISWA', 'SISWA', id_siswa, `Menonaktifkan siswa: ${db.siswa[index].nama_siswa}`);

    return { success: true, message: 'Siswa berhasil dinonaktifkan.' };
  }

  if (action === 'createKelas') {
    const { nama_kelas, tingkat, id_wali_kelas, nama_wali_kelas, tahun_ajaran, status } = payload;
    if (!nama_kelas) return { success: false, message: 'Nama kelas wajib diisi.' };

    const newId = `KLS-0${db.kelas.length + 1}`;
    const newKelas: Kelas = {
      id_kelas: newId,
      nama_kelas,
      tingkat: tingkat || '7',
      id_wali_kelas: id_wali_kelas || '',
      nama_wali_kelas: nama_wali_kelas || '',
      wali_kelas: nama_wali_kelas || '',
      tahun_ajaran: tahun_ajaran || '2025/2026',
      status: status || 'AKTIF',
      jumlah_siswa: 0,
      total_saldo: 0,
      total_setoran: 0,
      total_penarikan: 0
    };
    db.kelas.push(newKelas);
    saveLocalDb({ kelas: db.kelas });
    localLog('UPDATE_KELAS', 'KELAS', newId, `Menambahkan kelas baru: ${nama_kelas}`);

    return { success: true, message: 'Kelas berhasil ditambahkan.', data: newKelas as any };
  }

  if (action === 'updateKelas') {
    const { id_kelas } = payload;
    const index = db.kelas.findIndex(k => k.id_kelas === id_kelas);
    if (index === -1) return { success: false, message: 'Kelas tidak ditemukan.' };

    db.kelas[index] = {
      ...db.kelas[index],
      ...payload,
      wali_kelas: payload.nama_wali_kelas || payload.wali_kelas || db.kelas[index].wali_kelas
    };
    saveLocalDb({ kelas: db.kelas });
    localLog('UPDATE_KELAS', 'KELAS', id_kelas, `Memperbarui kelas: ${db.kelas[index].nama_kelas}`);

    return { success: true, message: 'Data kelas berhasil diperbarui.' };
  }

  if (action === 'deleteKelas') {
    const { id_kelas } = payload;
    const index = db.kelas.findIndex(k => k.id_kelas === id_kelas);
    if (index === -1) return { success: false, message: 'Kelas tidak ditemukan.' };

    db.kelas[index].status = 'NONAKTIF';
    saveLocalDb({ kelas: db.kelas });
    localLog('UPDATE_KELAS', 'KELAS', id_kelas, `Menonaktifkan kelas: ${db.kelas[index].nama_kelas}`);
    return { success: true, message: 'Kelas berhasil dinonaktifkan.' };
  }

  if (action === 'createSetoran') {
    const { id_siswa, nominal, tanggal, keterangan } = payload;
    const numNominal = Number(nominal) || 0;
    if (!id_siswa) return { success: false, message: 'Pilih siswa terlebih dahulu.' };
    if (numNominal <= 0) return { success: false, message: 'Nominal setoran harus lebih besar dari 0.' };

    const studentIndex = db.siswa.findIndex(s => s.id_siswa === id_siswa);
    if (studentIndex === -1) return { success: false, message: 'Siswa tidak ditemukan.' };

    const student = db.siswa[studentIndex];
    const saldoSebelum = student.saldo || 0;
    const saldoSesudah = saldoSebelum + numNominal;
    const totalSetoranBaru = (student.total_setoran || 0) + numNominal;

    const dateFormatted = (tanggal || todayStr).replace(/-/g, '');
    const countToday = db.transaksi.filter(t => t.jenis_transaksi === 'SETORAN' && t.tanggal === (tanggal || todayStr)).length + 1;
    const noTrx = `ST-${dateFormatted}-${('0000' + countToday).slice(-4)}`;
    const idTrx = `TRX-${Date.now()}`;

    const newTrx: Transaksi = {
      id_transaksi: idTrx,
      no_transaksi: noTrx,
      tanggal: tanggal || todayStr,
      waktu: timeStr,
      id_siswa: student.id_siswa,
      nis: student.nis,
      nama_siswa: student.nama_siswa,
      id_kelas: student.id_kelas,
      nama_kelas: student.nama_kelas,
      jenis_transaksi: 'SETORAN',
      nominal: numNominal,
      saldo_sebelum: saldoSebelum,
      saldo_sesudah: saldoSesudah,
      keterangan: keterangan || 'Setoran tabungan',
      id_user: operatorUser?.id_user || 'SYSTEM',
      nama_petugas: operatorUser?.nama || 'Petugas Tabungan',
      status: 'AKTIF',
      created_at: nowStr
    };

    // Update Saldo Siswa
    db.siswa[studentIndex].saldo = saldoSesudah;
    db.siswa[studentIndex].total_setoran = totalSetoranBaru;
    db.siswa[studentIndex].updated_at = nowStr;

    db.transaksi.unshift(newTrx);
    saveLocalDb({ siswa: db.siswa, transaksi: db.transaksi });

    localLog('CREATE_SETORAN', 'TABUNGAN', noTrx, `Setoran Rp ${numNominal.toLocaleString('id-ID')} untuk ${student.nama_siswa}. Saldo baru: Rp ${saldoSesudah.toLocaleString('id-ID')}`);

    return {
      success: true,
      message: 'Setoran tabungan berhasil disimpan.',
      data: newTrx as any
    };
  }

  if (action === 'createPenarikan') {
    const { id_siswa, nominal, tanggal, keterangan } = payload;
    const numNominal = Number(nominal) || 0;
    if (!id_siswa) return { success: false, message: 'Pilih siswa terlebih dahulu.' };
    if (numNominal <= 0) return { success: false, message: 'Nominal penarikan harus lebih besar dari 0.' };

    const studentIndex = db.siswa.findIndex(s => s.id_siswa === id_siswa);
    if (studentIndex === -1) return { success: false, message: 'Siswa tidak ditemukan.' };

    const student = db.siswa[studentIndex];
    const saldoSebelum = student.saldo || 0;

    // VALIDASI SALDO
    if (numNominal > saldoSebelum) {
      return {
        success: false,
        message: 'Saldo tidak mencukupi'
      };
    }

    const saldoSesudah = saldoSebelum - numNominal;
    const totalPenarikanBaru = (student.total_penarikan || 0) + numNominal;

    const dateFormatted = (tanggal || todayStr).replace(/-/g, '');
    const countToday = db.transaksi.filter(t => t.jenis_transaksi === 'PENARIKAN' && t.tanggal === (tanggal || todayStr)).length + 1;
    const noTrx = `WD-${dateFormatted}-${('0000' + countToday).slice(-4)}`;
    const idTrx = `TRX-${Date.now()}`;

    const newTrx: Transaksi = {
      id_transaksi: idTrx,
      no_transaksi: noTrx,
      tanggal: tanggal || todayStr,
      waktu: timeStr,
      id_siswa: student.id_siswa,
      nis: student.nis,
      nama_siswa: student.nama_siswa,
      id_kelas: student.id_kelas,
      nama_kelas: student.nama_kelas,
      jenis_transaksi: 'PENARIKAN',
      nominal: numNominal,
      saldo_sebelum: saldoSebelum,
      saldo_sesudah: saldoSesudah,
      keterangan: keterangan || 'Penarikan tabungan',
      id_user: operatorUser?.id_user || 'SYSTEM',
      nama_petugas: operatorUser?.nama || 'Petugas Tabungan',
      status: 'AKTIF',
      created_at: nowStr
    };

    // Update Saldo Siswa
    db.siswa[studentIndex].saldo = saldoSesudah;
    db.siswa[studentIndex].total_penarikan = totalPenarikanBaru;
    db.siswa[studentIndex].updated_at = nowStr;

    db.transaksi.unshift(newTrx);
    saveLocalDb({ siswa: db.siswa, transaksi: db.transaksi });

    localLog('CREATE_PENARIKAN', 'TABUNGAN', noTrx, `Penarikan Rp ${numNominal.toLocaleString('id-ID')} untuk ${student.nama_siswa}. Sisa saldo: Rp ${saldoSesudah.toLocaleString('id-ID')}`);

    return {
      success: true,
      message: 'Penarikan tabungan berhasil diproses.',
      data: newTrx as any
    };
  }

  if (action === 'cancelTransaksi') {
    const { id_transaksi, alasan } = payload;
    const trxIndex = db.transaksi.findIndex(t => t.id_transaksi === id_transaksi || t.no_transaksi === id_transaksi);
    if (trxIndex === -1) return { success: false, message: 'Transaksi tidak ditemukan.' };

    const trx = db.transaksi[trxIndex];
    if (trx.status === 'DIBATALKAN') {
      return { success: false, message: 'Transaksi ini sudah pernah dibatalkan.' };
    }

    const studentIndex = db.siswa.findIndex(s => s.id_siswa === trx.id_siswa);
    if (studentIndex === -1) return { success: false, message: 'Siswa tidak ditemukan.' };

    const student = db.siswa[studentIndex];
    let newSaldo = student.saldo || 0;
    let newSetoran = student.total_setoran || 0;
    let newPenarikan = student.total_penarikan || 0;

    if (trx.jenis_transaksi === 'SETORAN') {
      if ((student.saldo || 0) < trx.nominal) {
        return {
          success: false,
          message: `Tidak dapat membatalkan setoran karena saldo saat ini (Rp ${student.saldo?.toLocaleString('id-ID')}) kurang dari nominal yang dibatalkan.`
        };
      }
      newSaldo = (student.saldo || 0) - trx.nominal;
      newSetoran = Math.max(0, (student.total_setoran || 0) - trx.nominal);
    } else {
      newSaldo = (student.saldo || 0) + trx.nominal;
      newPenarikan = Math.max(0, (student.total_penarikan || 0) - trx.nominal);
    }

    db.transaksi[trxIndex].status = 'DIBATALKAN';
    db.transaksi[trxIndex].keterangan = `${trx.keterangan} [DIBATALKAN: ${alasan || 'Pembatalan'} oleh ${operatorUser?.nama || 'Petugas'} pada ${nowStr}]`;

    db.siswa[studentIndex].saldo = newSaldo;
    db.siswa[studentIndex].total_setoran = newSetoran;
    db.siswa[studentIndex].total_penarikan = newPenarikan;
    db.siswa[studentIndex].updated_at = nowStr;

    saveLocalDb({ siswa: db.siswa, transaksi: db.transaksi });
    localLog('CANCEL_TRANSAKSI', 'TABUNGAN', trx.no_transaksi, `Membatalkan ${trx.jenis_transaksi} ${trx.no_transaksi} (${trx.nama_siswa}). Alasan: ${alasan}`);

    return {
      success: true,
      message: `Transaksi ${trx.no_transaksi} berhasil dibatalkan. Saldo telah dikoreksi.`,
      data: { no_transaksi: trx.no_transaksi, saldo_baru: newSaldo } as any
    };
  }

  if (action === 'createUser') {
    const { username, nama, password, role, id_kelas, status } = payload;
    if (!username || !nama || !password) {
      return { success: false, message: 'Username, Nama, dan Password wajib diisi.' };
    }
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: `Username '${username}' sudah digunakan.` };
    }

    const newId = `USR-${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id_user: newId,
      username,
      nama,
      role: role || 'WALI_KELAS',
      id_kelas: id_kelas || '',
      status: status || 'AKTIF',
      created_at: nowStr,
      updated_at: nowStr
    };
    db.users.push(newUser);
    saveLocalDb({ users: db.users });
    localLog('CREATE_USER', 'PENGGUNA', newId, `Membuat akun pengguna: ${username} (${newUser.role})`);

    return { success: true, message: 'Pengguna baru berhasil ditambahkan.', data: newUser as any };
  }

  if (action === 'updateUser') {
    const { id_user } = payload;
    const index = db.users.findIndex(u => u.id_user === id_user);
    if (index === -1) return { success: false, message: 'Pengguna tidak ditemukan.' };

    db.users[index] = { ...db.users[index], ...payload, updated_at: nowStr };
    saveLocalDb({ users: db.users });
    localLog('UPDATE_USER', 'PENGGUNA', id_user, `Memperbarui akun pengguna: ${db.users[index].username}`);

    return { success: true, message: 'Data pengguna berhasil diperbarui.' };
  }

  if (action === 'deleteUser') {
    const { id_user } = payload;
    const index = db.users.findIndex(u => u.id_user === id_user);
    if (index === -1) return { success: false, message: 'Pengguna tidak ditemukan.' };

    db.users[index].status = 'NONAKTIF';
    db.users[index].updated_at = nowStr;
    saveLocalDb({ users: db.users });
    localLog('UPDATE_USER', 'PENGGUNA', id_user, `Menonaktifkan akun pengguna: ${db.users[index].username}`);
    return { success: true, message: 'Pengguna berhasil dinonaktifkan.' };
  }

  return { success: false, message: `Action POST '${action}' tidak dikenali.` };
}
