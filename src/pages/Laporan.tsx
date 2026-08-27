/**
 * Laporan & Rekapitulasi Keuangan Tabungan Siswa
 * Laporan Harian, Bulanan, Per Kelas, & Rekap Saldo Seluruh Siswa + Ekspor CSV & Cetak Dokumen Resmi
 */
import React, { useState, useEffect, useMemo } from 'react';
import { getLaporan, getKelas } from '../services/api';
import { LaporanKeuanganData, Kelas, Siswa, Transaksi } from '../types';
import { formatRupiah, formatTanggal, getTodayDateString } from '../utils/formatters';
import { CardStat } from '../components/CardStat';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building2,
  RefreshCw,
  Search,
  Users,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const Laporan: React.FC = () => {
  const { schoolProfile } = useSchoolProfile();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<LaporanKeuanganData | null>(null);

  // Filter States
  const [tipeLaporan, setTipeLaporan] = useState<'bulanan' | 'harian' | 'kelas' | 'rekap_saldo'>('bulanan');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [selectedKelas, setSelectedKelas] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-view for class report (Transactions vs Student Balances)
  const [kelasSubView, setKelasSubView] = useState<'transaksi' | 'siswa'>('transaksi');

  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const res = await getKelas();
        if (res.success && res.data) {
          setKelasList(res.data);
          if (res.data.length > 0 && !selectedKelas) {
            setSelectedKelas(res.data[0].id_kelas);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil kelas:', err);
      }
    };
    fetchKelas();
  }, []);

  const fetchLaporanData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const params: any = { tipe: tipeLaporan };

      if (tipeLaporan === 'harian') {
        params.tanggal = selectedDate;
      } else if (tipeLaporan === 'bulanan') {
        params.bulan = selectedBulan;
        params.tahun = selectedTahun;
      } else if (tipeLaporan === 'kelas') {
        params.id_kelas = selectedKelas;
      } else if (tipeLaporan === 'rekap_saldo') {
        if (selectedKelas) {
          params.id_kelas = selectedKelas;
        }
      }

      const res = await getLaporan(params);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMessage(res.message || 'Gagal memuat data laporan');
      }
    } catch (err: any) {
      console.error('Gagal mengambil laporan:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanData();
  }, [tipeLaporan, selectedDate, selectedBulan, selectedTahun, selectedKelas]);

  // Filtered Transactions
  const filteredTransaksi = useMemo(() => {
    const trxList = data?.transaksi || [];
    if (!searchQuery.trim()) return trxList;
    const q = searchQuery.toLowerCase();
    return trxList.filter(
      t =>
        (t.no_transaksi && t.no_transaksi.toLowerCase().includes(q)) ||
        (t.nama_siswa && t.nama_siswa.toLowerCase().includes(q)) ||
        (t.nis && t.nis.toLowerCase().includes(q)) ||
        (t.keterangan && t.keterangan.toLowerCase().includes(q)) ||
        (t.nama_petugas && t.nama_petugas.toLowerCase().includes(q))
    );
  }, [data?.transaksi, searchQuery]);

  // Filtered Rekap Siswa
  const filteredSiswa = useMemo(() => {
    const siswaList = data?.rekap_siswa || [];
    if (!searchQuery.trim()) return siswaList;
    const q = searchQuery.toLowerCase();
    return siswaList.filter(
      s =>
        (s.nama_siswa && s.nama_siswa.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.no_tabungan && s.no_tabungan.toLowerCase().includes(q)) ||
        (s.nama_kelas && s.nama_kelas.toLowerCase().includes(q))
    );
  }, [data?.rekap_siswa, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (tipeLaporan === 'rekap_saldo' || (tipeLaporan === 'kelas' && kelasSubView === 'siswa')) {
      const siswaList = filteredSiswa;
      if (siswaList.length === 0) {
        alert('Tidak ada data siswa untuk diekspor.');
        return;
      }

      const headers = ['No', 'NIS', 'NISN', 'Nama Siswa', 'Kelas', 'No Tabungan', 'Total Setoran', 'Total Penarikan', 'Saldo Akhir', 'Status'];
      const rows = siswaList.map((s, idx) => [
        idx + 1,
        `"${s.nis}"`,
        `"${s.nisn || ''}"`,
        `"${s.nama_siswa}"`,
        `"${s.nama_kelas || s.id_kelas}"`,
        `"${s.no_tabungan || ''}"`,
        s.total_setoran || 0,
        s.total_penarikan || 0,
        s.saldo || 0,
        `"${s.status || 'AKTIF'}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rekap_Saldo_Siswa_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const trxList = filteredTransaksi;
    if (trxList.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const headers = ['No Transaksi', 'Tanggal', 'Waktu', 'NIS', 'Nama Siswa', 'Kelas', 'Jenis Transaksi', 'Nominal', 'Saldo Sebelum', 'Saldo Sesudah', 'Status', 'Petugas', 'Keterangan'];
    const rows = trxList.map(t => [
      `"${t.no_transaksi}"`,
      `"${t.tanggal}"`,
      `"${t.waktu || ''}"`,
      `"${t.nis}"`,
      `"${t.nama_siswa}"`,
      `"${t.nama_kelas || t.id_kelas}"`,
      `"${t.jenis_transaksi}"`,
      t.nominal,
      t.saldo_sebelum,
      t.saldo_sesudah,
      `"${t.status || 'AKTIF'}"`,
      `"${t.nama_petugas || ''}"`,
      `"${(t.keterangan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Tabungan_${tipeLaporan}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = data?.ringkasan || {
    total_setoran: 0,
    total_penarikan: 0,
    selisih: 0,
    jumlah_transaksi: 0,
    total_saldo_mengendap: 0
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Laporan &amp; Rekapitulasi Keuangan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis arus kas tabungan harian, bulanan, per kelas, serta rekapitulasi saldo seluruh siswa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            id="btn-print-laporan"
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Laporan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Parameters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Tipe Laporan Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          {[
            { id: 'bulanan', label: 'Laporan Bulanan', icon: Calendar },
            { id: 'harian', label: 'Laporan Harian', icon: FileText },
            { id: 'kelas', label: 'Laporan Per Kelas', icon: Building2 },
            { id: 'rekap_saldo', label: 'Rekap Saldo Seluruh Siswa', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = tipeLaporan === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-laporan-${tab.id}`}
                type="button"
                onClick={() => setTipeLaporan(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {tipeLaporan === 'harian' && (
              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700">Pilih Tanggal:</label>
                <input
                  id="input-laporan-tanggal"
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            )}

            {tipeLaporan === 'bulanan' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Bulan:</label>
                  <select
                    id="select-laporan-bulan"
                    value={selectedBulan}
                    onChange={e => setSelectedBulan(Number(e.target.value))}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {[
                      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                    ].map((bln, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {bln}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Tahun:</label>
                  <select
                    id="select-laporan-tahun"
                    value={selectedTahun}
                    onChange={e => setSelectedTahun(Number(e.target.value))}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {[2024, 2025, 2026, 2027].map(yr => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {tipeLaporan === 'kelas' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Pilih Kelas:</label>
                  <select
                    id="select-laporan-kelas"
                    value={selectedKelas}
                    onChange={e => setSelectedKelas(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {kelasList.map(k => (
                      <option key={k.id_kelas} value={k.id_kelas}>
                        Kelas {k.nama_kelas} (Wali: {k.wali_kelas || k.nama_wali_kelas || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setKelasSubView('transaksi')}
                    className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                      kelasSubView === 'transaksi' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    Mutasi Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => setKelasSubView('siswa')}
                    className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                      kelasSubView === 'siswa' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    Daftar Saldo Siswa
                  </button>
                </div>
              </>
            )}

            {tipeLaporan === 'rekap_saldo' && (
              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700">Filter Kelas:</label>
                <select
                  id="select-laporan-filter-kelas"
                  value={selectedKelas}
                  onChange={e => setSelectedKelas(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">Semua Rombongan Belajar</option>
                  {kelasList.map(k => (
                    <option key={k.id_kelas} value={k.id_kelas}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              id="btn-apply-laporan"
              type="button"
              onClick={fetchLaporanData}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
              title="Refresh Laporan"
              aria-label="Muat Ulang Laporan"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi / siswa..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={fetchLaporanData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Ringkasan Statistik Laporan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat
          id="stat-lap-setoran"
          title="Total Setoran Masuk"
          value={formatRupiah(summary.total_setoran)}
          subtitle="Arus kas masuk periode ini"
          icon={<ArrowDownLeft className="w-5 h-5" />}
          colorClass="from-emerald-600 to-teal-600"
        />

        <CardStat
          id="stat-lap-penarikan"
          title="Total Penarikan"
          value={formatRupiah(summary.total_penarikan)}
          subtitle="Arus kas keluar periode ini"
          icon={<ArrowUpRight className="w-5 h-5" />}
          colorClass="from-rose-500 to-amber-600"
        />

        <CardStat
          id="stat-lap-selisih"
          title="Net Arus Kas (Selisih)"
          value={formatRupiah(summary.selisih)}
          subtitle="Pertumbuhan saldo periode ini"
          icon={<Wallet className="w-5 h-5" />}
          colorClass="from-blue-600 to-indigo-600"
        />

        <CardStat
          id="stat-lap-saldo-total"
          title="Total Saldo Tersimpan"
          value={formatRupiah(summary.total_saldo_mengendap)}
          subtitle="Total dana siswa tersimpan"
          icon={<Building2 className="w-5 h-5" />}
          colorClass="from-purple-600 to-indigo-600"
        />
      </div>

      {/* Printable Report Document Container */}
      <div
        id="printable-laporan-area"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 print:border-none print:p-0"
      >
        {/* Kop Cetak Surat Resmi */}
        <div className="hidden print:block text-center pb-4 border-b-2 border-slate-900 mb-6">
          <h1 className="text-lg font-black uppercase tracking-wide text-slate-900">
            {schoolProfile.nama_sekolah || 'KELOMPOK B3 TK NEGERI KEMAYORAN 02'}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            {schoolProfile.alamat || schoolProfile.alamat_sekolah || ''} 
            {schoolProfile.telepon ? ` • Telp: ${schoolProfile.telepon}` : ''}
            {schoolProfile.npsn ? ` • NPSN: ${schoolProfile.npsn}` : ''}
          </p>
          <div className="border-t border-slate-300 my-2 pt-2">
            <h2 className="text-sm font-extrabold uppercase text-blue-900 tracking-wider">
              {tipeLaporan === 'rekap_saldo' ? 'REKAPITULASI SALDO TABUNGAN SISWA' : 'LAPORAN MUTASI & KEUANGAN TABUNGAN'}
            </h2>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">
              Periode: {data?.judul || 'Laporan Tabungan'}
            </p>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{data?.judul || 'Laporan Tabungan'}</h3>
            <p className="text-[11px] text-slate-500">
              {tipeLaporan === 'rekap_saldo' || (tipeLaporan === 'kelas' && kelasSubView === 'siswa')
                ? `Menampilkan ${filteredSiswa.length} Data Siswa`
                : `Menampilkan ${filteredTransaksi.length} Data Mutasi Transaksi`}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {tipeLaporan.toUpperCase().replace('_', ' ')}
          </span>
        </div>

        {/* TABLE 1: REKAP SALDO SISWA */}
        {tipeLaporan === 'rekap_saldo' || (tipeLaporan === 'kelas' && kelasSubView === 'siswa') ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">NISN</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">No. Tabungan</th>
                  <th className="p-3 text-right">Total Setoran</th>
                  <th className="p-3 text-right">Total Penarikan</th>
                  <th className="p-3 text-right">Saldo Akhir</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat data rekap saldo siswa...</span>
                    </td>
                  </tr>
                ) : filteredSiswa.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-slate-400 italic">
                      {searchQuery ? `Tidak ada siswa yang cocok dengan "${searchQuery}".` : 'Belum ada data siswa.'}
                    </td>
                  </tr>
                ) : (
                  filteredSiswa.map((s, idx) => (
                    <tr key={s.id_siswa || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-3 font-mono text-slate-700 font-medium">{s.nis}</td>
                      <td className="p-3 font-mono text-slate-500">{s.nisn || '-'}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.nama_siswa}</td>
                      <td className="p-3 text-slate-600">{s.nama_kelas || s.id_kelas}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{s.no_tabungan || '-'}</td>
                      <td className="p-3 text-right font-medium text-emerald-600">
                        {formatRupiah(s.total_setoran || 0)}
                      </td>
                      <td className="p-3 text-right font-medium text-rose-600">
                        {formatRupiah(s.total_penarikan || 0)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 bg-slate-50/50">
                        {formatRupiah(s.saldo || 0)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.status || 'AKTIF'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredSiswa.length > 0 && (
                <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={6} className="p-3 text-right uppercase text-[11px]">
                      Total Rekapitulasi:
                    </td>
                    <td className="p-3 text-right text-emerald-700">
                      {formatRupiah(filteredSiswa.reduce((a, b) => a + (b.total_setoran || 0), 0))}
                    </td>
                    <td className="p-3 text-right text-rose-700">
                      {formatRupiah(filteredSiswa.reduce((a, b) => a + (b.total_penarikan || 0), 0))}
                    </td>
                    <td className="p-3 text-right text-blue-700 bg-slate-200/50">
                      {formatRupiah(filteredSiswa.reduce((a, b) => a + (b.saldo || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          /* TABLE 2: TRANSAKSI MUTASI */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">No. Transaksi</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 text-right">Saldo Sesudah</th>
                  <th className="p-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat data transaksi laporan...</span>
                    </td>
                  </tr>
                ) : filteredTransaksi.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-slate-400 italic">
                      {searchQuery
                        ? `Tidak ada transaksi yang cocok dengan kata kunci "${searchQuery}".`
                        : 'Tidak ada transaksi pada periode laporan yang dipilih.'}
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
                          isCancelled ? 'opacity-40 line-through bg-rose-50/40' : ''
                        }`}
                      >
                        <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-3 font-medium whitespace-nowrap">{formatTanggal(t.tanggal)}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{t.no_transaksi}</td>
                        <td className="p-3 font-mono text-slate-700">{t.nis}</td>
                        <td className="p-3 font-semibold text-slate-900">{t.nama_siswa}</td>
                        <td className="p-3 text-slate-600">{t.nama_kelas || t.id_kelas}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSetoran ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.jenis_transaksi}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            isSetoran ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 bg-slate-50/50">
                          {formatRupiah(t.saldo_sesudah)}
                        </td>
                        <td className="p-3 text-slate-600 truncate max-w-[120px]">{t.nama_petugas || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredTransaksi.length > 0 && (
                <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={7} className="p-3 text-right uppercase text-[11px]">
                      Total Periode Ini:
                    </td>
                    <td className="p-3 text-right text-emerald-700">
                      {formatRupiah(
                        filteredTransaksi
                          .filter(t => t.jenis_transaksi === 'SETORAN' && t.status !== 'DIBATALKAN')
                          .reduce((a, b) => a + b.nominal, 0)
                      )}
                    </td>
                    <td className="p-3 text-right text-slate-800">
                      {filteredTransaksi.length} Trx
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Tanda Tangan Cetak Dokumen Resmi */}
        <div className="hidden print:block mt-12 pt-8 border-t border-slate-300 text-xs">
          <div className="text-right mb-6 text-slate-600">
            <span>
              {schoolProfile.kota || 'Indonesia'}, {formatTanggal(new Date())}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-slate-600 font-medium">Mengetahui,<br />Kepala Sekolah</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 border-t border-slate-400 mx-12 pt-1">
                ( {schoolProfile.kepala_sekolah || 'Kepala Sekolah'} )
              </p>
              {schoolProfile.nip_kepala_sekolah && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  NIP. {schoolProfile.nip_kepala_sekolah}
                </p>
              )}
            </div>
            <div>
              <p className="text-slate-600 font-medium">Pengelola Tabungan,<br />Bendahara Sekolah</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 border-t border-slate-400 mx-12 pt-1">
                ( {schoolProfile.bendahara || 'Bendahara Pengelola'} )
              </p>
              {schoolProfile.nip_bendahara && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  NIP. {schoolProfile.nip_bendahara}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
