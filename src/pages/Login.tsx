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
      return stored === 'false';
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
            Aplikasi Tabungan Anak Hebat Indonesia
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
        
        <div className="mt-6 text-center text-[11px] text-slate-500">
          Dilindungi Autentikasi Role-Based Access Control (RBAC)
        </div>
      </div>
    </div>
  );
};
