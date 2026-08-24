import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, ChatMessage, VoiceSettings, AssistantAction, VoiceEngine, AndroidAppId } from './types';
import { Header } from './components/Header';
import { DeviceStatusBar } from './components/DeviceStatusBar';
import { AndroidNavBar } from './components/AndroidNavBar';
import { AndroidAppDrawer } from './components/AndroidAppDrawer';
import { PermissionConsentModal } from './components/PermissionConsentModal';
import { AndroidAppModal } from './components/AndroidAppModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { AccessibilityOverlay } from './components/AccessibilityOverlay';
import { Visualizer } from './components/Visualizer';
import { MicButton } from './components/MicButton';
import { SubtitleOverlay } from './components/SubtitleOverlay';
import { QuickPrompts } from './components/QuickPrompts';
import { ChatDrawer } from './components/ChatDrawer';
import { SettingsModal } from './components/SettingsModal';
import { RoastModal } from './components/RoastModal';
import { TermuxRunnerModal } from './components/TermuxRunnerModal';
import { ScreenReaderModal } from './components/ScreenReaderModal';
import { FirstRunSetupModal } from './components/FirstRunSetupModal';
import { AndroidProjectExportModal } from './components/AndroidProjectExportModal';
import { audioService } from './services/audioService';
import { speechService } from './services/speechService';
import { liveVoiceService } from './services/liveService';
import { ActionParser } from './services/actionParser';
import { GeminiClient } from './services/geminiClient';
import { androidDeviceManager } from './services/androidDeviceManager';
import { powerManager } from './services/powerManager';
import { Send, Terminal, Scan, Sparkles } from 'lucide-react';

const INITIAL_SETTINGS: VoiceSettings = {
  voiceEngine: 'live',
  geminiLiveVoice: 'Aoede',
  language: 'bn-BD',
  autoSpeak: true,
  speechRate: 1.05,
  speechPitch: 1.15,
  preferredVoice: '',
  wakeWordEnabled: true,
  continuousListening: true,
  volume: 1.0,
  visualizerTheme: 'gemini_glow',
  autoOpenActions: true,
  requireExplicitApprovalForApps: false,
  accessibilityAgentEnabled: true,
  powerMode: 'auto',
  lowBatteryThreshold: 20,
};

export const App: React.FC = () => {
  const [state, setState] = useState<AssistantState>('idle');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [assistantText, setAssistantText] = useState<string>('');
  const [activeEmotion, setActiveEmotion] = useState<string>('sassy');
  const [activeAction, setActiveAction] = useState<AssistantAction | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [batteryState, setBatteryState] = useState(() => powerManager.getState());
  
  // Modals and Drawers
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRoastModalOpen, setIsRoastModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState<boolean>(false);
  const [isTermuxModalOpen, setIsTermuxModalOpen] = useState<boolean>(false);
  const [termuxInitialCommand, setTermuxInitialCommand] = useState<string>('');
  const [isScreenReaderModalOpen, setIsScreenReaderModalOpen] = useState<boolean>(false);
  const [isFirstRunSetupOpen, setIsFirstRunSetupOpen] = useState<boolean>(false);
  const [isProjectExportOpen, setIsProjectExportOpen] = useState<boolean>(false);
  
  // Android Specific Active Simulation
  const [activeAppWindow, setActiveAppWindow] = useState<AndroidAppId | null>(null);
  const [pendingConsentAction, setPendingConsentAction] = useState<AssistantAction | null>(null);
  const [isAccessibilityActive, setIsAccessibilityActive] = useState<boolean>(false);
  const [accessibilityTarget, setAccessibilityTarget] = useState<string>('');

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('zoya_settings');
      return saved ? { ...INITIAL_SETTINGS, ...JSON.parse(saved) } : INITIAL_SETTINGS;
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  });

  const [mainInputText, setMainInputText] = useState<string>('');

  const stateRef = useRef<AssistantState>('idle');
  stateRef.current = state;
  const settingsRef = useRef<VoiceSettings>(settings);
  settingsRef.current = settings;
  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;
  const pendingActionRef = useRef<AssistantAction | null>(pendingConsentAction);
  pendingActionRef.current = pendingConsentAction;

  // Persist settings & sync with services
  useEffect(() => {
    try {
      localStorage.setItem('zoya_settings', JSON.stringify(settings));
    } catch (e) {}
    liveVoiceService.setVoice(settings.geminiLiveVoice);
    if (settings.language) {
      speechService.setLanguage(settings.language);
    }
    if (settings.powerMode) {
      powerManager.setPowerMode(settings.powerMode);
    }
    if (settings.lowBatteryThreshold) {
      powerManager.setLowBatteryThreshold(settings.lowBatteryThreshold);
    }
  }, [settings]);

  // Subscribe to Battery & Power Manager updates
  useEffect(() => {
    const unsub = powerManager.subscribe((st) => {
      setBatteryState(st);
    });
    return unsub;
  }, []);

  // Initial Health Check & Bengali Greeting
  useEffect(() => {
    GeminiClient.checkHealth().then((res) => {
      setHasApiKey(res.hasApiKey);
    });

    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome',
      sender: 'zoya',
      text: 'হাই মুকতাদির! আমি জয়া (Zoya), তোমার লোকাল অ্যান্ড্রয়েড মোবাইল ও টার্মাক্স অটোমেশন এজেন্ট। মাইক্রোফোনে বলো—"Termux খোলো", "স্ক্রিনে যা আছে পড়ে শোনাও", বা "এই অ্যাপে কাজ করো"—স্পষ্ট অনুমতি পেলে তবেই কাজ করবো!',
      timestamp: Date.now(),
      emotion: 'flirty',
    };
    setMessages([welcomeMsg]);
    setAssistantText(welcomeMsg.text);
    setActiveEmotion('flirty');
  }, []);

  // Update mute state on live service
  useEffect(() => {
    liveVoiceService.setMuted(isMuted);
  }, [isMuted]);

  // Speak function for Standard voice mode
  const speakText = useCallback(
    (text: string) => {
      if (isMutedRef.current || !settingsRef.current.autoSpeak) return;

      if (settingsRef.current.voiceEngine === 'live') {
        if (liveVoiceService.getIsConnected()) {
          liveVoiceService.sendText(text);
          return;
        }
      }

      setState('speaking');
      audioService.setSpeakingVisualState(true);

      speechService.speak(text, {
        rate: settingsRef.current.speechRate,
        pitch: settingsRef.current.speechPitch,
        voiceName: settingsRef.current.preferredVoice,
        onEnd: () => {
          setState('idle');
          audioService.setSpeakingVisualState(false);
        },
        onError: () => {
          setState('idle');
          audioService.setSpeakingVisualState(false);
        },
      });
    },
    []
  );

  // Execute Approved Action
  const executeApprovedAction = useCallback((action: AssistantAction) => {
    setActiveAction(action);
    setPendingConsentAction(null);

    // Trigger visual accessibility pulse
    if (settingsRef.current.accessibilityAgentEnabled) {
      setAccessibilityTarget(action.titleBn || action.title);
      setIsAccessibilityActive(true);
      setTimeout(() => setIsAccessibilityActive(false), 2400);
    }

    if (action.type === 'termux_run') {
      if (action.payload?.command) {
        setTermuxInitialCommand(action.payload.command);
      }
      setIsTermuxModalOpen(true);
      return;
    }

    if (action.type === 'read_screen') {
      setIsScreenReaderModalOpen(true);
      return;
    }

    if (action.type === 'in_app_automate') {
      setIsScreenReaderModalOpen(true);
      return;
    }

    if (action.type === 'read_files' || action.targetApp === 'files') {
      setActiveAppWindow('files');
      return;
    }

    if (action.type === 'shizuku_exec' || action.targetApp === 'shizuku') {
      setIsFirstRunSetupOpen(true);
      return;
    }

    // Launch app window simulation or native intent
    if (action.targetApp) {
      if (action.targetApp === 'termux') {
        setIsTermuxModalOpen(true);
      } else {
        setActiveAppWindow(action.targetApp as AndroidAppId);
      }
      ActionParser.executeAction(action);
    }
  }, []);

  // Central Action Dispatcher with Permission Checks
  const dispatchAssistantAction = useCallback(
    (action: AssistantAction) => {
      setActiveAction(action);

      // Check permissions
      const permCheck = androidDeviceManager.checkActionPermission(action);

      if (!permCheck.allowed || action.requiresExplicitConsent) {
        setPendingConsentAction(action);
        const reason = permCheck.reasonBn || `${action.titleBn || action.title} চালানোর জন্য অনুমতি প্রয়োজন।`;
        setAssistantText(reason);
        speakText(reason);
        return;
      }

      // Execute Action Immediately
      executeApprovedAction(action);
    },
    [speakText, executeApprovedAction]
  );

  // User Grants Consent from Modal
  const handleConsentApprove = useCallback((alwaysAllow: boolean = false) => {
    if (!pendingConsentAction) return;

    const action = pendingConsentAction;
    setPendingConsentAction(null);

    if (action.requiresPermission && alwaysAllow) {
      androidDeviceManager.setPermissionGranted(action.requiresPermission, true);
    }

    executeApprovedAction(action);

    const approveMsg = `অনুমতি পাওয়া গেছে! ${action.titleBn || action.title} সম্পন্ন করছি।`;
    setAssistantText(approveMsg);
    speakText(approveMsg);
  }, [pendingConsentAction, executeApprovedAction, speakText]);

  // User Denies Consent
  const handleConsentDeny = useCallback(() => {
    if (!pendingConsentAction) return;
    const action = pendingConsentAction;
    setPendingConsentAction(null);

    androidDeviceManager.addAuditLog({
      actionTitle: action.title,
      targetApp: action.targetApp,
      permissionUsed: action.requiresPermission,
      status: 'denied',
      details: 'User explicitly denied permission in confirmation modal',
    });

    const denyMsg = `ঠিক আছে, অনুমতি না থাকায় "${action.titleBn || action.title}" কাজটি বাতিল করা হলো।`;
    setAssistantText(denyMsg);
    speakText(denyMsg);
  }, [pendingConsentAction, speakText]);

  // Setup Live Voice Service Event Handlers
  useEffect(() => {
    audioService.setExternalFrequencyProvider(() => {
      const { outputData, inputData } = liveVoiceService.getVisualizerData();
      let outSum = 0;
      for (let i = 0; i < 16; i++) outSum += outputData[i] || 0;
      if (outSum > 15) return outputData;

      let inSum = 0;
      for (let i = 0; i < 16; i++) inSum += inputData[i] || 0;
      if (inSum > 15) return inputData;

      return outputData;
    });

    liveVoiceService.callbacks = {
      onStateChange: (st) => {
        if (st === 'connecting') {
          setState('thinking');
        } else if (st === 'listening') {
          setIsLiveConnected(true);
          setState('listening');
        } else if (st === 'speaking') {
          setIsLiveConnected(true);
          setState('speaking');
        } else if (st === 'disconnected') {
          setIsLiveConnected(false);
          setState('idle');
        }
      },
      onInputTranscription: (text) => {
        setUserTranscript(text);
      },
      onOutputTranscription: (text) => {
        setAssistantText((prev) => (prev ? prev + ' ' + text : text));
      },
      onAction: (action) => {
        dispatchAssistantAction(action);
      },
      onError: (err) => {
        console.warn('Live voice event error:', err);
      },
      onTurnComplete: () => {
        setState('listening');
      },
    };

    return () => {
      liveVoiceService.disconnect();
    };
  }, [dispatchAssistantAction]);

  // Core NLP Query Processor
  const processQuery = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;

      // Handle direct voice consent responses
      if (pendingActionRef.current) {
        const lower = trimmed.toLowerCase();
        if (
          lower.includes('অনুমতি দিলাম') ||
          lower.includes('হ্যাঁ') ||
          lower.includes('allow') ||
          lower.includes('yes') ||
          lower.includes('করো') ||
          lower.includes('approve')
        ) {
          handleConsentApprove(false);
          return;
        }
        if (
          lower.includes('বাতিল') ||
          lower.includes('না') ||
          lower.includes('deny') ||
          lower.includes('cancel') ||
          lower.includes('no')
        ) {
          handleConsentDeny();
          return;
        }
      }

      // Add user message to state
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        sender: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setUserTranscript(trimmed);
      setState('thinking');

      // Check instant client-side keyword action routing
      const actionResult = ActionParser.parseCommand(trimmed);

      let replyText = '';
      let executedAction: AssistantAction | null = null;
      let chosenEmotion: any = 'sassy';

      if (actionResult.hasAction && actionResult.action) {
        executedAction = actionResult.action;
        replyText = actionResult.sassySpokenText;
        chosenEmotion = actionResult.emotion || 'witty';
        dispatchAssistantAction(executedAction);
      } else {
        // Fallback to Gemini 3.7 Flash Backend
        try {
          const response = await GeminiClient.sendMessage(trimmed, messages);
          replyText = response.reply;
          chosenEmotion = response.emotion || 'sassy';
          if (response.action) {
            executedAction = {
              id: `act_${Date.now()}`,
              type: response.action.type,
              title: response.action.title,
              titleBn: response.action.titleBn,
              targetApp: response.action.targetApp,
              requiresPermission: response.action.requiresPermission,
              requiresExplicitConsent: response.action.requiresExplicitConsent,
              url: response.action.url,
              payload: response.action.payload,
              executedAt: Date.now(),
            };
            dispatchAssistantAction(executedAction);
          }
        } catch (err) {
          replyText = 'আরেহ মুকতাদির! একটু নেটওয়ার্ক প্রবলেম হলো, আবার বলো তো!';
        }
      }

      // Update UI State with response
      setAssistantText(replyText);
      setActiveEmotion(chosenEmotion);

      // Add assistant message to log
      const zoyaMsg: ChatMessage = {
        id: `msg_${Date.now()}_z`,
        sender: 'zoya',
        text: replyText,
        timestamp: Date.now(),
        action: executedAction || undefined,
        emotion: chosenEmotion,
      };
      setMessages((prev) => [...prev, zoyaMsg]);

      // Speak the response aloud
      speakText(replyText);
    },
    [messages, speakText, pendingConsentAction, dispatchAssistantAction]
  );

  // Setup Standard Speech Recognition Listeners
  useEffect(() => {
    if (settings.voiceEngine !== 'standard') return;

    speechService.onTranscriptChange = (transcript: string, isFinal: boolean) => {
      setUserTranscript(transcript);
      if (isFinal) {
        processQuery(transcript);
      }
    };

    speechService.onWakeWordDetected = () => {
      if (stateRef.current === 'idle') {
        audioService.playWakeChime();
        setState('listening');
        setUserTranscript('');
        audioService.connectMicrophone();
      }
    };

    speechService.onSpeechStart = () => {
      if (stateRef.current !== 'speaking') {
        setState('listening');
      }
    };

    speechService.onSpeechEnd = () => {
      if (stateRef.current === 'listening') {
        setState('idle');
      }
    };

    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, [settings.voiceEngine, processQuery]);

  // Central Mic Button Click Handler
  const handleMicToggle = useCallback(async () => {
    audioService.init();

    // LIVE VOICE ENGINE MODE
    if (settings.voiceEngine === 'live') {
      if (liveVoiceService.getIsConnected()) {
        liveVoiceService.disconnect();
        audioService.playSleepSound();
        setState('idle');
        return;
      }

      audioService.playWakeChime();
      setUserTranscript('');
      setState('thinking');
      await liveVoiceService.connect();
      return;
    }

    // STANDARD VOICE ENGINE MODE
    if (state === 'speaking') {
      speechService.stopSpeaking();
      audioService.setSpeakingVisualState(false);
      setState('idle');
      return;
    }

    if (state === 'listening') {
      speechService.stopListening();
      audioService.playSleepSound();
      setState('idle');
      return;
    }

    audioService.playWakeChime();
    setUserTranscript('');
    setState('listening');
    await audioService.connectMicrophone();
    speechService.startListening(settings.continuousListening);
  }, [state, settings.voiceEngine, settings.continuousListening]);

  // Toggle Voice Engine
  const handleToggleVoiceEngine = () => {
    const nextEngine: VoiceEngine = settings.voiceEngine === 'live' ? 'standard' : 'live';
    if (settings.voiceEngine === 'live') {
      liveVoiceService.disconnect();
    } else {
      speechService.stopListening();
      speechService.stopSpeaking();
    }
    setSettings((prev) => ({ ...prev, voiceEngine: nextEngine }));
  };

  // Manual Trigger for Quick Prompts
  const handleSelectPrompt = (promptText: string) => {
    audioService.init();
    audioService.playWakeChime();
    processQuery(promptText);
  };

  // Replay Audio for chat message
  const handleReplayAudio = (text: string) => {
    audioService.init();
    speakText(text);
  };

  // Open App Directly from Drawer
  const handleOpenAppDirectly = (appId: AndroidAppId) => {
    if (appId === 'termux') {
      setIsTermuxModalOpen(true);
      return;
    }
    if (appId === 'shizuku') {
      setIsFirstRunSetupOpen(true);
      return;
    }

    const targetAction: AssistantAction = {
      id: `manual_${Date.now()}`,
      type: 'open_app',
      title: `Open ${appId}`,
      titleBn: `${appId.toUpperCase()} অ্যাপ খোলা`,
      targetApp: appId,
      requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
      requiresExplicitConsent: false,
      executedAt: Date.now(),
    };
    dispatchAssistantAction(targetAction);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Android Device Status Bar */}
      <DeviceStatusBar
        state={state}
        isLiveConnected={isLiveConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Header */}
      <Header
        state={state}
        voiceEngine={settings.voiceEngine}
        onToggleVoiceEngine={handleToggleVoiceEngine}
        isLiveConnected={isLiveConnected}
        isAppDrawerOpen={isAppDrawerOpen}
        onToggleAppDrawer={() => setIsAppDrawerOpen(!isAppDrawerOpen)}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRoastCreator={() => setIsRoastModalOpen(true)}
        onOpenTermux={() => setIsTermuxModalOpen(true)}
        onOpenScreenReader={() => setIsScreenReaderModalOpen(true)}
        onOpenFirstRunSetup={() => setIsFirstRunSetupOpen(true)}
        onOpenProjectExport={() => setIsProjectExportOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        unreadCount={messages.length}
      />

      {/* Center Main Stage with Audio Visualizer & Android Apps */}
      <main className="relative flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-between px-3 sm:px-4 py-2 z-10 overflow-hidden">
        {/* Top: Subtitles & Action Notification */}
        <div className="w-full flex justify-center pt-1">
          <SubtitleOverlay
            userTranscript={userTranscript}
            assistantText={assistantText}
            isListening={state === 'listening'}
            isSpeaking={state === 'speaking'}
            emotion={activeEmotion}
            activeAction={activeAction}
            onExecuteAction={(act) => dispatchAssistantAction(act)}
          />
        </div>

        {/* Center: Glowing Siri / Gemini Visualizer Canvas or Android App Drawer */}
        {isAppDrawerOpen ? (
          <div className="w-full max-w-xl my-auto animate-fadeIn">
            <AndroidAppDrawer
              onOpenApp={handleOpenAppDirectly}
              onQuickAction={(q) => processQuery(q)}
            />
          </div>
        ) : (
          <div className="relative w-full max-w-lg h-44 sm:h-64 flex flex-col items-center justify-center my-auto">
            <Visualizer
              state={state}
              theme={settings.visualizerTheme}
              isPowerSaving={batteryState.isPowerSavingActive}
            />

            {/* Power Saving Active Reassurance Indicator */}
            {batteryState.isPowerSavingActive && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="absolute bottom-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-amber-500/40 text-[10px] text-amber-300 shadow-lg shadow-black/40 hover:bg-slate-800 transition-colors pointer-events-auto cursor-pointer animate-fadeIn"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-medium">Intelligent Power Mode (22 FPS • Voice Wake 100% Active)</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Section: Text Command Input, Central Mic Button & Quick Prompts */}
        <div className="w-full flex flex-col items-center gap-2.5 pb-2">
          {/* Quick Natural Language Text Input Box */}
          <div className="w-full max-w-md flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500 shadow-lg">
            <input
              id="main-natural-input"
              type="text"
              value={mainInputText}
              onChange={(e) => setMainInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mainInputText.trim()) {
                  processQuery(mainInputText);
                  setMainInputText('');
                }
              }}
              placeholder="মুখে বলুন বা লিখুন: 'Termux খোলো', 'স্ক্রিন পড়ো'..."
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              id="btn-send-main-input"
              type="button"
              disabled={!mainInputText.trim()}
              onClick={() => {
                if (mainInputText.trim()) {
                  processQuery(mainInputText);
                  setMainInputText('');
                }
              }}
              className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <MicButton
            state={state}
            voiceEngine={settings.voiceEngine}
            isLiveConnected={isLiveConnected}
            onClick={handleMicToggle}
          />

          <QuickPrompts onSelectPrompt={handleSelectPrompt} disabled={state === 'thinking'} />
        </div>
      </main>

      {/* Android 3-Button Navigation Bar */}
      <AndroidNavBar
        onBack={() => {
          if (activeAppWindow) setActiveAppWindow(null);
          else if (isAppDrawerOpen) setIsAppDrawerOpen(false);
          else if (isChatOpen) setIsChatOpen(false);
        }}
        onHome={() => {
          setActiveAppWindow(null);
          setIsAppDrawerOpen(false);
          setIsChatOpen(false);
        }}
        onRecents={() => setIsAppDrawerOpen(true)}
      />

      {/* Accessibility Simulation Overlay */}
      <AccessibilityOverlay targetTitle={accessibilityTarget} isActive={isAccessibilityActive} />

      {/* Permission Consent Modal (অনুমতি চাওয়া) */}
      <PermissionConsentModal
        isOpen={!!pendingConsentAction}
        action={pendingConsentAction}
        permission={
          pendingConsentAction?.requiresPermission
            ? androidDeviceManager.getPermission(pendingConsentAction.requiresPermission)
            : null
        }
        onApprove={handleConsentApprove}
        onDeny={handleConsentDeny}
      />

      {/* Termux Terminal Runner Modal */}
      <TermuxRunnerModal
        isOpen={isTermuxModalOpen}
        initialCommand={termuxInitialCommand}
        onClose={() => setIsTermuxModalOpen(false)}
        onSpeak={(t) => {
          setAssistantText(t);
          speakText(t);
        }}
      />

      {/* Accessibility Screen Reader Modal */}
      <ScreenReaderModal
        isOpen={isScreenReaderModalOpen}
        onClose={() => setIsScreenReaderModalOpen(false)}
        onSpeak={(t) => {
          setAssistantText(t);
          speakText(t);
        }}
      />

      {/* First-Run Setup & Permissions Center Modal */}
      <FirstRunSetupModal
        isOpen={isFirstRunSetupOpen}
        onClose={() => setIsFirstRunSetupOpen(false)}
        onSpeak={(t) => {
          setAssistantText(t);
          speakText(t);
        }}
      />

      {/* Android Project Source Code & Build Instructions Modal */}
      <AndroidProjectExportModal
        isOpen={isProjectExportOpen}
        onClose={() => setIsProjectExportOpen(false)}
      />

      {/* Android App Modal (Simulated App Windows) */}
      <AndroidAppModal
        isOpen={!!activeAppWindow}
        appId={activeAppWindow}
        actionPayload={activeAction?.payload}
        onReadAloud={(text) => {
          setAssistantText(text);
          speakText(text);
        }}
        onClose={() => setActiveAppWindow(null)}
      />

      {/* Security Audit Trail Modal */}
      <SecurityAuditModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />

      {/* Slide-out Chat History Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={processQuery}
        onClearHistory={() => setMessages([])}
        onReplayAudio={handleReplayAudio}
        onExecuteAction={(act) => dispatchAssistantAction(act)}
        disabled={state === 'thinking'}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        hasApiKey={hasApiKey}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
      />

      {/* Roast Muktadir Modal */}
      <RoastModal
        isOpen={isRoastModalOpen}
        onClose={() => setIsRoastModalOpen(false)}
        onSpeakRoast={(roast) => {
          setAssistantText(roast);
          setActiveEmotion('roasting');
          if (settings.voiceEngine === 'live' && liveVoiceService.getIsConnected()) {
            liveVoiceService.sendText(`মুকতাদিরকে রোস্ট করো: ${roast}`);
          } else {
            speakText(roast);
          }
        }}
      />
    </div>
  );
};

export default App;
