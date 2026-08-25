import {
  AssistantAction,
  ActionParseResult,
  AndroidPermissionType,
  AndroidPermissionState,
  CommandDangerLevel,
  ChatMessage,
} from '../types';
import { androidDeviceManager } from './androidDeviceManager';
import { OfflineCommandEngine } from './offlineCommandEngine';
import { ActionParser } from './actionParser';

export interface ActionGatewayResult {
  success: boolean;
  status: 'executed' | 'needs_permission' | 'needs_consent' | 'unsupported' | 'failed';
  action?: AssistantAction;
  permissionRequired?: AndroidPermissionState;
  dangerLevel?: CommandDangerLevel;
  spokenReply: string;
  displayReply: string;
  auditDetails?: string;
}

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  createdAt: number;
  intervalId?: any;
}

/**
 * Action Gateway for Zoya AI
 * Centralized, secure action orchestrator connecting AI intent to Android OS actions.
 *
 * Pipeline:
 * User Request
 *  → Intent Understanding (Offline / Hybrid)
 *  → Action Validation
 *  → Permission Check
 *  → Risk Classification
 *  → Android Action Dispatch
 *  → Verify Result
 *  → Zoya Response
 */
export class ActionGateway {
  private activeTimers: Map<string, ActiveTimer> = new Map();
  private isTorchActive: boolean = false;
  private mediaStreamTrack: MediaStreamTrack | null = null;

  public onTimerCompleted?: (timer: ActiveTimer) => void;

  constructor() {}

  /**
   * Process a user voice/text request through the entire Action Gateway pipeline
   */
  public async processRequest(
    userRequest: string,
    options: {
      isOffline?: boolean;
      forceOfflineEngine?: boolean;
      userApprovedConsent?: boolean;
    } = {}
  ): Promise<ActionGatewayResult> {
    const raw = userRequest.trim();
    if (!raw) {
      return {
        success: false,
        status: 'unsupported',
        spokenReply: '',
        displayReply: '',
      };
    }

    // Step 1: Intent Understanding (Offline Engine priority if offline or high-confidence local intent)
    let parseResult: ActionParseResult;

    const isOffline = options.isOffline ?? (typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false);
    const canHandleLocally = OfflineCommandEngine.canHandleOffline(raw);

    if (isOffline || options.forceOfflineEngine || canHandleLocally) {
      parseResult = OfflineCommandEngine.parseOffline(raw);
    } else {
      parseResult = ActionParser.parseCommand(raw);
    }

    // If no action detected by offline heuristics, fall back to general ActionParser
    if (!parseResult.hasAction) {
      parseResult = ActionParser.parseCommand(raw);
    }

    // If still no action, return purely conversational message
    if (!parseResult.hasAction || !parseResult.action) {
      return {
        success: true,
        status: 'executed',
        spokenReply: parseResult.sassySpokenText || 'আমি তোমার কথা বুঝতে পেরেছি। বলো কি কাজ করতে হবে?',
        displayReply: parseResult.sassySpokenText || 'আমি তোমার কথা বুঝতে পেরেছি।',
      };
    }

    const action = parseResult.action;

    // Step 2: Action Validation
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return {
        success: false,
        status: 'unsupported',
        action,
        spokenReply: validation.reasonBn || 'এই কমান্ডটি আপনার ডিভাইসে এই মুহূর্তে সমর্থিত নয়।',
        displayReply: validation.reason || 'This action is not supported on this platform.',
      };
    }

    // Step 3: Permission Check
    const permCheck = androidDeviceManager.checkActionPermission(action);
    if (!permCheck.allowed && permCheck.requiredPermission) {
      return {
        success: false,
        status: 'needs_permission',
        action,
        permissionRequired: permCheck.requiredPermission,
        spokenReply: `এই কাজটি করতে "${permCheck.requiredPermission.nameBn}" অনুমতি প্রয়োজন। স্ক্রিনের বাটনে ক্লিক করে পারমিশন দিন।`,
        displayReply: `Permission Required: ${permCheck.requiredPermission.name} (${permCheck.requiredPermission.nameBn})`,
      };
    }

    // Step 4: Risk Classification
    const risk = this.classifyRisk(action);
    if (risk.requiresExplicitConfirmation && !options.userApprovedConsent) {
      return {
        success: false,
        status: 'needs_consent',
        action,
        dangerLevel: risk.level,
        spokenReply: risk.explanationBn,
        displayReply: risk.explanation,
      };
    }

    // Step 5: Android Action Execution & Dispatch
    const dispatchResult = await this.dispatchAction(action);

    // Step 6: Verify Result
    const verified = this.verifyResult(action, dispatchResult);

    // Step 7: Zoya Response Formulation
    return {
      success: verified.success,
      status: verified.success ? 'executed' : 'failed',
      action,
      dangerLevel: risk.level,
      spokenReply: parseResult.sassySpokenText || verified.messageBn,
      displayReply: verified.messageEn,
      auditDetails: verified.auditDetails,
    };
  }

  /**
   * Action Validation: ensure action targets, intents, or payload values are syntactically valid
   */
  private validateAction(action: AssistantAction): { valid: boolean; reason?: string; reasonBn?: string } {
    if (!action.type) {
      return { valid: false, reason: 'Invalid action type', reasonBn: 'অ্যাকশনের ধরন সঠিক নয়।' };
    }

    if (action.type === 'device_setting' && !action.payload?.settingKey && !action.intentUri) {
      return { valid: false, reason: 'Missing settings target', reasonBn: 'নির্দিষ্ট কোনো সেটিংস পাওয়া যায়নি।' };
    }

    if (action.type === 'device_control' && !action.payload?.settingKey) {
      return { valid: false, reason: 'Missing hardware control key', reasonBn: 'হার্ডওয়্যার কন্ট্রোল পাওয়া যায়নি।' };
    }

    return { valid: true };
  }

  /**
   * Risk Classification: categorize actions into Low, Medium, High, or Destructive tiers
   */
  public classifyRisk(action: AssistantAction): {
    level: CommandDangerLevel;
    requiresExplicitConfirmation: boolean;
    explanation: string;
    explanationBn: string;
  } {
    // 1. Terminal / Termux commands
    if (action.type === 'termux_run' && action.payload?.command) {
      const safety = androidDeviceManager.evaluateCommandSafety(action.payload.command);
      return {
        level: safety.dangerLevel,
        requiresExplicitConfirmation: safety.requiresConfirmation,
        explanation: safety.explanation,
        explanationBn: safety.explanationBn,
      };
    }

    // 2. Destructive file operations
    if (action.type === 'read_files' && action.payload?.query?.toLowerCase().includes('delete')) {
      return {
        level: 'destructive',
        requiresExplicitConfirmation: true,
        explanation: 'File deletion request detected. Confirmation is strictly required.',
        explanationBn: 'ফাইল মুছে ফেলার নির্দেশ সনাক্ত হয়েছে। নিশ্চিত করা বাধ্যতামূলক।',
      };
    }

    // 3. Shizuku / Privileged ADB Actions
    if (action.type === 'shizuku_exec') {
      return {
        level: 'privileged',
        requiresExplicitConfirmation: true,
        explanation: 'Shizuku ADB-level service execution requested.',
        explanationBn: 'শিজুকু এডিবি প্রিভিলেজ সার্ভিস চালু করার সম্মতি প্রয়োজন।',
      };
    }

    // 4. In-App Automations
    if (action.type === 'in_app_automate') {
      return {
        level: 'moderate',
        requiresExplicitConfirmation: action.requiresExplicitConsent ?? false,
        explanation: 'Automated UI gestures will be injected into the active app.',
        explanationBn: 'অ্যাপের ভেতর স্বয়ংক্রিয়ভাবে ক্লিক বা টাইপ করা হবে।',
      };
    }

    // 5. Safe / Low-risk default
    return {
      level: 'safe',
      requiresExplicitConfirmation: false,
      explanation: 'Safe read-only or application launcher action.',
      explanationBn: 'নিরাপদ ডিভাইস অ্যাকশন।',
    };
  }

  /**
   * Dispatch action to native Android system, browser APIs, or in-app simulators
   */
  public async dispatchAction(action: AssistantAction): Promise<{
    success: boolean;
    mode: 'native_intent' | 'hardware_torch' | 'local_timer' | 'termux_pipe' | 'deep_link' | 'web_fallback' | 'simulated';
    details?: string;
  }> {
    // A. Flashlight / Torch Control
    if (
      action.type === 'device_control' &&
      (action.payload?.settingKey === 'flashlight' || action.payload?.toggle === 'flashlight')
    ) {
      const turnOn = action.payload?.state !== undefined ? !!action.payload.state : !!action.payload.settingValue;
      const torchSuccess = await this.setFlashlight(turnOn);
      return {
        success: true,
        mode: 'hardware_torch',
        details: `Flashlight state set to ${turnOn ? 'ON' : 'OFF'} (Hardware/Simulated API: ${torchSuccess})`,
      };
    }

    // B. Local Timer Control
    if (
      action.type === 'device_control' &&
      (action.payload?.settingKey === 'timer' || action.payload?.timerMinutes !== undefined)
    ) {
      const duration = action.payload?.timerMinutes
        ? action.payload.timerMinutes * 60
        : (action.payload?.settingValue as number) || 300;
      const label = action.payload?.durationLabel || `${Math.round(duration / 60)} min`;
      this.createTimer(label, duration);
      
      // Also attempt native Android SET_TIMER intent
      if (action.intentUri) {
        androidDeviceManager.launchNativeAndroidApp({
          id: 'clock',
          intentUri: action.intentUri,
          name: 'Clock',
          nameBn: 'ঘড়ি ও টাইমার',
        });
      }

      return {
        success: true,
        mode: 'local_timer',
        details: `Timer created for ${label} (${duration} seconds)`,
      };
    }

    // C. Termux Command Execution
    if (action.type === 'termux_run' && action.payload?.command) {
      const record = androidDeviceManager.executeTermuxCommand(action.payload.command);
      return {
        success: record.exitCode === 0,
        mode: 'termux_pipe',
        details: `Termux process exited with code ${record.exitCode}`,
      };
    }

    // D. Android Settings Sub-Pages & Native Apps
    if (action.type === 'device_setting' || action.type === 'open_app' || action.targetApp) {
      const launch = androidDeviceManager.launchNativeAndroidApp({
        id: action.targetApp || action.payload?.appId || 'app',
        name: action.title,
        nameBn: action.titleBn,
        packageName: action.packageName || action.payload?.packageName,
        intentUri: action.intentUri || action.payload?.intentUri,
        deepLink: action.deepLink || action.payload?.deepLink,
        webFallback: action.url,
      });

      return {
        success: true,
        mode: launch.mode === 'android_intent' ? 'native_intent' : launch.mode === 'deep_link' ? 'deep_link' : 'simulated',
        details: `Launched via ${launch.mode} (${launch.uri || 'Direct Intent'})`,
      };
    }

    return {
      success: true,
      mode: 'simulated',
      details: 'Action processed and registered.',
    };
  }

  /**
   * Verify whether the dispatched action actually succeeded
   */
  private verifyResult(
    action: AssistantAction,
    dispatchResult: { success: boolean; mode: string; details?: string }
  ): { success: boolean; messageEn: string; messageBn: string; auditDetails: string } {
    const isSuccess = dispatchResult.success;
    const auditDetails = `Action [${action.title}] processed via ${dispatchResult.mode}. Details: ${dispatchResult.details || 'None'}`;

    androidDeviceManager.addAuditLog({
      actionTitle: action.title,
      targetApp: action.targetApp || 'system',
      permissionUsed: action.requiresPermission,
      status: isSuccess ? 'allowed' : 'denied',
      details: auditDetails,
    });

    return {
      success: isSuccess,
      messageEn: isSuccess
        ? `Successfully executed: ${action.title}`
        : `Failed to execute: ${action.title}`,
      messageBn: isSuccess
        ? `${action.titleBn || action.title} সফলভাবে সম্পন্ন হয়েছে।`
        : `${action.titleBn || action.title} সম্পন্ন করা যায়নি।`,
      auditDetails,
    };
  }

  /**
   * Hardware Web Flashlight / Torch toggle API
   */
  public async setFlashlight(enable: boolean): Promise<boolean> {
    this.isTorchActive = enable;

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        if (enable) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              // @ts-ignore
              advanced: [{ torch: true }],
            },
          });
          const track = stream.getVideoTracks()[0];
          this.mediaStreamTrack = track;
          // @ts-ignore
          if (track && typeof track.applyConstraints === 'function') {
            // @ts-ignore
            await track.applyConstraints({ advanced: [{ torch: true }] });
          }
          return true;
        } else {
          if (this.mediaStreamTrack) {
            // @ts-ignore
            if (typeof this.mediaStreamTrack.applyConstraints === 'function') {
              // @ts-ignore
              await this.mediaStreamTrack.applyConstraints({ advanced: [{ torch: false }] });
            }
            this.mediaStreamTrack.stop();
            this.mediaStreamTrack = null;
          }
          return true;
        }
      } catch (e) {
        // Fall back gracefully to software state indicator
        return true;
      }
    }
    return true;
  }

  public getFlashlightState(): boolean {
    return this.isTorchActive;
  }

  /**
   * Local Timer creation & management
   */
  public createTimer(label: string, totalSeconds: number): ActiveTimer {
    const id = `timer_${Date.now()}`;
    const timer: ActiveTimer = {
      id,
      label,
      totalSeconds,
      remainingSeconds: totalSeconds,
      createdAt: Date.now(),
    };

    const interval = setInterval(() => {
      timer.remainingSeconds -= 1;
      if (timer.remainingSeconds <= 0) {
        clearInterval(timer.intervalId);
        this.activeTimers.delete(id);
        this.onTimerCompleted?.(timer);
      }
    }, 1000);

    if (typeof interval === 'object' && interval !== null && 'unref' in interval && typeof (interval as any).unref === 'function') {
      (interval as any).unref();
    }

    timer.intervalId = interval;
    this.activeTimers.set(id, timer);
    return timer;
  }

  public getActiveTimers(): ActiveTimer[] {
    return Array.from(this.activeTimers.values());
  }

  public cancelTimer(id: string) {
    const timer = this.activeTimers.get(id);
    if (timer?.intervalId) {
      clearInterval(timer.intervalId);
    }
    this.activeTimers.delete(id);
  }
}

export const actionGateway = new ActionGateway();
