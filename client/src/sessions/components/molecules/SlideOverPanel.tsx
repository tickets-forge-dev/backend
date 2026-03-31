'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SlideOverPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string;
  children: ReactNode;
}

export function SlideOverPanel({ open, onClose, title, subtitle, width = 'w-[480px]', children }: SlideOverPanelProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
      document.body.style.overflow = 'hidden';
    } else {
      setAnimating(false);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 ${width} max-w-full bg-[var(--bg)] border-l border-[var(--border-subtle)] flex flex-col transition-transform duration-300 ease-out ${
          animating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header — compact, Linear-style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
          <div className="min-w-0">
            <h3 className="text-[13px] font-medium text-[var(--text)]">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors shrink-0 ml-3"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </div>
    </>
  );
}
