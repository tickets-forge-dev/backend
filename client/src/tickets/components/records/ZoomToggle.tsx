'use client';

import { ZoomIn, ZoomOut } from 'lucide-react';

export type ZoomLevel = 'hour' | 'day' | 'week' | 'month';
const LEVELS: ZoomLevel[] = ['hour', 'day', 'week', 'month'];
const LABELS: Record<ZoomLevel, string> = { hour: 'Hours', day: 'Days', week: 'Weeks', month: 'Months' };

interface ZoomToggleProps {
  zoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
}

export function ZoomToggle({ zoom, onZoomChange }: ZoomToggleProps) {
  const idx = LEVELS.indexOf(zoom);

  return (
    <div className="flex items-center h-7 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-0.5">
      <button
        onClick={() => idx > 0 && onZoomChange(LEVELS[idx - 1])}
        disabled={idx === 0}
        className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-25"
        title="Zoom in"
      >
        <ZoomIn className="w-3 h-3 text-[var(--text-tertiary)]" />
      </button>
      <span className="text-[10px] text-[var(--text-tertiary)] w-[38px] text-center select-none">
        {LABELS[zoom]}
      </span>
      <button
        onClick={() => idx < LEVELS.length - 1 && onZoomChange(LEVELS[idx + 1])}
        disabled={idx === LEVELS.length - 1}
        className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-25"
        title="Zoom out"
      >
        <ZoomOut className="w-3 h-3 text-[var(--text-tertiary)]" />
      </button>
    </div>
  );
}
