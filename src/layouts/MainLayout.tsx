/**
 * Main Layout Component
 * Sidebar Responsif, Mobile Drawer, Header, dan Kontainer Halaman
 */
import React, { useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import { getApiUrl } from '../services/api';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  FileText,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CircleDot,
  Building,
  UserCheck
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'siswa'
  | 'siswa-detail'
  | 'kelas'
  | 'users'
  | 'setoran'
  | 'penarikan'
  | 'buku-tabungan'
  | 'laporan'
  | 'logs'
  | 'pengaturan';

interface MainLayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId, extraId?: string) => void;
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  onNavigate,
  children
}) => {
  const { user, logout, isAdmin, isBendahara, isWaliKelas, isSiswa } = useAuth();
  const { schoolProfile } = useSchoolProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(true);
  const [tabunganOpen, setTabunganOpen] = useState(true);

  const hasLiveApi = Boolean(getApiUrl());

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'siswa':
        return 'Master Data Siswa';
      case 'siswa-detail':
        return 'Detail & Rekapitulasi Siswa';
      case 'kelas':
        return 'Data Rombongan Belajar (Kelas)';
      case 'users':
        return 'Manajemen Akun & Hak Akses Pengguna';
      case 'setoran':
        return 'Transaksi Setoran Tabungan';
      case 'penarikan':
        return 'Transaksi Penarikan Tabungan';
      case 'buku-tabungan':
        return 'Buku Tabungan / Rekening Koran';
      case 'laporan':
        return 'Laporan & Rekapitulasi Keuangan';
      case 'logs':
        return 'Audit Log & Riwayat Aktivitas';
      case 'pengaturan':
        return 'Pengaturan Sistem & Database Google Sheets';
      default:
        return 'Sistem Tabungan Siswa';
    }
  };

  const handleNav = (page: PageId) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row antialiased text-slate-800">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Drawer Mobile) */}
      <aside
        id="sidebar"
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg">
                ST
              </div>
              <div>
                <h1 className="font-bold text-sm text-white tracking-tight leading-tight truncate max-w-[170px]" title={schoolProfile.nama_sekolah}>
                  {schoolProfile.nama_sekolah || 'Tabungan Siswa'}
                </h1>
                <p className="text-[11px] text-slate-400">Sistem Keuangan Sekolah</p>
              </div>
            </div>
            <button
              id="btn-close-sidebar"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Badge Info */}
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs uppercase">
              {user?.role ? user.role.slice(0, 2) : 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.nama || 'Pengguna'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">
                  {user?.role || 'PENGGUNA'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] text-sm">
            {/* Dashboard */}
            <button
              id="nav-dashboard"
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                currentPage === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Data Master Group (Admin, Bendahara, Wali Kelas) */}
            {!isSiswa && (
              <div className="pt-2">
                <button
                  id="nav-group-master"
                  onClick={() => setMasterOpen(!masterOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-400" />
                    Data Master
                  </span>
                  {masterOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {masterOpen && (
                  <div className="ml-4 pl-2 border-l border-slate-800 space-y-1 mt-1">
                    <button
                      id="nav-siswa"
                      onClick={() => handleNav('siswa')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        currentPage === 'siswa' || currentPage === 'siswa-detail'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Data Siswa</span>
                    </button>

                    {(isAdmin || isBendahara) && (
                      <button
                        id="nav-kelas"
                        onClick={() => handleNav('kelas')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          currentPage === 'kelas'
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Data Kelas</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        id="nav-users"
                        onClick={() => handleNav('users')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          currentPage === 'users'
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Data Pengguna</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tabungan Group */}
            <div className="pt-2">
              <button
                id="nav-group-tabungan"
                onClick={() => setTabunganOpen(!tabunganOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Tabungan
                </span>
                {tabunganOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {tabunganOpen && (
                <div className="ml-4 pl-2 border-l border-slate-800 space-y-1 mt-1">
                  {(isAdmin || isBendahara) && (
                    <>
                      <button
                        id="nav-setoran"
                        onClick={() => handleNav('setoran')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          currentPage === 'setoran'
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Setoran</span>
                      </button>

                      <button
                        id="nav-penarikan"
                        onClick={() => handleNav('penarikan')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          currentPage === 'penarikan'
                            ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                        <span>Penarikan</span>
                      </button>
                    </>
                  )}

                  <button
                    id="nav-buku-tabungan"
                    onClick={() => handleNav('buku-tabungan')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      currentPage === 'buku-tabungan'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Buku Tabungan</span>
                  </button>
                </div>
              )}
            </div>

            {/* Laporan (Admin, Bendahara, Wali Kelas) */}
            {!isSiswa && (
              <button
                id="nav-laporan"
                onClick={() => handleNav('laporan')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  currentPage === 'laporan'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Laporan Keuangan</span>
              </button>
            )}

            {/* Audit Log (Admin) */}
            {isAdmin && (
              <button
                id="nav-logs"
                onClick={() => handleNav('logs')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  currentPage === 'logs'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Log Aktivitas</span>
              </button>
            )}

            {/* Pengaturan (Admin & Bendahara) */}
            {isAdmin && (
              <button
                id="nav-pengaturan"
                onClick={() => handleNav('pengaturan')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  currentPage === 'pengaturan'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan & API</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="mb-3 px-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CircleDot className={`w-2.5 h-2.5 ${hasLiveApi ? 'text-emerald-400 animate-pulse' : 'text-blue-400'}`} />
              {hasLiveApi ? 'Google Sheets Live' : 'Database Ready'}
            </span>
            <span className="font-mono text-[10px] text-slate-500">v1.0</span>
          </div>

          <button
            id="btn-logout"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="btn-open-sidebar"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{getPageTitle()}</h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                {schoolProfile.nama_sekolah ? `${schoolProfile.nama_sekolah} • Sistem Tabungan Siswa` : 'Sistem Manajemen Keuangan Tabungan Siswa'}
              </p>
            </div>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-3">
            {/* Live API / Demo Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${hasLiveApi ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span>{hasLiveApi ? 'GAS API Terkoneksi' : 'Mode Offline / Preview'}</span>
            </div>

            {/* Quick User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                  {user?.nama}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{user?.role?.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
