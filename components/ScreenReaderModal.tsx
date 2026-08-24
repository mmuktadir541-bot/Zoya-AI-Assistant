import React, { useState } from 'react';
import {
  Scan,
  Volume2,
  Play,
  CheckCircle2,
  MousePointer,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Eye,
  Shield,
  Smartphone,
} from 'lucide-react';
import { ScreenNode } from '../types';
import { androidDeviceManager, MOCK_DEVICE_DATA } from '../services/androidDeviceManager';

interface ScreenReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeak?: (text: string) => void;
}

export const ScreenReaderModal: React.FC<ScreenReaderModalProps> = ({
  isOpen,
  onClose,
  onSpeak,
}) => {
  const [screenText, setScreenText] = useState<string>(MOCK_DEVICE_DATA.visibleScreenText);
  const [nodes, setNodes] = useState<ScreenNode[]>(MOCK_DEVICE_DATA.screenNodes);
  const [selectedNode, setSelectedNode] = useState<ScreenNode | null>(null);
  const [isAutomating, setIsAutomating] = useState<boolean>(false);
  const [automationStep, setAutomationStep] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'text' | 'nodes' | 'automation'>('text');

  if (!isOpen) return null;

  const handleReadAloud = () => {
    const speech = `স্ক্রিনে দেখা যাচ্ছে: রহমান ভাইয়ের সাথে হোয়াটসঅ্যাপ চ্যাট চলছে। রহমান ভাই বলছেন "মুকতাদির কাজ কত দূর?", আমি বলেছি "জয়া এআই অ্যাসিস্ট্যান্ট অ্যান্ড্রয়েড ১৫ এজেন্ট রেডি!" এবং রহমান ভাই উত্তর দিয়েছেন "চায়ের দোকানে আসবা নাকি?"।`;
    if (onSpeak) {
      onSpeak(speech);
    }
  };

  const handleRunInAppAutomation = () => {
    setIsAutomating(true);
    setAutomationStep(1);

    setTimeout(() => {
      setAutomationStep(2);
      setTimeout(() => {
        setAutomationStep(3);
        setTimeout(() => {
          setAutomationStep(4);
          setIsAutomating(false);
          if (onSpeak) {
            onSpeak('অ্যাপের ভেতরে আপনার নির্দেশ অনুযায়ী স্বয়ংক্রিয়ভাবে মেসেজ টাইপ ও সেন্ড করা সম্পন্ন হয়েছে!');
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return (
    <div
      id="modal-screen-reader"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-md">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Accessibility Screen Reader & UI Agent</h3>
                <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                  OCR + ACCESSIBILITY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                স্ক্রিনের টেক্সট পাঠ ও ইন-অ্যাপ ইন্টারঅ্যাকশন অটোমেশন
              </p>
            </div>
          </div>

          <button
            id="btn-screen-reader-close"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 pt-3 bg-slate-900/50 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>স্ক্রিন টেক্সট (Read Screen)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nodes')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'nodes'
                ? 'border-indigo-400 text-indigo-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>UI এলিমেন্ট নোড ট্রি ({nodes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'automation'
                ? 'border-pink-400 text-pink-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>ইন-অ্যাপ অটোমেশন (In-App Action)</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>বর্তমান অ্যাক্টিভ স্ক্রিনে দৃশ্যমান টেক্সট:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReadAloud}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>পড়ে শোনাও (Read Aloud)</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-black/70 border border-slate-800 text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
                  {screenText}
                </div>
              </div>

              {/* Natural language summary box */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>জয়া এআই কনটেক্সট সামারি (AI Analysis):</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  ব্যবহারকারী বর্তমানে <strong>WhatsApp</strong> এ রহমান ভাইয়ের সাথে সক্রিয়ভাবে বার্তা বিনিময় করছেন। শেষ মেসেজে রহমান ভাই চা খাওয়ার আমন্ত্রণ জানিয়েছেন।
                </p>
              </div>
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Accessibility Node Tree (Android 15 View Hierarchy)</span>
                <span className="text-[10px] text-indigo-400 font-mono">Service: Enabled</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedNode?.id === node.id
                        ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {node.text || node.contentDescription || 'Unnamed Node'}
                        </span>
                        {node.clickable && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono">
                            CLICKABLE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {node.className}
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 text-right shrink-0">
                      [{node.bounds.x}, {node.bounds.y}]
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-pink-400" />
                    <span>অ্যাপের ভেতর স্বয়ংক্রিয় নির্দেশ পালন (In-App Action Runner):</span>
                  </div>
                  <button
                    type="button"
                    disabled={isAutomating}
                    onClick={handleRunInAppAutomation}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/25 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isAutomating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    <span>অটোমেশন শুরু করুন (Start Automation)</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    { step: 1, text: '১. চ্যাট ইনপুট বক্সে ফোকাস নেওয়া (Focus android.widget.EditText)' },
                    { step: 2, text: '২. ভয়েস অনুযায়ী টেক্সট টাইপ করা ("হ্যাঁ আসছি, ৫ মিনিট")' },
                    { step: 3, text: '৩. সেন্ড বাটনে স্বয়ংক্রিয় ট্যাপ (Click android.widget.ImageButton)' },
                    { step: 4, text: '৪. কাজ সফলভাবে সম্পন্ন হয়েছে ও ফলাফল প্রদর্শন' },
                  ].map((s) => {
                    const isDone = automationStep > s.step || (automationStep === 4 && s.step === 4);
                    const isCurrent = automationStep === s.step && isAutomating;

                    return (
                      <div
                        key={s.step}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isDone
                            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                            : isCurrent
                            ? 'bg-pink-950/70 border-pink-500 text-pink-200 animate-pulse'
                            : 'bg-slate-950 border-slate-850 text-slate-400'
                        }`}
                      >
                        <span>{s.text}</span>
                        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>অটোমেশন শুধুমাত্র ব্যবহারকারীর স্পষ্ট নির্দেশে ও অনুমোদনে চালিত হয়।</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
