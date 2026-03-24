'use client';

import { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  stream: MediaStream | null;
}

/**
 * VoiceWaveform — Compact real-time audio visualizer for inline button use.
 *
 * Thin vertical lines that respond to actual voice input.
 * High noise floor so ambient noise doesn't trigger movement.
 * Designed to fit inside a button (20px tall, ~60px wide).
 */
export function VoiceWaveform({ stream }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.85;
    analyser.minDecibels = -70;
    analyser.maxDecibels = -10;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const BAR_COUNT = 12;
    const BAR_WIDTH = 1.5;
    const BAR_GAP = 2.5;
    const NOISE_FLOOR = 0.15; // Ignore values below this (cuts ambient noise)

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

      const centerY = height / 2;
      const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        // Sample mid-range frequencies (skip rumble and hiss)
        const dataIndex = Math.min(Math.floor((i + 3) * (bufferLength / (BAR_COUNT + 8))), bufferLength - 1);
        let value = dataArray[dataIndex] / 255;

        // Apply noise floor — below threshold shows as idle line
        value = value > NOISE_FLOOR ? (value - NOISE_FLOOR) / (1 - NOISE_FLOOR) : 0;

        // Idle: thin 2px line, active: scales up to 80% of height
        const minHeight = 2;
        const barHeight = Math.max(minHeight, value * (height * 0.8));

        const x = startX + i * (BAR_WIDTH + BAR_GAP);
        const y = centerY - barHeight / 2;

        // Subtle: low-opacity white when idle, brighter when voice detected
        const opacity = value > 0 ? 0.5 + value * 0.5 : 0.25;
        ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`; // red-500 matching the stop button
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, BAR_WIDTH / 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '48px', height: '16px' }}
    />
  );
}
