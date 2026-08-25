import { AudioConfig } from '../types';

export class AudioStreamer {
  private audioContext: AudioContext;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private config: AudioConfig;
  private onDataCallback: ((data: ArrayBuffer) => void) | null = null;

  constructor(config: AudioConfig = { sampleRate: 16000, channels: 1, bitDepth: 16 }) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.config = config;
  }

  async start(onData: (data: ArrayBuffer) => void): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.onDataCallback = onData;

      this.processor.onaudioprocess = (event) => {
        const audioData = event.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(audioData);
        onData(pcm16.buffer);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Failed to start audio stream:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  playAudio(data: ArrayBuffer): void {
    const audioData = new Float32Array(data);
    const source = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(1, audioData.length, 24000);
    buffer.getChannelData(0).set(audioData);
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  private floatTo16BitPCM(floatArray: Float32Array): Int16Array {
    const pcm16 = new Int16Array(floatArray.length);
    for (let i = 0; i < floatArray.length; i++) {
      pcm16[i] = Math.max(-1, Math.min(1, floatArray[i])) * 0x7fff;
    }
    return pcm16;
  }

  dispose(): void {
    this.stop();
    this.audioContext.close();
  }
}
