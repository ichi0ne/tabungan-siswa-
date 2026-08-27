/**
 * Pengaturan Sistem & Integrasi Google Apps Script (Prompt Section 17 & 18)
 * Konfigurasi URL Google Apps Script Web App, Pengaturan Profil Sekolah, & Inisialisasi Database
 */
import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { getApiUrl, setApiUrl, setupDatabase } from '../services/api';
import { APPS_SCRIPT_ALL_IN_ONE_CODE } from '../services/appsScriptCode';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import {
  Settings,
  Database,
  Link,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  HelpCircle,
  ExternalLink,
  Copy,
  Sparkles,
  RefreshCw,
  Code2,
  Check,
  X,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Eye
} from 'lucide-react';

export const Pengaturan: React.FC = () => {
  const { showToast } = useToast();
  const { schoolProfile: currentProfile, updateProfile, resetProfile } = useSchoolProfile();

  const [gasUrl, setGasUrl] = useState(getApiUrl() || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [initializingDb, setInitializingDb] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form Profile State
  const [formData, setFormData] = useState({ ...currentProfile });

  const handleSaveGasUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setApiUrl(gasUrl.trim());
    showToast('success', 'Tersimpan', 'URL Google Apps Script API berhasil diperbarui.');
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      showToast('warning', 'Peringatan', 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }

    try {
      setTestingConnection(true);
      const res = await fetch(`${gasUrl.trim()}?action=ping`);
      const data = await res.json();
      if (data && data.success) {
        showToast('success', 'Koneksi Berhasil!', `Terkoneksi ke Google Sheets: ${data.message || 'Online'}`);
      } else {
        showToast('error', 'Koneksi Gagal', data.message || 'Web App tidak mengembalikan respon valid.');
      }
    } catch (err: any) {
      showToast('error', 'Gagal Terhubung', 'Pastikan Deployment Web App diatur: "Execute as: Me" dan "Who has access: Anyone".');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInitDatabase = async () => {
    try {
      setInitializingDb(true);
      const res = await setupDatabase();
      if (res.success) {
        showToast('success', 'Database Siap!', 'Sheet USERS, SISWA, KELAS, TRANSAKSI, SALDO, dan LOGS berhasil dibuat/diperbarui.');
      } else {
        showToast('error', 'Gagal Inisialisasi', res.message || 'Gagal memproses inisialisasi sheet.');
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    } finally {
      setInitializingDb(false);
    }
  };

  const handleSaveSchoolProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    showToast('success', 'Tersimpan!', 'Identitas sekolah & penandatangan dokumen berhasil diperbarui di seluruh sistem.');
  };

  const handleResetSchoolProfile = () => {
    const def = resetProfile();
    setFormData(def);
    showToast('info', 'Direset', 'Profil identitas sekolah dikembalikan ke standar awal.');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Pengaturan Sistem & Database</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola endpoint Google Apps Script Web App API, identitas resmi sekolah, dan format pencetakan slip
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Konfigurasi Google Apps Script (Section 17 & 18) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card API GAS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Koneksi Google Apps Script Web App</h3>
                <p className="text-[11px] text-slate-500">Database utama menggunakan spreadsheet Google Sheets</p>
              </div>
            </div>

            <form onSubmit={handleSaveGasUrl} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Deployment Web App Google Apps Script
                </label>
                <input
                  id="input-gas-url"
                  type="url"
                  value={gasUrl}
                  onChange={e => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * Dapatkan URL ini dari menu <b>Deploy &gt; New deployment &gt; Web app</b> pada Google Apps Script Anda.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  id="btn-save-gas-url"
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan URL</span>
                </button>

                <button
                  id="btn-test-gas-connection"
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !gasUrl.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {testingConnection ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Link className="w-3.5 h-3.5" />
                  )}
                  <span>Uji Koneksi API</span>
                </button>

                <button
                  id="btn-init-database"
                  type="button"
                  onClick={handleInitDatabase}
                  disabled={initializingDb}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {initializingDb ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Inisialisasi / Buat Sheets</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card Petunjuk Deployment */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Petunjuk Setup Google Sheets & Apps Script:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Salin Kode Apps Script</span>
              </button>
            </div>

            {/* Error Solution Callout */}
            <div className="p-3.5 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-[11px] text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mengalami &quot;ReferenceError: jsonResponse is not defined&quot;?</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                Penyebabnya adalah editor Apps Script Anda hanya berisi potongan file <code>Code.gs</code> tanpa file pendukung (seperti <code>Utils.gs</code>). 
                <b> Solusinya:</b> Klik tombol <b>&quot;Salin Kode Apps Script&quot;</b> di atas, lalu tempelkan <b>1 file lengkap (All-in-One)</b> tersebut ke Apps Script Anda!
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed text-[11px]">
              <li>
                Buka Spreadsheet baru di <b>Google Sheets</b> (<a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-2.5 h-2.5" /></a>).
              </li>
              <li>
                Buka menu <b>Extensions &gt; Apps Script</b>.
              </li>
              <li>
                Klik tombol <b>Salin Kode Apps Script</b> di atas, hapus kode bawaan di editor Apps Script, lalu <b>Paste (Tempel)</b> seluruhnya.
              </li>
              <li>
                Klik <b>Deploy &gt; New deployment &gt; Select type: Web App</b>.
              </li>
              <li>
                Atur <b>Execute as: Me</b> dan <b>Who has access: Anyone</b>.
              </li>
              <li>
                Salin <b>Web App URL</b> yang dihasilkan dan tempelkan pada kolom di atas!
              </li>
            </ol>
          </div>
        </div>

        {/* Kolom Kanan: Identitas & Profil Sekolah */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Identitas Sekolah & Dokumen Cetak</h3>
                  <p className="text-[11px] text-slate-500">Tercetak pada kop bukti transaksi, rekening koran, & laporan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetSchoolProfile}
                title="Reset ke identitas default"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <form onSubmit={handleSaveSchoolProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Instansi / Sekolah</label>
                <input
                  id="input-setting-nama-sekolah"
                  type="text"
                  required
                  value={formData.nama_sekolah}
                  onChange={e => setFormData({ ...formData, nama_sekolah: e.target.value })}
                  placeholder="Contoh: SMP NEGERI 1 INDONESIA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NPSN</label>
                  <input
                    id="input-setting-npsn"
                    type="text"
                    value={formData.npsn || ''}
                    onChange={e => setFormData({ ...formData, npsn: e.target.value })}
                    placeholder="Contoh: 20104050"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    id="input-setting-kota"
                    type="text"
                    value={formData.kota || ''}
                    onChange={e => setFormData({ ...formData, kota: e.target.value })}
                    placeholder="Contoh: Jakarta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Sekolah</label>
                <textarea
                  id="input-setting-alamat-sekolah"
                  rows={2}
                  value={formData.alamat || formData.alamat_sekolah || ''}
                  onChange={e => setFormData({ ...formData, alamat: e.target.value, alamat_sekolah: e.target.value })}
                  placeholder=""
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / Kontak</label>
                  <input
                    id="input-setting-kontak-sekolah"
                    type="text"
                    value={formData.telepon || ''}
                    onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                    placeholder="Contoh: (021) 555-0199"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    id="input-setting-email-sekolah"
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Wali Kelas</label>
                  <input
                    id="input-setting-kepsek"
                    type="text"
                    value={formData.kepala_sekolah || ''}
                    onChange={e => setFormData({ ...formData, kepala_sekolah: e.target.value })}
                    placeholder="Nama lengkap & gelar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontak Wali Kelas</label>
                  <input
                    id="input-setting-nip-kepsek"
                    type="text"
                    value={formData.nip_kepala_sekolah || ''}
                    onChange={e => setFormData({ ...formData, nip_kepala_sekolah: e.target.value })}
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Bendahara Kelas</label>
                  <input
                    id="input-setting-bendahara"
                    type="text"
                    value={formData.bendahara || ''}
                    onChange={e => setFormData({ ...formData, bendahara: e.target.value })}
                    placeholder="Nama lengkap & gelar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontak Bendahara</label>
                  <input
                    id="input-setting-nip-bendahara"
                    type="text"
                    value={formData.nip_bendahara || ''}
                    onChange={e => setFormData({ ...formData, nip_bendahara: e.target.value })}
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Opsi Visibilitas Quick Demo Login Preset */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label htmlFor="toggle-demo-login-preset" className="font-semibold text-slate-800 cursor-pointer">
                    Preset Akun Demo di Halaman Login
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Jika dinonaktifkan, tombol coba akun demo (Admin, Bendahara, Wali, Siswa) akan otomatis disembunyikan
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="toggle-demo-login-preset"
                    type="checkbox"
                    checked={formData.tampilkan_demo_login !== false}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData({ ...formData, tampilkan_demo_login: checked });
                      localStorage.setItem('LOGIN_DEMO_PRESET_VISIBLE', String(checked));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  id="btn-save-school-profile"
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Identitas Sekolah</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Kop Surat Dokumen Cetak */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Eye className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Pratinjau Kop & Dokumen Cetak</h4>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center shadow-xs text-xs">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-700" />
                <h5 className="font-black text-sm uppercase tracking-wide text-slate-900">
                  {formData.nama_sekolah || 'NAMA SEKOLAH BELUM DIISI'}
                </h5>
              </div>
              <p className="text-[11px] text-slate-500">
                {formData.alamat || 'Alamat sekolah belum diatur'} 
                {formData.telepon ? ` • Telp: ${formData.telepon}` : ''}
                {formData.npsn ? ` • NPSN: ${formData.npsn}` : ''}
              </p>
              
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 grid grid-cols-2 gap-4 text-left text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Wali Kelas:</span>
                  <span className="font-semibold text-slate-800">{formData.kepala_sekolah || '-'}</span>
                  {formData.nip_kepala_sekolah && (
                    <span className="block text-[10px] text-slate-500 font-mono">Nomor. {formData.nip_kepala_sekolah}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Bendahara Tabungan:</span>
                  <span className="font-semibold text-slate-800">{formData.bendahara || '-'}</span>
                  {formData.nip_bendahara && (
                    <span className="block text-[10px] text-slate-500 font-mono">Nomor. {formData.nip_bendahara}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Code Apps Script All-In-One */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kode Backend Google Apps Script (All-in-One 1 File)</h3>
                  <p className="text-[11px] text-slate-500">Salin seluruh kode ini ke editor script Google Sheets Anda</p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Code Preview */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Mengapa menggunakan All-in-One script?
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Menyatukan seluruh fungsi router, database, autentikasi, transaksi, dan utility ke dalam 1 file ini mencegah terjadinya error <code>ReferenceError: jsonResponse is not defined</code> atau fungsi tidak ditemukan di Google Apps Script.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                  {APPS_SCRIPT_ALL_IN_ONE_CODE}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Ukuran script: ~{APPS_SCRIPT_ALL_IN_ONE_CODE.length} karakter
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(APPS_SCRIPT_ALL_IN_ONE_CODE);
                    setCopiedCode(true);
                    showToast('success', 'Berhasil Disalin!', 'Seluruh kode Google Apps Script siap ditempel (Paste) ke editor Apps Script.');
                    setTimeout(() => setCopiedCode(false), 3000);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode Script'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
