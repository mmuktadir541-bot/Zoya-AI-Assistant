import { AssistantAction, AndroidPermissionType, CommandDangerLevel, AndroidAppId } from '../types';
import { androidDeviceManager } from './androidDeviceManager';
import { OfflineCommandEngine, OfflineCommandMatch } from './offlineCommandEngine';
import { GeminiClient } from './geminiClient';
import { nativeAndroidBridge } from './nativeAndroidBridge';
import { securityConfirmationManager } from './securityConfirmationManager';

export interface ActionGatewayResult {
  success: boolean;
  intent: string;
  source: 'offline_engine' | 'gemini_brain' | 'direct_intent';
  action?: AssistantAction;
  spokenResponseBn: string;
  spokenResponseEn: string;
  requiresPermissionModal?: boolean;
  missingPermission?: AndroidPermissionType;
  permissionExplanationBn?: string;
  permissionExplanationEn?: string;
  requiresConfirmationModal?: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  verified: boolean;
  error?: string;
}

/**
 * AndroidActionGateway
 * Centralized, secure action execution pipeline:
 * User Request -> Intent Understanding -> Action Validation -> Permission Check -> Risk Classification -> User Confirmation if required -> Android Action -> Verify Result -> Zoya Response
 */
export class AndroidActionGateway {
  /**
   * Process a complete user request through the full architectural pipeline
   */
  public static async processRequest(
    userInput: string,
    history: any[] = [],
    forceOffline: boolean = false
  ): Promise<ActionGatewayResult> {
    const raw = userInput.trim();
    if (!raw) {
      return {
        success: false,
        intent: 'EMPTY',
        source: 'offline_engine',
        spokenResponseBn: 'কিছু শুনতে পাইনি, আবার বলো তো!',
        spokenResponseEn: "I couldn't hear anything, please say it again!",
        riskLevel: 'LOW',
        verified: false,
      };
    }

    // Step 1: Intent Understanding (Offline Engine Fast-Path)
    const offlineMatch = OfflineCommandEngine.parse(raw);
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (offlineMatch.isMatched && offlineMatch.action) {
      return this.handleActionPipeline(offlineMatch.action, 'offline_engine', offlineMatch);
    }

    // If offline and no local rule matched
    if (forceOffline || !isOnline) {
      return {
        success: false,
        intent: 'OFFLINE_UNSUPPORTED',
        source: 'offline_engine',
        spokenResponseBn: 'এখন ইন্টারনেট সংযোগ নেই। অফলাইনে আমি অ্যাপস, সেটিংস, ফ্ল্যাশলাইট, টাইমার বা ফাইলস খুলতে পারব।',
        spokenResponseEn: 'No internet connection. In offline mode I can open apps, settings, flashlight, timer, or files.',
        riskLevel: 'LOW',
        verified: false,
      };
    }

    // Step 1 (Alternative): Online Gemini AI Brain Understanding
    try {
      const geminiRes = await GeminiClient.sendMessage(raw, history);
      if (geminiRes.action) {
        const action: AssistantAction = {
          id: `act_${Date.now()}`,
          type: geminiRes.action.type,
          title: geminiRes.action.title,
          titleBn: geminiRes.action.titleBn,
          targetApp: geminiRes.action.targetApp as AndroidAppId,
          requiresPermission: geminiRes.action.requiresPermission,
          requiresExplicitConsent: geminiRes.action.requiresExplicitConsent,
          url: geminiRes.action.url,
          payload: geminiRes.action.payload,
          executedAt: Date.now(),
        };
        return this.handleActionPipeline(action, 'gemini_brain', undefined, geminiRes.reply);
      }

      // Pure Conversational response from Gemini
      return {
        success: true,
        intent: 'CONVERSATION',
        source: 'gemini_brain',
        spokenResponseBn: geminiRes.reply,
        spokenResponseEn: geminiRes.reply,
        riskLevel: 'LOW',
        verified: true,
      };
    } catch (err: any) {
      return {
        success: false,
        intent: 'AI_COMMUNICATION_ERROR',
        source: 'gemini_brain',
        spokenResponseBn: 'নেটওয়ার্ক রেসপন্স করতে পারছে না, তবে অফলাইন কমান্ডগুলো চালু আছে!',
        spokenResponseEn: 'AI network communication failed, but offline commands are available!',
        riskLevel: 'LOW',
        verified: false,
        error: err?.message || 'Network failure',
      };
    }
  }

  /**
   * Execution Pipeline for a validated action
   */
  public static handleActionPipeline(
    action: AssistantAction,
    source: 'offline_engine' | 'gemini_brain' | 'direct_intent',
    offlineMatch?: OfflineCommandMatch,
    geminiSpokenReply?: string
  ): ActionGatewayResult {
    // Step 2: Action Validation
    const validation = this.validateAction(action);
    if (!validation.isValid) {
      return {
        success: false,
        intent: 'INVALID_ACTION',
        source,
        action,
        spokenResponseBn: `দুঃখিত, অ্যাকশনটি সঠিক নয়: ${validation.error}`,
        spokenResponseEn: `Action validation failed: ${validation.error}`,
        riskLevel: 'LOW',
        verified: false,
        error: validation.error,
      };
    }

    // Step 3: Risk Classification & Confirmation Evaluation
    const confirmationEval = securityConfirmationManager.evaluateRequiresConfirmation(action);
    const riskLevel = confirmationEval.riskLevel;

    // Step 4: Permission Check
    const permCheck = this.checkPermissions(action);
    if (!permCheck.allowed) {
      return {
        success: false,
        intent: action.type.toUpperCase(),
        source,
        action,
        spokenResponseBn: permCheck.reasonBn || 'এই কাজটি করতে অ্যান্ড্রয়েড পারমিশন প্রয়োজন।',
        spokenResponseEn: permCheck.reasonEn || 'Android permission required to perform this action.',
        requiresPermissionModal: true,
        missingPermission: action.requiresPermission,
        permissionExplanationBn: permCheck.reasonBn,
        permissionExplanationEn: permCheck.reasonEn,
        riskLevel,
        verified: false,
      };
    }

    // Step 5: High-Risk or Explicit Consent Interception
    if (confirmationEval.requiresConfirmation && !action.isConfirmed) {
      return {
        success: false,
        intent: action.type.toUpperCase(),
        source,
        action,
        spokenResponseBn: confirmationEval.explanationBn,
        spokenResponseEn: confirmationEval.explanation,
        requiresConfirmationModal: true,
        riskLevel,
        verified: false,
      };
    }

    // Step 6: Execute Android Action via Native Bridge & Step 7: Verify Result
    const execResult = this.executeAndVerify(action);

    const defaultBn = offlineMatch?.spokenResponseBn || geminiSpokenReply || `${action.titleBn || action.title} সম্পন্ন করা হয়েছে।`;
    const defaultEn = offlineMatch?.spokenResponseEn || geminiSpokenReply || `${action.title} executed successfully.`;

    return {
      success: execResult.verified,
      intent: action.type.toUpperCase(),
      source,
      action,
      spokenResponseBn: execResult.verified ? defaultBn : `কাজটি শুরু হয়েছে কিন্তু পুরোপুরি নিশ্চিত করা যায়নি: ${action.titleBn || action.title}`,
      spokenResponseEn: execResult.verified ? defaultEn : `Action dispatched: ${action.title}`,
      riskLevel,
      verified: execResult.verified,
      error: execResult.error,
    };
  }

  /**
   * Action Validation
   */
  public static validateAction(action: AssistantAction): { isValid: boolean; error?: string } {
    if (!action || !action.type) {
      return { isValid: false, error: 'Missing action structure' };
    }

    const validTypes = [
      'open_url', 'open_app', 'close_app', 'termux_run', 'read_screen',
      'in_app_automate', 'shizuku_exec', 'youtube', 'spotify', 'whatsapp',
      'gmail', 'messages', 'maps', 'phone_call', 'read_files', 'search_info',
      'google', 'device_control', 'device_setting', 'roast', 'system'
    ];

    if (!validTypes.includes(action.type)) {
      return { isValid: false, error: `Unsupported action type: ${action.type}` };
    }

    // Termux command safety validation
    if (action.type === 'termux_run' && action.payload?.command) {
      const safety = androidDeviceManager.evaluateCommandSafety(action.payload.command);
      if (safety.dangerLevel === 'destructive') {
        action.requiresExplicitConsent = true;
        action.payload.dangerLevel = 'destructive';
      }
    }

    return { isValid: true };
  }

  /**
   * Permission Check
   */
  public static checkPermissions(action: AssistantAction): { allowed: boolean; reasonBn?: string; reasonEn?: string } {
    return androidDeviceManager.checkActionPermission(action);
  }

  /**
   * Risk Classification
   */
  public static classifyRisk(action: AssistantAction): 'LOW' | 'MEDIUM' | 'HIGH' {
    return securityConfirmationManager.evaluateRequiresConfirmation(action).riskLevel;
  }

  /**
   * Android Action Execution & Outcome Verification
   */
  public static executeAndVerify(action: AssistantAction): { verified: boolean; error?: string } {
    try {
      // 1. Dispatch through Native Intent Bridge if setting or app
      if (action.type === 'device_setting' && action.payload?.settingKey) {
        nativeAndroidBridge.launchSystemSettings(action.payload.settingKey);
      } else if (action.type === 'open_app' && action.packageName) {
        nativeAndroidBridge.launchAppIntent(action.packageName);
      }

      // 2. Execute on Android Device Manager (maintains audit trails and app state)
      const executed = androidDeviceManager.executeAction(action);
      
      // 3. Verification check: Audit log entry exists & no security rejection
      const auditLogs = androidDeviceManager.getAuditLogs();
      const lastLog = auditLogs[0];

      if (lastLog && lastLog.status === 'denied') {
        return { verified: false, error: lastLog.details || 'Permission rejected' };
      }

      return { verified: executed };
    } catch (e: any) {
      return { verified: false, error: e?.message || 'Execution error' };
    }
  }
}
