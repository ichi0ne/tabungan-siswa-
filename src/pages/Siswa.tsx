/**
 * Data Siswa Page Component
 * Manajemen Master Data Siswa, Filter Kelas, Form CRUD, & Pencarian Cepat
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getSiswa, getKelas, createSiswa, updateSiswa, deleteSiswa } from '../services/api';
import { Siswa, Kelas } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageId } from '../layouts/MainLayout';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  BookOpen,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';

interface SiswaProps {
  onNavigate: (page: PageId, extraId?: string) => void;
}

export const DataSiswa: React.FC<SiswaProps> = ({ onNavigate }) => {
  const { user, isAdmin, isBendahara, isWaliKelas } = useAuth();
  const { showToast } = useToast();

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('AKTIF');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    nama_siswa: '',
    jenis_kelamin: 'Laki-laki',
    tanggal_lahir: '',
    alamat: '',
    id_kelas: '',
    nama_orang_tua: '',
    no_hp_orang_tua: '',
    no_tabungan: '',
    status: 'AKTIF'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSiswa, resKelas] = await Promise.all([
        getSiswa({ id_kelas: isWaliKelas && user?.id_kelas ? user.id_kelas : undefined }),
        getKelas()
      ]);

      if (resSiswa.success && resSiswa.data) {
        setSiswaList(resSiswa.data);
      }
      if (resKelas.success && resKelas.data) {
        setKelasList(resKelas.data);
        if (!formData.id_kelas && resKelas.data.length > 0) {
          setFormData(prev => ({ ...prev, id_kelas: resKelas.data[0].id_kelas }));
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data siswa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Filtered List
  const filteredList = useMemo(() => {
    return siswaList.filter(s => {
      // Wali Kelas filter constraint
      if (isWaliKelas && user?.id_kelas && s.id_kelas !== user.id_kelas) return false;

      if (selectedKelas && s.id_kelas !== selectedKelas) return false;
      if (selectedStatus && s.status !== selectedStatus) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          s.nama_siswa.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.nisn.toLowerCase().includes(q) ||
          s.no_tabungan.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [siswaList, selectedKelas, selectedStatus, searchTerm, isWaliKelas, user?.id_kelas]);

  // Paginated List
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const handleOpenAdd = () => {
    setEditingSiswa(null);
    setFormData({
      nis: '',
      nisn: '',
      nama_siswa: '',
      jenis_kelamin: 'Laki-laki',
      tanggal_lahir: '',
      alamat: '',
      id_kelas: kelasList.length > 0 ? kelasList[0].id_kelas : '',
      nama_orang_tua: '',
      no_hp_orang_tua: '',
      no_tabungan: '',
      status: 'AKTIF'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormData({
      nis: siswa.nis,
      nisn: siswa.nisn || '',
      nama_siswa: siswa.nama_siswa,
      jenis_kelamin: siswa.jenis_kelamin || 'Laki-laki',
      tanggal_lahir: siswa.tanggal_lahir || '',
      alamat: siswa.alamat || '',
      id_kelas: siswa.id_kelas,
      nama_orang_tua: siswa.nama_orang_tua || '',
      no_hp_orang_tua: siswa.no_hp_orang_tua || '',
      no_tabungan: siswa.no_tabungan || '',
      status: siswa.status || 'AKTIF'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.nama_siswa.trim() || !formData.id_kelas) {
      showToast('warning', 'Validasi', 'NIS, Nama Siswa, dan Kelas wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSiswa) {
        const res = await updateSiswa({
          id_siswa: editingSiswa.id_siswa,
          ...formData
        });
        if (res.success) {
          showToast('success', 'Sukses', 'Data siswa berhasil diperbarui.');
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast('error', 'Gagal', res.message || 'Gagal menyimpan perubahan.');
        }
      } else {
        const res = await createSiswa(formData);
        if (res.success) {
          showToast('success', 'Sukses', 'Siswa baru berhasil didaftarkan ke sistem.');
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast('error', 'Gagal', res.message || 'Gagal menambahkan siswa.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteSiswa(deleteTarget.id_siswa);
      if (res.success) {
        showToast('success', 'Dinonaktifkan', `Siswa ${deleteTarget.nama_siswa} dinonaktifkan.`);
        setDeleteTarget(null);
        fetchData();
      } else {
        showToast('error', 'Gagal', res.message || 'Gagal menonaktifkan siswa.');
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Master Data Siswa</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data identitas nasabah siswa, nomor tabungan, dan pantau saldo per siswa
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-refresh-siswa"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Muat Ulang"
            aria-label="Muat Ulang Data Siswa"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(isAdmin || isBendahara) && (
            <button
              id="btn-tambah-siswa"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Siswa Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-siswa"
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari berdasarkan NIS, NISN, Nama, atau No. Tabungan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Kelas */}
        <div className="sm:col-span-3">
          <select
            id="select-filter-kelas"
            value={selectedKelas}
            onChange={e => {
              setSelectedKelas(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k.id_kelas} value={k.id_kelas}>
                Kelas {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="sm:col-span-3">
          <select
            id="select-filter-status"
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="AKTIF">Status Aktif</option>
            <option value="NONAKTIF">Status Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Siswa */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">NIS / NISN</th>
                <th className="p-3.5">Nama Siswa</th>
                <th className="p-3.5">Kelas</th>
                <th className="p-3.5">No. Tabungan</th>
                <th className="p-3.5 text-right">Saldo Saat Ini</th>
                <th className="p-3.5">Orang Tua / Kontak</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Memuat data siswa...</p>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                    Tidak ditemukan data siswa yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedList.map(siswa => (
                  <tr key={siswa.id_siswa} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-900 block">{siswa.nis}</span>
                      {siswa.nisn && <span className="text-[10px] text-slate-400 font-mono">NISN: {siswa.nisn}</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 text-xs block">{siswa.nama_siswa}</span>
                      <span className="text-[11px] text-slate-400">{siswa.jenis_kelamin}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                        {siswa.nama_kelas || siswa.id_kelas}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">{siswa.no_tabungan}</td>
                    <td className="p-3.5 text-right">
                      <span className="font-bold text-sm text-blue-700 block">
                        {formatRupiah(siswa.saldo)}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <span className="block font-medium truncate max-w-[140px]">
                        {siswa.nama_orang_tua || '-'}
                      </span>
                      {siswa.no_hp_orang_tua && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" /> {siswa.no_hp_orang_tua}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          siswa.status === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {siswa.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Buku Tabungan Button */}
                        <button
                          id={`btn-buku-${siswa.id_siswa}`}
                          onClick={() => onNavigate('buku-tabungan', siswa.id_siswa)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                          title="Buku Tabungan"
                          aria-label="Lihat Buku Tabungan"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>

                        {/* Detail Button */}
                        <button
                          id={`btn-detail-${siswa.id_siswa}`}
                          onClick={() => onNavigate('siswa-detail', siswa.id_siswa)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                          title="Detail Siswa"
                          aria-label="Lihat Detail Siswa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        {(isAdmin || isBendahara) && (
                          <button
                            id={`btn-edit-${siswa.id_siswa}`}
                            onClick={() => handleOpenEdit(siswa)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors"
                            title="Edit Siswa"
                            aria-label="Edit Data Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Deactivate Button */}
                        {isAdmin && siswa.status === 'AKTIF' && (
                          <button
                            id={`btn-del-${siswa.id_siswa}`}
                            onClick={() => setDeleteTarget(siswa)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Nonaktifkan"
                            aria-label="Nonaktifkan Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredList.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal Form Tambah / Edit Siswa (Section 9) */}
      <Modal
        id="modal-form-siswa"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSiswa ? 'Edit Profil Siswa' : 'Tambah Siswa Baru'}
        subtitle="Data akan otomatis tersinkronisasi ke sheet SISWA dan tabel SALDO di Google Sheets"
        maxWidth="2xl"
        footer={
          <>
            <button
              id="btn-cancel-siswa"
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-save-siswa"
              type="submit"
              form="form-siswa"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {editingSiswa ? 'Simpan Perubahan' : 'Daftarkan Siswa'}
            </button>
          </>
        }
      >
        <form id="form-siswa" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nomor Induk Siswa (NIS) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-nis"
              type="text"
              required
              value={formData.nis}
              onChange={e => setFormData({ ...formData, nis: e.target.value })}
              placeholder="Contoh: 2025005"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">NISN (Opsional)</label>
            <input
              id="input-nisn"
              type="text"
              value={formData.nisn}
              onChange={e => setFormData({ ...formData, nisn: e.target.value })}
              placeholder="Contoh: 0081234567"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-nama-siswa"
              type="text"
              required
              value={formData.nama_siswa}
              onChange={e => setFormData({ ...formData, nama_siswa: e.target.value })}
              placeholder="Masukkan nama lengkap siswa..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
            <select
              id="select-jk"
              value={formData.jenis_kelamin}
              onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
            <input
              id="input-tgl-lahir"
              type="date"
              value={formData.tanggal_lahir}
              onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Rombongan Belajar (Kelas) <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-id-kelas"
              required
              value={formData.id_kelas}
              onChange={e => setFormData({ ...formData, id_kelas: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Kelas</option>
              {kelasList.map(k => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  Kelas {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nomor Buku Tabungan
            </label>
            <input
              id="input-no-tabungan"
              type="text"
              value={formData.no_tabungan}
              onChange={e => setFormData({ ...formData, no_tabungan: e.target.value })}
              placeholder="Kosongkan untuk generate otomatis..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * Jika dikosongkan, sistem akan membuat nomor tabungan otomatis secara unik.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
            <input
              id="input-nama-ortu"
              type="text"
              value={formData.nama_orang_tua}
              onChange={e => setFormData({ ...formData, nama_orang_tua: e.target.value })}
              placeholder="Nama ayah/ibu/wali..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">No. HP Orang Tua</label>
            <input
              id="input-hp-ortu"
              type="tel"
              value={formData.no_hp_orang_tua}
              onChange={e => setFormData({ ...formData, no_hp_orang_tua: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
            <textarea
              id="input-alamat"
              rows={2}
              value={formData.alamat}
              onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Alamat domisili lengkap siswa..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Siswa</label>
            <select
              id="select-status-siswa"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="AKTIF">AKTIF</option>
              <option value="NONAKTIF">NONAKTIF</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog Deactivate */}
      <ConfirmDialog
        id="dialog-delete-siswa"
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Nonaktifkan Siswa"
        message={`Apakah Anda yakin ingin menonaktifkan siswa "${deleteTarget?.nama_siswa}" (NIS: ${deleteTarget?.nis})? Siswa tidak akan muncul di daftar aktif.`}
        confirmText="Ya, Nonaktifkan"
        isDangerous
      />
    </div>
  );
};
