# Zoya - AI Assistant 🎀

A real-time, voice-to-voice AI assistant web app featuring **Zoya** - a witty, sassy, and intelligent female AI personality.

## Features 🌟

- **Real-time Voice Interaction**: Stream audio directly to Gemini Live API
- **Stunning UI**: Futuristic dark theme with neon glows and animations
- **Mobile-First Design**: Responsive interface for all devices
- **Audio Streaming**: PCM16 16kHz input → 24kHz output via Web Audio API
- **Visual Feedback**: Real-time status indicators, waveform visualizer
- **Function Calling**: Execute browser actions via tool calls
- **Personality**: Witty, flirty, and emotionally responsive conversations

## Tech Stack 🛠️

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Build**: Vite
- **API**: Google Gemini Live API
- **Audio**: Web Audio API

## Getting Started 🚀

### Prerequisites

- Node.js 18+
- Google Gemini API Key

### Installation

1. Clone the repository
```bash
git clone https://github.com/mmuktadir541-bot/Zoya-AI-Assistant.git
cd Zoya-AI-Assistant
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Add your Gemini API key to .env
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage 💬

1. Click the "Start" button to begin
2. Allow microphone access when prompted
3. Speak naturally - Zoya will respond in real-time
4. Click "Stop" to end the conversation

## Project Structure 📁

```
zoya-ai-assistant/
├── src/
│   ├── components/          # React components
│   │   ├── MainInterface.tsx
│   │   ├── MicButton.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── ChatHistory.tsx
│   │   ├── StatusIndicator.tsx
│   │   └── WaveformVisualizer.tsx
│   ├── lib/                 # Core logic
│   │   ├── audio-streamer.ts
│   │   └── live-session.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## Building for Production 📦

```bash
npm run build
```

The build output will be in the `dist/` directory.

## API Integration 🔌

### Gemini Live API

Zoya uses Google's Gemini Live API for real-time voice interactions:

- **Audio Input**: PCM16 at 16kHz (mono)
- **Audio Output**: 24kHz mono
- **Streaming**: Continuous bidirectional audio stream
- **Function Calling**: Support for browser actions via tool calls

## Customization 🎨

### Change Zoya's Personality

Edit the system prompt in `src/lib/live-session.ts` to customize Zoya's behavior and tone.

### Customize Colors

Modify the neon color palette in `tailwind.config.js`:

```javascript
neon: {
  pink: '#ff006e',
  purple: '#8338ec',
  cyan: '#00f5ff',
  green: '#3a86ff',
  orange: '#fb5607',
}
```

### Add More Functions

Extend the function calling system by adding new tools in `src/lib/live-session.ts`.

## Deployment 🌐

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add `REACT_APP_GEMINI_API_KEY` to environment variables
4. Deploy!

### Netlify

Similar process - connect GitHub repo and add environment variables.

## Troubleshooting 🔧

### Microphone access denied
- Check browser permissions
- Ensure HTTPS in production (localhost works for dev)

### No audio response
- Verify Gemini API key is correct
- Check browser console for errors
- Ensure sufficient API quota

### Poor audio quality
- Check microphone input levels
- Try adjusting audio settings in `src/lib/audio-streamer.ts`

## License 📄

MIT License - feel free to use this project for any purpose!

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## Support 💌

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ by mmuktadir541-bot**
