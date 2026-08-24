import { BatteryState, PowerMode } from '../types';

type BatteryListener = (state: BatteryState) => void;

class PowerManager {
  private level: number = 88; // Percentage 0 - 100
  private isCharging: boolean = false;
  private powerMode: PowerMode = 'auto';
  private lowBatteryThreshold: number = 20;
  private listeners: Set<BatteryListener> = new Set();
  private isBatteryApiSupported: boolean = false;
  private batteryObj: any = null;

  constructor() {
    this.initBatteryApi();
  }

  private async initBatteryApi(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        this.batteryObj = await (navigator as any).getBattery();
        this.isBatteryApiSupported = true;
        
        this.updateFromBatteryObj();

        this.batteryObj.addEventListener('levelchange', () => {
          this.updateFromBatteryObj();
        });
        this.batteryObj.addEventListener('chargingchange', () => {
          this.updateFromBatteryObj();
        });
      }
    } catch (e) {
      console.log('Web Battery API not accessible or simulated environment');
    }
  }

  private updateFromBatteryObj(): void {
    if (!this.batteryObj) return;
    this.level = Math.round((this.batteryObj.level ?? 0.88) * 100);
    this.isCharging = !!this.batteryObj.charging;
    this.notify();
  }

  public getState(): BatteryState {
    const isPowerSavingActive = this.computeIsPowerSavingActive();
    return {
      level: this.level,
      isCharging: this.isCharging,
      isPowerSavingActive,
      powerMode: this.powerMode,
      lowBatteryThreshold: this.lowBatteryThreshold,
    };
  }

  public computeIsPowerSavingActive(): boolean {
    if (this.powerMode === 'always_on') return true;
    if (this.powerMode === 'off') return false;
    // 'auto' mode: turns on when level <= threshold and not actively charging
    return this.level <= this.lowBatteryThreshold && !this.isCharging;
  }

  public setPowerMode(mode: PowerMode): void {
    this.powerMode = mode;
    this.notify();
  }

  public setLowBatteryThreshold(threshold: number): void {
    this.lowBatteryThreshold = Math.max(5, Math.min(50, threshold));
    this.notify();
  }

  public setBatteryLevel(level: number): void {
    this.level = Math.max(1, Math.min(100, Math.round(level)));
    this.notify();
  }

  public setCharging(isCharging: boolean): void {
    this.isCharging = isCharging;
    this.notify();
  }

  public subscribe(listener: BatteryListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('Error in power manager listener', e);
      }
    });
  }

  /**
   * Returns throttled interval for polling tasks in power-saving mode
   */
  public getPollingInterval(normalMs: number, throttleMultiplier = 2.5): number {
    return this.computeIsPowerSavingActive() ? Math.round(normalMs * throttleMultiplier) : normalMs;
  }

  /**
   * Returns target animation frames per second
   */
  public getTargetFPS(): number {
    return this.computeIsPowerSavingActive() ? 22 : 60;
  }
}

export const powerManager = new PowerManager();
