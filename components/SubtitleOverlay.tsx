import React from 'react';
import { Sparkles, User, Bot, ExternalLink } from 'lucide-react';
import { AssistantAction } from '../types';

interface SubtitleOverlayProps {
  userTranscript: string;
  assistantText: string;
  isListening: boolean;
  isSpeaking: boolean;
  emotion?: string;
  activeAction?: AssistantAction | null;
  onExecuteAction?: (action: AssistantAction) => void;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  userTranscript,
  assistantText,
  isListening,
  isSpeaking,
  emotion,
  activeAction,
  onExecuteAction,
}) => {
  if (!userTranscript && !assistantText && !isListening) {
    return null;
  }

  const getEmotionBadge = () => {
    switch (emotion) {
      case 'roasting':
        return { label: 'ROAST MODE 🔥', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'flirty':
        return { label: 'PLAYFUL 💖', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
      case 'dramatic':
        return { label: 'DRAMATIC 🎭', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'witty':
        return { label: 'SASSY 💅', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      default:
        return { label: 'SMART AI ✨', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    }
  };

  const badge = getEmotionBadge();

  return (
    <div
      id="zoya-subtitles-card"
      className="w-full max-w-2xl mx-auto px-4 z-20 pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="relative rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 shadow-2xl p-4 sm:p-5 overflow-hidden">
        {/* Glow Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />

        {/* User Speech Section */}
        {userTranscript && (
          <div className="flex items-start gap-3 pb-3 border-b border-slate-800/50">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <User className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">You</div>
              <p className="text-sm sm:text-base font-medium text-slate-200 leading-snug break-words">
                "{userTranscript}"
              </p>
            </div>
          </div>
        )}

        {/* Live Listening State without Text yet */}
        {!userTranscript && isListening && (
          <div className="flex items-center gap-3 py-1 text-slate-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <span className="italic">Listening for commands... Speak now</span>
          </div>
        )}

        {/* Zoya's Sassy Response Section */}
        {assistantText && (
          <div className="flex items-start gap-3 pt-3">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-pink-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono text-pink-300 font-bold tracking-wider">ZOYA</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-base sm:text-lg font-medium text-white leading-relaxed tracking-wide">
                {assistantText}
              </p>

              {/* Action Quick Launch Button if action triggered */}
              {activeAction && activeAction.url && onExecuteAction && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    id="btn-retrigger-action"
                    type="button"
                    onClick={() => onExecuteAction(activeAction)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-pink-500/20 border border-pink-400/30 transition-all hover:scale-102"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{activeAction.title}</span>
                  </button>
                  <span className="text-[11px] text-slate-400 italic">
                    (Opened in new tab)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
