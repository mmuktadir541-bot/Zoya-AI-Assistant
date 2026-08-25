import React from 'react'
import { SessionState } from '../types'

interface MicButtonProps {
  state: SessionState
  isListening: boolean
}

const MicButton: React.FC<MicButtonProps> = ({ state, isListening }) => {
  const isActive = isListening && (state === 'listening' || state === 'speaking')

  return (
    <button
      className={`relative w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-110 ${
        isActive
          ? 'bg-gradient-to-br from-neon-pink to-neon-purple shadow-lg shadow-neon-pink/50 animate-pulse-glow'
          : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg shadow-slate-900/50'
      }`}
      aria-label="Toggle microphone"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 2C8.9 2 8 2.9 8 4v6c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12c-2.7 0-5-2-5-4.5V10c0-.6.4-1 1-1s1 .4 1 1v3.5c0 1.9 1.6 3.5 3.5 3.5S13.5 15.4 13.5 13.5V10c0-.6.4-1 1-1s1 .4 1 1v3.5c0 2.5-2.3 4.5-5 4.5z" />
        </svg>
      </div>
    </button>
  )
}

export default MicButton
