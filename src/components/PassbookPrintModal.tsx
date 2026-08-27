/**
 * Passbook Printable Modal (Cetak Buku Tabungan Siswa)
 * Layout Buku Tabungan Standar Sekolah
 */
import React from 'react';
import { Modal } from './Modal';
import { Siswa, Transaksi } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import { Printer, Building2 } from 'lucide-react';

interface PassbookPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: Siswa | null;
  transaksi: Transaksi[];
  schoolName?: string;
}

export const PassbookPrintModal: React.FC<PassbookPrintModalProps> = ({
  isOpen,
  onClose,
  siswa,
  transaksi,
  schoolName
}) => {
  const { schoolProfile } = useSchoolProfile();
  if (!siswa) return null;

  const handlePrint = () => {
    window.print();
  };

  const displaySchoolName = schoolName || schoolProfile.nama_sekolah || 'KELOMPOK B3 TK NEGERI KEMAYORAN 02';
  const displayAddress = schoolProfile.alamat || schoolProfile.alamat_sekolah || '';
  const displayPhone = schoolProfile.telepon || '';
  const displayBendahara = schoolProfile.bendahara || 'Bendahara Pengelola';
  const displayNipBendahara = schoolProfile.nip_bendahara ? `NIP. ${schoolProfile.nip_bendahara}` : '';

  return (
    <Modal
      id="modal-passbook-print"
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Rekening Koran Buku Tabungan"
      subtitle={`No. Tabungan: ${siswa.no_tabungan || '-'}`}
      maxWidth="4xl"
      footer={
        <>
          <button
            id="btn-close-passbook"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            id="btn-do-print-passbook"
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen
          </button>
        </>
      }
    >
      <div id="printable-passbook-document" className="bg-white p-6 border border-slate-200 rounded-2xl print:border-none print:p-0 text-slate-800">
        {/* Kop Resmi Sekolah */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {displaySchoolName}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                {displayAddress} {displayPhone ? `• Telp: ${displayPhone}` : ''}
                {schoolProfile.npsn ? ` • NPSN: ${schoolProfile.npsn}` : ''}
              </p>
              <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                TABUNGAN SISWA
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase">
              BUKU TABUNGAN SISWA
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Dicetak: {formatTanggal(new Date())}</p>
          </div>
        </div>

        {/* Informasi Nasabah / Siswa */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-6">
          <div>
            <span className="text-slate-500 block">Nama Siswa</span>
            <span className="font-bold text-slate-900 text-sm">{siswa.nama_siswa}</span>
          </div>
          <div>
            <span className="text-slate-500 block">NIS / NISN</span>
            <span className="font-semibold text-slate-800">{siswa.nis} {siswa.nisn ? ` / ${siswa.nisn}` : ''}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Kelas / Nomor Tabungan</span>
            <span className="font-semibold text-slate-800">{siswa.nama_kelas || siswa.id_kelas} • <span className="font-mono text-blue-700">{siswa.no_tabungan}</span></span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Saldo Saat Ini</span>
            <span className="font-extrabold text-blue-700 text-sm">{formatRupiah(siswa.saldo)}</span>
          </div>
        </div>

        {/* Tabel Mutasi Tabungan */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-10">No</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">No. Transaksi</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-right">Setoran (Kredit)</th>
                <th className="p-3 text-right">Penarikan (Debit)</th>
                <th className="p-3 text-right">Saldo Akhir</th>
                <th className="p-3 text-center">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transaksi.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                    Belum ada riwayat transaksi pada buku tabungan ini.
                  </td>
                </tr>
              ) : (
                transaksi.map((t, idx) => {
                  const isSetoran = t.jenis_transaksi === 'SETORAN';
                  const isCancelled = t.status === 'DIBATALKAN';
                  return (
                    <tr key={t.id_transaksi || idx} className={`hover:bg-slate-50 ${isCancelled ? 'opacity-50 line-through bg-rose-50/40' : ''}`}>
                      <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-medium whitespace-nowrap">{formatTanggal(t.tanggal)}</td>
                      <td className="p-3 font-mono text-[11px] whitespace-nowrap">{t.no_transaksi}</td>
                      <td className="p-3 max-w-[200px] truncate" title={t.keterangan}>{t.keterangan || '-'}</td>
                      <td className="p-3 text-right font-medium text-emerald-700">
                        {isSetoran && !isCancelled ? formatRupiah(t.nominal) : '-'}
                      </td>
                      <td className="p-3 text-right font-medium text-rose-700">
                        {!isSetoran && !isCancelled ? formatRupiah(t.nominal) : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(t.saldo_sesudah)}
                      </td>
                      <td className="p-3 text-center text-slate-600 truncate max-w-[120px]">
                        {t.nama_petugas || 'Petugas'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Tanda Tangan */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs mt-10 pt-6 border-t border-slate-200">
          <div>
            <p className="text-slate-500">Mengetahui, Orang Tua / Wali Siswa</p>
            <div className="h-16"></div>
            <p className="font-semibold text-slate-800 border-t border-slate-300 mx-12 pt-1">
              ( {siswa.nama_orang_tua || 'Orang Tua / Wali Siswa'} )
            </p>
          </div>
          <div>
            <p className="text-slate-500">Petugas Pengelola Tabungan Sekolah</p>
            <div className="h-16"></div>
            <p className="font-semibold text-slate-800 border-t border-slate-300 mx-12 pt-1">
              ( {displayBendahara} )
            </p>
            {displayNipBendahara && (
              <p className="text-[10px] text-slate-500 mt-0.5">{displayNipBendahara}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

