/**
 * Main Application Component
 * Sistem Manajemen Keuangan Tabungan Siswa
 */
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { MainLayout, PageId } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DataSiswa } from './pages/Siswa';
import { SiswaDetail } from './pages/SiswaDetail';
import { DataKelas } from './pages/Kelas';
import { DataUsers } from './pages/Users';
import { Setoran } from './pages/Setoran';
import { Penarikan } from './pages/Penarikan';
import { BukuTabungan } from './pages/BukuTabungan';
import { Laporan } from './pages/Laporan';
import { Logs } from './pages/Logs';
import { Pengaturan } from './pages/Pengaturan';

const AppContent: React.FC = () => {
  const { user, loading, isSiswa, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);

  const handleNavigate = (page: PageId, extraId?: string) => {
    if (extraId) {
      setSelectedStudentId(extraId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Memuat Sistem Tabungan Siswa...</p>
      </div>
    );
  }

  // Jika belum login, tampilkan Login Screen
  if (!user) {
    return <Login />;
  }

  // Render Halaman Berdasarkan State
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'siswa':
        return <DataSiswa onNavigate={handleNavigate} />;
      case 'siswa-detail':
        return selectedStudentId ? (
          <SiswaDetail idSiswa={selectedStudentId} onNavigate={handleNavigate} />
        ) : (
          <DataSiswa onNavigate={handleNavigate} />
        );
      case 'kelas':
        return <DataKelas />;
      case 'users':
        return isAdmin ? <DataUsers /> : <Dashboard onNavigate={handleNavigate} />;
      case 'setoran':
        return <Setoran />;
      case 'penarikan':
        return <Penarikan />;
      case 'buku-tabungan':
        return <BukuTabungan initialSiswaId={selectedStudentId} />;
      case 'laporan':
        return <Laporan />;
      case 'logs':
        return isAdmin ? <Logs /> : <Dashboard onNavigate={handleNavigate} />;
      case 'pengaturan':
        return isAdmin ? <Pengaturan /> : <Dashboard onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderCurrentPage()}
    </MainLayout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
