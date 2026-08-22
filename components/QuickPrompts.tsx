import React from 'react';
import {
  Flame,
  Play,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  MapPin,
  Folder,
  Shield,
  PhoneCall,
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
      label: 'C: 💬 WhatsApp মেসেজ',
      text: 'রহমান ভাইকে হোয়াটসঅ্যাপে মেসেজ পাঠাও যে আমি ৫ মিনিটে আসছি',
      icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/30 text-emerald-300',
    },
    {
      label: 'C: ✉️ Gmail ইমেইল',
      text: 'তানভীরকে জিমেইলে প্রজেক্ট আপডেট পাঠিয়ে দাও',
      icon: <Mail className="w-3.5 h-3.5 text-rose-400" />,
      color: 'hover:border-rose-500/50 hover:bg-rose-950/30 text-rose-300',
    },
    {
      label: 'B: 🌐 Chrome সার্চ ও পাঠ',
      text: 'গুগল ক্রোমে বাংলাদেশ এআই খবর খোঁজো আর আমাকে পড়ে শোনাও',
      icon: <Globe className="w-3.5 h-3.5 text-amber-400" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-950/30 text-amber-300',
    },
    {
      label: 'A: 🗺️ Google Maps রুট',
      text: 'গুগল ম্যাপসে ধানমন্ডি লেক যাওয়ার রাস্তা এবং ট্রাফিক দেখাও',
      icon: <MapPin className="w-3.5 h-3.5 text-blue-400" />,
      color: 'hover:border-blue-500/50 hover:bg-blue-950/30 text-blue-300',
    },
    {
      label: 'E: 📁 Files ডকুমেন্ট',
      text: 'আমার ফাইলস ম্যানেজার থেকে প্রজেক্ট জয়ার PDF ডকুমেন্ট দেখাও',
      icon: <Folder className="w-3.5 h-3.5 text-indigo-400" />,
      color: 'hover:border-indigo-500/50 hover:bg-indigo-950/30 text-indigo-300',
    },
    {
      label: 'C: 💬 Messages SMS',
      text: 'রহমান ভাইকে মেসেজে এসএমএস পাঠাও',
      icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-950/30 text-cyan-300',
    },
    {
      label: 'A: 🎬 YouTube গান',
      text: 'ইউটিউবে বাংলা লো-ফাই গান বাজাও',
      icon: <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />,
      color: 'hover:border-red-500/50 hover:bg-red-950/30 text-red-300',
    },
    {
      label: 'A: 📞 Phone কল',
      text: 'তানভীরকে ফোন দাও',
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/30 text-emerald-300',
    },
    {
      label: '🔥 রোস্ট মুকতাদির',
      text: 'মুকতাদিরকে নিয়ে একটা মজার রোস্ট শোনাও',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-950/30 text-amber-300',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-3 py-2 select-none z-20">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar justify-start sm:justify-center">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm transition-all duration-200 whitespace-nowrap active:scale-95 disabled:opacity-50 ${p.color}`}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
