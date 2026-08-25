/**
 * Zoya AI Assistant - Enhanced Audio Processing
 * Handles advanced audio streaming with better quality and error handling
 */

import { AudioConfig } from '../types'

export class EnhancedAudioStreamer {
  private audioContext: AudioContext
  private mediaStream: MediaStream | null = null
  private processor: AudioWorkletNode | null = null
  private analyser: AnalyserNode | null = null
  private config: AudioConfig
  private onDataCallback: ((data: ArrayBuffer) => void) | null = null
  private isActive: boolean = false
  private frequencyData: Uint8Array | null = null

  constructor(config: AudioConfig = { sampleRate: 16000, channels: 1, bitDepth: 16 }) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: config.sampleRate,
    })
    this.config = config
  }

  async start(onData: (data: ArrayBuffer) => void): Promise<void> {
    if (this.isActive) return

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: this.config.sampleRate },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: { ideal: this.config.channels },
        },
      })

      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)

      const scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1)
      this.onDataCallback = onData

      scriptProcessor.onaudioprocess = (event) => {
        const audioData = event.inputBuffer.getChannelData(0)
        const pcm16 = this.floatTo16BitPCM(audioData)
        onData(pcm16.buffer)

        if (this.analyser && this.frequencyData) {
          this.analyser.getByteFrequencyData(this.frequencyData)
        }
      }

      source.connect(this.analyser)
      this.analyser.connect(scriptProcessor)
      scriptProcessor.connect(this.audioContext.destination)

      this.isActive = true
    } catch (error) {
      console.error('Failed to start audio stream:', error)
      throw error
    }
  }

  stop(): void {
    this.isActive = false

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }
  }

  playAudio(data: ArrayBuffer): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const audioData = new Float32Array(data)
    const source = this.audioContext.createBufferSource()
    const buffer = this.audioContext.createBuffer(1, audioData.length, 24000)
    buffer.getChannelData(0).set(audioData)
    source.buffer = buffer
    source.connect(this.audioContext.destination)
    source.start(0)
  }

  getFrequencyData(): Uint8Array | null {
    return this.frequencyData
  }

  getVolume(): number {
    if (!this.frequencyData) return 0
    const sum = this.frequencyData.reduce((a, b) => a + b, 0)
    return (sum / this.frequencyData.length) * 100
  }

  private floatTo16BitPCM(floatArray: Float32Array): Int16Array {
    const pcm16 = new Int16Array(floatArray.length)
    for (let i = 0; i < floatArray.length; i++) {
      const s = Math.max(-1, Math.min(1, floatArray[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return pcm16
  }

  dispose(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}
