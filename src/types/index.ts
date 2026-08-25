export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export type SessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'thinking';

export interface ToolCall {
  id: string;
  function: string;
  args: Record<string, unknown>;
}

export interface ToolResponse {
  toolCallId: string;
  result: unknown;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ZoyaConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
}