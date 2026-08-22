import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Smartphone,
  MessageCircle,
  PhoneCall,
  Folder,
  PlaySquare,
  Music,
  ExternalLink,
  Mic,
  Globe,
  Mail,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import { AssistantAction, AndroidPermissionState } from '../types';

interface PermissionConsentModalProps {
  action: AssistantAction | null;
  permission?: AndroidPermissionState | null;
  isOpen: boolean;
  onApprove: (alwaysAllow?: boolean) => void;
  onDeny: () => void;
}

export const PermissionConsentModal: React.FC<PermissionConsentModalProps> = ({
  action,
  permission,
  isOpen,
  onApprove,
  onDeny,
}) => {
  if (!isOpen || !action) return null;

  const getAppIcon = () => {
    switch (action.targetApp) {
      case 'whatsapp':
        return <MessageCircle className="w-8 h-8 text-emerald-400" />;
      case 'chrome':
        return <Globe className="w-8 h-8 text-amber-400" />;
      case 'youtube':
        return <PlaySquare className="w-8 h-8 text-red-400" />;
      case 'gmail':
        return <Mail className="w-8 h-8 text-rose-400" />;
      case 'maps':
        return <MapPin className="w-8 h-8 text-blue-400" />;
      case 'files':
        return <Folder className="w-8 h-8 text-blue-400" />;
      case 'phone':
        return <PhoneCall className="w-8 h-8 text-emerald-400" />;
      case 'messages':
        return <MessageSquare className="w-8 h-8 text-cyan-400" />;
      case 'spotify':
        return <Music className="w-8 h-8 text-emerald-400" />;
      default:
        return <Smartphone className="w-8 h-8 text-indigo-400" />;
    }
  };

  return (
    <div
      id="modal-permission-consent"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 flex flex-col gap-5 text-slate-200">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>অ্যান্ড্রয়েড সিকিউরিটি অনুমতি চাই (Permission Required)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Android 15 Guard</span>
        </div>

        {/* Target App & Action Info */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700/60 shadow-inner">
            {getAppIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
              {action.targetApp ? `${action.targetApp.toUpperCase()} অ্যাকশন` : 'ডিভাইস অ্যাকশন'}
            </div>
            <h3 className="text-base font-bold text-white truncate mt-0.5">
              {action.titleBn || action.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              জয়া (Zoya) আপনার অনুমতি নিয়ে এই কাজটি সম্পন্ন করতে চাচ্ছে।
            </p>
          </div>
        </div>

        {/* Payload / Details Box */}
        {action.payload && (
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              কাজের বিবরণ (Action Payload):
            </div>
            {action.payload.contactName && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">প্রাপক (Contact):</span>
                <span className="font-semibold text-white">{action.payload.contactName}</span>
              </div>
            )}
            {action.payload.subject && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">ইমেইল বিষয় (Subject):</span>
                <span className="font-semibold text-white">{action.payload.subject}</span>
              </div>
            )}
            {action.payload.message && (
              <div className="space-y-1">
                <span className="text-slate-400">বার্তা (Message):</span>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 italic font-mono text-[11px]">
                  "{action.payload.message}"
                </div>
              </div>
            )}
            {action.payload.destination && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">গন্তব্য (Destination):</span>
                <span className="font-semibold text-rose-300">"{action.payload.destination}"</span>
              </div>
            )}
            {action.payload.query && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">অনুসন্ধান (Query):</span>
                <span className="font-semibold text-cyan-300">"{action.payload.query}"</span>
              </div>
            )}
          </div>
        )}

        {/* Required Permission Banner */}
        {permission && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
            <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">{permission.nameBn}</span> ({permission.name}): {permission.descriptionBn}
            </div>
          </div>
        )}

        {/* Voice Approval Helper */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400">
          <Mic className="w-3.5 h-3.5 text-pink-400" />
          <span>মুখে বলুন: <strong className="text-white">"অনুমতি দিলাম"</strong> বা <strong className="text-white">"বাতিল"</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            id="btn-permission-deny"
            type="button"
            onClick={onDeny}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 active:scale-95"
          >
            <XCircle className="w-4 h-4 text-red-400" />
            <span>বাতিল করুন (Deny)</span>
          </button>

          <button
            id="btn-permission-allow-once"
            type="button"
            onClick={() => onApprove(false)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>অনুমতি দিন (Allow Once)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

