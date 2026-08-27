import React, { useState, useEffect } from 'react';
import { Wifi, Battery, BatteryCharging, BatteryWarning, Shield, Leaf, Zap } from 'lucide-react';
import { AssistantState, BatteryState } from '../types';
import { powerManager } from '../services/powerManager';

interface DeviceStatusBarProps {
  state: AssistantState;
  isLiveConnected: boolean;
  onOpenSettings?: () => void;
}

export const DeviceStatusBar: React.FC<DeviceStatusBarProps> = ({ state, isLiveConnected, onOpenSettings }) => {
  const [time, setTime] = useState<string>('');
  const [batteryState, setBatteryState] = useState<BatteryState>(powerManager.getState());

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

    // Adjust clock polling interval in power saving mode
    const intervalMs = batteryState.isPowerSavingActive ? 30000 : 10000;
    const interval = setInterval(updateTime, intervalMs);
    return () => clearInterval(interval);
  }, [batteryState.isPowerSavingActive]);

  useEffect(() => {
    const unsubscribe = powerManager.subscribe((newState) => {
      setBatteryState(newState);
    });
    return unsubscribe;
  }, []);

  const isMicActive = state === 'listening' || state === 'speaking' || isLiveConnected;

  const getBatteryColor = () => {
    if (batteryState.isCharging) return 'text-emerald-400 fill-emerald-400/30';
    if (batteryState.level <= batteryState.lowBatteryThreshold) return 'text-rose-400 fill-rose-400/30';
    if (batteryState.level <= 40) return 'text-amber-400 fill-amber-400/30';
    return 'text-emerald-400 fill-emerald-400/30';
  };

  const getBatteryIcon = () => {
    if (batteryState.isCharging) {
      return <BatteryCharging className={`w-3.5 h-3.5 ${getBatteryColor()}`} />;
    }
    if (batteryState.level <= batteryState.lowBatteryThreshold) {
      return <BatteryWarning className={`w-3.5 h-3.5 ${getBatteryColor()}`} />;
    }
    return <Battery className={`w-3.5 h-3.5 ${getBatteryColor()}`} />;
  };

  return (
    <div
      id="android-status-bar"
      className="w-full h-7 px-4 flex items-center justify-between text-[11px] font-medium text-slate-400 select-none bg-slate-950/80 backdrop-blur-md border-b border-slate-900 z-30"
    >
      {/* Left: Clock */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-300 tracking-tight">{time || '10:45 AM'}</span>
      </div>

      {/* Center: Subtle active indicator */}
      {isMicActive && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-400 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{state === 'speaking' ? 'Speaking' : 'Mic Active'}</span>
        </div>
      )}

      {/* Right: Wifi & Battery */}
      <div className="flex items-center gap-2.5 text-slate-400">
        <Wifi className="w-3.5 h-3.5 text-slate-400" />

        {/* Battery Indicator with Click to Open Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title={`Battery: ${batteryState.level}%`}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span className={`text-[10px] font-mono ${batteryState.level <= batteryState.lowBatteryThreshold ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {batteryState.level}%
          </span>
          {getBatteryIcon()}
        </button>
      </div>
    </div>
  );
};
