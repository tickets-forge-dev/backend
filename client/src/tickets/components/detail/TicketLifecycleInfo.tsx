'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LIFECYCLE_STEPS, EXECUTE_STATUSES, TICKET_STATUS_CONFIG } from '../../config/ticketStatusConfig';

function LifecyclePanel({ currentStatus, onTransition }: { currentStatus: string; onTransition?: (status: string) => void }) {
  // Always 4 fixed steps. Executing/complete all map to the "Forged" step.
  const currentIdx = LIFECYCLE_STEPS.findIndex(
    (s) => s.key === currentStatus || (s.key === 'forged' && EXECUTE_STATUSES.has(currentStatus)),
  );

  return (
    <div className="w-72 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] shadow-lg p-3">
      <p className="text-xs font-semibold text-[var(--text)] mb-3">Ticket Lifecycle</p>

      <div className="space-y-0">
        {LIFECYCLE_STEPS.map((step, i) => {
          const isCurrent =
            step.key === currentStatus ||
            (step.key === 'forged' && EXECUTE_STATUSES.has(currentStatus));
          const isLast = i === LIFECYCLE_STEPS.length - 1;
          const statusCfg = TICKET_STATUS_CONFIG[step.key];
          const isClickable = onTransition && !isCurrent;
          const isBefore = currentIdx >= 0 && i < currentIdx;
          const isAfter = currentIdx >= 0 && i > currentIdx;

          return (
            <div key={step.key} className="flex gap-2.5">
              {/* Vertical track */}
              <div className="flex flex-col items-center w-4 shrink-0">
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-[var(--border)] bg-[var(--bg)]'
                  }`}
                >
                  {isCurrent && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 min-h-[16px] bg-[var(--border)]" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-3 -mt-0.5 ${isLast ? 'pb-0' : ''}`}>
                {isClickable ? (
                  <button
                    onClick={() => onTransition(step.key)}
                    className={`group/step inline-flex items-center gap-1.5 px-2 py-1 -mx-0.5 rounded-md text-[11px] font-medium leading-none transition-all cursor-pointer border border-transparent ${
                      isBefore
                        ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20'
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20'
                    }`}
                  >
                    {isBefore ? '\u2190' : '\u2192'}
                    {step.label}
                  </button>
                ) : (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-none ${
                      isCurrent
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                        : statusCfg?.badgeClass ?? 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {step.label}
                  </span>
                )}
                <p className={`text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-snug ${isClickable ? 'ml-0.5' : ''}`}>
                  {step.description}
                </p>
                {step.note && (
                  <p className="text-[10px] text-[var(--text-tertiary)]/60 mt-0.5 italic leading-snug">
                    {step.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Props ── */

interface ClickProps {
  currentStatus: string;
  trigger?: 'click';
  children: ReactNode;
  onTransition?: (status: string) => void;
}

interface HoverProps {
  currentStatus: string;
  trigger: 'hover';
  children: ReactNode;
  onTransition?: never;
}

type TicketLifecycleInfoProps = ClickProps | HoverProps;

export function TicketLifecycleInfo(props: TicketLifecycleInfoProps) {
  const { currentStatus, trigger = 'click' } = props;

  if (trigger === 'hover') {
    return <HoverLifecycle currentStatus={currentStatus}>{props.children}</HoverLifecycle>;
  }

  return (
    <ClickLifecycle currentStatus={currentStatus} onTransition={props.onTransition}>
      {props.children}
    </ClickLifecycle>
  );
}

/* ── Click variant — wraps children (the badge), click to open lifecycle panel ── */

function ClickLifecycle({ currentStatus, onTransition, children }: { currentStatus: string; onTransition?: (status: string) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="appearance-none bg-transparent border-none p-0 m-0"
        aria-label="Ticket lifecycle"
      >
        {children}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <LifecyclePanel currentStatus={currentStatus} onTransition={onTransition} />
        </div>
      )}
    </div>
  );
}

/* ── Hover variant — used in ticket grid (read-only) ── */

function HoverLifecycle({ currentStatus, children }: { currentStatus: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 6, left: rect.left });
      }
      setVisible(true);
    }, 1500);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }, []);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}

      {visible && createPortal(
        <div
          className="fixed z-[9999]"
          style={{ top: coords.top, left: coords.left }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <LifecyclePanel currentStatus={currentStatus} />
        </div>,
        document.body,
      )}
    </div>
  );
}
