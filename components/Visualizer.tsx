import React, { useEffect, useRef } from 'react';
import { AssistantState, VisualizerTheme } from '../types';
import { audioService } from '../services/audioService';

interface VisualizerProps {
  state: AssistantState;
  theme?: VisualizerTheme;
  interactive?: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  state,
  theme = 'gemini_glow',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Theme color palettes
  const getThemePalettes = (t: VisualizerTheme) => {
    switch (t) {
      case 'cyber_neon':
        return {
          primary: 'rgba(236, 72, 153, 0.85)', // Pink-500
          secondary: 'rgba(6, 182, 212, 0.85)', // Cyan-500
          tertiary: 'rgba(168, 85, 247, 0.75)', // Purple-500
          accent: 'rgba(244, 114, 182, 0.9)',
          core: 'rgba(255, 255, 255, 0.95)',
          glow: 'rgba(236, 72, 153, 0.35)',
        };
      case 'siri_wave':
        return {
          primary: 'rgba(59, 130, 246, 0.85)', // Blue
          secondary: 'rgba(147, 51, 234, 0.85)', // Purple
          tertiary: 'rgba(239, 68, 68, 0.75)', // Red/Coral
          accent: 'rgba(56, 189, 248, 0.9)',
          core: 'rgba(255, 255, 255, 0.95)',
          glow: 'rgba(99, 102, 241, 0.35)',
        };
      case 'aurora_bliss':
        return {
          primary: 'rgba(16, 185, 129, 0.85)', // Emerald
          secondary: 'rgba(6, 182, 212, 0.85)', // Cyan
          tertiary: 'rgba(139, 92, 246, 0.75)', // Violet
          accent: 'rgba(52, 211, 153, 0.9)',
          core: 'rgba(255, 255, 255, 0.95)',
          glow: 'rgba(16, 185, 129, 0.35)',
        };
      case 'gemini_glow':
      default:
        return {
          primary: 'rgba(99, 102, 241, 0.85)', // Indigo
          secondary: 'rgba(236, 72, 153, 0.85)', // Pink/Magenta
          tertiary: 'rgba(56, 189, 248, 0.8)', // Sky
          accent: 'rgba(168, 85, 247, 0.9)', // Purple
          core: 'rgba(255, 255, 255, 0.95)',
          glow: 'rgba(99, 102, 241, 0.35)',
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = Math.floor(entry.contentRect.width);
        height = Math.floor(entry.contentRect.height);
        if (width > 0 && height > 0) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
        }
      }
    });

    resizeObserver.observe(container);

    // Dynamic particles
    const particleCount = 45;
    const particles: Array<{
      x: number;
      y: number;
      angle: number;
      speed: number;
      radius: number;
      opacity: number;
      dist: number;
      maxDist: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: 0,
        y: 0,
        angle: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.6,
        radius: 1 + Math.random() * 2.5,
        opacity: 0.2 + Math.random() * 0.7,
        dist: 40 + Math.random() * 120,
        maxDist: 140 + Math.random() * 100,
      });
    }

    let time = 0;
    let smoothAmplitude = 0;

    const render = () => {
      time += 0.025;
      const freqData = audioService.getFrequencyData();
      
      // Calculate audio power
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        sum += freqData[i] || 0;
      }
      const rawAmplitude = sum / (32 * 255);
      smoothAmplitude += (rawAmplitude - smoothAmplitude) * 0.2;

      // Base boost depending on state
      let stateBoost = 0.08;
      if (state === 'listening') stateBoost = 0.25 + smoothAmplitude * 0.85;
      else if (state === 'speaking') stateBoost = 0.35 + smoothAmplitude * 0.95;
      else if (state === 'thinking') stateBoost = 0.22 + Math.sin(time * 6) * 0.1;

      const colors = getThemePalettes(theme);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.22;

      // 1. Draw outer ambient radial glow
      const outerGlowRadius = baseRadius * (1.8 + stateBoost * 0.6);
      const radialGradient = ctx.createRadialGradient(
        centerX, centerY, baseRadius * 0.3,
        centerX, centerY, outerGlowRadius
      );
      radialGradient.addColorStop(0, colors.glow);
      radialGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.12)');
      radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Floating Orbiting Particles
      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.angle += p.speed * 0.015 * (1 + stateBoost * 2);
        p.dist += Math.sin(time + i) * 0.3;

        const currentDist = p.dist * (1 + stateBoost * 0.4);
        const px = centerX + Math.cos(p.angle) * currentDist;
        const py = centerY + Math.sin(p.angle) * currentDist;

        ctx.fillStyle = i % 2 === 0 ? colors.accent : colors.secondary;
        ctx.globalAlpha = p.opacity * (0.4 + stateBoost * 0.6);
        ctx.beginPath();
        ctx.arc(px, py, p.radius * (1 + stateBoost * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Fluid Siri & Gemini Multi-Wave Layering
      const numWaves = 4;
      const points = 64;

      for (let w = 0; w < numWaves; w++) {
        ctx.save();
        ctx.beginPath();

        const waveOffset = (w * Math.PI) / 2;
        const waveSpeed = time * (1.5 + w * 0.3);
        const radiusMultiplier = 1 + w * 0.08 + stateBoost * 0.3;
        const currentRadius = baseRadius * radiusMultiplier;

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const freqIndex = Math.floor((i / points) * 24);
          const freqVal = (freqData[freqIndex] || 0) / 255;

          // Harmonic distortion
          const harmonic1 = Math.sin(angle * 3 + waveSpeed + waveOffset) * (8 + stateBoost * 24);
          const harmonic2 = Math.cos(angle * 5 - waveSpeed * 0.8) * (5 + stateBoost * 18);
          const freqDeform = freqVal * (25 * stateBoost);

          const r = currentRadius + harmonic1 + harmonic2 + freqDeform;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        // Wave Fill & Stroke Styling
        let waveGradient = ctx.createLinearGradient(
          centerX - currentRadius,
          centerY - currentRadius,
          centerX + currentRadius,
          centerY + currentRadius
        );

        if (w === 0) {
          waveGradient.addColorStop(0, colors.primary);
          waveGradient.addColorStop(1, colors.secondary);
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 2.5;
        } else if (w === 1) {
          waveGradient.addColorStop(0, colors.secondary);
          waveGradient.addColorStop(1, colors.tertiary);
          ctx.strokeStyle = colors.primary;
          ctx.lineWidth = 2;
        } else if (w === 2) {
          waveGradient.addColorStop(0, colors.tertiary);
          waveGradient.addColorStop(1, colors.accent);
          ctx.strokeStyle = colors.secondary;
          ctx.lineWidth = 1.5;
        } else {
          waveGradient.addColorStop(0, colors.accent);
          waveGradient.addColorStop(1, colors.primary);
          ctx.strokeStyle = colors.tertiary;
          ctx.lineWidth = 1;
        }

        ctx.globalAlpha = 0.25 + (w === 0 ? 0.3 : 0.15) * (1 + stateBoost * 0.8);
        ctx.fillStyle = waveGradient;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 4. Central Glowing Core Sphere
      ctx.save();
      const coreRadius = baseRadius * 0.55 * (1 + stateBoost * 0.35);
      const coreGradient = ctx.createRadialGradient(
        centerX - coreRadius * 0.2,
        centerY - coreRadius * 0.2,
        coreRadius * 0.1,
        centerX,
        centerY,
        coreRadius
      );
      coreGradient.addColorStop(0, colors.core);
      coreGradient.addColorStop(0.4, colors.accent);
      coreGradient.addColorStop(0.8, colors.primary);
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowColor = colors.accent;
      ctx.shadowBlur = 24 + stateBoost * 30;
      ctx.fill();
      ctx.restore();

      // 5. High-tech Orbiting Arc Rings
      ctx.save();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6 + stateBoost * 0.4;
      
      const ringRadius = baseRadius * 1.35;
      const rotAngle = time * (state === 'thinking' ? 4 : 1.2);
      
      // Arc 1
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, rotAngle, rotAngle + Math.PI * 0.6);
      ctx.stroke();

      // Arc 2
      ctx.beginPath();
      ctx.strokeStyle = colors.secondary;
      ctx.arc(centerX, centerY, ringRadius * 1.15, -rotAngle * 0.8, -rotAngle * 0.8 + Math.PI * 0.45);
      ctx.stroke();
      
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [state, theme]);

  return (
    <div
      ref={containerRef}
      id="zoya-visualizer-container"
      className="relative w-full h-full flex items-center justify-center pointer-events-none select-none"
    >
      <canvas
        ref={canvasRef}
        id="zoya-visualizer-canvas"
        className="w-full h-full block"
      />
    </div>
  );
};
