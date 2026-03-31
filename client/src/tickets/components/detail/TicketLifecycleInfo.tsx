'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LIFECYCLE_STEPS, TICKET_STATUS_CONFIG } from '../../config/ticketStatusConfig';

function LifecyclePanel({ currentStatus, onTransition, hasAssignee = true }: { currentStatus: string; onTransition?: (status: string) => void; hasAssignee?: boolean }) {
  const currentIdx = LIFECYCLE_STEPS.findIndex(
    (s) => s.key === currentStatus,
  );

  return (
    <div className="w-64 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] shadow-md p-3.5">
      <p className="text-[11px] font-medium text-[var(--text-secondary)] mb-3">Lifecycle</p>

      <div className="space-y-0">
        {LIFECYCLE_STEPS.map((step, i) => {
          const isCurrent = step.key === currentStatus;
          const isLast = i === LIFECYCLE_STEPS.length - 1;
          const isClickable = onTransition && !isCurrent;
          const isBefore = currentIdx >= 0 && i < currentIdx;
          const isDimmed = !hasAssignee && step.optional && !isCurrent && !isBefore;

          return (
            <div key={step.key} className={`flex gap-2.5 ${isDimmed ? 'opacity-30' : ''}`}>
              {/* Vertical track */}
              <div className="flex flex-col items-center w-3 shrink-0">
                <div
                  className={`h-3 w-3 rounded-full flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-blue-500'
                      : isBefore
                        ? 'bg-emerald-500/40'
                        : 'border-2 border-white/20'
                  }`}
                >
                  {isCurrent && (
                    <div className="h-1 w-1 rounded-full bg-white" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-px flex-1 min-h-[12px] ${
                    isBefore ? 'bg-emerald-500/20' : 'bg-[var(--border-subtle)]'
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-2.5 -mt-0.5 ${isLast ? 'pb-0' : ''}`}>
                {isClickable && !isDimmed ? (
                  <button
                    onClick={() => onTransition(step.key)}
                    className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                  >
                    {step.label}
                  </button>
                ) : (
                  <span className={`text-[11px] font-medium ${
                    isCurrent ? 'text-[var(--text)]' : 'text-[var(--text-tertiary)]'
                  }`}>
                    {step.label}
                    {isDimmed && <span className="ml-1 font-normal opacity-70">· skip</span>}
                  </span>
                )}
                {isCurrent && (
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-snug">
                    {step.description}
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
  hasAssignee?: boolean;
}

interface HoverProps {
  currentStatus: string;
  trigger: 'hover';
  children: ReactNode;
  onTransition?: never;
  hasAssignee?: boolean;
}

type TicketLifecycleInfoProps = ClickProps | HoverProps;

export function TicketLifecycleInfo(props: TicketLifecycleInfoProps) {
  const { currentStatus, trigger = 'click', hasAssignee } = props;

  if (trigger === 'hover') {
    return <HoverLifecycle currentStatus={currentStatus} hasAssignee={hasAssignee}>{props.children}</HoverLifecycle>;
  }

  return (
    <ClickLifecycle currentStatus={currentStatus} onTransition={props.onTransition} hasAssignee={hasAssignee}>
      {props.children}
    </ClickLifecycle>
  );
}

/* ── Click variant — wraps children (the badge), click to open lifecycle panel ── */

function ClickLifecycle({ currentStatus, onTransition, hasAssignee, children }: { currentStatus: string; onTransition?: (status: string) => void; hasAssignee?: boolean; children: ReactNode }) {
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
          <LifecyclePanel currentStatus={currentStatus} onTransition={onTransition} hasAssignee={hasAssignee} />
        </div>
      )}
    </div>
  );
}

/* ── Hover variant — used in ticket grid (read-only) ── */

function HoverLifecycle({ currentStatus, hasAssignee, children }: { currentStatus: string; hasAssignee?: boolean; children: ReactNode }) {
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
          <LifecyclePanel currentStatus={currentStatus} hasAssignee={hasAssignee} />
        </div>,
        document.body,
      )}
    </div>
  );
}
