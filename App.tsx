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
import { audioService } from './services/audioService';
import { speechService } from './services/speechService';
import { liveVoiceService } from './services/liveService';
import { ActionParser } from './services/actionParser';
import { GeminiClient } from './services/geminiClient';
import { androidDeviceManager } from './services/androidDeviceManager';

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
  requireExplicitApprovalForApps: true,
  accessibilityAgentEnabled: true,
};

export const App: React.FC = () => {
  const [state, setState] = useState<AssistantState>('idle');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [assistantText, setAssistantText] = useState<string>('');
  const [activeEmotion, setActiveEmotion] = useState<string>('sassy');
  const [activeAction, setActiveAction] = useState<AssistantAction | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Modals and Drawers
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRoastModalOpen, setIsRoastModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState<boolean>(false);
  
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

  const stateRef = useRef<AssistantState>('idle');
  stateRef.current = state;
  const settingsRef = useRef<VoiceSettings>(settings);
  settingsRef.current = settings;
  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;
  const pendingActionRef = useRef<AssistantAction | null>(pendingConsentAction);
  pendingActionRef.current = pendingConsentAction;

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('zoya_settings', JSON.stringify(settings));
    } catch (e) {}
    liveVoiceService.setVoice(settings.geminiLiveVoice);
    if (settings.language) {
      speechService.setLanguage(settings.language);
    }
  }, [settings]);

  // Initial Health Check & Bengali Greeting
  useEffect(() => {
    GeminiClient.checkHealth().then((res) => {
      setHasApiKey(res.hasApiKey);
    });

    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome',
      sender: 'zoya',
      text: 'হাই মুকতাদির! আমি জয়া (Zoya), তোমার পার্সোনাল অ্যান্ড্রয়েড মোবাইল এজেন্ট। মাইক্রোফোন চাপো বা বলো—তুমি অনুমতি দিলে আমি যেকোনো অ্যাপ খুলবো আর কাজ করে দেবো!',
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
  const speakText = useCallback((text: string, onFinish?: () => void) => {
    if (isMutedRef.current || !settingsRef.current.autoSpeak) {
      if (onFinish) onFinish();
      return;
    }

    setState('speaking');
    audioService.setSpeakingVisualState(true);

    speechService.speak(text, {
      rate: settingsRef.current.speechRate,
      pitch: settingsRef.current.speechPitch,
      preferredVoice: settingsRef.current.preferredVoice,
      onStart: () => {
        setState('speaking');
        audioService.setSpeakingVisualState(true);
      },
      onEnd: () => {
        audioService.setSpeakingVisualState(false);
        setState('idle');
        if (onFinish) onFinish();
        if (settingsRef.current.continuousListening) {
          setTimeout(() => {
            if (stateRef.current === 'idle') {
              speechService.startListening(true);
            }
          }, 400);
        }
      },
      onError: () => {
        audioService.setSpeakingVisualState(false);
        setState('idle');
        if (onFinish) onFinish();
      },
    });
  }, []);

  // Action Dispatcher with Android Permission & Consent Checks
  const dispatchAssistantAction = useCallback(
    (action: AssistantAction) => {
      setActiveAction(action);

      // Check permission
      const check = androidDeviceManager.checkActionPermission(action);

      if (!check.permitted) {
        // Needs explicit user permission modal
        setPendingConsentAction(action);
        audioService.playWakeChime();
        return;
      }

      // If user enabled mandatory confirmation in settings for sensitive apps
      if (
        settingsRef.current.requireExplicitApprovalForApps &&
        (action.requiresExplicitConsent || action.requiresPermission)
      ) {
        setPendingConsentAction(action);
        audioService.playWakeChime();
        return;
      }

      // Allowed directly: execute action
      executeApprovedAction(action);
    },
    []
  );

  // Execute Approved Action
  const executeApprovedAction = (action: AssistantAction) => {
    audioService.playActionCompleteSound();

    // Trigger Accessibility visual animation if enabled
    if (settingsRef.current.accessibilityAgentEnabled) {
      setAccessibilityTarget(action.titleBn || action.title);
      setIsAccessibilityActive(true);
      setTimeout(() => setIsAccessibilityActive(false), 2400);
    }

    // Open simulated Android App if relevant
    if (action.targetApp) {
      setActiveAppWindow(action.targetApp);
      setIsAppDrawerOpen(false);
    }

    // External web fallback if requested
    if (settingsRef.current.autoOpenActions && action.url) {
      ActionParser.executeAction(action);
    }

    androidDeviceManager.addAuditLog({
      actionTitle: action.titleBn || action.title,
      targetApp: action.targetApp,
      permissionUsed: action.requiresPermission,
      status: 'allowed',
      details: action.payload?.message || action.payload?.query || 'Action executed with consent.',
    });
  };

  // Handle Consent Modal Approval
  const handleConsentApprove = (alwaysAllow: boolean = false) => {
    if (!pendingConsentAction) return;
    const action = pendingConsentAction;
    setPendingConsentAction(null);

    if (action.requiresPermission && alwaysAllow) {
      androidDeviceManager.setPermissionGranted(action.requiresPermission, true);
    }

    executeApprovedAction(action);

    const confText = `অনুমতি দেওয়া হয়েছে: ${action.titleBn || action.title} কাজ শুরু করছি!`;
    setAssistantText(confText);
    if (settings.voiceEngine === 'standard') {
      speakText(confText);
    }
  };

  // Handle Consent Modal Denial
  const handleConsentDeny = () => {
    if (!pendingConsentAction) return;
    const action = pendingConsentAction;
    setPendingConsentAction(null);

    androidDeviceManager.addAuditLog({
      actionTitle: action.titleBn || action.title,
      targetApp: action.targetApp,
      permissionUsed: action.requiresPermission,
      status: 'denied',
      details: 'User declined action permission request.',
    });

    const deniedText = 'ঠিক আছে মুকতাদির, তোমার অনুমতি ছাড়া আমি কোনো কাজ করব না!';
    setAssistantText(deniedText);
    if (settings.voiceEngine === 'standard') {
      speakText(deniedText);
    }
  };

  // Setup Gemini Live Service Event Handlers
  useEffect(() => {
    liveVoiceService.onStateChange = (liveState) => {
      if (liveState === 'disconnected') {
        setIsLiveConnected(false);
        setState('idle');
        audioService.setSpeakingVisualState(false);
      } else if (liveState === 'connecting') {
        setState('thinking');
      } else if (liveState === 'connected') {
        setIsLiveConnected(true);
        setState('listening');
      } else if (liveState === 'listening') {
        setState('listening');
        audioService.setSpeakingVisualState(false);
      } else if (liveState === 'speaking') {
        setState('speaking');
        audioService.setSpeakingVisualState(true);
      }
    };

    liveVoiceService.onInputTranscription = (text) => {
      setUserTranscript(text);

      // Check if user is voice-approving/denying pending permission request
      if (pendingActionRef.current) {
        if (speechService.isVoiceConsentApproval(text)) {
          handleConsentApprove(false);
          return;
        }
        if (speechService.isVoiceConsentDenial(text)) {
          handleConsentDeny();
          return;
        }
      }
    };

    liveVoiceService.onOutputTranscription = (text) => {
      setAssistantText(text);
      setActiveEmotion('sassy');
    };

    liveVoiceService.onAction = (action) => {
      dispatchAssistantAction(action);
      setMessages((prev) => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          sender: 'zoya',
          text: `অ্যান্ড্রয়েড অ্যাকশন: ${action.titleBn || action.title}`,
          timestamp: Date.now(),
          action,
          emotion: 'witty',
        },
      ]);
    };

    liveVoiceService.onTurnComplete = () => {
      if (assistantText) {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.text === assistantText) return prev;
          return [
            ...prev,
            {
              id: `msg_${Date.now()}_z`,
              sender: 'zoya',
              text: assistantText,
              timestamp: Date.now(),
              emotion: 'sassy',
            },
          ];
        });
      }
    };

    liveVoiceService.onError = (err) => {
      console.warn('Live voice notice:', err);
    };

    return () => {
      liveVoiceService.disconnect();
    };
  }, [assistantText, dispatchAssistantAction]);

  // Core Command Processing Pipeline for Standard mode / Chat drawer
  const processQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;

      const trimmed = queryText.trim();
      setUserTranscript(trimmed);

      // Check voice consent if modal is active
      if (pendingConsentAction) {
        if (speechService.isVoiceConsentApproval(trimmed)) {
          handleConsentApprove(false);
          return;
        }
        if (speechService.isVoiceConsentDenial(trimmed)) {
          handleConsentDeny();
          return;
        }
      }

      // If in Live mode and connected, send directly to Live API session
      if (settingsRef.current.voiceEngine === 'live' && liveVoiceService.getIsConnected()) {
        liveVoiceService.sendText(trimmed);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_u`,
            sender: 'user',
            text: trimmed,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      setState('thinking');
      speechService.stopListening();

      // 1. Add user message to log
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        sender: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // 2. Check for instant client-side keyword action routing
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
        // 3. Fallback to Gemini 3.7 Flash Backend
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

      // 4. Update UI State with response
      setAssistantText(replyText);
      setActiveEmotion(chosenEmotion);

      // 5. Add assistant message to log
      const zoyaMsg: ChatMessage = {
        id: `msg_${Date.now()}_z`,
        sender: 'zoya',
        text: replyText,
        timestamp: Date.now(),
        action: executedAction || undefined,
        emotion: chosenEmotion,
      };
      setMessages((prev) => [...prev, zoyaMsg]);

      // 6. Speak the response aloud
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
    const targetAction: AssistantAction = {
      id: `manual_${Date.now()}`,
      type: 'open_app',
      title: `Open ${appId}`,
      titleBn: `${appId.toUpperCase()} অ্যাপ খোলা`,
      targetApp: appId,
      requiresPermission: 'PACKAGE_USAGE_STATS',
      requiresExplicitConsent: true,
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
      <DeviceStatusBar state={state} isLiveConnected={isLiveConnected} />

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
          <div className="relative w-full max-w-lg h-52 sm:h-72 flex items-center justify-center my-auto">
            <Visualizer state={state} theme={settings.visualizerTheme} />
          </div>
        )}

        {/* Bottom Section: Central Mic Button & Quick Prompts */}
        <div className="w-full flex flex-col items-center gap-3 pb-2">
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
