import React from 'react';
import { ArrowLeft, Circle, Square, Smartphone } from 'lucide-react';

interface AndroidNavBarProps {
  onBack?: () => void;
  onHome?: () => void;
  onRecents?: () => void;
  activeAppId?: string | null;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  onBack,
  onHome,
  onRecents,
  activeAppId,
}) => {
  return (
    <div
      id="android-nav-bar"
      className="w-full h-10 px-8 flex items-center justify-around bg-slate-950/80 backdrop-blur-md border-t border-slate-800/60 z-30 select-none"
    >
      {/* Back Button (Triangle/Chevron) */}
      <button
        id="btn-nav-back"
        type="button"
        onClick={onBack}
        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 active:scale-90 transition-transform"
        title="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Home Button (Circle / Gesture Pill) */}
      <button
        id="btn-nav-home"
        type="button"
        onClick={onHome}
        className="flex items-center justify-center p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/50 active:scale-95 transition-transform"
        title="Home Screen"
      >
        <div className="w-16 h-1 rounded-full bg-slate-400 hover:bg-white transition-colors" />
      </button>

      {/* Recents Button (Square) */}
      <button
        id="btn-nav-recents"
        type="button"
        onClick={onRecents}
        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 active:scale-90 transition-transform"
        title="Recent Apps & Permissions"
      >
        <Square className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
