import React from 'react';
import {
  Terminal,
  Scan,
  MousePointer,
  Folder,
  MessageCircle,
  Mail,
  MapPin,
  Play,
  Flame,
  Globe,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (text: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const prompts = [
    {
      label: '🎬 YouTube গান বাজা',
      text: 'ইউটিউবে সুন্দর বাংলা গান চালাইয়া দেও',
      icon: <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />,
      color: 'hover:border-red-500/50 hover:bg-red-950/40 text-red-300',
    },
    {
      label: '🔥 রোস্ট মুকতাদির',
      text: 'মুকতাদিররে লইয়া একটা মজার রোস্ট শুনাও তো',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-950/40 text-amber-300',
    },
    {
      label: '💻 Termux খোল',
      text: 'Termux খুলিয়া দেও',
      icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300',
    },
    {
      label: '💬 WhatsApp মেসেজ',
      text: 'রহমান ভাইরে হোয়াটসঅ্যাপে মেসেজ পাঠাই দেও যে আমি ৫ মিনিটে আইরাম',
      icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300',
    },
    {
      label: '🗺️ Maps রাস্তা দেখাও',
      text: 'শিলচর মেডিকেল কলেজ যাওয়ার রাস্তা আর ম্যাপ দেখাও',
      icon: <MapPin className="w-3.5 h-3.5 text-blue-400" />,
      color: 'hover:border-blue-500/50 hover:bg-blue-950/40 text-blue-300',
    },
    {
      label: '👁️ স্ক্রিন পড়িয়া শুনাও',
      text: 'স্ক্রিনে যা আছে তা একটু পড়িয়া শুনাও',
      icon: <Scan className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-950/40 text-cyan-300',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-2 py-1 select-none z-20">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar justify-start sm:justify-center">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-800 backdrop-blur-sm transition-all duration-200 whitespace-nowrap active:scale-95 disabled:opacity-50 ${p.color}`}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
