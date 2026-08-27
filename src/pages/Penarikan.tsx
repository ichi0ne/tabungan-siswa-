/**
 * Penarikan Tabungan Siswa Page Component (Prompt Section 12)
 * Form Penarikan, Validasi Saldo Mencukupi, Tampilan Saldo Real-Time, & Bukti Penarikan
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getSiswa, getTransaksi, createPenarikan, cancelTransaksi } from '../services/api';
import { Siswa, Transaksi } from '../types';
import { formatRupiah, formatTanggal, getTodayDateString } from '../utils/formatters';
import { ReceiptModal } from '../components/ReceiptModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  Wallet,
  Printer,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const Penarikan: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tanggal, setTanggal] = useState(getTodayDateString());
  const [nominal, setNominal] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('Penarikan Tabungan Siswa');

  // Receipt & Cancel Dialogs
  const [recentReceiptTrx, setRecentReceiptTrx] = useState<Transaksi | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Transaksi | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSiswa, resTrx] = await Promise.all([
        getSiswa({ status: 'AKTIF' }),
        getTransaksi({ jenis_transaksi: 'PENARIKAN', limit: 20 })
      ]);
      if (resSiswa.success && resSiswa.data) setSiswaList(resSiswa.data);
      if (resTrx.success && resTrx.data) setTransaksiList(resTrx.data);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedSiswa = useMemo(() => {
    return siswaList.find(s => s.id_siswa === selectedSiswaId) || null;
  }, [siswaList, selectedSiswaId]);

  const searchedSiswaList = useMemo(() => {
    if (!studentSearch) return siswaList.slice(0, 8);
    const q = studentSearch.toLowerCase();
    return siswaList
      .filter(
        s =>
          s.nama_siswa.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.no_tabungan.toLowerCase().includes(q) ||
          (s.nama_kelas && s.nama_kelas.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [siswaList, studentSearch]);

  const handleSelectStudent = (siswa: Siswa) => {
    setSelectedSiswaId(siswa.id_siswa);
    setStudentSearch(`${siswa.nama_siswa} (${siswa.nis} - ${siswa.nama_kelas || siswa.id_kelas})`);
    setIsDropdownOpen(false);
  };

  const isSaldoInsufficient = useMemo(() => {
    if (!selectedSiswa || !nominal) return false;
    return Number(nominal) > Number(selectedSiswa.saldo);
  }, [selectedSiswa, nominal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId || !selectedSiswa) {
      showToast('warning', 'Validasi', 'Silakan pilih siswa terlebih dahulu.');
      return;
    }
    const num = Number(nominal);
    if (!num || num <= 0) {
      showToast('warning', 'Validasi', 'Nominal penarikan harus lebih besar dari Rp 0.');
      return;
    }
    if (num > selectedSiswa.saldo) {
      showToast('error', 'Saldo Tidak Mencukupi', `Saldo siswa hanya ${formatRupiah(selectedSiswa.saldo)}`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await createPenarikan({
        id_siswa: selectedSiswaId,
        tanggal,
        nominal: num,
        keterangan
      });

      if (res.success && res.data) {
        showToast('success', 'Penarikan Berhasil', `Penarikan ${formatRupiah(num)} untuk ${selectedSiswa.nama_siswa} berhasil diproses.`);
        setRecentReceiptTrx(res.data);
        // Reset Form
        setSelectedSiswaId('');
        setStudentSearch('');
        setNominal('');
        setKeterangan('Penarikan Tabungan Siswa');
        fetchData();
      } else {
        showToast('error', 'Gagal', res.message || 'Gagal memproses penarikan.');
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTransaksi = async (alasan?: string) => {
    if (!cancelTarget) return;
    try {
      setIsCancelling(true);
      const res = await cancelTransaksi(cancelTarget.id_transaksi, alasan || 'Dibatalkan oleh operator');
      if (res.success) {
        showToast('info', 'Dibatalkan', `Penarikan ${cancelTarget.no_transaksi} berhasil dibatalkan.`);
        setCancelTarget(null);
        fetchData();
      } else {
        showToast('error', 'Gagal', res.message || 'Gagal membatalkan penarikan.');
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ArrowUpRight className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Pencatatan Penarikan Tabungan</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proses penarikan saldo siswa dengan proteksi validasi saldo minimum dan pencetakan bukti slip penarikan
          </p>
        </div>

        <button
          id="btn-refresh-penarikan"
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title="Refresh Data"
          aria-label="Refresh Data Penarikan"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Penarikan (Left Column) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Formulir Penarikan</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Tanggal Transaksi */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Penarikan <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-tanggal-penarikan"
                type="date"
                required
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Cari / Pilih Siswa */}
            <div className="relative">
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Nasabah Siswa <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="input-search-siswa-penarikan"
                  type="text"
                  value={studentSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Ketik NIS, nama, atau no tabungan..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {searchedSiswaList.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 italic">
                      Siswa tidak ditemukan.
                    </div>
                  ) : (
                    searchedSiswaList.map(s => (
                      <button
                        key={s.id_siswa}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full text-left p-3 hover:bg-amber-50/60 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{s.nama_siswa}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            NIS: {s.nis} • {s.nama_kelas || s.id_kelas} • {s.no_tabungan}
                          </p>
                        </div>
                        <span className="font-bold text-blue-700 text-xs">
                          {formatRupiah(s.saldo)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Live Display Info Saldo Siswa */}
            {selectedSiswa && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-900 font-medium">Siswa Terpilih:</span>
                  <span className="font-bold text-amber-950">{selectedSiswa.nama_siswa}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-900 font-medium">Kelas / NIS:</span>
                  <span className="text-amber-900">{selectedSiswa.nama_kelas || selectedSiswa.id_kelas} / {selectedSiswa.nis}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
                  <span className="text-amber-900 font-bold text-xs flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Saldo Tersedia:
                  </span>
                  <span className="text-base font-extrabold text-blue-800">
                    {formatRupiah(selectedSiswa.saldo)}
                  </span>
                </div>
              </div>
            )}

            {/* Nominal Penarikan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nominal Penarikan (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-nominal-penarikan"
                type="number"
                min="1000"
                step="500"
                required
                value={nominal}
                onChange={e => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 50000"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:bg-white ${
                  isSaldoInsufficient
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/40 text-rose-700'
                    : 'border-slate-300 focus:ring-amber-500'
                }`}
              />

              {/* Saldo Overdraft Warning Alert */}
              {isSaldoInsufficient && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-800 flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    Saldo tidak mencukupi! Maksimal penarikan: <b>{formatRupiah(selectedSiswa?.saldo || 0)}</b>
                  </span>
                </div>
              )}

              {/* Quick Withdraw All Button */}
              {selectedSiswa && selectedSiswa.saldo > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setNominal(selectedSiswa.saldo)}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[11px] transition-colors"
                  >
                    Tarik Seluruh Saldo ({formatRupiah(selectedSiswa.saldo)})
                  </button>
                </div>
              )}
            </div>

            {/* Keterangan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keterangan / Keperluan</label>
              <input
                id="input-keterangan-penarikan"
                type="text"
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                placeholder="Misal: Keperluan pembelian buku pelajaran..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <button
              id="btn-submit-penarikan"
              type="submit"
              disabled={submitting || !selectedSiswaId || !nominal || isSaldoInsufficient}
              className="w-full mt-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proses Penarikan Dana</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Riwayat Penarikan Terbaru (Right Column) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Riwayat Penarikan Terbaru</span>
              </h3>
              <span className="text-xs text-slate-400">20 Transaksi Terakhir</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Tanggal / Waktu</th>
                    <th className="p-3">No. Transaksi</th>
                    <th className="p-3">Siswa</th>
                    <th className="p-3 text-right">Nominal</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Memuat riwayat penarikan...
                      </td>
                    </tr>
                  ) : transaksiList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Belum ada riwayat penarikan dana.
                      </td>
                    </tr>
                  ) : (
                    transaksiList.map(t => (
                      <tr key={t.id_transaksi} className={`hover:bg-slate-50 ${t.status === 'DIBATALKAN' ? 'opacity-50' : ''}`}>
                        <td className="p-3 whitespace-nowrap font-medium">
                          {formatTanggal(t.tanggal)}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{t.no_transaksi}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 block">{t.nama_siswa}</span>
                          <span className="text-[10px] text-slate-400">{t.nama_kelas || t.id_kelas}</span>
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'AKTIF'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700 line-through'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-print-penarikan-${t.id_transaksi}`}
                              onClick={() => setRecentReceiptTrx(t)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Cetak Bukti Penarikan"
                              aria-label="Cetak Struk"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {t.status === 'AKTIF' && (
                              <button
                                id={`btn-cancel-penarikan-${t.id_transaksi}`}
                                onClick={() => setCancelTarget(t)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Batalkan Penarikan (Reversal)"
                                aria-label="Batalkan Penarikan"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cetak Struk Penarikan */}
      <ReceiptModal
        isOpen={Boolean(recentReceiptTrx)}
        onClose={() => setRecentReceiptTrx(null)}
        transaksi={recentReceiptTrx}
      />

      {/* Dialog Konfirmasi Pembatalan Penarikan (Reversal) */}
      <ConfirmDialog
        id="dialog-cancel-penarikan"
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelTransaksi}
        title="Batalkan Transaksi Penarikan (Reversal)"
        message={`Apakah Anda yakin ingin membatalkan penarikan ${formatRupiah(cancelTarget?.nominal || 0)} untuk siswa ${cancelTarget?.nama_siswa}? Saldo siswa akan otomatis dikembalikan.`}
        confirmText="Ya, Batalkan Penarikan"
        isDangerous
        requireReason
        reasonPlaceholder="Tuliskan alasan pembatalan penarikan..."
        loading={isCancelling}
      />
    </div>
  );
};
