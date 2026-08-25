/**
 * AudioRecorder
 * Captures microphone input at 16kHz PCM, computes RMS energy for Voice Activity Detection (VAD),
 * converts Float32 to 16-bit PCM little-endian Base64, and passes active chunks to the Live streaming session.
 */
export class AudioRecorder {
  private inputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isRecording: boolean = false;
  private isMuted: boolean = false;
  private silenceFramesCount: number = 0;
  private currentRms: number = 0;

  // Adaptive Ambient Noise Calibration parameters
  private ambientNoiseFloor: number = 0.003;
  private dynamicVadThreshold: number = 0.006;
  private calibrationFramesCount: number = 0;
  private isCalibrationComplete: boolean = false;

  // Calibration bounds and multipliers
  private readonly CALIBRATION_FRAMES_REQUIRED = 8; // ~500ms initial calibration
  private readonly MIN_VAD_THRESHOLD = 0.0035;      // In very quiet environments
  private readonly MAX_VAD_THRESHOLD = 0.045;       // In noisy environments
  private readonly NOISE_MULTIPLIER = 1.85;         // SNR headroom above ambient floor
  private readonly NOISE_OFFSET = 0.0025;           // Safety margin
  private readonly AMBIENT_EMA_ALPHA = 0.05;        // Slow adaptation rate for background noise floor
  private readonly MAX_SILENT_FRAMES = 6;           // Tail hangover frames to prevent clipping trailing phonemes

  public onAudioChunk?: (base64Chunk: string, isSpeech: boolean) => void;
  public onRmsChange?: (rms: number, isSpeech: boolean, threshold: number) => void;
  public onCalibrationComplete?: (noiseFloor: number, threshold: number) => void;
  public onError?: (error: string) => void;

  constructor() {}

  public async start(): Promise<boolean> {
    if (this.isRecording) return true;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });

      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Handle bluetooth or headset disconnects
      const audioTrack = this.micStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.onended = () => {
          this.onError?.('Microphone disconnected.');
          this.stop();
        };
      }

      this.analyserNode = this.inputAudioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.7;

      this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.micSource.connect(this.analyserNode);
      this.micSource.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      // Reset calibration state
      this.calibrationFramesCount = 0;
      this.isCalibrationComplete = false;
      this.ambientNoiseFloor = 0.003;
      this.dynamicVadThreshold = 0.006;
      this.silenceFramesCount = 0;

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate Root Mean Square (RMS) for energy / VAD
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        this.currentRms = rms;

        // Phase 1: Initial Calibration
        if (!this.isCalibrationComplete) {
          this.calibrationFramesCount++;
          // Track initial ambient energy
          this.ambientNoiseFloor = (this.ambientNoiseFloor * (this.calibrationFramesCount - 1) + rms) / this.calibrationFramesCount;
          
          if (this.calibrationFramesCount >= this.CALIBRATION_FRAMES_REQUIRED) {
            this.isCalibrationComplete = true;
            this.recalculateThreshold();
            this.onCalibrationComplete?.(this.ambientNoiseFloor, this.dynamicVadThreshold);
          }
        } else {
          // Phase 2: Ongoing dynamic adaptation
          // If RMS is below current threshold, slowly update background noise floor estimate
          if (rms < this.dynamicVadThreshold) {
            this.ambientNoiseFloor = (1 - this.AMBIENT_EMA_ALPHA) * this.ambientNoiseFloor + this.AMBIENT_EMA_ALPHA * rms;
            this.recalculateThreshold();
          }
        }

        const isSpeech = this.isCalibrationComplete && (rms > this.dynamicVadThreshold);
        this.onRmsChange?.(rms, isSpeech, this.dynamicVadThreshold);

        if (isSpeech) {
          this.silenceFramesCount = 0;
        } else {
          this.silenceFramesCount++;
        }

        // Send all speech frames and up to MAX_SILENT_FRAMES of tail silence for natural sentence endings
        if (isSpeech || this.silenceFramesCount <= this.MAX_SILENT_FRAMES) {
          const base64PCM = this.floatTo16BitPCMBase64(inputData);
          if (base64PCM) {
            this.onAudioChunk?.(base64PCM, isSpeech);
          }
        }
      };

      this.isRecording = true;
      this.silenceFramesCount = 0;
      return true;
    } catch (err: any) {
      console.error('AudioRecorder failed to start:', err);
      this.onError?.(err?.message || 'Microphone access denied or unavailable.');
      this.stop();
      return false;
    }
  }

  private recalculateThreshold() {
    const rawThreshold = (this.ambientNoiseFloor * this.NOISE_MULTIPLIER) + this.NOISE_OFFSET;
    this.dynamicVadThreshold = Math.max(
      this.MIN_VAD_THRESHOLD,
      Math.min(this.MAX_VAD_THRESHOLD, rawThreshold)
    );
  }

  public stop() {
    this.isRecording = false;
    this.currentRms = 0;
    this.calibrationFramesCount = 0;
    this.isCalibrationComplete = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.currentRms = 0;
      this.onRmsChange?.(0, false, this.dynamicVadThreshold);
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getCurrentRms(): number {
    return this.currentRms;
  }

  public getNoiseFloor(): number {
    return this.ambientNoiseFloor;
  }

  public getVadThreshold(): number {
    return this.dynamicVadThreshold;
  }

  public isCalibrated(): boolean {
    return this.isCalibrationComplete;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode || !this.isRecording) return new Uint8Array(128);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  /**
   * Converts Float32Array [-1.0, 1.0] to 16-bit PCM little-endian Base64
   */
  private floatTo16BitPCMBase64(input: Float32Array): string {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
