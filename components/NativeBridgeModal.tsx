import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Cpu,
  Layers,
  Activity,
  Play,
  Square,
  Pause,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Radio,
  Sliders,
  Terminal,
  ExternalLink,
  CheckCircle2,
  XCircle,
  X,
  Volume2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  AccessibilityBridgeStatus,
  ForegroundServiceStatus,
  IntentDispatchResult,
  NativeBridgeInfo,
} from '../types';
import { nativeAndroidBridge } from '../services/nativeAndroidBridge';
import { foregroundServiceManager } from '../services/foregroundServiceManager';
import { accessibilityBridge } from '../services/accessibilityBridge';
import { androidDeviceManager } from '../services/androidDeviceManager';

interface NativeBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NativeBridgeModal: React.FC<NativeBridgeModalProps> = ({ isOpen, onClose }) => {
  const [bridgeInfo, setBridgeInfo] = useState<NativeBridgeInfo>(() => nativeAndroidBridge.getBridgeInfo());
  const [fgsStatus, setFgsStatus] = useState<ForegroundServiceStatus>(() => foregroundServiceManager.getStatus());
  const [accStatus, setAccStatus] = useState<AccessibilityBridgeStatus>(() => accessibilityBridge.getStatus());
  const [activeTab, setActiveTab] = useState<'overview' | 'foreground_service' | 'accessibility' | 'intent_dispatcher'>('overview');
  const [intentHistory, setIntentHistory] = useState<IntentDispatchResult[]>([]);
  const [testPackageName, setTestPackageName] = useState<string>('com.whatsapp');

  useEffect(() => {
    if (!isOpen) return;

    setBridgeInfo(nativeAndroidBridge.getBridgeInfo());
    setFgsStatus(foregroundServiceManager.getStatus());
    setAccStatus(accessibilityBridge.refreshStatus());

    const unsubFgs = foregroundServiceManager.subscribe((st) => setFgsStatus(st));
    const unsubAcc = accessibilityBridge.subscribe((st) => setAccStatus(st));
    const unsubIntent = nativeAndroidBridge.onIntentResult((res) => {
      setIntentHistory((prev) => [res, ...prev.slice(0, 19)]);
    });

    return () => {
      unsubFgs();
      unsubAcc();
      unsubIntent();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartFgs = async () => {
    await foregroundServiceManager.startService('microphone');
  };

  const handleStopFgs = async () => {
    await foregroundServiceManager.stopService();
  };

  const handlePauseFgs = () => {
    foregroundServiceManager.pauseListening();
  };

  const handleResumeFgs = () => {
    foregroundServiceManager.resumeListening();
  };

  const handleTestSystemSetting = async (action: string) => {
    await nativeAndroidBridge.launchSystemSettings(action);
  };

  const handleTestAppLaunch = async (pkg: string) => {
    await nativeAndroidBridge.launchAppIntent(pkg);
  };

  const handleOpenAccessibilitySettings = async () => {
    await accessibilityBridge.openAccessibilitySettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Native Android Bridge & Service Control</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  API {bridgeInfo.androidApiLevel} (Android 15)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modern Android 14/15 Architecture: Foreground Service, Intent Bridge, and Accessibility Foundation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Bridge Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('foreground_service')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'foreground_service'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Foreground Service</span>
            {fgsStatus.state === 'running' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'accessibility'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Accessibility Layer</span>
          </button>
          <button
            onClick={() => setActiveTab('intent_dispatcher')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'intent_dispatcher'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Intent Dispatcher</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Bridge Runtime:</span>
                    <span className="font-mono text-cyan-300 font-medium capitalize">
                      {bridgeInfo.platform.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target SDK:</span>
                    <span className="font-mono text-emerald-400">API 35 (Android 15)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Interface:</span>
                    <span className="font-mono text-purple-300">{bridgeInfo.bridgeName}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Foreground Service:</span>
                    <span
                      className={`font-semibold uppercase ${
                        fgsStatus.state === 'running'
                          ? 'text-emerald-400'
                          : fgsStatus.state === 'paused'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {fgsStatus.state}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Accessibility Status:</span>
                    <span
                      className={`font-semibold ${
                        accStatus.isEnabledInSettings ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {accStatus.isEnabledInSettings ? 'Enabled' : 'Action Required'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Audio Focus Held:</span>
                    <span className="font-mono text-cyan-300">
                      {fgsStatus.audioFocusHeld ? 'YES (TRANSIENT)' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Architecture Pipeline Banner */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>7-Stage Native Action Gateway Pipeline</span>
                </div>
                <div className="font-mono text-[11px] text-cyan-200/90 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-cyan-900/40">
                  User Request → Intent Understanding → Action Validation → Permission Check → Risk Classification → User Confirmation (if High Risk) → Native Android Action → Verify Result → Zoya Spoken Response
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FOREGROUND SERVICE */}
          {activeTab === 'foreground_service' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200 text-sm">Foreground Service Controller</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-semibold ${
                      fgsStatus.state === 'running'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : fgsStatus.state === 'paused'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    STATUS: {fgsStatus.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div>Type: <span className="text-cyan-300">{fgsStatus.serviceType} (Android 14+)</span></div>
                  <div>Channel ID: <span className="text-slate-300">{fgsStatus.channelId}</span></div>
                  <div>Audio Focus: <span className="text-emerald-400">{fgsStatus.audioFocusHeld ? 'EXCLUSIVE_TRANSIENT' : 'NONE'}</span></div>
                  <div>WakeLock: <span className="text-purple-300">{fgsStatus.wakeLockActive ? 'HELD (PARTIAL)' : 'RELEASED'}</span></div>
                </div>

                {/* Notification Preview */}
                <div className="p-3 rounded-lg bg-black/60 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-200 text-xs">{fgsStatus.notificationTitle}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{fgsStatus.notificationContent}</div>
                  </div>
                </div>

                {/* Service Control Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleStartFgs}
                    disabled={fgsStatus.state === 'running'}
                    className="flex-1 py-2 px-3 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Service</span>
                  </button>
                  <button
                    onClick={fgsStatus.state === 'paused' ? handleResumeFgs : handlePauseFgs}
                    disabled={fgsStatus.state === 'stopped'}
                    className="py-2 px-3 rounded-lg font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:pointer-events-none text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>{fgsStatus.state === 'paused' ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={handleStopFgs}
                    disabled={fgsStatus.state === 'stopped'}
                    className="py-2 px-3 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Service</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCESSIBILITY LAYER */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-slate-200 text-sm">Accessibility Service Foundation</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-semibold ${
                      accStatus.isEnabledInSettings
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {accStatus.isEnabledInSettings ? 'CONNECTED' : 'DISABLED'}
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  Zoya's native accessibility service reads on-screen text and performs UI interactions strictly when requested by the user. Android system permissions can be enabled in Accessibility settings.
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div>Window Content: <span className="text-emerald-400">ENABLED</span></div>
                  <div>Gesture Injection: <span className="text-emerald-400">ENABLED</span></div>
                  <div>Feedback Type: <span className="text-cyan-300">GENERIC | SPOKEN</span></div>
                  <div>Service Name: <span className="text-slate-300">ZoyaAccessibilityService</span></div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleOpenAccessibilitySettings}
                    className="w-full py-2.5 px-4 rounded-xl font-medium bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Android Accessibility Settings (অ্যাক্সেসিবিলিটি সেটিংস)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTENT DISPATCHER */}
          {activeTab === 'intent_dispatcher' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-slate-200 text-sm">Test Native Intent Dispatcher</span>
                </div>

                {/* Quick Test Triggers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleTestSystemSetting('android.settings.WIFI_SETTINGS')}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors flex items-center justify-between"
                  >
                    <span>Wi-Fi Settings</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleTestSystemSetting('android.settings.BATTERY_SAVER_SETTINGS')}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors flex items-center justify-between"
                  >
                    <span>Battery Saver</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleTestSystemSetting('android.settings.BLUETOOTH_SETTINGS')}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors flex items-center justify-between"
                  >
                    <span>Bluetooth</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleTestAppLaunch('com.termux')}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors flex items-center justify-between"
                  >
                    <span>Launch Termux</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleTestAppLaunch('com.whatsapp')}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors flex items-center justify-between"
                  >
                    <span>Launch WhatsApp</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleTestAppLaunch('com.android.chrome')}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors flex items-center justify-between"
                  >
                    <span>Launch Chrome</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Intent Logs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Live Intent Dispatch Logs ({intentHistory.length})</span>
                  {intentHistory.length > 0 && (
                    <button
                      onClick={() => setIntentHistory([])}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {intentHistory.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 font-mono text-[11px] bg-slate-950/40 rounded-xl border border-slate-800">
                    No intents dispatched in this session yet. Trigger any action above or speak a command!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {intentHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-slate-300 font-medium">{item.action}</span>
                          {item.targetPackage && (
                            <span className="text-slate-500 text-[10px]">({item.targetPackage})</span>
                          )}
                        </div>
                        <span className="text-emerald-400 text-[10px]">VERIFIED</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strict Android 14/15 Background & Microphone Execution Compliance</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
