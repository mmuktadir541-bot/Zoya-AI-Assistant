module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff006e',
          purple: '#8338ec',
          cyan: '#00f5ff',
          green: '#3a86ff',
          orange: '#fb5607',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'waveform': 'waveform 0.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(255, 0, 110, 0.5)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 40px rgba(255, 0, 110, 0.8)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'waveform': {
          '0%, 100%': { height: '0.5rem' },
          '50%': { height: '2rem' },
        },
      },
    },
  },
  plugins: [],
}