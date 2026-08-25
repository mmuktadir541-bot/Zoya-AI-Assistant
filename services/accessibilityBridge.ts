import { AccessibilityBridgeStatus, ScreenNode } from '../types';
import { androidDeviceManager } from './androidDeviceManager';
import { nativeAndroidBridge } from './nativeAndroidBridge';

/**
 * AccessibilityBridge
 * Architecture foundation for Android Accessibility Service.
 * Allows detecting accessibility service state, guiding user to Android Accessibility Settings,
 * and querying visible screen elements strictly with explicit user consent.
 */
export class AccessibilityBridge {
  private static instance: AccessibilityBridge;

  private status: AccessibilityBridgeStatus = {
    isEnabledInSettings: true,
    isServiceConnected: true,
    canRetrieveWindowContent: true,
    canPerformGestures: true,
    packageFilter: ['com.termux', 'com.whatsapp', 'com.bKash.customerapp', 'com.android.chrome'],
    feedbackType: 'feedbackGeneric|feedbackSpoken',
    lastEventTimestamp: Date.now(),
  };

  private listeners: Array<(status: AccessibilityBridgeStatus) => void> = [];

  private constructor() {
    this.refreshStatus();
  }

  public static getInstance(): AccessibilityBridge {
    if (!AccessibilityBridge.instance) {
      AccessibilityBridge.instance = new AccessibilityBridge();
    }
    return AccessibilityBridge.instance;
  }

  /**
   * Refreshes current accessibility service state from native bridge or device manager
   */
  public refreshStatus(): AccessibilityBridgeStatus {
    const perm = androidDeviceManager.getPermission('BIND_ACCESSIBILITY_SERVICE');
    let isNativeEnabled = perm ? perm.granted : false;

    if (typeof window !== 'undefined' && window.AndroidBridge?.isAccessibilityEnabled) {
      try {
        isNativeEnabled = window.AndroidBridge.isAccessibilityEnabled();
      } catch (e) {
        // Fallback to permission state
      }
    }

    this.status.isEnabledInSettings = isNativeEnabled;
    this.status.isServiceConnected = isNativeEnabled;
    this.notifyListeners();
    return { ...this.status };
  }

  public getStatus(): AccessibilityBridgeStatus {
    return { ...this.status };
  }

  /**
   * Open Android Accessibility Settings so the user can enable/disable Zoya Accessibility Service
   */
  public async openAccessibilitySettings(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.AndroidBridge?.openAccessibilitySettings) {
      return window.AndroidBridge.openAccessibilitySettings();
    }

    const res = await nativeAndroidBridge.launchSystemSettings('android.settings.ACCESSIBILITY_SETTINGS');
    androidDeviceManager.addAuditLog({
      actionTitle: 'Open Accessibility Settings',
      status: 'allowed',
      details: 'Navigated to Android Accessibility Settings flow',
    });
    return res.dispatched;
  }

  /**
   * Fetch visible screen nodes from Accessibility tree
   */
  public getScreenNodes(): ScreenNode[] {
    return androidDeviceManager.getScreenNodes();
  }

  /**
   * Fetch summarized visible text on screen
   */
  public getScreenTextSummary(): string {
    return androidDeviceManager.getScreenTextSummary();
  }

  public subscribe(listener: (status: AccessibilityBridgeStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const current = this.getStatus();
    this.listeners.forEach((l) => {
      try {
        l(current);
      } catch (e) {
        console.error('[AccessibilityBridge] Listener error:', e);
      }
    });
  }
}

export const accessibilityBridge = AccessibilityBridge.getInstance();
