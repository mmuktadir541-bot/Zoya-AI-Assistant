export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type VisualizerTheme = 'gemini_glow' | 'cyber_neon' | 'siri_wave' | 'aurora_bliss';

export type VoiceEngine = 'live' | 'standard';

export type AndroidPermissionType =
  | 'RECORD_AUDIO'
  | 'BIND_ACCESSIBILITY_SERVICE'
  | 'TERMUX_RUN_COMMAND'
  | 'SHIZUKU_PERMISSION'
  | 'SYSTEM_ALERT_WINDOW'
  | 'MANAGE_EXTERNAL_STORAGE'
  | 'READ_CONTACTS'
  | 'ACCESS_FINE_LOCATION'
  | 'POST_NOTIFICATIONS'
  | 'CALL_PHONE'
  | 'SEND_SMS';

export interface AndroidPermissionState {
  id: AndroidPermissionType;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  granted: boolean;
  sensitive: boolean;
  requiredFor: string[];
}

export type KnownAndroidAppId =
  | 'termux'
  | 'shizuku'
  | 'whatsapp'
  | 'chrome'
  | 'youtube'
  | 'gmail'
  | 'maps'
  | 'files'
  | 'phone'
  | 'messages'
  | 'settings'
  | 'camera'
  | 'spotify'
  | 'notes'
  | 'facebook'
  | 'messenger'
  | 'bkash'
  | 'nagad'
  | 'instagram'
  | 'tiktok'
  | 'telegram'
  | 'calculator'
  | 'calendar'
  | 'clock'
  | 'playstore'
  | 'twitter'
  | 'netflix'
  | 'daraz'
  | 'foodpanda'
  | 'pathao'
  | 'uber'
  | 'photos'
  | 'drive'
  | 'chatgpt';

export type AndroidAppId = KnownAndroidAppId | (string & {});

export interface AndroidApp {
  id: AndroidAppId;
  name: string;
  nameBn: string;
  icon: string;
  category: 'communication' | 'media' | 'system' | 'utility' | 'tools' | 'finance' | 'social';
  color: string;
  packageName: string;
  intentUri?: string;
  deepLink?: string;
  webFallback?: string;
  requiredPermissions: AndroidPermissionType[];
  descriptionBn: string;
}

export type WorkType =
  | 'A_APP_CONTROL'
  | 'B_INFO_SEARCH'
  | 'C_IN_APP_AUTOMATION'
  | 'D_TERMUX_COMMAND'
  | 'E_FILE_MANAGEMENT'
  | 'F_SCREEN_READER'
  | 'G_SHIZUKU_PRIVILEGED';

export type CommandDangerLevel = 'safe' | 'moderate' | 'privileged' | 'destructive';

export interface TermuxExecutionRecord {
  id: string;
  command: string;
  explanation: string;
  explanationBn: string;
  dangerLevel: CommandDangerLevel;
  requiresConfirmation: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  status: 'pending' | 'approved' | 'running' | 'completed' | 'rejected' | 'failed';
  executedAt: number;
  durationMs?: number;
}

export interface ScreenNode {
  id: string;
  text: string;
  contentDescription?: string;
  className: string;
  clickable: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  focused?: boolean;
}

export interface AssistantAction {
  id: string;
  type:
    | 'open_url'
    | 'open_app'
    | 'close_app'
    | 'termux_run'
    | 'read_screen'
    | 'in_app_automate'
    | 'shizuku_exec'
    | 'youtube'
    | 'spotify'
    | 'whatsapp'
    | 'gmail'
    | 'messages'
    | 'maps'
    | 'phone_call'
    | 'read_files'
    | 'search_info'
    | 'google'
    | 'device_control'
    | 'device_setting'
    | 'roast'
    | 'system';
  workType?: WorkType;
  title: string;
  titleBn?: string;
  url?: string;
  targetApp?: AndroidAppId;
  packageName?: string;
  intentUri?: string;
  deepLink?: string;
  requiresPermission?: AndroidPermissionType;
  requiresExplicitConsent?: boolean;
  isConfirmed?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'executed';
  payload?: {
    command?: string;
    commandExplanation?: string;
    commandExplanationBn?: string;
    dangerLevel?: CommandDangerLevel;
    screenSummary?: string;
    automationSteps?: Array<{ step: number; action: string; targetText?: string; delayMs?: number }>;
    query?: string;
    phone?: string;
    message?: string;
    subject?: string;
    recipientEmail?: string;
    contactName?: string;
    destination?: string;
    origin?: string;
    domain?: string;
    appName?: string;
    appId?: AndroidAppId;
    packageName?: string;
    intentUri?: string;
    deepLink?: string;
    path?: string;
    fileType?: string;
    infoSummary?: string;
    settingKey?: string;
    settingValue?: any;
  };
  executedAt: number;
}

export interface ConsentRequest {
  action: AssistantAction;
  permission?: AndroidPermissionState;
  explanation: string;
  explanationBn: string;
  timestamp: number;
}

export interface DeviceAuditLog {
  id: string;
  actionTitle: string;
  permissionUsed?: AndroidPermissionType;
  targetApp?: string;
  status: 'allowed' | 'denied' | 'auto_approved';
  timestamp: number;
  details: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'zoya' | 'system';
  text: string;
  timestamp: number;
  action?: AssistantAction;
  emotion?: 'sassy' | 'flirty' | 'witty' | 'dramatic' | 'smart' | 'roasting' | 'neutral';
  isAudioPlaying?: boolean;
  isConsentRequest?: boolean;
}

export type PowerMode = 'auto' | 'always_on' | 'off';

export interface BatteryState {
  level: number; // 0 - 100
  isCharging: boolean;
  isPowerSavingActive: boolean;
  powerMode: PowerMode;
  lowBatteryThreshold: number; // e.g. 20
}

export interface VoiceSettings {
  voiceEngine: VoiceEngine;
  geminiLiveVoice: string; // Aoede, Kore, Zephyr, Puck, Fenrir, Charon
  language: 'bn-BD' | 'hi-IN' | 'en-US';
  autoSpeak: boolean;
  speechRate: number; // 0.8 to 1.4
  speechPitch: number; // 0.8 to 1.3
  preferredVoice: string;
  wakeWordEnabled: boolean;
  continuousListening: boolean;
  volume: number; // 0 to 1
  visualizerTheme: VisualizerTheme;
  autoOpenActions: boolean;
  approvalMode: 'always_ask' | 'sensitive_only' | 'auto';
  requireExplicitApprovalForApps: boolean;
  accessibilityAgentEnabled: boolean;
  powerMode: PowerMode;
  lowBatteryThreshold: number;
  shizukuEnabled: boolean;
  termuxAutoConnect: boolean;
}

export interface ActionParseResult {
  hasAction: boolean;
  action?: AssistantAction;
  cleanText: string;
  sassySpokenText: string;
  emotion?: 'sassy' | 'flirty' | 'witty' | 'dramatic' | 'smart' | 'roasting';
}
