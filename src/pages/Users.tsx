/**
 * Data Pengguna & Hak Akses (Users Page)
 * Khusus Role ADMIN untuk mengelola akun bendahara, wali, dan admin
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getUsers, getKelas, createUser, updateUser, deleteUser } from '../services/api';
import { User, UserRole, Kelas } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  UserCheck,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  Search,
  RefreshCw
} from 'lucide-react';

export const DataUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: '',
    role: 'BENDAHARA' as UserRole,
    id_kelas: '',
    status: 'AKTIF'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resUsers, resKelas] = await Promise.all([getUsers(), getKelas()]);
      if (resUsers.success && resUsers.data) {
        setUsers(resUsers.data);
      }
      if (resKelas.success && resKelas.data) {
        setKelasList(resKelas.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.nama.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      nama: '',
      role: 'BENDAHARA',
      id_kelas: '',
      status: 'AKTIF'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: '',
      nama: u.nama,
      role: u.role,
      id_kelas: u.id_kelas || '',
      status: u.status || 'AKTIF'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.nama.trim()) {
      showToast('warning', 'Validasi', 'Username dan Nama wajib diisi.');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      showToast('warning', 'Validasi', 'Password wajib diisi untuk pengguna baru.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingUser) {
        const res = await updateUser({
          id_user: editingUser.id_user,
          ...formData
        });
        if (res.success) {
          showToast('success', 'Sukses', 'Akun pengguna berhasil diperbarui.');
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast('error', 'Gagal', res.message || 'Gagal menyimpan perubahan.');
        }
      } else {
        const res = await createUser(formData);
        if (res.success) {
          showToast('success', 'Sukses', 'Akun pengguna baru berhasil dibuat.');
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast('error', 'Gagal', res.message || 'Gagal membuat pengguna.');
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
      const res = await deleteUser(deleteTarget.id_user);
      if (res.success) {
        showToast('success', 'Dihapus', `Akun ${deleteTarget.nama} berhasil dihapus.`);
        setDeleteTarget(null);
        fetchData();
      } else {
        showToast('error', 'Gagal', res.message || 'Gagal menghapus pengguna.');
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
          <h2 className="text-xl font-bold text-slate-900">Manajemen Pengguna Sistem</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun administrator, bendahara sekolah, dan akses login wali kelas
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-refresh-users"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Data"
            aria-label="Refresh Data Pengguna"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="btn-tambah-user"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-users"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, username, atau role..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Nama Pengguna</th>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Role / Hak Akses</th>
                <th className="p-3.5">Rombel Kelas Binaan</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Memuat akun pengguna...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic">
                    Tidak ditemukan data pengguna.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id_user} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {u.nama.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{u.nama}</span>
                          {u.id_user === currentUser?.id_user && (
                            <span className="text-[10px] text-blue-600 font-semibold">(Akun Anda)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-slate-700">{u.username}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'BENDAHARA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.role === 'WALI_KELAS'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {u.id_kelas ? (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          {kelasList.find(k => k.id_kelas === u.id_kelas)?.nama_kelas || u.id_kelas}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.status === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-edit-user-${u.id_user}`}
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors"
                          title="Edit Pengguna"
                          aria-label="Edit Akun Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id_user !== currentUser?.id_user && (
                          <button
                            id={`btn-del-user-${u.id_user}`}
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Hapus Pengguna"
                            aria-label="Hapus Akun Pengguna"
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
      </div>

      {/* Modal Form User */}
      <Modal
        id="modal-form-user"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
        subtitle="Data akun akan tersimpan di Google Sheets sheet USERS"
        maxWidth="md"
        footer={
          <>
            <button
              id="btn-cancel-user"
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-save-user"
              type="submit"
              form="form-user"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
            </button>
          </>
        }
      >
        <form id="form-user" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-user-nama"
              type="text"
              required
              value={formData.nama}
              onChange={e => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Siti Rahmawati"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-user-username"
              type="text"
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="Contoh: bendahara1, walikelas3a..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Password {editingUser && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
            </label>
            <input
              id="input-user-password"
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Masukkan password baru jika ingin mengubah...' : 'Password login...'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role / Hak Akses</label>
            <select
              id="select-user-role"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="BENDAHARA">BENDAHARA (Kelola Setoran, Penarikan, Laporan)</option>
              <option value="WALI_KELAS">WALI_KELAS (Lihat Siswa & Buku Tabungan Rombel)</option>
              <option value="ADMIN">ADMIN (Hak Akses Penuh Termasuk Kelola Pengguna)</option>
            </select>
          </div>

          {formData.role === 'WALI_KELAS' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tugaskan Sebagai Wali Kelas Untuk:
              </label>
              <select
                id="select-user-kelas"
                value={formData.id_kelas}
                onChange={e => setFormData({ ...formData, id_kelas: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kelas Binaan</option>
                {kelasList.map(k => (
                  <option key={k.id_kelas} value={k.id_kelas}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
            <select
              id="select-user-status"
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

      {/* Confirmation Dialog Delete */}
      <ConfirmDialog
        id="dialog-delete-user"
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${deleteTarget?.nama}"? Pengguna tidak akan dapat login kembali.`}
        confirmText="Hapus Pengguna"
        isDangerous
      />
    </div>
  );
};
