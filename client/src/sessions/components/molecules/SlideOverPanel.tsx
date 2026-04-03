'use client';
import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';

interface SlideOverPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string;
  children: ReactNode;
}

/** Extract pixel value from Tailwind width class like "w-[480px]" → "480px" */
function extractWidth(cls: string): string | null {
  const m = cls.match(/w-\[(.+)\]/);
  return m ? m[1] : null;
}

export function SlideOverPanel({ open, onClose, title, subtitle, width = 'w-[480px]', children }: SlideOverPanelProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const panelWidth = useMemo(() => extractWidth(width), [width]);

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
      {/* Backdrop — hidden on mobile since panel is full-screen */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 hidden sm:block ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      {/* Panel — full-screen on mobile, side panel on sm+ */}
      <div
        className={`fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 z-50 bg-[var(--bg)] sm:border-l sm:border-[var(--border-subtle)] flex flex-col transition-transform duration-300 ease-out ${
          animating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={panelWidth ? { '--panel-width': panelWidth } as React.CSSProperties : undefined}
      >
        {/* Apply desktop width via CSS custom property — mobile stays full-screen */}
        {panelWidth && (
          <style>{`@media (min-width: 640px) { [style*="--panel-width"] { width: var(--panel-width); max-width: 100%; } }`}</style>
        )}
        {/* Header — back arrow on mobile, X on desktop */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="sm:hidden p-1 -ml-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h3 className="text-[13px] font-medium text-[var(--text)]">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="hidden sm:block p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors shrink-0 ml-3"
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
