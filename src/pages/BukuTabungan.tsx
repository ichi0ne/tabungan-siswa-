/**
 * Buku Tabungan & Rekening Koran Page Component (Prompt Section 13)
 * Menampilkan Buku Tabungan Siswa, Filter Rentang Waktu & Mutasi, serta Cetak Fisik Buku
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSiswa, getBukuTabungan } from '../services/api';
import { Siswa, BukuTabunganData, Transaksi } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import { PassbookPrintModal } from '../components/PassbookPrintModal';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  BookOpen,
  Search,
  Printer,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Calendar,
  Building,
  User,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

interface BukuTabunganProps {
  initialSiswaId?: string;
}

export const BukuTabungan: React.FC<BukuTabunganProps> = ({ initialSiswaId }) => {
  const { user, isSiswa, isWaliKelas } = useAuth();

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(
    initialSiswaId || (isSiswa && user?.id_siswa ? user.id_siswa : '')
  );
  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [passbookData, setPassbookData] = useState<BukuTabunganData | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterJenis, setFilterJenis] = useState<'SEMUA' | 'SETORAN' | 'PENARIKAN'>('SEMUA');

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReceiptTrx, setSelectedReceiptTrx] = useState<Transaksi | null>(null);

  // Fetch Siswa List for Autocomplete (If not SISWA role)
  useEffect(() => {
    const fetchSiswa = async () => {
      if (isSiswa) return;
      try {
        const res = await getSiswa({
          id_kelas: isWaliKelas && user?.id_kelas ? user.id_kelas : undefined,
          status: 'AKTIF'
        });
        if (res.success && res.data) {
          setSiswaList(res.data);
          // If no student is selected yet, select first student
          if (!selectedSiswaId && res.data.length > 0) {
            setSelectedSiswaId(res.data[0].id_siswa);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data siswa:', err);
      }
    };
    fetchSiswa();
  }, [isSiswa, isWaliKelas, user]);

  // Load Passbook when selectedSiswaId changes
  useEffect(() => {
    const fetchPassbook = async () => {
      const idToLoad = isSiswa && user?.id_siswa ? user.id_siswa : selectedSiswaId;
      if (!idToLoad) return;

      try {
        setLoading(true);
        const res = await getBukuTabungan(idToLoad);
        if (res.success && res.data) {
          setPassbookData(res.data);
        }
      } catch (err) {
        console.error('Gagal memuat buku tabungan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPassbook();
  }, [selectedSiswaId, isSiswa, user?.id_siswa]);

  const searchedSiswaList = useMemo(() => {
    if (!studentSearch) return siswaList.slice(0, 8);
    const q = studentSearch.toLowerCase();
    return siswaList
      .filter(
        s =>
          s.nama_siswa.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.no_tabungan.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [siswaList, studentSearch]);

  const handleSelectStudent = (siswa: Siswa) => {
    setSelectedSiswaId(siswa.id_siswa);
    setStudentSearch(`${siswa.nama_siswa} (${siswa.nis} - ${siswa.nama_kelas || siswa.id_kelas})`);
    setIsDropdownOpen(false);
  };

  // Filter Mutasi Transaksi
  const filteredTransaksi = useMemo(() => {
    if (!passbookData) return [];
    return passbookData.transaksi.filter(t => {
      if (filterJenis !== 'SEMUA' && t.jenis_transaksi !== filterJenis) return false;
      if (startDate && t.tanggal < startDate) return false;
      if (endDate && t.tanggal > endDate) return false;
      return true;
    });
  }, [passbookData, filterJenis, startDate, endDate]);

  const s = passbookData?.siswa;

  return (
    <div className="space-y-6">
      {/* Top Selector Bar (Hanya tampil jika Admin/Bendahara/Wali Kelas) */}
      {!isSiswa && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:max-w-md relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Nasabah Siswa untuk Membuka Buku Tabungan:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="input-search-buku-tabungan"
                type="text"
                value={studentSearch}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={e => {
                  setStudentSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Ketik NIS, nama, atau no. tabungan siswa..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                {searchedSiswaList.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs italic">
                    Siswa tidak ditemukan.
                  </div>
                ) : (
                  searchedSiswaList.map(item => (
                    <button
                      key={item.id_siswa}
                      type="button"
                      onClick={() => handleSelectStudent(item)}
                      className="w-full text-left p-3 hover:bg-blue-50/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.nama_siswa}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          NIS: {item.nis} • {item.nama_kelas || item.id_kelas} • {item.no_tabungan}
                        </p>
                      </div>
                      <span className="font-bold text-blue-700">{formatRupiah(item.saldo)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-buku-tabungan"
              onClick={() => setIsPrintModalOpen(true)}
              disabled={!s}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Buku Tabungan / Slip</span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Membuka buku tabungan siswa...</p>
        </div>
      ) : !s ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 italic">
          Silakan pilih siswa untuk melihat buku tabungan.
        </div>
      ) : (
        <>
          {/* Header Kartu Buku Tabungan (Section 13) */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl shadow-slate-950/20 border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="space-y-1">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  REKENING TABUNGAN SISWA
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-2">
                  {s.nama_siswa}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <span>NIS: <b className="font-mono text-white">{s.nis}</b></span>
                  <span>Kelas: <b className="text-blue-300">{s.nama_kelas || s.id_kelas}</b></span>
                  <span>No. Tabungan: <b className="font-mono text-emerald-400">{s.no_tabungan}</b></span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-right min-w-[220px]">
                <span className="text-xs uppercase tracking-wider text-slate-300 block font-medium">
                  Saldo Tabungan Aktif
                </span>
                <span className="text-2xl font-black text-emerald-400 block mt-1">
                  {formatRupiah(s.saldo)}
                </span>
                <span className="text-[10px] text-slate-300 mt-1 block">
                  Total Setoran: {formatRupiah(s.total_setoran)} • Penarikan: {formatRupiah(s.total_penarikan)}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar Mutasi */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-4 flex items-center gap-2">
              <label className="text-slate-600 font-semibold whitespace-nowrap">Dari:</label>
              <input
                id="input-filter-start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-4 flex items-center gap-2">
              <label className="text-slate-600 font-semibold whitespace-nowrap">Sampai:</label>
              <input
                id="input-filter-end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                id="select-filter-jenis-mutasi"
                value={filterJenis}
                onChange={e => setFilterJenis(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="SEMUA">Semua Mutasi (Setoran & Penarikan)</option>
                <option value="SETORAN">Khusus Setoran</option>
                <option value="PENARIKAN">Khusus Penarikan</option>
              </select>
            </div>
          </div>

          {/* Tabel Mutasi Rekening Koran (Section 13) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs">Lembar Catatan Mutasi Buku Tabungan</h3>
              </div>
              <span className="text-[11px] text-slate-500">
                {filteredTransaksi.length} Catatan Ditemukan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">No. Transaksi</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 text-right">Setoran (Kredit)</th>
                    <th className="p-3 text-right">Penarikan (Debit)</th>
                    <th className="p-3 text-right">Saldo Akhir</th>
                    <th className="p-3 text-center">Petugas</th>
                    <th className="p-3 text-center">Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransaksi.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400 italic">
                        Tidak ada riwayat mutasi transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTransaksi.map((t, idx) => {
                      const isSetoran = t.jenis_transaksi === 'SETORAN';
                      const isCancelled = t.status === 'DIBATALKAN';
                      return (
                        <tr
                          key={t.id_transaksi || idx}
                          className={`hover:bg-slate-50 transition-colors ${
                            isCancelled ? 'opacity-40 bg-rose-50/40 line-through' : ''
                          }`}
                        >
                          <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-3 font-medium whitespace-nowrap">{formatTanggal(t.tanggal)}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">{t.no_transaksi}</td>
                          <td className="p-3 text-slate-700 max-w-[200px] truncate" title={t.keterangan}>
                            {t.keterangan || '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {isSetoran && !isCancelled ? `+ ${formatRupiah(t.nominal)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-600 whitespace-nowrap">
                            {!isSetoran && !isCancelled ? `- ${formatRupiah(t.nominal)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap">
                            {formatRupiah(t.saldo_sesudah)}
                          </td>
                          <td className="p-3 text-center text-slate-500 truncate max-w-[110px]">
                            {t.nama_petugas || 'Petugas'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              id={`btn-receipt-passbook-${t.id_transaksi}`}
                              onClick={() => setSelectedReceiptTrx(t)}
                              className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                            >
                              Struk
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Cetak Rekening Koran */}
      {s && (
        <PassbookPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          siswa={s}
          transaksi={filteredTransaksi}
        />
      )}

      {/* Modal Struk */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptTrx)}
        onClose={() => setSelectedReceiptTrx(null)}
        transaksi={selectedReceiptTrx}
      />
    </div>
  );
};
