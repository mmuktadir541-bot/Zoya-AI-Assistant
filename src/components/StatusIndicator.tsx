import React from 'react'
import { SessionState } from '../types'

interface StatusIndicatorProps {
  state: SessionState
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
  const statusConfig = {
    disconnected: {
      color: 'text-slate-400',
      label: 'Ready to chat',
      icon: '⭕',
      bgColor: 'bg-slate-500/20',
    },
    connecting: {
      color: 'text-neon-orange',
      label: 'Connecting...',
      icon: '🔄',
      bgColor: 'bg-orange-500/20',
    },
    listening: {
      color: 'text-neon-cyan',
      label: 'Listening...',
      icon: '🎤',
      bgColor: 'bg-cyan-500/20',
    },
    speaking: {
      color: 'text-neon-pink',
      label: 'Speaking...',
      icon: '🗣️',
      bgColor: 'bg-pink-500/20',
    },
    thinking: {
      color: 'text-neon-purple',
      label: 'Thinking...',
      icon: '💭',
      bgColor: 'bg-purple-500/20',
    },
  }

  const config = statusConfig[state]

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full ${config.bgColor} backdrop-blur`}
    >
      <span className={`text-xl ${config.color}`}>{config.icon}</span>
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}

export default StatusIndicator
