import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Radio, Shield, Mic, Circle } from 'lucide-react';
import { AssistantState } from '../types';

interface DeviceStatusBarProps {
  state: AssistantState;
  isLiveConnected: boolean;
}

export const DeviceStatusBar: React.FC<DeviceStatusBarProps> = ({ state, isLiveConnected }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const isMicActive = state === 'listening' || state === 'speaking' || isLiveConnected;

  return (
    <div
      id="android-status-bar"
      className="w-full h-8 px-4 flex items-center justify-between text-[11px] font-medium text-slate-300 select-none bg-slate-950/70 backdrop-blur-md border-b border-slate-800/40 z-30"
    >
      {/* Left: Clock & Carrier */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-200 tracking-tight">{time || '10:45 AM'}</span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">5G GP</span>
      </div>

      {/* Center: Dynamic Island / Privacy Pill */}
      {isMicActive && (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] text-emerald-300 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono">
            {state === 'speaking' ? 'Zoya Speaking' : 'Live Mic Active'}
          </span>
        </div>
      )}

      {/* Right: Connectivity & Battery */}
      <div className="flex items-center gap-2 text-slate-300">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Secured</span>
        </div>
        <Wifi className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-300">94%</span>
          <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30" />
        </div>
      </div>
    </div>
  );
};
