/**
 * AudioStreamer
 * Handles gapless 24kHz Web Audio API playback for Gemini Live responses,
 * real-time interruption cancellation with click-free fadeout, and frequency data extraction for visualizers.
 */
export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime: number = 0;
  private isMuted: boolean = false;
  private volume: number = 1.0;

  public onPlaybackStart?: () => void;
  public onPlaybackEnd?: () => void;

  constructor() {
    // Lazy initialized on first user interaction or connect
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    }
  }

  public async resume(): Promise<void> {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  /**
   * Enqueues and plays a 24kHz 16-bit PCM Little Endian base64 chunk
   */
  public playChunk(base64Audio: string) {
    if (this.isMuted || !base64Audio) return;

    try {
      this.initContext();
      if (!this.audioCtx || !this.gainNode) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      // 1. Decode base64 to binary
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 2. Convert 16-bit PCM little endian to Float32 [-1.0, 1.0]
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      if (float32.length === 0) return;

      // 3. Create AudioBuffer @ 24kHz
      const audioBuffer = this.audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const now = this.audioCtx.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.025; // 25ms safety jitter buffer
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      const wasEmpty = this.activeSources.length === 0;
      this.activeSources.push(source);

      if (wasEmpty) {
        this.onPlaybackStart?.();
      }

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.onPlaybackEnd?.();
        }
      };
    } catch (err) {
      console.error('AudioStreamer playback error:', err);
    }
  }

  /**
   * Immediately stops all currently playing and queued audio buffers (Interrupt handling)
   * with click-free rapid fadeout
   */
  public stop() {
    if (this.gainNode && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.01); // 10ms click-free ramp
      } catch (_) {}
    }

    setTimeout(() => {
      for (const src of this.activeSources) {
        try {
          src.stop();
          src.disconnect();
        } catch (_) {}
      }
      this.activeSources = [];
      if (this.audioCtx) {
        this.nextStartTime = this.audioCtx.currentTime;
      }
      // Restore normal gain
      if (this.gainNode && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, now);
      }
      this.onPlaybackEnd?.();
    }, 12);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && !this.isMuted && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : this.volume, this.audioCtx.currentTime);
    }
    if (muted) {
      this.stop();
    }
  }

  public isPlaying(): boolean {
    return this.activeSources.length > 0;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(128);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  public close() {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.analyserNode = null;
      this.gainNode = null;
    }
  }
}
