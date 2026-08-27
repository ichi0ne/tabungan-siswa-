/**
 * Login Page Component
 * Halaman Masuk Multi-Role (ADMIN, BENDAHARA, WALI_KELAS, SISWA)
 */
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import { Lock, User as UserIcon, LogIn, Building2, Sparkles, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const { schoolProfile } = useSchoolProfile();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Setting visibilitas preset demo login (bisa disembunyikan/ditampilkan)
  const [showDemo, setShowDemo] = useState<boolean>(() => {
    const stored = localStorage.getItem('LOGIN_DEMO_PRESET_VISIBLE');
    if (stored !== null) {
      return stored === 'true';
    }
    return schoolProfile.tampilkan_demo_login !== false;
  });

  const handleToggleDemo = () => {
    const nextState = !showDemo;
    setShowDemo(nextState);
    localStorage.setItem('LOGIN_DEMO_PRESET_VISIBLE', String(nextState));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    await login(username, password);
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  const schoolName = schoolProfile.nama_sekolah || 'Tabungan Siswa';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/60">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-600/30 mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
            {schoolName}
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Sistem Manajemen Keuangan & Tabungan Sekolah Berbasis Google Sheets API
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username / NIS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="input-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username atau NIS..."
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Sistem</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Preset Section (Dengan Properti Hidden / Toggle) */}
        <div className="mt-8 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold uppercase tracking-wider">Akun Demo</span>
            </div>
            <button
              id="btn-toggle-demo-login"
              type="button"
              onClick={handleToggleDemo}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-400 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800"
            >
              {showDemo ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Sembunyikan</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tampilkan</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Buttons - Hidden jika showDemo = false */}
          {showDemo ? (
            <div id="demo-accounts-preset-container" className="grid grid-cols-2 gap-2 animate-fadeIn">
              <button
                id="btn-demo-admin"
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors group cursor-pointer"
              >
                <span className="block text-xs font-bold text-blue-400 group-hover:text-blue-300">ADMIN</span>
                <span className="text-[10px] text-slate-400">admin / admin123</span>
              </button>

              <button
                id="btn-demo-bendahara"
                type="button"
                onClick={() => handleQuickLogin('bendahara', 'bendahara123')}
                className="p-2 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors group cursor-pointer"
              >
                <span className="block text-xs font-bold text-emerald-400 group-hover:text-emerald-300">BENDAHARA</span>
                <span className="text-[10px] text-slate-400">bendahara / bendahara123</span>
              </button>

              <button
                id="btn-demo-wali"
                type="button"
                onClick={() => handleQuickLogin('walikelas7a', 'wali123')}
                className="p-2 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors group cursor-pointer"
              >
                <span className="block text-xs font-bold text-indigo-400 group-hover:text-indigo-300">WALI KELAS</span>
                <span className="text-[10px] text-slate-400">walikelas7a / wali123</span>
              </button>

              <button
                id="btn-demo-siswa"
                type="button"
                onClick={() => handleQuickLogin('2025001', '2025001')}
                className="p-2 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors group cursor-pointer"
              >
                <span className="block text-xs font-bold text-amber-400 group-hover:text-amber-300">SISWA (NIS)</span>
                <span className="text-[10px] text-slate-400">2025001 / 2025001</span>
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic text-center py-1">
              Preset akun demo disembunyikan. Klik &quot;Tampilkan&quot; jika diperlukan.
            </p>
          )}
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500">
          Dilindungi Autentikasi Role-Based Access Control (RBAC)
        </div>
      </div>
    </div>
  );
};
