/**
 * Audio Service managing Web Audio API, AnalyserNode for Visualizer, and Synth SFX
 */
class AudioService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private syntheticGain: GainNode | null = null;
  private isSpeakingSimulated: boolean = false;
  private speechFreqModifier: number = 0;
  private animInterval: number | null = null;
  private externalFrequencyProvider?: () => Uint8Array;

  public setExternalFrequencyProvider(provider: () => Uint8Array) {
    this.externalFrequencyProvider = provider;
  }

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.syntheticGain = this.ctx.createGain();
      this.syntheticGain.gain.value = 0.001; // subtle
      this.syntheticGain.connect(this.analyser);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public async connectMicrophone(): Promise<MediaStream | null> {
    try {
      this.init();
      if (this.micStream) return this.micStream;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
        } as any
      });
      this.micStream = stream;
      if (this.ctx && this.analyser) {
        this.micSource = this.ctx.createMediaStreamSource(stream);
        this.micSource.connect(this.analyser);
      }
      return stream;
    } catch (err) {
      console.warn("Microphone access permission rejected or unavailable:", err);
      return null;
    }
  }

  public disconnectMicrophone(): void {
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
  }

  public getFrequencyData(): Uint8Array {
    if (this.externalFrequencyProvider) {
      const ext = this.externalFrequencyProvider();
      if (ext && ext.length > 0) {
        let hasSignal = false;
        for (let i = 0; i < Math.min(ext.length, 32); i++) {
          if (ext[i] > 5) {
            hasSignal = true;
            break;
          }
        }
        if (hasSignal) {
          return ext;
        }
      }
    }

    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);

    // If simulated speech is active, inject dynamic frequencies
    if (this.isSpeakingSimulated) {
      const now = performance.now() * 0.005;
      for (let i = 0; i < data.length; i++) {
        const wave = Math.sin(now * 3 + i * 0.2) * 0.5 + 0.5;
        const pulse = Math.sin(now * 8) * 0.3 + 0.7;
        const injected = Math.min(255, (data[i] * 0.3) + (wave * pulse * 180 * (1 - i / data.length)));
        data[i] = Math.max(data[i], injected);
      }
    }
    return data;
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  public setSpeakingVisualState(isSpeaking: boolean): void {
    this.isSpeakingSimulated = isSpeaking;
  }

  // Futuristic Sound Effects generated purely via Web Audio API synth
  public playWakeChime(): void {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      // Audio context may be restricted before gesture
    }
  }

  public playActionCompleteSound(): void {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  public playSleepSound(): void {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.exponentialRampToValueAtTime(392.00, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

export const audioService = new AudioService();
