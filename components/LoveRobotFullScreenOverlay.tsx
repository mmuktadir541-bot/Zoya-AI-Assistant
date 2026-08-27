import React, { useState, useEffect, useRef } from 'react';
import { AssistantState } from '../types';
import { audioService } from '../services/audioService';
import { Heart, Sparkles, Volume2, Mic, Brain, MessageSquareHeart } from 'lucide-react';

interface LoveRobotFullScreenOverlayProps {
  state: AssistantState;
  emotion?: string;
  isAudioPlaying?: boolean;
  userTranscript?: string;
  assistantText?: string;
  onPoke?: () => void;
}

export const LoveRobotFullScreenOverlay: React.FC<LoveRobotFullScreenOverlayProps> = ({
  state,
  isAudioPlaying = false,
  userTranscript = '',
  assistantText = '',
  onPoke,
}) => {
  const [mouthFrame, setMouthFrame] = useState(0);
  const [mouthScale, setMouthScale] = useState(1);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPoked, setIsPoked] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; left: number; size: number; duration: number }>>([]);
  const animFrameRef = useRef<number | null>(null);

  const isSpeaking = state === 'speaking' || isAudioPlaying;
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const isUserSpeaking = isListening || (userTranscript.length > 0 && state !== 'speaking');

  // Real-time Audio Level Detection (Microphone and Assistant Voice)
  useEffect(() => {
    let active = true;

    const checkAudioLevel = () => {
      if (!active) return;

      const freqData = audioService.getFrequencyData();
      let sum = 0;
      const count = Math.min(freqData.length, 48);
      for (let i = 0; i < count; i++) {
        sum += freqData[i];
      }
      const avg = count > 0 ? sum / count : 0;
      const normalizedLevel = Math.min(1, avg / 80);

      setAudioLevel(normalizedLevel);

      // If there is active audio energy or assistant is speaking or user is listening
      if (isSpeaking || isListening || normalizedLevel > 0.12) {
        setMouthScale(1 + normalizedLevel * 0.4);
      } else {
        setMouthScale(1);
      }

      animFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    animFrameRef.current = requestAnimationFrame(checkAudioLevel);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSpeaking, isListening]);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3200 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Lip-Sync & Speaking / Listening Mouth Frame cycle
  useEffect(() => {
    // When robot speaks OR when user speaks (isListening / isUserSpeaking)
    if (!isSpeaking && !isListening) {
      setMouthFrame(0);
      return;
    }

    const speed = isSpeaking ? 110 : 140;
    const interval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4);
    }, speed);

    return () => clearInterval(interval);
  }, [isSpeaking, isListening]);

  // Floating hearts rising from the love potion beaker
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const newHeart = {
        id: Date.now() + Math.random(),
        left: 36 + Math.random() * 28, // centered around potion beaker
        size: 16 + Math.random() * 18,
        duration: 2.8 + Math.random() * 2,
      };

      setFloatingHearts((prev) => [...prev.slice(-16), newHeart]);
    }, (isSpeaking || isListening) ? 350 : 900);

    return () => clearInterval(spawnInterval);
  }, [isSpeaking, isListening]);

  const handlePoke = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 1400);

    const burst = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      left: 30 + Math.random() * 40,
      size: 20 + Math.random() * 16,
      duration: 1.8 + Math.random() * 1,
    }));
    setFloatingHearts((prev) => [...prev, ...burst]);

    if (onPoke) {
      onPoke();
    }
  };

  return (
    <div
      onClick={handlePoke}
      title="আমাকে টাচ করো বা কথা বলো (Tap robot to talk!)"
      className="relative flex-1 w-full flex flex-col items-center justify-center cursor-pointer select-none"
    >
      {/* Floating Love Potion Hearts on Full Screen */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {floatingHearts.map((h) => (
          <div
            key={h.id}
            style={{
              left: `${h.left}%`,
              bottom: '22%',
              animation: `floatUp ${h.duration}s ease-out forwards`,
            }}
            className="absolute text-pink-400 opacity-90 drop-shadow-[0_0_12px_rgba(236,72,153,1)]"
          >
            <Heart
              style={{ width: `${h.size}px`, height: `${h.size}px` }}
              className="fill-pink-500 text-pink-300 animate-pulse"
            />
          </div>
        ))}
      </div>

      {/* Floating Interactive Speech / Mood Badge */}
      <div className="relative z-20 mb-auto mt-2 pointer-events-auto">
        {isSpeaking ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-pink-500/60 backdrop-blur-md shadow-xl shadow-pink-500/25 text-xs font-semibold text-pink-200 animate-bounce">
            <Volume2 className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>আমি মুখে কথা কইরাম... 💖</span>
          </div>
        ) : isListening ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-cyan-400/70 backdrop-blur-md shadow-xl shadow-cyan-500/25 text-xs font-semibold text-cyan-200 animate-pulse">
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
            <span>তুমি কথা কও, আমি মুখে শুনে নড়ছি... 🎙️✨</span>
          </div>
        ) : isThinking ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-purple-500/60 backdrop-blur-md shadow-xl text-xs font-semibold text-purple-200">
            <Brain className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>ভাবিয়া উত্তর সাজাইরাম... 🧠</span>
          </div>
        ) : isPoked ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-pink-400 backdrop-blur-md shadow-xl text-xs font-semibold text-pink-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            <span>হিহিহি! আদর পাইলাম! 🥰</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/70 border border-pink-500/30 backdrop-blur-md text-[11px] font-medium text-pink-200/90">
            <MessageSquareHeart className="w-3 h-3 text-pink-400" />
            <span>রোবট জয়া • কথা বলো বা টাচ করো 🌸</span>
          </div>
        )}
      </div>

      {/* 
        TALKING MOUTH ANIMATION DIRECTLY ON FULL SCREEN ROBOT FACE
        Active when:
        1. User is speaking (state === 'listening' or active mic input)
        2. Robot is speaking (state === 'speaking' || isAudioPlaying)
      */}
      <div
        className="relative z-20 pointer-events-none flex flex-col items-center justify-center my-auto transition-transform duration-150"
        style={{ transform: `scale(${mouthScale})` }}
      >
        {/* Animated Talking Mouth Overlay */}
        {(isSpeaking || isListening || audioLevel > 0.08) ? (
          <div className="relative flex flex-col items-center animate-in zoom-in duration-200">
            {/* Frame 0: Wide open talking mouth */}
            {mouthFrame === 0 && (
              <div className="w-12 h-6 bg-gradient-to-b from-pink-500 to-rose-950 rounded-full border-2 border-pink-300 shadow-[0_0_20px_rgba(244,114,182,1)] animate-pulse" />
            )}
            {/* Frame 1: Circular 'O' vocal mouth shape */}
            {mouthFrame === 1 && (
              <div className="w-9 h-9 bg-gradient-to-b from-pink-400 to-purple-950 rounded-full border-2 border-pink-200 shadow-[0_0_24px_rgba(236,72,153,1)]" />
            )}
            {/* Frame 2: Joyful wide open smiling mouth */}
            {mouthFrame === 2 && (
              <div className="w-14 h-5 bg-gradient-to-b from-pink-500 to-rose-900 rounded-b-full border-2 border-pink-300 shadow-[0_0_18px_rgba(244,114,182,0.9)]" />
            )}
            {/* Frame 3: Articulated talking mouth */}
            {mouthFrame === 3 && (
              <div className="w-10 h-5 bg-gradient-to-b from-pink-400 to-rose-950 rounded-full border-2 border-pink-200 shadow-[0_0_18px_rgba(244,114,182,1)]" />
            )}

            {/* Glowing sound wave ripples radiating around the mouth */}
            <div className={`absolute -inset-3 rounded-full border-2 border-pink-400/60 animate-ping pointer-events-none ${isListening ? 'border-cyan-400/60' : 'border-pink-400/60'}`} />
            <div className="absolute -inset-6 rounded-full border border-pink-400/30 animate-pulse pointer-events-none" />
          </div>
        ) : isPoked ? (
          /* Laughing mouth when poked */
          <div className="w-11 h-5 bg-gradient-to-b from-pink-500 to-rose-950 rounded-b-full border-2 border-pink-300 shadow-[0_0_14px_rgba(244,114,182,0.9)] animate-pulse" />
        ) : isThinking ? (
          /* Curious thinking mouth */
          <div className="w-6 h-6 bg-purple-950/80 rounded-full border-2 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-pulse" />
        ) : (
          /* Sweet subtle resting smile */
          <div className="w-8 h-2 bg-pink-400/80 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
        )}
      </div>

      {/* Subtle Bottom Instruction */}
      <div className="relative z-20 mt-auto mb-2 pointer-events-none">
        <span className="text-[11px] text-pink-200/80 font-medium px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-sm border border-pink-500/20">
          {isListening ? '🎙️ আপনি কথা বলুন, রোবটের মুখ নড়ছে...' : 'স্ক্রিনে টাচ করে বা নিচে মাইকে চাপ দিয়ে কথা বলুন 💖'}
        </span>
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0px) scale(0.6);
            opacity: 0;
          }
          25% {
            opacity: 1;
            transform: translateY(-50px) scale(1);
          }
          100% {
            transform: translateY(-220px) scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
