/**
 * Confirmation & Reversal Dialog Component
 */
import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  id,
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDangerous = false,
  requireReason = false,
  reasonPlaceholder = 'Tuliskan alasan pembatalan...',
  loading = false
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      alert('Alasan pembatalan wajib diisi.');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            id={`btn-cancel-${id}`}
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            id={`btn-confirm-${id}`}
            type="button"
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all shadow-sm flex items-center gap-2 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        <div
          className={`p-3 rounded-xl shrink-0 ${
            isDangerous ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {isDangerous ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
        </div>
        <div className="space-y-2 flex-1">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

          {requireReason && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan / Catatan Pembatalan <span className="text-rose-500">*</span>
              </label>
              <textarea
                id={`input-reason-${id}`}
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
