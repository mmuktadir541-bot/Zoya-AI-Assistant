import React from 'react';
import { MousePointer2, Sparkles } from 'lucide-react';

interface AccessibilityOverlayProps {
  targetTitle?: string;
  isActive: boolean;
}

export const AccessibilityOverlay: React.FC<AccessibilityOverlayProps> = ({ targetTitle, isActive }) => {
  if (!isActive) return null;

  return (
    <div
      id="accessibility-overlay"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/90 border border-indigo-400 text-indigo-200 text-xs font-semibold shadow-2xl shadow-indigo-500/30 animate-bounce pointer-events-none"
    >
      <MousePointer2 className="w-4 h-4 text-indigo-400 animate-pulse" />
      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      <span>অ্যান্ড্রয়েড অ্যাক্সেসিবিলিটি অটোমেশন: {targetTitle || 'Executing action...'}</span>
    </div>
  );
};
