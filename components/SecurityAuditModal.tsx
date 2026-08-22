import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle, XCircle, Trash2, X, Clock, FileCheck } from 'lucide-react';
import { DeviceAuditLog } from '../types';
import { androidDeviceManager } from '../services/androidDeviceManager';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<DeviceAuditLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(androidDeviceManager.getAuditLogs());
    }
  }, [isOpen]);

  const handleClear = () => {
    androidDeviceManager.clearAuditLogs();
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-security-audit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-lg h-[80vh] max-h-[640px] bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">সিকিউরিটি অডিট ও পারমিশন লগ</h3>
              <p className="text-[10px] text-slate-400 font-mono">Real-time Android Guard Activity Trail</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            জয়া (Zoya) আপনার অনুমতি ছাড়া ব্যক্তিগত কোনো ডেটা বা অ্যাপ পরিচালনা করতে পারে না। এখানে প্রতিটি অনুমোদিত ও প্রত্যাখ্যাত কাজের বিবরণ সংরক্ষিত থাকে।
          </p>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs gap-2">
              <Clock className="w-8 h-8 stroke-1 text-slate-600" />
              <span>এখনো কোনো অ্যাকশন লগ তৈরি হয়নি।</span>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {log.status === 'allowed' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-white">{log.actionTitle}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{log.details}</div>
                    {log.permissionUsed && (
                      <div className="text-[9px] font-mono text-cyan-400 mt-1">
                        Permission: {log.permissionUsed}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-500 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-red-950/60 hover:text-red-300 text-slate-400 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>লগ মুছুন (Clear Logs)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
