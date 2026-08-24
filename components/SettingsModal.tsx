import React, { useState, useEffect } from 'react';
import { X, Volume2, Palette, Sparkles, Radio, Check, Info, Shield, Smartphone, Globe, Battery, BatteryCharging, Leaf, Zap } from 'lucide-react';
import { VoiceSettings, VisualizerTheme, PowerMode, BatteryState } from '../types';
import { speechService } from '../services/speechService';
import { powerManager } from '../services/powerManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
  hasApiKey: boolean;
  onOpenAuditLogs?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  hasApiKey,
  onOpenAuditLogs,
}) => {
  const [batteryState, setBatteryState] = useState<BatteryState>(powerManager.getState());

  useEffect(() => {
    const unsub = powerManager.subscribe((st) => setBatteryState(st));
    return unsub;
  }, []);

  if (!isOpen) return null;

  const voices = speechService.getAvailableVoices();
  const femaleVoices = voices.filter((v) =>
    v.lang.startsWith('en') || v.lang.startsWith('hi') || v.lang.startsWith('bn')
  );

  const themes: Array<{ id: VisualizerTheme; label: string; previewColor: string }> = [
    { id: 'gemini_glow', label: 'Gemini Violet Glow', previewColor: 'from-indigo-500 via-pink-500 to-cyan-400' },
    { id: 'cyber_neon', label: 'Cyberpunk Pink & Teal', previewColor: 'from-pink-500 via-purple-500 to-cyan-400' },
    { id: 'siri_wave', label: 'Siri Fluid Dynamic', previewColor: 'from-blue-500 via-purple-500 to-rose-500' },
    { id: 'aurora_bliss', label: 'Aurora Emerald', previewColor: 'from-emerald-400 via-cyan-400 to-indigo-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div
        id="zoya-settings-modal"
        className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Android Assistant Settings</h2>
              <p className="text-xs text-slate-400">Voice, Android Permissions & Automation</p>
            </div>
          </div>

          <button
            id="btn-close-settings"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Android Security & Consent Guard */}
          <div className="space-y-3 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
            <label className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Android অনুমতি ও সিকিউরিটি গার্ড (Permission Guard)</span>
            </label>

            {/* Explicit Approval Toggle / Direct Open */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-semibold text-white">সরাসরি অ্যাপ চালু (Direct Open Mode)</div>
                <div className="text-[11px] text-slate-400">
                  {settings.requireExplicitApprovalForApps
                    ? 'অনুমতি পপ-আপ চালু আছে (Confirmation popups enabled)'
                    : 'সরাসরি ওপেন মোড সক্রিয়—কোনো অনুমতি পপ-আপ ছাড়াই তৎক্ষণাৎ অ্যাপ চালু হবে (Direct Instant Open)'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={!settings.requireExplicitApprovalForApps}
                onChange={(e) => onUpdateSettings({ requireExplicitApprovalForApps: !e.target.checked })}
                className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Accessibility Agent */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-semibold text-white">অ্যান্ড্রয়েড অ্যাক্সেসিবিলিটি সার্ভিস সিমুলেশন</div>
                <div className="text-[11px] text-slate-400">
                  Allow Zoya to tap buttons and automate UI steps with your consent
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.accessibilityAgentEnabled}
                onChange={(e) => onUpdateSettings({ accessibilityAgentEnabled: e.target.checked })}
                className="w-4 h-4 rounded-md accent-indigo-500 cursor-pointer"
              />
            </label>

            {onOpenAuditLogs && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuditLogs();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>সিকিউরিটি অডিট ও পারমিশন হিস্ট্রি দেখুন (View Security Trail)</span>
              </button>
            )}
          </div>

          {/* Primary Language */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Voice Recognition Language</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bn-BD', label: 'বাংলা (Bengali)' },
                { id: 'hi-IN', label: 'Hinglish / Hindi' },
                { id: 'en-US', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onUpdateSettings({ language: lang.id as any })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    settings.language === lang.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Engine & Live Settings */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Voice Engine & Live Audio</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ voiceEngine: 'live' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.voiceEngine === 'live'
                    ? 'bg-slate-900 border-pink-500 shadow-md shadow-pink-500/10 text-white'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>⚡ Gemini Live</span>
                  {settings.voiceEngine === 'live' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Real-time low-latency neural voice stream</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ voiceEngine: 'standard' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.voiceEngine === 'standard'
                    ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10 text-white'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>🎙️ Standard Voice</span>
                  {settings.voiceEngine === 'standard' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Browser Speech Recognition & Synthesis</div>
              </button>
            </div>

            {/* Gemini Live Prebuilt Voice Selection */}
            {settings.voiceEngine === 'live' && (
              <div className="space-y-1.5 pt-2">
                <div className="text-xs text-slate-400">Gemini Live Voice Persona</div>
                <select
                  value={settings.geminiLiveVoice || 'Aoede'}
                  onChange={(e) => onUpdateSettings({ geminiLiveVoice: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-400"
                >
                  <option value="Aoede">Aoede (Expressive Female - Recommended for Zoya)</option>
                  <option value="Kore">Kore (Smooth & Natural Female)</option>
                  <option value="Zephyr">Zephyr (Bright & Friendly)</option>
                  <option value="Puck">Puck (Playful & Energetic)</option>
                  <option value="Fenrir">Fenrir (Bold & Confident)</option>
                  <option value="Charon">Charon (Calm & Deep)</option>
                </select>
              </div>
            )}
          </div>

          {/* Intelligent Power Mode Section */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span>ইন্টেলিজেন্ট পাওয়ার সেভিং (Intelligent Power Mode)</span>
              </label>
              {batteryState.isPowerSavingActive && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300">
                  <Leaf className="w-3 h-3 text-amber-400" />
                  Eco Active
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              ব্যাটারি কম থাকলে স্বয়ংক্রিয়ভাবে ভিজ্যুয়ালাইজার অ্যানিমেশন ফ্রেমরেট (22 FPS) ও ব্যাকগ্রাউন্ড পোলিং কমিয়ে দেয়।
            </p>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', label: 'Auto (স্মার্ট)', sub: '<20% হলে চালু' },
                { id: 'always_on', label: 'Always Eco', sub: 'সর্বোচ্চ সেভিং' },
                { id: 'off', label: 'Full Power', sub: '60 FPS আনলিমিটেড' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    const m = mode.id as PowerMode;
                    onUpdateSettings({ powerMode: m });
                    powerManager.setPowerMode(m);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    (settings.powerMode || 'auto') === mode.id
                      ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{mode.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{mode.sub}</div>
                </button>
              ))}
            </div>

            {/* Battery Level Simulation & Low Battery Threshold Control */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  {batteryState.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5 text-amber-400" />}
                  বর্তমান ব্যাটারি লেভেল (Battery Level):
                </span>
                <span className="font-mono font-bold text-slate-200">{batteryState.level}%</span>
              </div>

              {/* Slider to test battery levels */}
              <input
                type="range"
                min="5"
                max="100"
                value={batteryState.level}
                onChange={(e) => powerManager.setBatteryLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batteryState.isCharging}
                    onChange={(e) => powerManager.setCharging(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-emerald-500"
                  />
                  <span>চার্জার কানেক্টেড (Charging)</span>
                </label>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      powerManager.setBatteryLevel(14);
                      powerManager.setCharging(false);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-600/40 text-rose-300 hover:bg-rose-900/60"
                  >
                    14% Low Test
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      powerManager.setBatteryLevel(85);
                      powerManager.setCharging(false);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                  >
                    Reset (85%)
                  </button>
                </div>
              </div>

              {/* Critical Wake Feature Reassurance */}
              <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-300/90">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>ভয়েস ওয়েক শতভাগ সক্রিয়:</strong> পাওয়ার সেভিং মোডেও ‘Hey Zoya’ বা ‘জয়া’ ভয়েস ডিটেকশন এবং সরাসরি অ্যান্ড্রয়েড অ্যাপ অ্যাকশন কোনো বিলম্ব ছাড়াই পূর্ণ গতিতে কাজ করে।
                </span>
              </div>
            </div>
          </div>

          {/* Visualizer Theme Selector */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Palette className="w-4 h-4 text-pink-400" />
              <span>Visualizer Visual Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateSettings({ visualizerTheme: t.id })}
                  className={`
                    p-3 rounded-2xl border flex items-center gap-3 text-left transition-all
                    ${
                      settings.visualizerTheme === t.id
                        ? 'bg-slate-900 border-pink-500 shadow-md shadow-pink-500/10'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
                    }
                  `}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${t.previewColor} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{t.label}</div>
                  </div>
                  {settings.visualizerTheme === t.id && (
                    <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-pink-500/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
