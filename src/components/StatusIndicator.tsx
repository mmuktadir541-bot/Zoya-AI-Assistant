import React from 'react'
import { SessionState } from '../types'

interface StatusIndicatorProps {
  state: SessionState
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
  const statusConfig = {
    disconnected: { color: 'text-slate-400', label: 'Ready to chat', icon: '○' },
    connecting: { color: 'text-neon-orange', label: 'Connecting...', icon: '◐' },
    listening: { color: 'text-neon-cyan', label: 'Listening...', icon: '◑' },
    speaking: { color: 'text-neon-pink', label: 'Speaking...', icon: '◒' },
    thinking: { color: 'text-neon-purple', label: 'Thinking...', icon: '◓' },
  }

  const config = statusConfig[state]

  return (
    <div className="flex items-center justify-center gap-2">
      <span className={`text-lg font-bold ${config.color} animate-pulse`}>{config.icon}</span>
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}

export default StatusIndicator
