import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  Terminal,
  Cpu,
  Layers,
  Mic,
  Folder,
  PhoneCall,
  MessageSquare,
  Sparkles,
  HelpCircle,
  X,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { AndroidPermissionState, AndroidPermissionType } from '../types';
import { androidDeviceManager } from '../services/androidDeviceManager';

interface FirstRunSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeak?: (text: string) => void;
}

export const FirstRunSetupModal: React.FC<FirstRunSetupModalProps> = ({
  isOpen,
  onClose,
  onSpeak,
}) => {
  const [permissions, setPermissions] = useState<AndroidPermissionState[]>(() =>
    androidDeviceManager.getPermissions()
  );

  if (!isOpen) return null;

  const togglePermission = (id: AndroidPermissionType, currentGranted: boolean) => {
    const nextGranted = !currentGranted;
    androidDeviceManager.setPermissionGranted(id, nextGranted);
    setPermissions(androidDeviceManager.getPermissions());
    if (onSpeak) {
      onSpeak(nextGranted ? 'অনুমতি প্রদান করা হয়েছে।' : 'অনুমতি বাতিল করা হয়েছে।');
    }
  };

  const getPermissionIcon = (id: AndroidPermissionType) => {
    switch (id) {
      case 'BIND_ACCESSIBILITY_SERVICE':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'TERMUX_RUN_COMMAND':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'SHIZUKU_PERMISSION':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'RECORD_AUDIO':
        return <Mic className="w-4 h-4 text-pink-400" />;
      case 'MANAGE_EXTERNAL_STORAGE':
        return <Folder className="w-4 h-4 text-amber-400" />;
      case 'CALL_PHONE':
        return <PhoneCall className="w-4 h-4 text-green-400" />;
      case 'SEND_SMS':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <Lock className="w-4 h-4 text-slate-400" />;
    }
  };

  const grantedCount = permissions.filter((p) => p.granted).length;

  return (
    <div
      id="modal-first-run-setup"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Android Permissions & Setup Center</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                  {grantedCount}/{permissions.length} GRANTED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                স্বচ্ছতা ও স্পষ্ট ব্যবহারকারীর অনুমোদন ভিত্তিক সিকিউরিটি আর্কিটেকচার
              </p>
            </div>
          </div>

          <button
            id="btn-first-run-close"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Safety Guarantee Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-950 border-b border-emerald-900/30 flex items-center gap-2.5 text-xs text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>সিকিউরিটি প্রতিশ্রুতি: </strong>
            কোনো ব্যক্তিগত পাসওয়ার্ড, ওটিপি বা ব্যাংকিং তথ্য সংগ্রহ করা হবে না। প্রতিটি কাজের আগে স্পষ্ট অনুমতি চাওয়া হবে।
          </span>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {permissions.map((perm) => (
            <div
              key={perm.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                perm.granted
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-950 border-slate-850 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                  {getPermissionIcon(perm.id)}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white">{perm.nameBn}</h4>
                    <span className="text-[10px] font-mono text-slate-400">({perm.name})</span>
                    {perm.sensitive && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 text-[9px] font-bold">
                        SENSITIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {perm.descriptionBn}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    প্রয়োজন: {perm.requiredFor.join(', ')}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => togglePermission(perm.id, perm.granted)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    perm.granted
                      ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {perm.granted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>অনুমোদিত (Granted)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>বন্ধ (Revoked)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              androidDeviceManager.launchNativeAndroidApp({
                packageName: 'com.android.settings',
                intentUri: 'intent:#Intent;action=android.settings.SETTINGS;end;',
                name: 'Device Settings',
                nameBn: 'ডিভাইস সেটিংস',
              });
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>অ্যান্ড্রয়েড সেটিংস খুলুন</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            সম্পন্ন করুন (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
