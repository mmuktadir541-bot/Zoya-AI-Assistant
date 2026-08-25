import { SessionState, ToolCall, ToolResponse, Message } from '../types';

export class LiveSession {
  private sessionId: string = '';
  private state: SessionState = 'disconnected';
  private messageHistory: Message[] = [];
  private onStateChange: ((state: SessionState) => void) | null = null;
  private onMessage: ((message: string) => void) | null = null;
  private onToolCall: ((toolCall: ToolCall) => void) | null = null;
  private ws: WebSocket | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    try {
      // Initialize Gemini Live API connection
      this.sessionId = await this.createSession();
      this.setState('listening');
    } catch (error) {
      this.setState('disconnected');
      throw error;
    }
  }

  private async createSession(): Promise<string> {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/live-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: 'models/gemini-2.0-flash-exp',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.name || data.sessionId;
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (this.state !== 'listening' && this.state !== 'speaking') {
      return;
    }

    // Send audio to Gemini Live API
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${this.sessionId}:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                data: base64Audio,
                mimeType: 'audio/pcm;rate=16000',
              }],
            },
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send audio:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  }

  async handleToolCall(toolCall: ToolCall): Promise<void> {
    if (this.onToolCall) {
      this.onToolCall(toolCall);
    }
  }

  async sendToolResponse(response: ToolResponse): Promise<void> {
    try {
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${this.sessionId}:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            toolResponse: {
              toolCallId: response.toolCallId,
              response: response.result,
            },
          }),
        }
      );
    } catch (error) {
      console.error('Error sending tool response:', error);
    }
  }

  setState(state: SessionState): void {
    this.state = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  getState(): SessionState {
    return this.state;
  }

  onStateChanged(callback: (state: SessionState) => void): void {
    this.onStateChange = callback;
  }

  onMessageReceived(callback: (message: string) => void): void {
    this.onMessage = callback;
  }

  onToolCallReceived(callback: (toolCall: ToolCall) => void): void {
    this.onToolCall = callback;
  }

  disconnect(): void {
    this.setState('disconnected');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
