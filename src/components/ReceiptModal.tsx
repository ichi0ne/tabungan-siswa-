/**
 * Receipt / Bukti Transaksi Printable Modal
 * Format Resmi Struk / Slip Setoran & Penarikan Tabungan Siswa
 */
import React from 'react';
import { Modal } from './Modal';
import { Transaksi } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import { Printer, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaksi: Transaksi | null;
  schoolName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaksi,
  schoolName
}) => {
  const { schoolProfile } = useSchoolProfile();
  if (!transaksi) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSetoran = transaksi.jenis_transaksi === 'SETORAN';
  const displaySchoolName = schoolName || schoolProfile.nama_sekolah || 'KELOMPOK B3 TK NEGERI KEMAYORAN 02';
  const displayAddress = schoolProfile.alamat || schoolProfile.alamat_sekolah || '';
  const displayPhone = schoolProfile.telepon || '';
  const displayOfficer = transaksi.nama_petugas || schoolProfile.bendahara || 'Petugas Tabungan';
  const displayOfficerNip = schoolProfile.nip_bendahara ? `NIP. ${schoolProfile.nip_bendahara}` : '';

  return (
    <Modal
      id="modal-receipt"
      isOpen={isOpen}
      onClose={onClose}
      title="Bukti Transaksi Tabungan"
      subtitle={`No. Referensi: ${transaksi.no_transaksi}`}
      maxWidth="lg"
      footer={
        <>
          <button
            id="btn-close-receipt"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            id="btn-print-receipt"
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Bukti Transaksi
          </button>
        </>
      }
    >
      {/* Container Cetak */}
      <div
        id="printable-receipt-area"
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800 print:border-none print:shadow-none print:p-2"
      >
        {/* Kop Surat / Header Sekolah */}
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
              {displaySchoolName}
            </h2>
          </div>
          {(displayAddress || displayPhone) && (
            <p className="text-[11px] text-slate-600 mb-1">
              {displayAddress} {displayPhone ? `• Telp: ${displayPhone}` : ''}
              {schoolProfile.npsn ? ` • NPSN: ${schoolProfile.npsn}` : ''}
            </p>
          )}
          <p className="text-xs font-bold tracking-widest text-blue-800 uppercase mt-1">
            BUKTI TRANSAKSI TABUNGAN SISWA
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Unit Pengelola Tabungan &amp; Keuangan Siswa
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div>
            <span className="text-[11px] text-slate-500 block">No. Transaksi</span>
            <span className="text-xs font-mono font-bold text-slate-900">{transaksi.no_transaksi}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Tanggal / Waktu</span>
            <span className="text-xs font-medium text-slate-800">
              {formatTanggal(transaksi.tanggal)} {transaksi.waktu ? `• ${transaksi.waktu}` : ''}
            </span>
          </div>
        </div>

        {/* Data Siswa */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div>
            <span className="text-slate-500 block">Nama Siswa</span>
            <span className="font-bold text-slate-900 text-sm">{transaksi.nama_siswa}</span>
          </div>
          <div>
            <span className="text-slate-500 block">NIS / Kelas</span>
            <span className="font-medium text-slate-800">
              {transaksi.nis} / {transaksi.nama_kelas || transaksi.id_kelas}
            </span>
          </div>
        </div>

        {/* Rincian Transaksi */}
        <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div
            className={`p-3 text-center ${
              isSetoran ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider block">
              {isSetoran ? 'SETORAN TABUNGAN' : 'PENARIKAN TABUNGAN'}
            </span>
            <span className="text-2xl font-black mt-1 block">
              {formatRupiah(transaksi.nominal)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 space-y-2 text-xs divide-y divide-slate-200/60">
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Saldo Sebelum Transaksi</span>
              <span className="font-medium text-slate-700">{formatRupiah(transaksi.saldo_sebelum)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">
                {isSetoran ? 'Nominal Penambahan' : 'Nominal Pengurangan'}
              </span>
              <span className={`font-bold ${isSetoran ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isSetoran ? '+' : '-'} {formatRupiah(transaksi.nominal)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 font-bold text-sm text-slate-900">
              <span>Saldo Akhir (Sesudah)</span>
              <span className="text-blue-700">{formatRupiah(transaksi.saldo_sesudah)}</span>
            </div>
          </div>
        </div>

        {transaksi.keterangan && (
          <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-5">
            <span className="text-slate-500 block text-[11px]">Keterangan:</span>
            <p className="italic text-slate-700 mt-0.5">{transaksi.keterangan}</p>
          </div>
        )}

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-4 text-center text-xs pt-4 border-t border-dashed border-slate-300">
          <div>
            <p className="text-slate-500">Penyetor / Siswa</p>
            <div className="h-14"></div>
            <p className="font-semibold text-slate-800 border-t border-slate-300 mx-4 pt-1">
              ( {transaksi.nama_siswa} )
            </p>
          </div>
          <div>
            <p className="text-slate-500">Petugas / Bendahara</p>
            <div className="h-14"></div>
            <p className="font-semibold text-slate-800 border-t border-slate-300 mx-4 pt-1">
              ( {displayOfficer} )
            </p>
            {displayOfficerNip && (
              <p className="text-[10px] text-slate-500 mt-0.5">{displayOfficerNip}</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400">
          * Simpan bukti ini sebagai tanda transaksi tabungan yang sah. Dicetak otomatis oleh sistem.
        </div>
      </div>
    </Modal>
  );
};

