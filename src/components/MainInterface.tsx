import React from 'react'
import { SessionState } from '../types'
import MicButton from './MicButton'
import StatusIndicator from './StatusIndicator'
import WaveformVisualizer from './WaveformVisualizer'

interface MainInterfaceProps {
  state: SessionState
  isListening: boolean
}

const MainInterface: React.FC<MainInterfaceProps> = ({ state, isListening }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-neon-pink to-neon-purple opacity-20 blur-3xl rounded-full animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-neon-cyan to-neon-green opacity-10 blur-3xl rounded-full animate-float" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Zoya Avatar */}
        <div className="relative">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan p-1">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-6xl font-bold bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                Z
              </span>
            </div>
          </div>
          {isListening && (
            <div className="absolute inset-0 rounded-full border-2 border-neon-pink animate-pulse-glow" />
          )}
        </div>

        {/* Status and Name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Zoya</h1>
          <StatusIndicator state={state} />
          <p className="text-neon-cyan text-sm mt-2">Your AI Companion</p>
        </div>

        {/* Waveform */}
        {isListening && <WaveformVisualizer />}

        {/* Mic Button */}
        <MicButton state={state} isListening={isListening} />
      </div>
    </div>
  )
}

export default MainInterface
