export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type VisualizerTheme = 'gemini_glow' | 'cyber_neon' | 'siri_wave' | 'aurora_bliss';

export type VoiceEngine = 'live' | 'standard';

export type AndroidPermissionType =
  | 'RECORD_AUDIO'
  | 'BIND_ACCESSIBILITY_SERVICE'
  | 'READ_CONTACTS'
  | 'MANAGE_EXTERNAL_STORAGE'
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

export type AndroidAppId =
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
  | 'notes';

export interface AndroidApp {
  id: AndroidAppId;
  name: string;
  nameBn: string;
  icon: string;
  category: 'communication' | 'media' | 'system' | 'utility' | 'tools';
  color: string;
  packageName: string;
  requiredPermissions: AndroidPermissionType[];
  descriptionBn: string;
}

export type WorkType = 'A_APP_CONTROL' | 'B_INFO_SEARCH' | 'C_IN_APP_AUTOMATION' | 'E_FILE_MANAGEMENT';

export interface AssistantAction {
  id: string;
  type:
    | 'open_url'
    | 'open_app'
    | 'close_app'
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
    | 'roast'
    | 'system';
  workType?: WorkType;
  title: string;
  titleBn?: string;
  url?: string;
  targetApp?: AndroidAppId;
  requiresPermission?: AndroidPermissionType;
  requiresExplicitConsent?: boolean;
  isConfirmed?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'executed';
  payload?: {
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
}

export interface ActionParseResult {
  hasAction: boolean;
  action?: AssistantAction;
  cleanText: string;
  sassySpokenText: string;
  emotion?: 'sassy' | 'flirty' | 'witty' | 'dramatic' | 'smart' | 'roasting';
}

