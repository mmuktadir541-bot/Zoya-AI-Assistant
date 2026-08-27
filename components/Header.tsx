import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Settings,
  Volume2,
  VolumeX,
  Flame,
  Bot,
  Zap,
  Smartphone,
  Shield,
  Terminal,
  Scan,
  ShieldCheck,
  Package,
  Eye,
  Camera,
  Image as ImageIcon,
  Heart,
} from 'lucide-react';
import { AssistantState, VoiceEngine } from '../types';

interface HeaderProps {
  state: AssistantState;
  voiceEngine: VoiceEngine;
  onToggleVoiceEngine: () => void;
  isLiveConnected: boolean;
  isAppDrawerOpen: boolean;
  onToggleAppDrawer: () => void;
  onOpenAudit: () => void;
  onToggleChat: () => void;
  onOpenSettings: () => void;
  onRoastCreator: () => void;
  onOpenTermux: () => void;
  onOpenScreenReader: () => void;
  onOpenVisionCamera?: () => void;
  isFullScreenRobotBg?: boolean;
  onToggleFullScreenRobotBg?: () => void;
  onOpenFirstRunSetup: () => void;
  onOpenProjectExport: () => void;
  onOpenNativeBridge: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  voiceEngine,
  onToggleVoiceEngine,
  isLiveConnected,
  isAppDrawerOpen,
  onToggleAppDrawer,
  onOpenAudit,
  onToggleChat,
  onOpenSettings,
  onRoastCreator,
  onOpenTermux,
  onOpenScreenReader,
  onOpenVisionCamera,
  isFullScreenRobotBg = true,
  onToggleFullScreenRobotBg,
  onOpenFirstRunSetup,
  onOpenProjectExport,
  onOpenNativeBridge,
  isMuted,
  onToggleMute,
  unreadCount,
}) => {
  const getStateBadge = () => {
    switch (state) {
      case 'listening':
        return { label: 'LISTENING', dotColor: 'bg-pink-400', textColor: 'text-pink-300' };
      case 'thinking':
        return { label: 'PROCESSING', dotColor: 'bg-purple-400 animate-spin', textColor: 'text-purple-300' };
      case 'speaking':
        return { label: 'SPEAKING', dotColor: 'bg-cyan-400', textColor: 'text-cyan-300' };
      case 'idle':
      default:
        return { label: 'ANDROID AGENT', dotColor: 'bg-emerald-400', textColor: 'text-emerald-300' };
    }
  };

  const { label, dotColor, textColor } = getStateBadge();

  return (
    <header
      id="zoya-header"
      className="w-full px-3 sm:px-5 py-2.5 flex items-center justify-between z-30 select-none bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80"
    >
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 p-[1px] shadow-md shadow-pink-500/10">
          <div className="w-full h-full bg-slate-950/90 rounded-[11px] flex items-center justify-center">
            <Bot className="w-4 h-4 text-pink-400" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-slate-950 ${dotColor}`} />
        </div>

        <div>
          <h1 className="text-sm font-bold tracking-wider bg-gradient-to-r from-pink-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
            ZOYA AI
          </h1>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-1.5 justify-end">
        {/* Termux Terminal */}
        <button
          id="btn-open-termux"
          type="button"
          onClick={onOpenTermux}
          title="Termux Terminal"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-emerald-400 hover:border-emerald-500/40 transition-all active:scale-95 flex items-center gap-1"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Termux</span>
        </button>

        {/* Android Apps Drawer Button */}
        <button
          id="btn-toggle-apps"
          type="button"
          onClick={onToggleAppDrawer}
          title="Open Android Apps"
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 ${
            isAppDrawerOpen
              ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline text-[11px]">Apps</span>
        </button>

        {/* Full-Screen Cute Robot Wallpaper Toggle */}
        {onToggleFullScreenRobotBg && (
          <button
            id="btn-toggle-wallpaper"
            type="button"
            onClick={onToggleFullScreenRobotBg}
            title={isFullScreenRobotBg ? "ফুলস্ক্রিন রোবট ওয়ালপেপার চালু আছে (ক্লিক করে পরিবর্তন করুন)" : "ফুলস্ক্রিন রোবট ওয়ালপেপার বন্ধ"}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 cursor-pointer active:scale-95 ${
              isFullScreenRobotBg
                ? 'bg-pink-950/80 border-pink-500/60 text-pink-200 shadow-md shadow-pink-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFullScreenRobotBg ? 'text-pink-400 fill-pink-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline text-[11px]">Love Bot</span>
          </button>
        )}

        {/* Live Vision / Camera & Screenshot Button */}
        {onOpenVisionCamera && (
          <button
            id="btn-open-vision-camera"
            type="button"
            onClick={onOpenVisionCamera}
            title="লাইভ ক্যামেরা ও স্ক্রিনশট (Vision)"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-pink-300 hover:border-pink-500/50 hover:bg-pink-950/30 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline text-[11px]">Vision</span>
          </button>
        )}

        {/* Live Voice vs Standard Switch Button */}
        <button
          id="btn-toggle-engine"
          type="button"
          onClick={onToggleVoiceEngine}
          title={voiceEngine === 'live' ? 'Switch to Standard Voice' : 'Switch to Real-time Gemini Live Voice'}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 ${
            voiceEngine === 'live'
              ? isLiveConnected
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-pink-950/60 border-pink-500/50 text-pink-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${voiceEngine === 'live' ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
          <span className="hidden md:inline text-[11px]">
            {voiceEngine === 'live' ? 'Live Audio' : 'Standard'}
          </span>
        </button>

        {/* Mute Voice Toggle */}
        <button
          id="btn-toggle-mute"
          type="button"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Zoya Voice' : 'Mute Zoya Voice'}
          className={`p-1.5 rounded-xl border transition-all ${
            isMuted
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Chat Drawer Toggle */}
        <button
          id="btn-toggle-chat"
          type="button"
          onClick={onToggleChat}
          title="Conversation History"
          className="relative p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Settings Modal Toggle */}
        <button
          id="btn-open-settings"
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
