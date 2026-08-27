/**
 * Detail Profil Siswa & Ringkasan Rekening
 */
import React, { useState, useEffect } from 'react';
import { getBukuTabungan } from '../services/api';
import { BukuTabunganData } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import { CardStat } from '../components/CardStat';
import { PassbookPrintModal } from '../components/PassbookPrintModal';
import { PageId } from '../layouts/MainLayout';
import {
  ArrowLeft,
  BookOpen,
  Printer,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Building
} from 'lucide-react';

interface SiswaDetailProps {
  idSiswa: string;
  onNavigate: (page: PageId, extraId?: string) => void;
}

export const SiswaDetail: React.FC<SiswaDetailProps> = ({ idSiswa, onNavigate }) => {
  const [data, setData] = useState<BukuTabunganData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getBukuTabungan(idSiswa);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Gagal mengambil data detail siswa:', err);
      } finally {
        setLoading(false);
      }
    };
    if (idSiswa) fetchDetail();
  }, [idSiswa]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Memuat profil dan rekening siswa...</p>
      </div>
    );
  }

  if (!data || !data.siswa) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500">Data siswa tidak ditemukan atau telah dihapus.</p>
        <button
          onClick={() => onNavigate('siswa')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
        >
          Kembali ke Data Siswa
        </button>
      </div>
    );
  }

  const { siswa, transaksi } = data;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-siswa"
          onClick={() => onNavigate('siswa')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Siswa</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-buku-tabungan"
            onClick={() => onNavigate('buku-tabungan', siswa.id_siswa)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Buku Tabungan</span>
          </button>

          <button
            id="btn-print-rekening"
            onClick={() => setIsPrintOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekening Koran</span>
          </button>
        </div>
      </div>

      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            {siswa.nama_siswa.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{siswa.nama_siswa}</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  siswa.status === 'AKTIF'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {siswa.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>NIS: <b className="font-mono text-slate-800">{siswa.nis}</b></span>
              {siswa.nisn && <span>• NISN: <b className="font-mono text-slate-800">{siswa.nisn}</b></span>}
              <span>• Kelas: <b className="text-blue-700">{siswa.nama_kelas || siswa.id_kelas}</b></span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-right min-w-[200px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Nomor Buku Tabungan
          </span>
          <span className="text-base font-mono font-black text-blue-700 block mt-0.5">
            {siswa.no_tabungan}
          </span>
        </div>
      </div>

      {/* 3 Ringkasan Rekening */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CardStat
          id="stat-saldo-siswa"
          title="Saldo Saat Ini"
          value={formatRupiah(siswa.saldo)}
          subtitle="Saldo aktif rekening tabungan"
          icon={<Wallet className="w-6 h-6" />}
          colorClass="from-blue-600 to-indigo-600 text-white"
        />
        <CardStat
          id="stat-total-setoran-siswa"
          title="Total Setoran Masuk"
          value={formatRupiah(siswa.total_setoran)}
          subtitle="Akumulasi seluruh setoran"
          icon={<ArrowDownLeft className="w-6 h-6" />}
          colorClass="from-emerald-600 to-teal-600 text-white"
        />
        <CardStat
          id="stat-total-penarikan-siswa"
          title="Total Penarikan Keluar"
          value={formatRupiah(siswa.total_penarikan)}
          subtitle="Akumulasi seluruh penarikan"
          icon={<ArrowUpRight className="w-6 h-6" />}
          colorClass="from-amber-600 to-orange-600 text-white"
        />
      </div>

      {/* Profil Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detail Identitas */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Informasi Identitas & Wali</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
              <span className="font-semibold text-slate-800">{siswa.jenis_kelamin || '-'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Tanggal Lahir</span>
              <span className="font-semibold text-slate-800">
                {siswa.tanggal_lahir ? formatTanggal(siswa.tanggal_lahir) : '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Nama Orang Tua / Wali</span>
              <span className="font-semibold text-slate-800">{siswa.nama_orang_tua || '-'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">No. Telepon / WhatsApp Orang Tua</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-600" />
                {siswa.no_hp_orang_tua || '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Alamat Domisili</span>
              <span className="text-slate-700 leading-relaxed block mt-0.5">
                {siswa.alamat || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Riwayat Mutasi Siswa */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Mutasi Transaksi Tabungan</span>
            </h3>
            <span className="text-xs text-slate-500">{transaksi.length} Transaksi Tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Tanggal</th>
                  <th className="p-2.5">No. Transaksi</th>
                  <th className="p-2.5">Jenis</th>
                  <th className="p-2.5 text-right">Nominal</th>
                  <th className="p-2.5 text-right">Saldo Sesudah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaksi.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                      Belum ada transaksi pada rekening siswa ini.
                    </td>
                  </tr>
                ) : (
                  transaksi.map((t, idx) => (
                    <tr key={t.id_transaksi || idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-medium">{formatTanggal(t.tanggal)}</td>
                      <td className="p-2.5 font-mono text-slate-600">{t.no_transaksi}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.jenis_transaksi === 'SETORAN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.jenis_transaksi}
                        </span>
                      </td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          t.jenis_transaksi === 'SETORAN' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {t.jenis_transaksi === 'SETORAN' ? '+' : '-'} {formatRupiah(t.nominal)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatRupiah(t.saldo_sesudah)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Cetak Buku Tabungan */}
      <PassbookPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        siswa={siswa}
        transaksi={transaksi}
      />
    </div>
  );
};
