/**
 * Authentication Context & Hook
 * Manajemen Sesi Pengguna & Hak Akses Berdasarkan Role
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { getAuthUser, setAuthUser, login as apiLogin } from '../services/api';
import { useToast } from './useToast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isBendahara: boolean;
  isWaliKelas: boolean;
  isSiswa: boolean;
  canManageUsers: boolean;
  canManageTransactions: boolean;
  canManageMasterData: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Muat session tersimpan saat inisialisasi
    const savedUser = getAuthUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiLogin(username, password);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setAuthUser(res.data.user);
        showToast('success', 'Login Berhasil', `Selamat datang, ${res.data.user.nama}`);
        return true;
      } else {
        showToast('error', 'Login Gagal', res.message || 'Username atau password tidak valid');
        return false;
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan Jaringan', err.message || 'Tidak dapat terhubung ke server');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const userName = user?.nama;
    setUser(null);
    setAuthUser(null);
    showToast('info', 'Logout Berhasil', userName ? `Sampai jumpa lagi, ${userName}` : 'Anda telah keluar.');
  };

  const role: UserRole | undefined = user?.role;
  const isAdmin = role === 'ADMIN';
  const isBendahara = role === 'BENDAHARA';
  const isWaliKelas = role === 'WALI_KELAS';
  const isSiswa = role === 'SISWA';

  const canManageUsers = isAdmin;
  const canManageTransactions = isAdmin || isBendahara;
  const canManageMasterData = isAdmin || isBendahara;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isBendahara,
        isWaliKelas,
        isSiswa,
        canManageUsers,
        canManageTransactions,
        canManageMasterData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
