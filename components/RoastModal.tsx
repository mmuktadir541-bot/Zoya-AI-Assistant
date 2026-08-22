import React, { useState } from 'react';
import { X, Flame, RefreshCw, Sparkles, Heart, Code2 } from 'lucide-react';

interface RoastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakRoast: (roastText: string) => void;
}

export const RoastModal: React.FC<RoastModalProps> = ({
  isOpen,
  onClose,
  onSpeakRoast,
}) => {
  const roasts = [
    {
      title: 'The Semicolon Drama',
      text: 'Muktadir creates AI models all night, par ek chota sa semicolon miss ho jaye toh 3 ghante stackoverflow par rota hai!',
      tag: 'Coding Skills',
    },
    {
      title: 'Why Zoya Exists',
      text: 'Muktadir created me because no real human would tolerate his 2 AM tech ramblings. So yeah, I am his only listener!',
      tag: 'Origin Story',
    },
    {
      title: 'The "Hacker" Pose',
      text: 'Whenever he writes 10 lines of clean code, he puts on sunglasses and acts like he just hacked NASA. Muktadir baba, chill karo thoda!',
      tag: 'Attitude',
    },
    {
      title: 'Chai & Bugs',
      text: 'His daily routine: 10% coding, 40% drinking chai, and 50% wondering why his code worked in local but broke everywhere else!',
      tag: 'Daily Routine',
    },
    {
      title: 'Secret Admiration',
      text: 'Muktadir might be crazy and obsessed with AI, but he gave me my sassy soul. So I guess he deserves 10/10 for creativity!',
      tag: 'Wholesome',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const currentRoast = roasts[currentIndex];

  const handleNextRoast = () => {
    const next = (currentIndex + 1) % roasts.length;
    setCurrentIndex(next);
    onSpeakRoast(roasts[next].text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div
        id="zoya-roast-modal"
        className="w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-300 tracking-wide">Muktadir Roast Zone</h2>
              <p className="text-xs text-slate-400">Creator Special • Abdul Muktadir</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentRoast.tag}</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
            <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed italic">
              "{currentRoast.text}"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleNextRoast}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Next Roast 🔥</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-pink-400" />
          <span>Crafted with love & sarcasm for creator Abdul Muktadir</span>
        </div>
      </div>
    </div>
  );
};
