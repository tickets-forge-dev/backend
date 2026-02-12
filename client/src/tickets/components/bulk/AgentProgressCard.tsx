'use client';

import { Check, AlertCircle, Loader2 } from 'lucide-react';

/**
 * AgentProgressCard - Per-agent progress display
 *
 * Shows real-time progress for a single agent processing a ticket.
 * Displays: agent #, ticket title, current phase, progress bar, status color
 */

export interface AgentProgressCardProps {
  agentId: number;
  ticketTitle: string;
  phase: 'deep_analysis' | 'question_generation' | 'generating_spec' | 'saving' | 'complete' | 'error';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export function AgentProgressCard({
  agentId,
  ticketTitle,
  phase,
  status,
  message,
  error,
}: AgentProgressCardProps) {
  // Determine colors based on status
  const isError = status === 'failed';
  const isComplete = status === 'completed';
  const isInProgress = status === 'in_progress' || status === 'started';

  const statusColor = isError ? 'var(--red)' : isComplete ? 'var(--green)' : 'var(--blue)';
  const bgColor = isError
    ? 'rgba(239, 68, 68, 0.05)'
    : isComplete
      ? 'rgba(16, 185, 129, 0.05)'
      : 'rgba(59, 130, 246, 0.05)';
  const borderColor = statusColor;

  // Map phase to display text
  const phaseText =
    phase === 'deep_analysis'
      ? 'Deep Analysis'
      : phase === 'question_generation'
        ? 'Generating Questions'
        : phase === 'generating_spec'
          ? 'Generating Spec'
          : phase === 'saving'
            ? 'Saving'
            : 'Complete';

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: bgColor,
        borderColor,
      }}
    >
      {/* Header: Agent number and ticket title */}
      <div className="flex items-start gap-3 mb-3">
        {/* Agent avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm"
          style={{
            backgroundColor: statusColor,
            color: '#fff',
          }}
        >
          {agentId}
        </div>

        {/* Ticket info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text)' }}
          >
            {ticketTitle}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {phaseText}
          </p>
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {isComplete ? (
            <Check className="w-5 h-5" style={{ color: 'var(--green)' }} />
          ) : isError ? (
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--red)' }} />
          ) : isInProgress ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--blue)' }} />
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: isComplete ? '100%' : isError ? '100%' : '60%',
            backgroundColor: statusColor,
          }}
        />
      </div>

      {/* Message */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: isError ? 'var(--red)' : 'var(--text-secondary)' }}
      >
        {error || message}
      </p>
    </div>
  );
}
