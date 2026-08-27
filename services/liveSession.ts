import { AudioRecorder } from './audioRecorder';
import { AudioStreamer } from './audioStreamer';
import { AssistantAction } from '../types';

export type LiveSessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface LiveSessionCallbacks {
  onStateChange?: (state: LiveSessionState) => void;
  onInputTranscription?: (text: string) => void;
  onOutputTranscription?: (text: string) => void;
  onAction?: (action: AssistantAction) => void;
  onError?: (error: string) => void;
  onTurnComplete?: () => void;
  onCalibrationComplete?: (noiseFloor: number, threshold: number) => void;
}

/**
 * LiveSession
 * Coordinates real-time bi-directional audio streaming (Audio-to-Audio only)
 * using WebSocket to the server's Gemini Live API session with automatic reconnect,
 * local fast-path interruption, and network recovery.
 */
export class LiveSession {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder;
  private streamer: AudioStreamer;
  private state: LiveSessionState = 'disconnected';
  private voiceName: string = 'Aoede';
  private isMuted: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimer: any = null;
  private isManuallyClosed: boolean = false;

  public callbacks: LiveSessionCallbacks = {};

  constructor(voiceName: string = 'Aoede') {
    this.voiceName = voiceName;
    this.streamer = new AudioStreamer();
    this.recorder = new AudioRecorder();

    // Streamer events
    this.streamer.onPlaybackStart = () => {
      this.setState('speaking');
    };

    this.streamer.onPlaybackEnd = () => {
      if (this.state === 'speaking') {
        this.setState('listening');
      }
    };

    // Recorder audio chunk dispatch & fast-path interruption
    this.recorder.onAudioChunk = (base64Chunk, isSpeech) => {
      // Local fast-path interruption: If user speaks while assistant is actively playing speech, immediately cut off local audio
      if (isSpeech && this.streamer.isPlaying()) {
        this.streamer.stop();
        this.setState('listening');
        // Notify server of interruption if socket is open
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ type: 'client_interrupted' }));
          } catch (_) {}
        }
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'realtime_audio',
            audio: base64Chunk,
          })
        );
      }
    };

    this.recorder.onError = (err) => {
      this.callbacks.onError?.(err);
    };

    this.recorder.onCalibrationComplete = (noiseFloor, threshold) => {
      this.callbacks.onCalibrationComplete?.(noiseFloor, threshold);
    };

    // Listen to network connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isManuallyClosed && this.state === 'disconnected') {
          this.reconnect();
        }
      });
      window.addEventListener('offline', () => {
        this.callbacks.onError?.('Network connection lost.');
      });
    }
  }

  public setVoice(voice: string) {
    this.voiceName = voice || 'Aoede';
    if (this.isConnected()) {
      // Reconnect with new voice
      this.disconnect();
      this.connect();
    }
  }

  public getVoice(): string {
    return this.voiceName;
  }

  public getState(): LiveSessionState {
    return this.state;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getIsConnected(): boolean {
    return this.isConnected();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.recorder.setMuted(muted);
    this.streamer.setMuted(muted);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(volume: number) {
    this.streamer.setVolume(volume);
  }

  public getStreamer(): AudioStreamer {
    return this.streamer;
  }

  public getRecorder(): AudioRecorder {
    return this.recorder;
  }

  /**
   * Combined frequency data for the reactive visualizer
   */
  public getVisualizerData(): { outputData: Uint8Array; inputData: Uint8Array } {
    return {
      outputData: this.streamer.getFrequencyData(),
      inputData: this.recorder.getFrequencyData(),
    };
  }

  public getVadMetrics(): { noiseFloor: number; vadThreshold: number; currentRms: number; isCalibrated: boolean } {
    return {
      noiseFloor: this.recorder.getNoiseFloor(),
      vadThreshold: this.recorder.getVadThreshold(),
      currentRms: this.recorder.getCurrentRms(),
      isCalibrated: this.recorder.isCalibrated(),
    };
  }

  /**
   * Connect to Gemini Live audio-to-audio session
   */
  public async connect(): Promise<boolean> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return true;
    }

    if (!navigator.onLine) {
      this.setState('error');
      this.callbacks.onError?.('No internet connection available.');
      return false;
    }

    this.isManuallyClosed = false;
    this.clearReconnect();
    this.setState('connecting');

    try {
      await this.streamer.resume();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(this.voiceName)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.reconnectAttempts = 0;
        const micOk = await this.recorder.start();
        if (micOk) {
          this.setState('listening');
        } else {
          this.callbacks.onError?.('Microphone access was not granted.');
          this.disconnect();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('LiveSession WebSocket error:', err);
      };

      this.ws.onclose = (event) => {
        this.handleDisconnect(event);
      };

      return true;
    } catch (err: any) {
      console.error('LiveSession connect failed:', err);
      this.setState('error');
      this.callbacks.onError?.(err?.message || 'Failed to start Live session');
      return false;
    }
  }

  private reconnect() {
    if (this.isManuallyClosed || this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 5000);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle Disconnect & Cleanup
   */
  public disconnect() {
    this.isManuallyClosed = true;
    this.clearReconnect();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.recorder.stop();
    this.streamer.stop();
    this.setState('disconnected');
  }

  private handleDisconnect(event?: CloseEvent) {
    this.ws = null;
    this.recorder.stop();
    this.streamer.stop();
    if (!this.isManuallyClosed) {
      if (this.reconnectAttempts < this.maxReconnectAttempts && navigator.onLine) {
        this.reconnect();
      } else {
        this.setState('disconnected');
      }
    } else {
      this.setState('disconnected');
    }
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Handles incoming server events from Gemini Live
   */
  private handleServerMessage(data: any) {
    switch (data.type) {
      case 'audio':
        if (data.audio && !this.isMuted) {
          this.streamer.playChunk(data.audio);
        }
        break;

      case 'interrupted':
        // User interrupted the assistant while speaking: halt audio immediately
        this.streamer.stop();
        this.setState('listening');
        break;

      case 'inputTranscription':
        if (data.text) {
          this.callbacks.onInputTranscription?.(data.text);
        }
        break;

      case 'outputTranscription':
        if (data.text) {
          this.callbacks.onOutputTranscription?.(data.text);
        }
        break;

      case 'action':
        if (data.action) {
          this.executeBrowserAction(data.action);
          this.callbacks.onAction?.(data.action);
        }
        break;

      case 'turnComplete':
        this.callbacks.onTurnComplete?.();
        if (!this.streamer.isPlaying()) {
          this.setState('listening');
        }
        break;

      case 'error':
        this.setState('error');
        this.callbacks.onError?.(data.error || 'Live Voice error occurred');
        break;
    }
  }

  /**
   * Directly executes browser actions (e.g. open website, search web, etc.)
   */
  private executeBrowserAction(action: AssistantAction) {
    try {
      if (action.type === 'open_url' && action.url) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      } else if (action.type === 'google' && action.url) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      } else if (action.type === 'youtube' && action.url) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      } else if (action.type === 'spotify' && action.url) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      } else if (action.type === 'whatsapp' && action.url) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.warn('Could not auto-open external window directly:', e);
    }
  }

  /**
   * Sends text prompt to the Live API session if triggered via prompt buttons
   */
  public sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
    }
  }

  /**
   * Streams a camera video frame or screenshot to the Live API in real-time
   */
  public sendImageFrame(base64Image: string, mimeType: string = 'image/jpeg') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      this.ws.send(
        JSON.stringify({
          type: 'realtime_image',
          image: cleanBase64,
          mimeType,
        })
      );
    }
  }

  private setState(newState: LiveSessionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange?.(newState);
    }
  }

  public destroy() {
    this.disconnect();
    this.streamer.close();
  }
}

export const liveSession = new LiveSession();
