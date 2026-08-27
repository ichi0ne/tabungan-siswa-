/**
 * Audit Log & Riwayat Aktivitas Sistem (Prompt Section 16)
 * Khusus Administrator untuk audit trail aktivitas login, transaksi, dan perubahan data master
 */
import React, { useState, useEffect } from 'react';
import { getLogs } from '../services/api';
import { LogAktivitas } from '../types';
import { formatTanggalWaktu } from '../utils/formatters';
import { History, Search, Shield, Filter, Clock, User, Activity, RefreshCw } from 'lucide-react';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.nama_user.toLowerCase().includes(q) ||
      log.aksi.toLowerCase().includes(q) ||
      log.detail.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Log & Riwayat Aktivitas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan rekam jejak aktivitas operator, mutasi saldo, login, dan modifikasi data master
          </p>
        </div>

        <button
          id="btn-refresh-logs"
          onClick={fetchLogs}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title="Refresh Log"
          aria-label="Refresh Data Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-logs"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama user, aksi, detail aktivitas, atau role..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table Audit Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Waktu Kejadian</th>
                <th className="p-3.5">Nama Operator</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Aksi / Operasi</th>
                <th className="p-3.5">Rincian Perubahan Data</th>
                <th className="p-3.5 text-center">IP / Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    Memuat catatan log sistem...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic">
                    Belum ada riwayat aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id_log} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 whitespace-nowrap font-medium text-slate-600">
                      {formatTanggalWaktu(log.timestamp)}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">{log.nama_user}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          log.aksi.includes('SETORAN')
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.aksi.includes('PENARIKAN')
                            ? 'bg-amber-100 text-amber-800'
                            : log.aksi.includes('BATAL') || log.aksi.includes('DELETE')
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.aksi}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 max-w-md">{log.detail}</td>
                    <td className="p-3.5 text-center font-mono text-[11px] text-slate-400">
                      {log.ip_address || 'Cloud Client'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
