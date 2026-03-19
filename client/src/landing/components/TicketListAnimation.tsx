'use client';

import { useEffect, useRef, useState } from 'react';

interface Ticket {
  title: string;
  status: 'Ready' | 'Draft' | 'Refining' | 'Approved';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  assignee: string;
  score: number;
  delay: number;
}

const TICKETS: Ticket[] = [
  { title: 'Add webhook retry logic', status: 'Ready', priority: 'Urgent', assignee: 'Idan A.', score: 94, delay: 0 },
  { title: 'Login flow for GitHub OAuth', status: 'Ready', priority: 'High', assignee: 'Idan A.', score: 88, delay: 120 },
  { title: 'As a user I want to be able...', status: 'Refining', priority: 'High', assignee: 'Idan A.', score: 72, delay: 240 },
  { title: 'Update the onboarding UX', status: 'Draft', priority: 'Medium', assignee: 'Idan A.', score: 45, delay: 360 },
  { title: 'Can\'t login with GitHub SSO', status: 'Draft', priority: 'High', assignee: '\u2014', score: 31, delay: 480 },
  { title: 'As a user I can\'t access forge...', status: 'Draft', priority: 'Low', assignee: '\u2014', score: 28, delay: 600 },
  { title: 'As a user I want to have bet...', status: 'Draft', priority: 'Medium', assignee: '\u2014', score: 22, delay: 720 },
  { title: 'As a PM I want to add labels...', status: 'Draft', priority: 'Low', assignee: 'Idan A.', score: 18, delay: 840 },
];

function statusColor(status: Ticket['status']) {
  switch (status) {
    case 'Ready': return 'bg-emerald-500/20 text-emerald-400';
    case 'Approved': return 'bg-blue-500/20 text-blue-400';
    case 'Refining': return 'bg-amber-500/20 text-amber-400';
    case 'Draft': return 'bg-[#333] text-[#888]';
  }
}

function priorityDot(priority: Ticket['priority']) {
  switch (priority) {
    case 'Urgent': return 'bg-red-500';
    case 'High': return 'bg-orange-500';
    case 'Medium': return 'bg-amber-400';
    case 'Low': return 'bg-[#555]';
  }
}

function scoreColor(score: number) {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-[#555]';
}

export function TicketListAnimation() {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          TICKETS.forEach((ticket, i) => {
            setTimeout(() => setVisibleCount(i + 1), ticket.delay + 400);
          });
        }
      },
      { threshold: 0.3 }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="rounded-xl border border-[var(--border-subtle)] bg-[#0c0c0c] overflow-hidden font-[var(--font-mono)] flex flex-col h-[380px]">
      {/* App chrome — header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#111111] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 text-[11px] text-[#555] font-medium tracking-wide">forge</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#333] bg-[#1a1a1a] px-2 py-0.5 rounded">+ Create</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-[#444]">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-[#444]">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Search tickets...
        </div>
        <span className="text-[10px] text-[#333]">Recently updated ▾</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_64px_56px_64px_36px] px-4 py-1.5 border-b border-[#1a1a1a] shrink-0">
        <span className="text-[9px] text-[#444] uppercase tracking-wider">Title</span>
        <span className="text-[9px] text-[#444] uppercase tracking-wider">Status</span>
        <span className="text-[9px] text-[#444] uppercase tracking-wider text-center">Pri</span>
        <span className="text-[9px] text-[#444] uppercase tracking-wider text-right">Assignee</span>
        <span className="text-[9px] text-[#444] uppercase tracking-wider text-right">Score</span>
      </div>

      {/* Ticket rows */}
      <div className="flex-1 overflow-hidden">
        {TICKETS.slice(0, visibleCount).map((ticket, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_64px_56px_64px_36px] px-4 py-[7px] border-b border-[#141414] items-center hover:bg-[#141414] transition-colors"
            style={{
              animation: 'fadeIn 300ms ease-out both',
            }}
          >
            {/* Title */}
            <span className="text-[11px] text-[#c4c4c4] truncate pr-2">{ticket.title}</span>

            {/* Status badge */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full text-center whitespace-nowrap ${statusColor(ticket.status)}`}>
              {ticket.status}
            </span>

            {/* Priority dot */}
            <div className="flex justify-center">
              <div className={`w-2 h-2 rounded-full ${priorityDot(ticket.priority)}`} />
            </div>

            {/* Assignee */}
            <span className="text-[10px] text-[#555] text-right truncate">{ticket.assignee}</span>

            {/* Score */}
            <span className={`text-[10px] text-right font-medium ${scoreColor(ticket.score)}`}>
              {ticket.score}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[#1a1a1a] bg-[#0e0e0e] shrink-0">
        <span className="text-[10px] text-[#333]">{visibleCount} tickets</span>
        <span className="text-[10px] text-[#333]">forge workspace</span>
      </div>
    </div>
  );
}
