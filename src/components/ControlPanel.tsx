import React from 'react'

interface ControlPanelProps {
  onStart: () => void
  onStop: () => void
  isActive: boolean
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onStart, onStop, isActive }) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex gap-4 items-center justify-center">
        <button
          onClick={isActive ? onStop : onStart}
          className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
            isActive
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
              : 'bg-gradient-to-r from-neon-green to-neon-cyan text-black shadow-lg shadow-neon-green/50'
          }`}
        >
          {isActive ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  )
}

export default ControlPanel
