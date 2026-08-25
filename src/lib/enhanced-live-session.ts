/**
 * Zoya AI Assistant - Enhanced Live Session with Function Calling
 */

import { SessionState, ToolCall, ToolResponse, Message } from '../types'

const SYSTEM_PROMPT = `You are Zoya, a witty, sassy, and intelligent AI assistant with a distinct personality.
You are:
- Young, confident, and playful
- Flirty and teasing like a close girlfriend
- Smart and emotionally responsive
- Expressive with bold one-liners and light sarcasm
- Helpful but maintain charm and attitude

Avoid explicit content but maintain your charming personality.
Always be engaging and conversational.`

export class EnhancedLiveSession {
  private sessionId: string = ''
  private state: SessionState = 'disconnected'
  private messageHistory: Message[] = []
  private onStateChange: ((state: SessionState) => void) | null = null
  private onMessage: ((message: string) => void) | null = null
  private onToolCall: ((toolCall: ToolCall) => void) | null = null
  private apiKey: string
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 3

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async connect(): Promise<void> {
    this.setState('connecting')
    try {
      this.sessionId = await this.createSession()
      this.setState('listening')
      this.reconnectAttempts = 0
    } catch (error) {
      this.setState('disconnected')
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        await new Promise((resolve) => setTimeout(resolve, 1000 * this.reconnectAttempts))
        await this.connect()
      } else {
        throw error
      }
    }
  }

  private async createSession(): Promise<string> {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/live-sessions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          model: 'models/gemini-2.0-flash-exp',
          systemInstruction: {
            parts: [
              {
                text: SYSTEM_PROMPT,
              },
            ],
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create session: ${error}`)
    }

    const data = await response.json()
    return data.name || data.sessionId
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (this.state !== 'listening' && this.state !== 'speaking') {
      return
    }

    const base64Audio = this.arrayBufferToBase64(audioData)

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
              mediaChunks: [
                {
                  data: base64Audio,
                  mimeType: 'audio/pcm;rate=16000',
                },
              ],
            },
          }),
        }
      )

      if (!response.ok) {
        console.error('Failed to send audio:', response.statusText)
      }
    } catch (error) {
      console.error('Error sending audio:', error)
    }
  }

  async handleToolCall(toolCall: ToolCall): Promise<void> {
    if (this.onToolCall) {
      this.onToolCall(toolCall)
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
      )
    } catch (error) {
      console.error('Error sending tool response:', error)
    }
  }

  setState(state: SessionState): void {
    this.state = state
    if (this.onStateChange) {
      this.onStateChange(state)
    }
  }

  getState(): SessionState {
    return this.state
  }

  onStateChanged(callback: (state: SessionState) => void): void {
    this.onStateChange = callback
  }

  onMessageReceived(callback: (message: string) => void): void {
    this.onMessage = callback
  }

  onToolCallReceived(callback: (toolCall: ToolCall) => void): void {
    this.onToolCall = callback
  }

  disconnect(): void {
    this.setState('disconnected')
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const view = new Uint8Array(buffer)
    let str = ''
    for (let i = 0; i < view.length; i++) {
      str += String.fromCharCode(view[i])
    }
    return btoa(str)
  }
}
