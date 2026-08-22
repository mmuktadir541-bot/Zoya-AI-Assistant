import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2, Zap } from 'lucide-react';
import { AssistantState, VoiceEngine } from '../types';

interface MicButtonProps {
  state: AssistantState;
  voiceEngine?: VoiceEngine;
  isLiveConnected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  state,
  voiceEngine = 'standard',
  isLiveConnected = false,
  onClick,
  disabled = false,
}) => {
  const getButtonContent = () => {
    if (voiceEngine === 'live') {
      if (state === 'speaking') {
        return {
          icon: <Volume2 className="w-8 h-8 text-white animate-bounce" />,
          label: 'Zoya Live Speaking (Interrupt anytime)',
          ringColor: 'border-cyan-400 shadow-cyan-400/50',
          bgColor: 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600',
        };
      }
      if (state === 'listening' || isLiveConnected) {
        return {
          icon: <Mic className="w-8 h-8 text-white animate-pulse" />,
          label: 'Live Audio Streaming • Speak naturally',
          ringColor: 'border-emerald-400 shadow-emerald-400/50',
          bgColor: 'bg-gradient-to-tr from-emerald-600 via-pink-600 to-indigo-600',
        };
      }
      if (state === 'thinking') {
        return {
          icon: <Loader2 className="w-8 h-8 text-white animate-spin" />,
          label: 'Connecting to Gemini Live...',
          ringColor: 'border-purple-500 shadow-purple-500/50',
          bgColor: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500',
        };
      }
      return {
        icon: <Zap className="w-8 h-8 text-amber-300" />,
        label: 'Tap to Start Gemini Live Voice',
        ringColor: 'border-pink-500/60 shadow-pink-500/30',
        bgColor: 'bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600',
      };
    }

    switch (state) {
      case 'listening':
        return {
          icon: <Mic className="w-8 h-8 text-white animate-pulse" />,
          label: 'Listening to you...',
          ringColor: 'border-pink-500 shadow-pink-500/50',
          bgColor: 'bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-400',
        };
      case 'thinking':
        return {
          icon: <Loader2 className="w-8 h-8 text-white animate-spin" />,
          label: 'Zoya is thinking...',
          ringColor: 'border-purple-500 shadow-purple-500/50',
          bgColor: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500',
        };
      case 'speaking':
        return {
          icon: <Volume2 className="w-8 h-8 text-white animate-bounce" />,
          label: 'Zoya is speaking (Tap to stop)',
          ringColor: 'border-cyan-400 shadow-cyan-400/50',
          bgColor: 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600',
        };
      case 'idle':
      default:
        return {
          icon: <Mic className="w-8 h-8 text-white" />,
          label: 'Tap or Say "Hey Zoya"',
          ringColor: 'border-indigo-500/40 hover:border-pink-400 shadow-indigo-500/20',
          bgColor: 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500',
        };
    }
  };

  const { icon, label, ringColor, bgColor } = getButtonContent();

  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <div className="relative flex items-center justify-center">
        {/* Pulsating Animated Ambient Rings */}
        {(state === 'listening' || (voiceEngine === 'live' && isLiveConnected)) && (
          <>
            <div className="absolute w-28 h-28 rounded-full bg-pink-500/20 animate-ping" />
            <div className="absolute w-36 h-36 rounded-full border border-pink-500/30 animate-pulse" />
          </>
        )}

        {state === 'speaking' && (
          <>
            <div className="absolute w-28 h-28 rounded-full bg-cyan-500/20 animate-pulse" />
            <div className="absolute w-36 h-36 rounded-full border border-cyan-400/30 animate-ping" />
          </>
        )}

        {/* Core Button */}
        <button
          id="zoya-main-mic-button"
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={`
            relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center
            ${bgColor} shadow-2xl transition-all duration-300 ease-out
            hover:scale-105 active:scale-95 focus:outline-none
            border-2 ${ringColor}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Inner Gloss Overlay */}
          <div className="absolute inset-1 rounded-full bg-white/10 backdrop-blur-xs pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-center">
            {icon}
          </div>
        </button>
      </div>

      {/* Button Status Text Pill */}
      <button
        id="zoya-status-pill"
        onClick={onClick}
        type="button"
        className={`
          flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide
          backdrop-blur-md border transition-all duration-300
          ${
            voiceEngine === 'live' && isLiveConnected
              ? state === 'speaking'
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : state === 'listening'
              ? 'bg-pink-950/60 border-pink-500/40 text-pink-200'
              : state === 'speaking'
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
              : state === 'thinking'
              ? 'bg-purple-950/60 border-purple-500/40 text-purple-200'
              : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:text-white hover:border-pink-500/40'
          }
        `}
      >
        {voiceEngine === 'live' ? (
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 opacity-80" />
        )}
        <span>{label}</span>
      </button>
    </div>
  );
};
