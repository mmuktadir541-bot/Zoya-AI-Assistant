import React, { useEffect, useRef } from 'react'

const WaveformVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const bars = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center gap-1 h-16"
    >
      {bars.map((_, index) => (
        <div
          key={index}
          className="w-1 bg-gradient-to-t from-neon-pink to-neon-purple rounded-full animate-waveform"
          style={{
            height: '0.5rem',
            animation: `waveform 0.5s ease-in-out infinite`,
            animationDelay: `${index * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

export default WaveformVisualizer
