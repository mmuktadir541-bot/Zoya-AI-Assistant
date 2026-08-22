import { AssistantAction } from '../types';
import { audioService } from './audioService';

/**
 * Gemini Live Service
 * Manages WebSocket bidirectional audio streaming (16kHz PCM input, 24kHz PCM output)
 * with the Gemini 3.1 Flash Live API.
 */
export class LiveVoiceService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Gapless playback scheduler
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isConnected: boolean = false;
  private isMuted: boolean = false;
  private voiceName: string = 'Aoede';

  // Event callbacks
  public onStateChange?: (state: 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking') => void;
  public onInputTranscription?: (text: string) => void;
  public onOutputTranscription?: (text: string) => void;
  public onAction?: (action: AssistantAction) => void;
  public onError?: (error: string) => void;
  public onTurnComplete?: () => void;

  constructor() {
    this.voiceName = 'Aoede';
  }

  public setVoice(voice: string) {
    this.voiceName = voice || 'Aoede';
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllAudioPlayback();
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to backend Gemini Live WebSocket
   */
  public async connect(): Promise<boolean> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return true;
    }

    this.onStateChange?.('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(this.voiceName)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.isConnected = true;
        this.onStateChange?.('connected');
        await this.startAudioCapture();
        this.onStateChange?.('listening');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('Failed to parse Live message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('Live WebSocket error:', err);
        this.onError?.('Live connection encountered an error.');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopAudioCapture();
        this.stopAllAudioPlayback();
        this.onStateChange?.('disconnected');
      };

      return true;
    } catch (err: any) {
      console.error('Live connect failed:', err);
      this.onStateChange?.('disconnected');
      this.onError?.(err?.message || 'Failed to connect to Live Voice');
      return false;
    }
  }

  /**
   * Disconnect from Gemini Live WebSocket
   */
  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.stopAudioCapture();
    this.stopAllAudioPlayback();
    this.onStateChange?.('disconnected');
  }

  /**
   * Send text prompt into Live session
   */
  public sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
    }
  }

  /**
   * Handles incoming server messages
   */
  private handleServerMessage(data: any) {
    switch (data.type) {
      case 'audio':
        if (data.audio && !this.isMuted) {
          this.playAudioChunk(data.audio);
          this.onStateChange?.('speaking');
          audioService.setSpeakingVisualState(true);
        }
        break;

      case 'interrupted':
        this.stopAllAudioPlayback();
        audioService.setSpeakingVisualState(false);
        this.onStateChange?.('listening');
        break;

      case 'inputTranscription':
        if (data.text) {
          this.onInputTranscription?.(data.text);
        }
        break;

      case 'outputTranscription':
        if (data.text) {
          this.onOutputTranscription?.(data.text);
        }
        break;

      case 'action':
        if (data.action) {
          this.onAction?.(data.action);
        }
        break;

      case 'turnComplete':
        audioService.setSpeakingVisualState(false);
        this.onTurnComplete?.();
        this.onStateChange?.('listening');
        break;

      case 'error':
        this.onError?.(data.error || 'Live Voice error occurred');
        break;
    }
  }

  /**
   * Setup microphone audio capture @ 16kHz PCM
   */
  private async startAudioCapture() {
    try {
      if (!this.inputAudioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      }
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

      this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      // ScriptProcessorNode to capture raw PCM float chunks
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const base64PCM = this.floatTo16BitPCMBase64(inputData);

        this.ws.send(
          JSON.stringify({
            type: 'realtime_audio',
            audio: base64PCM,
          })
        );
      };

      this.micSource.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);
    } catch (err) {
      console.error('Error starting audio capture:', err);
      this.onError?.('Microphone access denied or unavailable.');
    }
  }

  private stopAudioCapture() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
  }

  /**
   * Convert Float32Array to 16-bit PCM little-endian Base64
   */
  private floatTo16BitPCMBase64(input: Float32Array): string {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
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

  /**
   * Decode Base64 24kHz 16-bit PCM and schedule gapless playback
   */
  private playAudioChunk(base64Audio: string) {
    try {
      if (!this.outputAudioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
        this.analyserNode = this.outputAudioCtx.createAnalyser();
        this.analyserNode.fftSize = 256;
      }
      if (this.outputAudioCtx.state === 'suspended') {
        this.outputAudioCtx.resume();
      }

      // Convert Base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM to Float32Array
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect to output destination and analyser for visualizer
      source.connect(this.outputAudioCtx.destination);
      if (this.analyserNode) {
        source.connect(this.analyserNode);
      }

      // Gapless scheduling
      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02; // small initial jitter buffer
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          audioService.setSpeakingVisualState(false);
        }
      };
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  }

  /**
   * Stop all active audio playback immediately on interruption or mute
   */
  private stopAllAudioPlayback() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  public getOutputFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(128);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }
}

export const liveVoiceService = new LiveVoiceService();
