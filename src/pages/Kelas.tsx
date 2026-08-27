/**
 * Data Kelas Page Component
 * Manajemen Master Rombongan Belajar (Kelas), Rekap Siswa & Saldo Per Kelas
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getKelas, createKelas, updateKelas, deleteKelas } from '../services/api';
import { Kelas } from '../types';
import { formatRupiah } from '../utils/formatters';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Wallet,
  GraduationCap,
  RefreshCw
} from 'lucide-react';

export const DataKelas: React.FC = () => {
  const { isAdmin, isBendahara } = useAuth();
  const { showToast } = useToast();

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Kelas | null>(null);

  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: '7',
    wali_kelas: '',
    tahun_ajaran: '2024/2025'
  });

  const fetchKelasData = async () => {
    try {
      setLoading(true);
      const res = await getKelas();
      if (res.success && res.data) {
        setKelasList(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelasData();
  }, []);

  const filteredKelas = useMemo(() => {
    if (!searchTerm) return kelasList;
    const q = searchTerm.toLowerCase();
    return kelasList.filter(
      k =>
        k.nama_kelas.toLowerCase().includes(q) ||
        k.wali_kelas.toLowerCase().includes(q) ||
        k.tingkat.toLowerCase().includes(q) ||
        k.tahun_ajaran.toLowerCase().includes(q)
    );
  }, [kelasList, searchTerm]);

  const handleOpenAdd = () => {
    setEditingKelas(null);
    setFormData({
      nama_kelas: '',
      tingkat: '7',
      wali_kelas: '',
      tahun_ajaran: '2024/2025'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (k: Kelas) => {
    setEditingKelas(k);
    setFormData({
      nama_kelas: k.nama_kelas,
      tingkat: k.tingkat,
      wali_kelas: k.wali_kelas,
      tahun_ajaran: k.tahun_ajaran
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kelas.trim() || !formData.wali_kelas.trim()) {
      showToast('warning', 'Validasi', 'Nama Kelas dan Nama Wali Kelas wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingKelas) {
        const res = await updateKelas({
          id_kelas: editingKelas.id_kelas,
          ...formData
        });
        if (res.success) {
          showToast('success', 'Sukses', 'Data kelas berhasil diperbarui.');
          setIsModalOpen(false);
          fetchKelasData();
        } else {
          showToast('error', 'Gagal', res.message || 'Gagal menyimpan perubahan.');
        }
      } else {
        const res = await createKelas(formData);
        if (res.success) {
          showToast('success', 'Sukses', 'Kelas baru berhasil ditambahkan.');
          setIsModalOpen(false);
          fetchKelasData();
        } else {
          showToast('error', 'Gagal', res.message || 'Gagal menambahkan kelas.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteKelas(deleteTarget.id_kelas);
      if (res.success) {
        showToast('success', 'Dihapus', `Kelas ${deleteTarget.nama_kelas} berhasil dihapus.`);
        setDeleteTarget(null);
        fetchKelasData();
      } else {
        showToast('error', 'Gagal', res.message || 'Gagal menghapus kelas.');
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Data Master Kelas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar rombongan belajar, wali kelas, jumlah siswa, dan total saldo per rombel
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-refresh-kelas"
            onClick={fetchKelasData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Data"
            aria-label="Refresh Data Kelas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(isAdmin || isBendahara) && (
            <button
              id="btn-tambah-kelas"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-kelas"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama kelas, wali kelas, tingkat, atau tahun ajaran..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Cards & Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Memuat data kelas...</p>
          </div>
        ) : filteredKelas.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 italic bg-white rounded-3xl border border-slate-200">
            Tidak ada data kelas yang cocok.
          </div>
        ) : (
          filteredKelas.map(k => (
            <div
              key={k.id_kelas}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                      {k.nama_kelas}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Kelas {k.nama_kelas}</h3>
                      <span className="text-[11px] text-slate-400">Tingkat {k.tingkat} • Th. {k.tahun_ajaran}</span>
                    </div>
                  </div>

                  {(isAdmin || isBendahara) && (
                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-edit-kelas-${k.id_kelas}`}
                        onClick={() => handleOpenEdit(k)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Kelas"
                        aria-label="Edit Kelas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          id={`btn-del-kelas-${k.id_kelas}`}
                          onClick={() => setDeleteTarget(k)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Kelas"
                          aria-label="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Wali Kelas:
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{k.wali_kelas}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Jumlah Siswa:
                    </span>
                    <span className="font-bold text-slate-900">{k.jumlah_siswa || 0} Siswa</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-blue-600" /> Total Saldo:
                </span>
                <span className="font-black text-sm text-blue-700">{formatRupiah(k.total_saldo || 0)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form Kelas */}
      <Modal
        id="modal-form-kelas"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingKelas ? 'Edit Rombongan Belajar' : 'Tambah Kelas Baru'}
        subtitle="Data kelas akan tersimpan di Google Sheets dan dapat dipilih saat mendaftar siswa"
        maxWidth="md"
        footer={
          <>
            <button
              id="btn-cancel-kelas"
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-save-kelas"
              type="submit"
              form="form-kelas"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {editingKelas ? 'Simpan Perubahan' : 'Tambah Kelas'}
            </button>
          </>
        }
      >
        <form id="form-kelas" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-nama-kelas"
              type="text"
              required
              value={formData.nama_kelas}
              onChange={e => setFormData({ ...formData, nama_kelas: e.target.value })}
              placeholder="Contoh: 7-A, 8-B, 10-IPA-1..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tingkat / Jenjang
            </label>
            <input
              id="input-tingkat"
              type="text"
              required
              value={formData.tingkat}
              onChange={e => setFormData({ ...formData, tingkat: e.target.value })}
              placeholder="Contoh: 7 / 8 / 9 / 10..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Wali Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-wali-kelas"
              type="text"
              required
              value={formData.wali_kelas}
              onChange={e => setFormData({ ...formData, wali_kelas: e.target.value })}
              placeholder="Nama lengkap wali kelas beserta gelar..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
            <input
              id="input-tahun-ajaran"
              type="text"
              value={formData.tahun_ajaran}
              onChange={e => setFormData({ ...formData, tahun_ajaran: e.target.value })}
              placeholder="Contoh: 2024/2025"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog Delete */}
      <ConfirmDialog
        id="dialog-delete-kelas"
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Data Kelas"
        message={`Apakah Anda yakin ingin menghapus Kelas "${deleteTarget?.nama_kelas}"?`}
        confirmText="Hapus Kelas"
        isDangerous
      />
    </div>
  );
};
