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
      label: '💻 Termux খোলো',
      text: 'Termux খোলো',
      icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300',
    },
    {
      label: '⚡ এই কমান্ডটা Termux-এ চালাও',
      text: 'এই কমান্ডটা Termux-এ চালাও: termux-battery-status',
      icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300',
    },
    {
      label: '👁️ স্ক্রিনে যা আছে সেটা পড়ে শোনাও',
      text: 'স্ক্রিনে যা আছে সেটা পড়ে শোনাও',
      icon: <Scan className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-950/40 text-cyan-300',
    },
    {
      label: '🤖 অ্যাপের ভিতর নির্দেশ অনুযায়ী কাজ করো',
      text: 'এই অ্যাপের ভিতরে আমার নির্দেশ অনুযায়ী কাজ করো',
      icon: <MousePointer className="w-3.5 h-3.5 text-pink-400" />,
      color: 'hover:border-pink-500/50 hover:bg-pink-950/40 text-pink-300',
    },
    {
      label: '📁 ফাইলটা খুঁজে দাও',
      text: 'আমার ফাইলটা খুঁজে দাও (Project_Zoya)',
      icon: <Folder className="w-3.5 h-3.5 text-indigo-400" />,
      color: 'hover:border-indigo-500/50 hover:bg-indigo-950/40 text-indigo-300',
    },
    {
      label: '💬 WhatsApp মেসেজ',
      text: 'রহমান ভাইকে হোয়াটসঅ্যাপে মেসেজ পাঠাও যে আমি ৫ মিনিটে আসছি',
      icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300',
    },
    {
      label: '✉️ Gmail ইমেইল',
      text: 'তানভীরকে জিমেইলে প্রজেক্ট আপডেট পাঠিয়ে দাও',
      icon: <Mail className="w-3.5 h-3.5 text-rose-400" />,
      color: 'hover:border-rose-500/50 hover:bg-rose-950/40 text-rose-300',
    },
    {
      label: '🗺️ Google Maps রুট',
      text: 'গুগল ম্যাপসে ধানমন্ডি লেক যাওয়ার রাস্তা এবং ট্রাফিক দেখাও',
      icon: <MapPin className="w-3.5 h-3.5 text-blue-400" />,
      color: 'hover:border-blue-500/50 hover:bg-blue-950/40 text-blue-300',
    },
    {
      label: '🎬 YouTube গান',
      text: 'ইউটিউবে বাংলা লো-ফাই গান বাজাও',
      icon: <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />,
      color: 'hover:border-red-500/50 hover:bg-red-950/40 text-red-300',
    },
    {
      label: '🔥 রোস্ট মুকতাদির',
      text: 'মুকতাদিরকে নিয়ে একটা মজার রোস্ট শোনাও',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-950/40 text-amber-300',
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
