/**
 * AudioRecorder
 * Captures microphone input at 16kHz PCM, converts Float32 to 16-bit PCM little-endian Base64,
 * and passes chunks to the Live streaming session.
 */
export class AudioRecorder {
  private inputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isRecording: boolean = false;
  private isMuted: boolean = false;

  public onAudioChunk?: (base64Chunk: string) => void;
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

      this.analyserNode = this.inputAudioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.7;

      this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.micSource.connect(this.analyserNode);
      this.micSource.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const base64PCM = this.floatTo16BitPCMBase64(inputData);
        if (base64PCM) {
          this.onAudioChunk?.(base64PCM);
        }
      };

      this.isRecording = true;
      return true;
    } catch (err: any) {
      console.error('AudioRecorder failed to start:', err);
      this.onError?.(err?.message || 'Microphone access denied or unavailable.');
      this.stop();
      return false;
    }
  }

  public stop() {
    this.isRecording = false;

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
  }

  public getIsRecording(): boolean {
    return this.isRecording;
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
