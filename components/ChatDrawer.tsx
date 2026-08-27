import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Volume2, Trash2, ExternalLink, Flame, Sparkles } from 'lucide-react';
import { ChatMessage, AssistantAction } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  onReplayAudio: (text: string) => void;
  onExecuteAction: (action: AssistantAction) => void;
  disabled?: boolean;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onClearHistory,
  onReplayAudio,
  onExecuteAction,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none">
      <div
        id="zoya-chat-drawer"
        className="w-full max-w-md h-full bg-slate-950/95 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Conversation Log</h2>
              <p className="text-[11px] text-slate-400">Zoya AI Sassy Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                id="btn-clear-chat-history"
                type="button"
                onClick={onClearHistory}
                title="Clear Chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-close-chat-drawer"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Sparkles className="w-10 h-10 text-pink-500/40 animate-pulse" />
              <p className="text-sm font-medium text-slate-400">No messages yet!</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Speak by pressing the mic button or type your query below. Ask to play YouTube, search Spotify, send WhatsApp, or roast Muktadir!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      isUser
                        ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300'
                        : 'bg-pink-600/30 border-pink-500/40 text-pink-300'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs sm:text-sm shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {!isUser && msg.emotion && (
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-pink-400">
                        {msg.emotion === 'roasting' && <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        <span className="uppercase tracking-wider">
                          {msg.emotion === 'roasting' ? 'Muktadir Roast' : msg.emotion}
                        </span>
                      </div>
                    )}

                    {/* Image Attachment (Screenshot or Photo) */}
                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-slate-700/80 bg-black/40">
                        <img
                          src={msg.image}
                          alt="Attached Screenshot or Snapshot"
                          className="max-h-48 w-full object-contain"
                        />
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Action button if attached */}
                    {msg.action && msg.action.url && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onExecuteAction(msg.action!)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-[11px] font-semibold text-pink-300 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{msg.action.title}</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Audio Replay & Timestamp */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => onReplayAudio(msg.text)}
                          title="Replay Audio"
                          className="hover:text-pink-300 transition-colors p-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Text Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-2"
        >
          <input
            id="chat-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or command for Zoya..."
            disabled={disabled}
            className="flex-1 bg-slate-950 border border-slate-700/70 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
          />
          <button
            id="btn-send-chat-text"
            type="submit"
            disabled={!inputText.trim() || disabled}
            className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
