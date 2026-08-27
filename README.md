# Sistem Manajemen Keuangan Tabungan Siswa

Aplikasi web full-stack modern, terstruktur, dan siap pakai untuk pengelolaan tabungan siswa di sekolah berbasis **React + TypeScript + Tailwind CSS** di frontend dan **Google Apps Script + Google Sheets** sebagai database & REST API backend.

---

## 🏛️ Arsitektur Sistem

```
Frontend (React + Vite)  ──[ HTTPS JSON ]──>  Google Apps Script (Web App)  ──[ Lock & Batch ]──>  Google Sheets (Database)
        │
   (Vercel / Cloud)
```

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend / API**: Google Apps Script (GAS) Web App dengan V8 Runtime, LockService concurrency guard, dan JSON output.
- **Database**: Google Sheets (Multi-sheet relational model: USERS, SISWA, KELAS, TRANSAKSI, SALDO, TAHUN_AJARAN, LOG_AKTIVITAS).

---

## 📋 Fitur Utama

1. **Autentikasi & Multi-Role**:
   - `ADMIN`: Akses penuh ke seluruh fitur & kelola akun pengguna.
   - `BENDAHARA`: Transaksi setoran, penarikan, saldo, dan laporan.
   - `WALI_KELAS`: Memantau siswa kelas bimbingan, riwayat, dan saldo.
   - `SISWA`: Portal mandiri melihat profil dan buku tabungan siswa.
2. **Dashboard Interaktif**:
   - Statistik total siswa, total saldo, setoran/penarikan bulan ini, dan transaksi hari ini.
   - Grafik Recharts: Tren bulanan, distribusi saldo per kelas, dan Top 10 siswa.
   - Tabel transaksi terbaru realtime.
3. **Data Master Siswa & Kelas**:
   - Manajemen siswa lengkap (NIS, NISN, Nama, JK, Tgl Lahir, Alamat, Kelas, Ortu, No. Tabungan).
   - Generate nomor tabungan otomatis.
   - Manajemen kelas & rekap otomatis jumlah siswa dan saldo per kelas.
4. **Setoran & Penarikan Realtime**:
   - Integrasi langsung dengan saldo terkini.
   - Validasi saldo di server (penarikan tidak boleh melebihi saldo).
   - Generate nomor transaksi otomatis (`ST-YYYYMMDD-XXXX` dan `WD-YYYYMMDD-XXXX`).
   - Cetak bukti transaksi / kuitansi resmi sekolah.
5. **Buku Tabungan Siswa**:
   - Rekening koran tabungan dengan running balance per transaksi.
   - Filter rentang tanggal.
   - Cetak buku tabungan fisik / simpan ke PDF.
   - Export transaksi ke format CSV.
6. **Laporan & Audit Log**:
   - Laporan transaksi, setoran, penarikan, saldo siswa, dan rekap per kelas.
   - Print view ramah cetak (Browser Print / Save PDF).
   - Pembatalan transaksi aman dengan reversal akuntansi (non-destructive).
   - Riwayat audit log semua tindakan pengguna.

---

## 🚀 Panduan Instalasi & Deployment

### Bagian A: Membuat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com) dan buat Spreadsheet baru.
2. Beri nama spreadsheet, misalnya **"Database Tabungan Siswa"**.
3. Anda tidak perlu membuat tabel manual! Script otomatis akan membuat seluruh sheet yang diperlukan.

---

### Bagian B: Memasang Backend Google Apps Script
1. Di Google Spreadsheet tersebut, klik menu **Extensions (Ekstensi)** → **Apps Script**.
2. Hapus kode default di editor, lalu salin file dari folder `google-apps-script/` di project ini:
   - `Config.gs`
   - `Utils.gs`
   - `Auth.gs`
   - `Siswa.gs`
   - `Kelas.gs`
   - `Transaksi.gs`
   - `Laporan.gs`
   - `Code.gs`
3. Pada dropdown fungsi di toolbar atas Apps Script, pilih fungsi **`setupDatabase`** lalu klik **Run (Jalankan)**.
4. Berikan izin akses Google (*Review permissions* → Pilih akun Anda → *Advanced* → *Go to ... (unsafe)* → *Allow*).
5. Struktur database Google Sheets beserta akun admin awal dan contoh data akan terbuat otomatis!
6. Untuk mendeploy API:
   - Klik tombol **Deploy** (kanan atas) → **New deployment**.
   - Pilih jenis: **Web app** (ikon roda gigi).
   - Isi deskripsi: *API Tabungan Siswa v1*.
   - **Execute as**: `Me (email Anda)`.
   - **Who has access**: `Anyone` (Siapa saja, bahkan anonim - *penting agar frontend dapat memanggil API*).
   - Klik **Deploy**.
   - **Salin Web App URL** yang dihasilkan (format: `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Bagian C: Menjalankan Frontend di Komputer Lokal

1. Clone atau buka direktori proyek ini.
2. Buat file `.env` dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Masukkan Web App URL dari Bagian B ke file `.env`:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
   ```
4. Install dependensi dan jalankan server pengembangan:
   ```bash
   npm install
   npm run dev
   ```
5. Buka `http://localhost:3000` di browser Anda.

---

### Bagian D: Deployment ke Vercel

1. Push kode ke repository GitHub / GitLab / Bitbucket Anda.
2. Buka dashboard [Vercel](https://vercel.com) dan klik **Add New Project** → Import Git repository Anda.
3. Di bagian **Environment Variables**, tambahkan:
   - **Key**: `VITE_GOOGLE_APPS_SCRIPT_URL`
   - **Value**: `URL Web App Google Apps Script Anda`
4. Klik **Deploy**.
5. Frontend aplikasi Anda sekarang aktif di Vercel dengan URL produksi!

---

## 🔑 Akun Default untuk Login Awal

| Role | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin123` | Akses penuh seluruh sistem |
| **BENDAHARA** | `bendahara` | `bendahara123` | Akses transaksi & laporan |
| **WALI KELAS** | `walikelas7a` | `wali123` | Akses siswa kelas 7-A |
| **SISWA** | `2025001` | `2025001` *(NIS)* | Akses buku tabungan siswa |

> ⚠️ **Catatan Keamanan**: Segera ubah password akun default di menu **Data Master → Pengguna** setelah instalasi sistem selesai.

---

## 🛠️ Struktur Folder Proyek

```
student-savings-management/
│
├── google-apps-script/          # Backend Google Apps Script (V8)
│   ├── Code.gs                  # Entry point API (doGet & doPost)
│   ├── Config.gs                # Konfigurasi & Inisialisasi Database
│   ├── Auth.gs                  # Login & Manajemen Pengguna
│   ├── Siswa.gs                 # Master Siswa & Sinkronisasi Saldo
│   ├── Kelas.gs                 # Master Kelas & Rekapitulasi Saldo
│   ├── Transaksi.gs             # Setoran, Penarikan, Saldo, Lock Concurrency
│   ├── Laporan.gs               # Dashboard, Laporan, Audit Log
│   └── Utils.gs                 # Format Rupiah, ID generator, dsb.
│
├── src/                         # Frontend React + TypeScript
│   ├── components/              # Komponen UI (Sidebar, Modal, Tabel, Receipt, dsb)
│   ├── layouts/                 # MainLayout (Sidebar, Drawer, Header)
│   ├── pages/                   # Halaman Utama (Login, Dashboard, Siswa, Setoran, Penarikan, dll)
│   ├── services/                # API Client & Mock fallback for offline preview
│   ├── hooks/                   # Custom React Hooks (useAuth, useToast)
│   ├── types/                   # TypeScript interfaces & types
│   ├── utils/                   # Formatters mata uang, tanggal, CSV export
│   ├── App.tsx                  # Router & State Provider
│   └── main.tsx                 # Root render
│
├── vercel.json                  # Konfigurasi routing Vercel SPA
├── package.json
└── README.md
```
