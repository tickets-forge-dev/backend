'use client';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SlideOverPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string;  // Tailwind width class, default 'w-[480px]'
  children: ReactNode;
}

export function SlideOverPanel({ open, onClose, title, subtitle, width = 'w-[480px]', children }: SlideOverPanelProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 ${width} max-w-full bg-[var(--bg)] border-l border-[var(--border-subtle)] flex flex-col animate-in slide-in-from-right duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-[14px] font-medium text-[var(--text-primary)]">{title}</h3>
            {subtitle && (
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
