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
      className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between z-30 select-none bg-slate-950/70 backdrop-blur-md border-b border-slate-800/60"
    >
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 p-[1px] shadow-lg shadow-pink-500/20">
          <div className="w-full h-full bg-slate-950/80 rounded-[11px] flex items-center justify-center">
            <Bot className="w-4 h-4 text-pink-400" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${dotColor}`} />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-bold tracking-wider bg-gradient-to-r from-pink-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
              ZOYA AI
            </h1>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              Android 15
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-mono font-medium tracking-wider ${textColor}`}>
              {label}
            </span>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              {voiceEngine === 'live' ? '⚡ Gemini 3.1 Live Audio' : 'Standard Voice'}
            </span>
          </div>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Android Apps Drawer Button */}
        <button
          id="btn-toggle-apps"
          type="button"
          onClick={onToggleAppDrawer}
          title="Open Android Apps"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
            isAppDrawerOpen
              ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-indigo-500/20'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline font-mono">APPS</span>
        </button>

        {/* Live Voice vs Standard Switch Button */}
        <button
          id="btn-toggle-engine"
          type="button"
          onClick={onToggleVoiceEngine}
          title={voiceEngine === 'live' ? 'Switch to Standard Voice' : 'Switch to Real-time Gemini Live Voice'}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
            voiceEngine === 'live'
              ? isLiveConnected
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10 animate-pulse'
                : 'bg-pink-950/50 border-pink-500/50 text-pink-300 shadow-pink-500/10'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${voiceEngine === 'live' ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline font-mono tracking-tight">
            {voiceEngine === 'live' ? 'LIVE AUDIO' : 'STANDARD'}
          </span>
        </button>

        {/* Security Audit Log Button */}
        <button
          id="btn-open-audit"
          type="button"
          onClick={onOpenAudit}
          title="Security & Permission Audit"
          className="p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
        >
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* Roast Muktadir Button */}
        <button
          id="btn-roast-muktadir"
          type="button"
          onClick={onRoastCreator}
          title="Roast Creator Muktadir"
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="hidden md:inline">Roast</span>
        </button>

        {/* Mute Voice Toggle */}
        <button
          id="btn-toggle-mute"
          type="button"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Zoya Voice' : 'Mute Zoya Voice'}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
            isMuted
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Chat Drawer Toggle */}
        <button
          id="btn-toggle-chat"
          type="button"
          onClick={onToggleChat}
          title="Open Conversation History"
          className="relative p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-white hover:border-pink-500/40 transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-[9px] font-bold text-white flex items-center justify-center shadow-md">
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
          className="p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
