import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  X,
  Check,
  Terminal,
  Trash2,
  PhoneCall,
  Lock,
  Layers,
} from 'lucide-react';
import { SecurityConfirmationRequest } from '../types';

interface ConfirmationDialogModalProps {
  request: SecurityConfirmationRequest | null;
  onConfirm: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const ConfirmationDialogModal: React.FC<ConfirmationDialogModalProps> = ({
  request,
  onConfirm,
  onReject,
}) => {
  if (!request) return null;

  const isDestructive = request.isDestructive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl transition-all ${
          isDestructive
            ? 'bg-gradient-to-b from-rose-950/90 via-slate-900/95 to-black border-rose-500/50 shadow-rose-500/20'
            : 'bg-gradient-to-b from-amber-950/80 via-slate-900/95 to-black border-amber-500/50 shadow-amber-500/20'
        }`}
      >
        {/* Header Badge & Title */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border ${
                isDestructive
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}
            >
              {isDestructive ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isDestructive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isDestructive ? 'উচ্চ-ঝুঁকি (HIGH RISK)' : 'নিরাপত্তা অনুমোদন (APPROVAL REQUIRED)'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">{request.titleBn || request.title}</h2>
            </div>
          </div>
          <button
            onClick={() => onReject(request.id)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanation in Bengali and English */}
        <div className="space-y-3 mb-5">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm">
            <p className="text-slate-200 font-medium leading-relaxed">{request.explanationBn}</p>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{request.explanation}</p>
          </div>

          {/* Command or Payload details if applicable */}
          {request.command && (
            <div className="p-3 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-emerald-400 flex items-start gap-2 overflow-x-auto">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="break-all whitespace-pre-wrap">{request.command}</div>
            </div>
          )}

          {request.targetApp && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>টার্গেট অ্যাপ / প্যাকেজ:</span>
              <span className="font-mono text-slate-300">{request.targetApp}</span>
            </div>
          )}
        </div>

        {/* Safety Warning */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-5">
          <Lock className="w-4 h-4 shrink-0 text-rose-400" />
          <span>অনুমোদন ছাড়া জয় এই কমান্ড চালাবে না। নিশ্চিত হলে তবেই অনুমতি দিন।</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onReject(request.id)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>বাতিল (Reject)</span>
          </button>
          <button
            onClick={() => onConfirm(request.id)}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white shadow-lg transition-all ${
              isDestructive
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>অনুমতি দিন (Authorize)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
