'use client';

import { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  stream: MediaStream | null;
  className?: string;
}

/**
 * VoiceWaveform — Real-time audio visualizer driven by actual mic input.
 *
 * Uses Web Audio API AnalyserNode to read frequency data from the mic stream
 * and renders animated bars that react to the user's voice in real time.
 */
export function VoiceWaveform({ stream, className = '' }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    contextRef.current = audioCtx;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const BAR_COUNT = 24;
    const BAR_GAP = 2;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;
      const centerY = height / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        // Sample from the frequency data (skip very low frequencies)
        const dataIndex = Math.min(Math.floor((i + 2) * (bufferLength / (BAR_COUNT + 4))), bufferLength - 1);
        const value = dataArray[dataIndex] / 255;

        // Minimum bar height so it looks alive even in silence
        const minHeight = 2;
        const barHeight = Math.max(minHeight, value * (height * 0.8));

        const x = i * (barWidth + BAR_GAP);
        const y = centerY - barHeight / 2;

        // Gradient from purple to blue based on amplitude
        const hue = 260 - value * 30; // purple → blue
        const lightness = 50 + value * 15;
        ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioCtx.close();
      contextRef.current = null;
      analyserRef.current = null;
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height: '32px' }}
    />
  );
}
