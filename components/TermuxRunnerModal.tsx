import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShieldAlert,
  Copy,
  Trash2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Cpu,
  HelpCircle,
  X,
  Code2,
} from 'lucide-react';
import { TermuxExecutionRecord, CommandDangerLevel } from '../types';
import { androidDeviceManager } from '../services/androidDeviceManager';
import { termuxExecutionEngine } from '../services/termuxExecutionEngine';

interface TermuxRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCommand?: string;
  onSpeak?: (text: string) => void;
}

const QUICK_COMMANDS = [
  { cmd: 'termux-battery-status', label: 'Battery Status', labelBn: 'ব্যাটারি স্ট্যাটাস' },
  { cmd: 'termux-setup-storage', label: 'Setup Storage', labelBn: 'স্টোরেজ লিংক' },
  { cmd: 'uname -a', label: 'Kernel Info', labelBn: 'কার্নেল তথ্য' },
  { cmd: 'pkg update -y', label: 'Update Packages', labelBn: 'প্যাকেজ আপডেট' },
  { cmd: 'python -c "print(\'Hello from Android AI Agent!\')"', label: 'Python Test', labelBn: 'পাইথন টেস্ট' },
  { cmd: 'curl -s "wttr.in/Dhaka?format=3"', label: 'Weather (Dhaka)', labelBn: 'আবহাওয়া (ঢাকা)' },
  { cmd: 'termux-toast "Zoya Assistant Connected"', label: 'Show Toast', labelBn: 'টপ নোটিফিকেশন' },
  { cmd: 'whoami && pwd', label: 'User & Path', labelBn: 'ইউজার ও পাথ' },
];

export const TermuxRunnerModal: React.FC<TermuxRunnerModalProps> = ({
  isOpen,
  onClose,
  initialCommand = '',
  onSpeak,
}) => {
  const [command, setCommand] = useState<string>(initialCommand || 'termux-battery-status');
  const [history, setHistory] = useState<TermuxExecutionRecord[]>(() =>
    termuxExecutionEngine.getHistory()
  );
  const [activeRecord, setActiveRecord] = useState<TermuxExecutionRecord | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [termuxStatus, setTermuxStatus] = useState(termuxExecutionEngine.getStatus());
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialCommand) {
      setCommand(initialCommand);
    }
  }, [initialCommand]);

  useEffect(() => {
    setHistory(termuxExecutionEngine.getHistory());
    setTermuxStatus(termuxExecutionEngine.getStatus());
  }, [isOpen]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isExecuting]);

  if (!isOpen) return null;

  const safety = termuxExecutionEngine.evaluateCommandSafety(command);

  const handleRun = async () => {
    if (!command.trim()) return;

    if (safety.requiresConfirmation && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    setShowConfirmDialog(false);
    setIsExecuting(true);

    try {
      const record = await termuxExecutionEngine.executeCommand(command);
      setActiveRecord(record);
      setHistory(termuxExecutionEngine.getHistory());
      setIsExecuting(false);

      if (onSpeak) {
        if (record.status === 'blocked') {
          onSpeak(record.explanationBn || 'নিরাপত্তা কারণে কমান্ডটি ব্লক করা হয়েছে।');
        } else if (record.status === 'completed') {
          onSpeak(`টার্মাক্সে "${command}" কমান্ড সম্পন্ন হয়েছে। এক্সিট কোড ${record.exitCode}।`);
        } else if (record.status === 'timeout') {
          onSpeak('টার্মাক্স কমান্ডের সময়সীমা শেষ হয়েছে।');
        } else {
          onSpeak('টার্মাক্স কমান্ড সম্পন্ন করা যায়নি।');
        }
      }
    } catch (e: any) {
      setIsExecuting(false);
      setHistory(termuxExecutionEngine.getHistory());
    }
  };

  const handleCancel = () => {
    termuxExecutionEngine.cancelActiveCommand();
    setIsExecuting(false);
    setHistory(termuxExecutionEngine.getHistory());
    if (onSpeak) onSpeak('কমান্ড বাতিল করা হয়েছে।');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDangerBadge = (level: CommandDangerLevel) => {
    switch (level) {
      case 'destructive':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-[10px] font-bold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            উচ্চ ঝুঁকিপূর্ণ (Destructive)
          </span>
        );
      case 'privileged':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            প্রিভিলেজড (Privileged)
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/50 text-blue-300 text-[10px] font-semibold flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" />
            সাধারণ কমান্ড (Moderate)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            নিরাপদ কমান্ড (Safe)
          </span>
        );
    }
  };

  return (
    <div
      id="modal-termux-runner"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-950/50">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Termux Command Execution Engine</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                  LOCAL SECURE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ব্যবহারকারীর স্পষ্ট অনুমতি ছাড়া কোনো স্ক্রিপ্ট রান হবে না
              </p>
            </div>
          </div>

          <button
            id="btn-termux-close"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Command Chips */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>জনপ্রিয় কমান্ডসমূহ (Quick Termux APIs):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COMMANDS.map((qc) => (
                <button
                  key={qc.cmd}
                  type="button"
                  onClick={() => setCommand(qc.cmd)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                    command === qc.cmd
                      ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {qc.labelBn} <span className="text-[10px] text-slate-400 font-sans">({qc.cmd ? qc.cmd.split(' ')[0] : ''})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Command Input Box */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="termux-command-input" className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>টার্মিনাল কমান্ড লিখুন (Command String):</span>
              </label>
              {getDangerBadge(safety.dangerLevel)}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-emerald-400 font-mono text-xs font-bold select-none">
                $
              </span>
              <input
                id="termux-command-input"
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRun()}
                placeholder="e.g. termux-battery-status or pkg update"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/80 border border-slate-800 focus:border-emerald-500 text-emerald-300 font-mono text-xs focus:outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Explanation & Intent */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-white">কার্যকারিতা: </strong>
                {safety.explanationBn}
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{safety.explanation}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  androidDeviceManager.launchNativeAndroidApp({
                    packageName: 'com.termux',
                    name: 'Termux',
                    nameBn: 'টার্মাক্স',
                  });
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="সরাসরি ফোনে টার্মাক্স খুলুন"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Termux App</span>
              </button>

              <button
                id="btn-termux-execute"
                type="button"
                disabled={isExecuting || !command.trim()}
                onClick={handleRun}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>চলছে...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>কমান্ড চালান (Run Command)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dangerous Command Explicit Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs space-y-3 animate-bounce-subtle">
              <div className="flex items-center gap-2 font-bold text-red-300">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>সতর্কবার্তা: ঝুঁকিপূর্ণ কমান্ড অনুমোদন (Security Confirmation)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                আপনি <strong>"{command}"</strong> কমান্ড চালাতে যাচ্ছেন যা সিস্টেম ফাইল মুছতে বা পরিবর্তন করতে পারে। আপনি কি নিশ্চিত যে আপনি এটি রান করতে চান?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={handleRun}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30"
                >
                  হ্যাঁ, আমি নিশ্চিত (Confirm & Run)
                </button>
              </div>
            </div>
          )}

          {/* Live Terminal Output Console */}
          <div className="rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-inner font-mono text-xs">
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-1 text-slate-300 font-bold">Termux Local TTY Console</span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      androidDeviceManager.clearTermuxHistory();
                      setHistory([]);
                    }}
                    className="hover:text-red-400 transition-colors p-1"
                    title="ক্লিয়ার লগ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto space-y-4 text-emerald-400">
              {history.length === 0 ? (
                <div className="text-slate-500 text-center py-6">
                  $ কোনো কমান্ড এখনও রান করা হয়নি। উপরে একটি কমান্ড দিয়ে "Run Command" চাপুন।
                </div>
              ) : (
                history.map((rec) => (
                  <div key={rec.id} className="space-y-1.5 border-b border-slate-900 pb-3 last:border-0">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-pink-400 font-bold">$ {rec.command}</span>
                      <div className="flex items-center gap-2">
                        <span className={rec.exitCode === 0 ? 'text-emerald-400' : 'text-red-400'}>
                          Exit: {rec.exitCode} {rec.exitCode === 0 ? '✓' : '✗'}
                        </span>
                        {rec.durationMs && <span>{rec.durationMs}ms</span>}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(rec.stdout || rec.command, rec.id)}
                          className="hover:text-white transition-colors"
                          title="আউটপুট কপি করুন"
                        >
                          {copiedId === rec.id ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    {rec.stdout && (
                      <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                        {rec.stdout}
                      </pre>
                    )}
                    {rec.stderr && (
                      <pre className="text-red-400 whitespace-pre-wrap leading-relaxed text-[11px] bg-red-950/40 p-2.5 rounded-xl border border-red-900/50">
                        {rec.stderr}
                      </pre>
                    )}
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Architecture: <strong>aarch64 (ARM64)</strong></span>
          </div>
          <span>Security Protocol: <strong>Consent-Gated Intent/AIDL</strong></span>
        </div>
      </div>
    </div>
  );
};
