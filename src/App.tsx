import React, { useState, useEffect, useRef } from 'react'
import { AudioStreamer } from './lib/audio-streamer'
import { LiveSession } from './lib/live-session'
import { SessionState, ToolCall } from './types'
import MainInterface from './components/MainInterface'
import ControlPanel from './components/ControlPanel'
import ChatHistory from './components/ChatHistory'
import ToolCaller from './components/ToolCaller'

const App: React.FC = () => {
  const [state, setState] = useState<SessionState>('disconnected')
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null)
  const audioStreamerRef = useRef<AudioStreamer | null>(null)
  const sessionRef = useRef<LiveSession | null>(null)
  const apiKeyRef = useRef<string>(process.env.REACT_APP_GEMINI_API_KEY || '')

  useEffect(() => {
    return () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.dispose()
      }
      if (sessionRef.current) {
        sessionRef.current.disconnect()
      }
    }
  }, [])

  const handleStart = async () => {
    try {
      if (!apiKeyRef.current) {
        alert('Please set REACT_APP_GEMINI_API_KEY environment variable')
        return
      }

      setIsListening(true)

      // Initialize audio streamer
      audioStreamerRef.current = new AudioStreamer({
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16,
      })

      // Initialize live session
      sessionRef.current = new LiveSession(apiKeyRef.current)

      // Setup callbacks
      sessionRef.current.onStateChanged((newState) => {
        setState(newState)
      })

      sessionRef.current.onMessageReceived((message) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: message }])
      })

      sessionRef.current.onToolCallReceived((toolCall) => {
        setCurrentToolCall(toolCall)
      })

      // Start audio stream
      await audioStreamerRef.current.start((audioData) => {
        if (sessionRef.current && state !== 'disconnected') {
          sessionRef.current.sendAudio(audioData)
        }
      })

      // Connect to Gemini Live API
      await sessionRef.current.connect()
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setIsListening(false)
      setState('disconnected')
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStop = () => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop()
    }
    if (sessionRef.current) {
      sessionRef.current.disconnect()
    }
    setIsListening(false)
    setState('disconnected')
  }

  const handleToolResponse = async (response: { toolCallId: string; result: unknown }) => {
    if (sessionRef.current) {
      await sessionRef.current.sendToolResponse(response)
    }
    setCurrentToolCall(null)
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex flex-col items-center justify-center overflow-hidden">
      {currentToolCall && (
        <ToolCaller toolCall={currentToolCall} onResponse={handleToolResponse} />
      )}
      <MainInterface state={state} isListening={isListening} />
      <ControlPanel onStart={handleStart} onStop={handleStop} isActive={isListening} />
      <ChatHistory messages={messages} />
    </div>
  )
}

export default App
