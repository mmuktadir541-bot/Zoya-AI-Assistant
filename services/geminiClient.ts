import { ChatMessage } from '../types';

export interface ChatResponse {
  reply: string;
  action?: any;
  emotion?: 'sassy' | 'flirty' | 'witty' | 'dramatic' | 'smart' | 'roasting' | 'neutral';
  source?: string;
}

export class GeminiClient {
  public static async sendMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        reply: data.reply || "Acha suno, samajh aa gaya!",
        action: data.action,
        emotion: data.emotion || 'sassy',
        source: data.source || 'gemini'
      };
    } catch (err) {
      console.warn("Server chat API error, falling back to instant client dialogue:", err);
      // Fast sassy fallback
      return {
        reply: "Uff! Thoda network issue lag raha hai, but don't worry, Zoya is right here with you!",
        emotion: 'dramatic',
        source: 'client_fallback'
      };
    }
  }

  public static async checkHealth(): Promise<{ status: string; hasApiKey: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { status: 'offline', hasApiKey: false };
  }
}
