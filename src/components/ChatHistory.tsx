import React from 'react'

interface ChatHistoryProps {
  messages: Array<{ role: string; content: string }>
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  if (messages.length === 0) return null

  return (
    <div className="fixed bottom-32 right-8 max-w-md max-h-64 overflow-y-auto bg-slate-900/80 backdrop-blur border border-neon-pink/30 rounded-lg p-4">
      <div className="space-y-3">
        {messages.slice(-5).map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm ${
              msg.role === 'assistant'
                ? 'text-neon-cyan'
                : 'text-neon-pink'
            }`}
          >
            <span className="font-bold">{msg.role === 'assistant' ? 'Zoya' : 'You'}:</span>
            <p className="mt-1 text-xs opacity-90">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatHistory
