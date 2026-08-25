import {
  ForegroundServiceState,
  ForegroundServiceStatus,
  ForegroundServiceType,
} from '../types';
import { androidDeviceManager } from './androidDeviceManager';

/**
 * ForegroundServiceManager
 * Coordinates Android Foreground Service lifecycle conforming to Android 14/15 standards.
 * Required for long-running continuous voice input, audio session management, and background assistant tasks.
 */
export class ForegroundServiceManager {
  private static instance: ForegroundServiceManager;

  private status: ForegroundServiceStatus = {
    state: 'stopped',
    serviceType: 'microphone',
    channelId: 'zoya_voice_service_channel',
    notificationTitle: 'Zoya AI Assistant',
    notificationContent: 'Listening for voice commands in background',
    activeSince: null,
    audioFocusHeld: false,
    wakeLockActive: false,
  };

  private listeners: Array<(status: ForegroundServiceStatus) => void> = [];

  private constructor() {
    this.initNativeSync();
  }

  public static getInstance(): ForegroundServiceManager {
    if (!ForegroundServiceManager.instance) {
      ForegroundServiceManager.instance = new ForegroundServiceManager();
    }
    return ForegroundServiceManager.instance;
  }

  private initNativeSync() {
    // Check if running on Android Native bridge
    if (typeof window !== 'undefined' && window.AndroidBridge) {
      // Bridge is available
    }
  }

  public getStatus(): ForegroundServiceStatus {
    return { ...this.status };
  }

  /**
   * Start Android Foreground Service with type (e.g. microphone for audio processing)
   */
  public async startService(
    serviceType: ForegroundServiceType = 'microphone',
    customTitle?: string,
    customContent?: string
  ): Promise<boolean> {
    if (this.status.state === 'running') {
      return true;
    }

    this.status.state = 'starting';
    this.status.serviceType = serviceType;
    this.status.notificationTitle = customTitle || 'Zoya AI Assistant (Foreground)';
    this.status.notificationContent = customContent || 'Active: Continuous Voice & Device Automation';
    this.notifyListeners();

    try {
      // Native Bridge Execution
      if (typeof window !== 'undefined' && window.AndroidBridge?.startForegroundService) {
        const ok = window.AndroidBridge.startForegroundService(
          serviceType,
          this.status.notificationTitle,
          this.status.notificationContent
        );
        if (!ok) {
          throw new Error('Native startForegroundService returned false');
        }
      }

      this.status.state = 'running';
      this.status.activeSince = Date.now();
      this.status.audioFocusHeld = true;
      this.status.wakeLockActive = true;
      this.status.lastErrorMessage = undefined;

      androidDeviceManager.addAuditLog({
        actionTitle: 'Foreground Service Started',
        status: 'allowed',
        details: `Type: ${serviceType} | Notification: "${this.status.notificationTitle}"`,
      });

      this.notifyListeners();
      return true;
    } catch (err: any) {
      this.status.state = 'error';
      this.status.lastErrorMessage = err?.message || 'Failed to start foreground service';
      this.status.audioFocusHeld = false;
      this.status.wakeLockActive = false;

      androidDeviceManager.addAuditLog({
        actionTitle: 'Foreground Service Error',
        status: 'denied',
        details: `Failed to start: ${this.status.lastErrorMessage}`,
      });

      this.notifyListeners();
      return false;
    }
  }

  /**
   * Stop Android Foreground Service
   */
  public async stopService(): Promise<boolean> {
    if (this.status.state === 'stopped') {
      return true;
    }

    try {
      if (typeof window !== 'undefined' && window.AndroidBridge?.stopForegroundService) {
        window.AndroidBridge.stopForegroundService();
      }

      this.status.state = 'stopped';
      this.status.activeSince = null;
      this.status.audioFocusHeld = false;
      this.status.wakeLockActive = false;

      androidDeviceManager.addAuditLog({
        actionTitle: 'Foreground Service Stopped',
        status: 'allowed',
        details: 'Service gracefully terminated and notification dismissed',
      });

      this.notifyListeners();
      return true;
    } catch (err: any) {
      this.status.state = 'error';
      this.status.lastErrorMessage = err?.message || 'Failed to stop service';
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Pause listening (e.g. while another app requests transient audio focus)
   */
  public pauseListening() {
    if (this.status.state === 'running') {
      this.status.state = 'paused';
      this.status.audioFocusHeld = false;
      this.notifyListeners();
    }
  }

  /**
   * Resume listening after focus regain
   */
  public resumeListening() {
    if (this.status.state === 'paused') {
      this.status.state = 'running';
      this.status.audioFocusHeld = true;
      this.notifyListeners();
    }
  }

  public subscribe(listener: (status: ForegroundServiceStatus) => void): () => void {
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
        console.error('[ForegroundService] Listener error:', e);
      }
    });
  }
}

export const foregroundServiceManager = ForegroundServiceManager.getInstance();
