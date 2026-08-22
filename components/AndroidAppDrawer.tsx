import React from 'react';
import {
  MessageCircle,
  PlaySquare,
  Music2,
  Folder,
  PhoneCall,
  Camera,
  Settings,
  Globe,
  Mail,
  MessageSquare,
  MapPin,
  FileText,
  Search,
  Sparkles,
} from 'lucide-react';
import { ANDROID_APPS } from '../services/androidDeviceManager';
import { AndroidAppId } from '../types';

interface AndroidAppDrawerProps {
  onOpenApp: (appId: AndroidAppId) => void;
  onQuickAction?: (query: string) => void;
}

export const AndroidAppDrawer: React.FC<AndroidAppDrawerProps> = ({ onOpenApp, onQuickAction }) => {
  const getIcon = (id: AndroidAppId) => {
    switch (id) {
      case 'whatsapp':
        return <MessageCircle className="w-6 h-6 text-white" />;
      case 'chrome':
        return <Globe className="w-6 h-6 text-white" />;
      case 'youtube':
        return <PlaySquare className="w-6 h-6 text-white" />;
      case 'gmail':
        return <Mail className="w-6 h-6 text-white" />;
      case 'maps':
        return <MapPin className="w-6 h-6 text-white" />;
      case 'files':
        return <Folder className="w-6 h-6 text-white" />;
      case 'phone':
        return <PhoneCall className="w-6 h-6 text-white" />;
      case 'messages':
        return <MessageSquare className="w-6 h-6 text-white" />;
      case 'spotify':
        return <Music2 className="w-6 h-6 text-white" />;
      case 'camera':
        return <Camera className="w-6 h-6 text-white" />;
      case 'settings':
        return <Settings className="w-6 h-6 text-white" />;
      case 'notes':
        return <FileText className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div id="android-app-drawer" className="w-full flex flex-col gap-4 p-4 select-none">
      {/* Search Bar / Android Google Widget */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg shadow-black/20">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="অ্যান্ড্রয়েড অ্যাপ বা তথ্য খুঁজুন (যেমন: WhatsApp, Gmail, Maps, Files)..."
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim() && onQuickAction) {
              onQuickAction(e.currentTarget.value.trim());
              e.currentTarget.value = '';
            }
          }}
        />
        <div className="flex items-center gap-1 text-[10px] text-pink-400 font-medium px-2 py-0.5 rounded-full bg-pink-950/40 border border-pink-500/30">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Zoya Agent</span>
        </div>
      </div>

      {/* App Header Tag */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          অনুমোদিত অ্যান্ড্রয়েড অ্যাপসমূহ (8 Core Apps):
        </span>
        <span className="text-[10px] font-mono text-emerald-400">Android 15 Ready</span>
      </div>

      {/* Android Installed Apps Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
        {ANDROID_APPS.map((app) => (
          <button
            key={app.id}
            id={`btn-app-${app.id}`}
            type="button"
            onClick={() => onOpenApp(app.id)}
            className="group flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-slate-800/50 active:scale-95 transition-all duration-200"
          >
            <div
              className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${app.color} p-3.5 shadow-md shadow-black/30 flex items-center justify-center group-hover:scale-105 group-hover:shadow-lg transition-all`}
            >
              {getIcon(app.id)}
            </div>
            <div className="flex flex-col items-center w-full">
              <span className="text-[11px] font-semibold text-slate-200 truncate w-full text-center group-hover:text-white">
                {app.nameBn}
              </span>
              <span className="text-[9px] text-slate-500 truncate w-full text-center">
                {app.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

