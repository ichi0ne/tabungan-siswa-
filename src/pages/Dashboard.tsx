/**
 * Dashboard Page Component
 * Ringkasan Statistik, 3 Grafik Interaktif Recharts, & Tabel Transaksi Terbaru
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDashboard, getBukuTabungan } from '../services/api';
import { DashboardData, BukuTabunganData, Transaksi } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import { CardStat } from '../components/CardStat';
import { ReceiptModal } from '../components/ReceiptModal';
import { PageId } from '../layouts/MainLayout';
import {
  Users,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  PlusCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface DashboardProps {
  onNavigate: (page: PageId, extraId?: string) => void;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, isAdmin, isBendahara, isSiswa } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [studentData, setStudentData] = useState<BukuTabunganData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptTrx, setSelectedReceiptTrx] = useState<Transaksi | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (isSiswa && user?.id_siswa) {
        const res = await getBukuTabungan(user.id_siswa);
        if (res.success && res.data) {
          setStudentData(res.data);
        }
      } else {
        const res = await getDashboard();
        if (res.success && res.data) {
          setData(res.data);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isSiswa, user?.id_siswa]);

  if (loading && !data && !studentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Memuat statistik dashboard tabungan...</p>
      </div>
    );
  }

  // JIKA USER ROLE = SISWA: Tampilkan Portal Ringkasan Saldo Mandiri
  if (isSiswa && studentData) {
    const s = studentData.siswa;
    return (
      <div className="space-y-6">
        {/* Welcome Banner Siswa */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white shadow-xl shadow-blue-900/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
                Portal Tabungan Mandiri
              </span>
              <h2 className="text-2xl font-bold mt-2">Halo, {s.nama_siswa}!</h2>
              <p className="text-xs text-blue-100 mt-1">
                NIS: <span className="font-mono font-bold">{s.nis}</span> • Kelas: {s.nama_kelas || s.id_kelas} • No. Tabungan: <span className="font-mono font-bold">{s.no_tabungan}</span>
              </p>
            </div>
            <button
              id="btn-goto-buku-tabungan"
              onClick={() => onNavigate('buku-tabungan')}
              className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Lihat Buku Tabungan Lengkap</span>
            </button>
          </div>
        </div>

        {/* Saldo Cards Siswa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <CardStat
            id="stat-student-saldo"
            title="Total Saldo Tersimpan"
            value={formatRupiah(s.saldo)}
            subtitle="Saldo aktif siap pakai"
            icon={<Wallet className="w-6 h-6" />}
            colorClass="from-blue-600 to-indigo-600 text-white"
          />
          <CardStat
            id="stat-student-setoran"
            title="Akumulasi Setoran"
            value={formatRupiah(s.total_setoran)}
            subtitle="Total seluruh setoran masuk"
            icon={<ArrowDownLeft className="w-6 h-6" />}
            colorClass="from-emerald-600 to-teal-600 text-white"
          />
          <CardStat
            id="stat-student-penarikan"
            title="Akumulasi Penarikan"
            value={formatRupiah(s.total_penarikan)}
            subtitle="Total penarikan diambil"
            icon={<ArrowUpRight className="w-6 h-6" />}
            colorClass="from-amber-600 to-orange-600 text-white"
          />
        </div>

        {/* Riwayat Terkini Siswa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Riwayat Mutasi Terakhir</h3>
            <button
              id="btn-view-all-mutasi"
              onClick={() => onNavigate('buku-tabungan')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">No. Transaksi</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 text-right">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentData.transaksi.slice(0, 5).map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{formatTanggal(t.tanggal)}</td>
                    <td className="p-3 font-mono text-slate-600">{t.no_transaksi}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.jenis_transaksi === 'SETORAN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.jenis_transaksi}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{t.keterangan || '-'}</td>
                    <td
                      className={`p-3 text-right font-bold ${
                        t.jenis_transaksi === 'SETORAN' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {t.jenis_transaksi === 'SETORAN' ? '+' : '-'} {formatRupiah(t.nominal)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(t.saldo_sesudah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.statistik || {
    total_siswa: 0,
    total_saldo: 0,
    total_setoran_bulan_ini: 0,
    total_penarikan_bulan_ini: 0,
    jumlah_transaksi_hari_ini: 0
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Ringkasan Keuangan Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring tabungan siswa terintegrasi secara otomatis dengan Google Sheets API
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-refresh-dashboard"
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(isAdmin || isBendahara) && (
            <>
              <button
                id="btn-quick-setoran"
                onClick={() => onNavigate('setoran')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Setoran Baru</span>
              </button>

              <button
                id="btn-quick-penarikan"
                onClick={() => onNavigate('penarikan')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-amber-600/20 flex items-center gap-2 transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Penarikan Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5 Statistik KPI Cards (Section 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CardStat
          id="stat-total-siswa"
          title="Total Siswa"
          value={`${stats.total_siswa} Siswa`}
          subtitle="Siswa aktif terdaftar"
          icon={<Users className="w-5 h-5" />}
          colorClass="from-blue-600 to-indigo-600"
        />

        <CardStat
          id="stat-total-saldo"
          title="Total Saldo"
          value={formatRupiah(stats.total_saldo)}
          subtitle="Dana tabungan tersimpan"
          icon={<Wallet className="w-5 h-5" />}
          colorClass="from-emerald-600 to-teal-600"
        />

        <CardStat
          id="stat-setoran-bulan-ini"
          title="Setoran Bulan Ini"
          value={formatRupiah(stats.total_setoran_bulan_ini)}
          subtitle="Pemasukan bulan berjalan"
          icon={<ArrowDownLeft className="w-5 h-5" />}
          colorClass="from-blue-500 to-cyan-600"
        />

        <CardStat
          id="stat-penarikan-bulan-ini"
          title="Penarikan Bulan Ini"
          value={formatRupiah(stats.total_penarikan_bulan_ini)}
          subtitle="Pengeluaran bulan berjalan"
          icon={<ArrowUpRight className="w-5 h-5" />}
          colorClass="from-rose-500 to-amber-600"
        />

        <CardStat
          id="stat-transaksi-hari-ini"
          title="Transaksi Hari Ini"
          value={`${stats.jumlah_transaksi_hari_ini} Transaksi`}
          subtitle="Aktivitas loket hari ini"
          icon={<Receipt className="w-5 h-5" />}
          colorClass="from-purple-600 to-indigo-600"
        />
      </div>

      {/* 3 Grafik Dashboard (Section 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Setoran vs Penarikan Per Bulan */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Grafik 1: Setoran vs Penarikan Per Bulan
              </h3>
              <p className="text-xs text-slate-500">
                Komparasi arus kas masuk dan keluar 6 bulan terakhir
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.grafik_bulanan || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={val => `Rp ${val / 1000}k`}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="setoran" name="Setoran (Masuk)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="penarikan" name="Penarikan (Keluar)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 2: Total Saldo Berdasarkan Kelas */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Grafik 2: Total Saldo Berdasarkan Kelas
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribusi saldo tabungan per rombongan belajar
            </p>

            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.grafik_saldo_kelas || []}
                    dataKey="total_saldo"
                    nameKey="nama_kelas"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {(data?.grafik_saldo_kelas || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatRupiah(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend Mini */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            {(data?.grafik_saldo_kelas || []).slice(0, 4).map((k, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="truncate text-slate-600">
                  {k.nama_kelas}: <b className="text-slate-900">{formatRupiah(k.total_saldo)}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grafik 3 & Top 10 Siswa Saldo Terbesar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Grafik 3: 10 Siswa dengan Saldo Tabungan Terbesar</span>
            </h3>
            <p className="text-xs text-slate-500">Apresiasi peringkat siswa paling rajin menabung</p>
          </div>
          <button
            id="btn-goto-siswa"
            onClick={() => onNavigate('siswa')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Lihat Semua Siswa <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(data?.top_siswa || []).map((s, rank) => (
            <div
              key={s.id_siswa || rank}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-blue-300 hover:shadow-xs transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                    rank === 0
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : rank === 1
                      ? 'bg-slate-300 text-slate-800'
                      : rank === 2
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {rank + 1}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{s.nis}</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {s.nama_siswa}
              </h4>
              <p className="mt-2 text-sm font-extrabold text-blue-700">{formatRupiah(s.saldo)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabel Transaksi Terbaru (Section 8) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tabel Transaksi Terbaru</h3>
            <p className="text-xs text-slate-500">Mutasi tabungan siswa yang baru saja diproses</p>
          </div>
          <button
            id="btn-goto-laporan"
            onClick={() => onNavigate('laporan')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Lihat Rekap Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Tanggal / Waktu</th>
                <th className="p-3">No. Transaksi</th>
                <th className="p-3">Siswa</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Jenis</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3">Petugas</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.transaksi_terbaru || []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Belum ada transaksi tercatat.
                  </td>
                </tr>
              ) : (
                (data?.transaksi_terbaru || []).map((t, idx) => (
                  <tr key={t.id_transaksi || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-medium whitespace-nowrap">
                      {formatTanggal(t.tanggal)} {t.waktu ? <span className="text-slate-400">• {t.waktu}</span> : ''}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">{t.no_transaksi}</td>
                    <td className="p-3 font-semibold text-slate-900">{t.nama_siswa}</td>
                    <td className="p-3 text-slate-600">{t.nama_kelas || t.id_kelas}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.jenis_transaksi === 'SETORAN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.jenis_transaksi}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        t.jenis_transaksi === 'SETORAN' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(t.nominal)}
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-[130px]">{t.nama_petugas || '-'}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.status === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 line-through'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        id={`btn-receipt-${t.id_transaksi}`}
                        onClick={() => setSelectedReceiptTrx(t)}
                        className="px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                      >
                        Struk
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Struk Transaksi */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptTrx)}
        onClose={() => setSelectedReceiptTrx(null)}
        transaksi={selectedReceiptTrx}
      />
    </div>
  );
};
