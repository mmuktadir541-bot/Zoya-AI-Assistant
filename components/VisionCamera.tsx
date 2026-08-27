import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Eye, Upload, RefreshCw, X, Image as ImageIcon, CheckCircle, Video, VideoOff } from 'lucide-react';
import { liveSession } from '../services/liveSession';

interface VisionCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onSendWithImage: (text: string, base64Image: string) => void;
  isLiveActive?: boolean;
}

export const VisionCamera: React.FC<VisionCameraProps> = ({
  isOpen,
  onClose,
  onSendWithImage,
  isLiveActive = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');
  const [isLiveVisionStreaming, setIsLiveVisionStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const liveIntervalRef = useRef<any>(null);

  // Start Camera
  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'user') => {
    try {
      setErrorMsg(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMsg('ক্যামেরা চালু করা সম্ভব হয়নি। পারমিশন চেক করুন বা স্ক্রিনশট আপলোড করুন।');
    }
  }, [stream]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    setIsLiveVisionStreaming(false);
  }, [stream]);

  // Open/Close effect
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(cameraFacing);
    } else if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setPromptText('');
      setErrorMsg(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Toggle Camera Facing (Front / Back)
  const toggleFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture Snapshot from Camera
  const captureSnapshot = (): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Handle Capture button
  const handleCapture = () => {
    const img = captureSnapshot();
    if (img) {
      setCapturedImage(img);
      stopCamera();
    }
  };

  // Handle File/Screenshot Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedImage(base64);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle Live Vision Streaming to Gemini Live
  const toggleLiveVision = () => {
    if (isLiveVisionStreaming) {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      setIsLiveVisionStreaming(false);
    } else {
      if (!stream) {
        startCamera(cameraFacing);
      }
      setIsLiveVisionStreaming(true);
      
      // Stream 1 frame every 1.2 seconds to avoid bandwidth saturation while maintaining real-time vision
      liveIntervalRef.current = setInterval(() => {
        const frame = captureSnapshot();
        if (frame) {
          liveSession.sendImageFrame(frame, 'image/jpeg');
        }
      }, 1200);
    }
  };

  // Submit Image + Question
  const handleSend = () => {
    if (!capturedImage) return;
    const q = promptText.trim() || 'এই স্ক্রিনশট / ছবিতে কী দেখতে পাচ্ছ? কাছাড়ের ভাষায় বুঝিয়ে বলো।';
    onSendWithImage(q, capturedImage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                জয়ার চোখ (Live Vision & Screenshot)
              </h2>
              <p className="text-[11px] text-slate-400">আমাকে দেখে দেখে বা স্ক্রিনশট দেখে কথা বলো</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col items-center gap-4">
          {errorMsg && (
            <div className="w-full p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Viewfinder / Preview Frame */}
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured or Uploaded preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
              />
            )}

            {/* Live Streaming Badge */}
            {isLiveVisionStreaming && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-bold flex items-center gap-1.5 animate-pulse shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE VISION STREAMING
              </div>
            )}

            {/* Flip Camera Button if Camera active */}
            {!capturedImage && stream && (
              <button
                type="button"
                onClick={toggleFacing}
                title="ক্যামেরা পরিবর্তন করুন"
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 border border-slate-700/80 shadow-lg cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Retake Button if image is captured */}
          {capturedImage && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera(cameraFacing);
                }}
                className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                আবার ছবি তুলুন / পরিবর্তন করুন
              </button>
            </div>
          )}

          {/* Prompt Question Input */}
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              জয়াকে কী প্রশ্ন বা নির্দেশ দিতে চান?
            </label>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="যেমন: 'এই ছবিতে কী আছে বলো', 'এই কোডের ভুল ধরো', 'আমাকে কেমন লাগছে?'..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Controls / Options */}
          <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
            {/* Upload Screenshot button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>স্ক্রিনশট / ফাইল আপলোড</span>
            </button>

            {/* Live Camera Streaming to Gemini Live Voice */}
            <button
              type="button"
              onClick={toggleLiveVision}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                isLiveVisionStreaming
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {isLiveVisionStreaming ? (
                <>
                  <VideoOff className="w-4 h-4 text-rose-400" />
                  <span>লাইভ ভিশন বন্ধ করুন</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>লাইভ দেখে কথা বলো</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3">
          {!capturedImage ? (
            <button
              type="button"
              onClick={handleCapture}
              disabled={!stream}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-600/20 disabled:opacity-50 transition-all active:scale-98"
            >
              <Camera className="w-4 h-4" />
              <span>ছবি / ফ্রেম স্ন্যাপ করুন</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
            >
              <CheckCircle className="w-4 h-4" />
              <span>জয়াকে ছবি ও প্রশ্ন পাঠান</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
