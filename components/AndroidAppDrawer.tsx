import React, { useState } from 'react';
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
  Share2,
  CreditCard,
  Wallet,
  Calculator,
  Calendar,
  Clock,
  Video,
  Send,
  ShoppingBag,
  Image,
  HardDrive,
  Bot,
  Smartphone,
} from 'lucide-react';
import { ANDROID_APPS } from '../services/androidDeviceManager';
import { AndroidAppId } from '../types';

interface AndroidAppDrawerProps {
  onOpenApp: (appId: AndroidAppId) => void;
  onQuickAction?: (query: string) => void;
}

export const AndroidAppDrawer: React.FC<AndroidAppDrawerProps> = ({ onOpenApp, onQuickAction }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getIcon = (id: string, iconName?: string) => {
    switch (id) {
      case 'whatsapp':
        return <MessageCircle className="w-6 h-6 text-white" />;
      case 'facebook':
        return <Share2 className="w-6 h-6 text-white" />;
      case 'messenger':
        return <MessageSquare className="w-6 h-6 text-white" />;
      case 'bkash':
        return <CreditCard className="w-6 h-6 text-white" />;
      case 'nagad':
        return <Wallet className="w-6 h-6 text-white" />;
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
      case 'calculator':
        return <Calculator className="w-6 h-6 text-white" />;
      case 'calendar':
        return <Calendar className="w-6 h-6 text-white" />;
      case 'clock':
        return <Clock className="w-6 h-6 text-white" />;
      case 'instagram':
        return <Camera className="w-6 h-6 text-white" />;
      case 'tiktok':
        return <Video className="w-6 h-6 text-white" />;
      case 'telegram':
        return <Send className="w-6 h-6 text-white" />;
      case 'playstore':
        return <ShoppingBag className="w-6 h-6 text-white" />;
      case 'photos':
        return <Image className="w-6 h-6 text-white" />;
      case 'drive':
        return <HardDrive className="w-6 h-6 text-white" />;
      case 'chatgpt':
        return <Bot className="w-6 h-6 text-white" />;
      case 'settings':
        return <Settings className="w-6 h-6 text-white" />;
      case 'notes':
        return <FileText className="w-6 h-6 text-white" />;
      default:
        return <Smartphone className="w-6 h-6 text-white" />;
    }
  };

  const filteredApps = ANDROID_APPS.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="android-app-drawer" className="w-full flex flex-col gap-4 p-4 select-none">
      {/* Search Bar / Android Google Widget */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg shadow-black/20">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="যেকোনো অ্যান্ড্রয়েড অ্যাপ খুঁজুন বা নাম লিখুন..."
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim() && onQuickAction) {
              onQuickAction(e.currentTarget.value.trim());
              setSearchQuery('');
            }
          }}
        />
        <div className="flex items-center gap-1 text-[10px] text-pink-400 font-medium px-2 py-0.5 rounded-full bg-pink-950/40 border border-pink-500/30">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Direct Launch</span>
        </div>
      </div>

      {/* App Header Tag */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          ইনস্টল করা মোবাইল অ্যাপস ({ANDROID_APPS.length}+):
        </span>
        <span className="text-[10px] font-mono text-emerald-400">Android Intent Ready</span>
      </div>

      {/* Android Installed Apps Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 max-h-[380px] overflow-y-auto pr-1">
        {filteredApps.map((app) => (
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
              {getIcon(app.id, app.icon)}
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

        {filteredApps.length === 0 && (
          <div className="col-span-4 md:col-span-6 flex flex-col items-center justify-center py-6 text-center">
            <Smartphone className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
            <p className="text-xs text-slate-300 font-medium">"{searchQuery}" আপনার ফোনে সরাসরি চালু করা যাবে</p>
            <button
              onClick={() => {
                if (onQuickAction) onQuickAction(`Open ${searchQuery}`);
                setSearchQuery('');
              }}
              className="mt-2 text-xs px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-medium shadow-md shadow-pink-600/30"
            >
              সরাসরি চালু করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

