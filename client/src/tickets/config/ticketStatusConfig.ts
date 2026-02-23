/**
 * Single source of truth for ticket status display configuration.
 * Backend enum keys are API contracts — only display labels change here.
 */

export interface StatusConfig {
  label: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  cliIcon: string;
}

export const TICKET_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: 'Write',
    description: 'PM creates the ticket',
    badgeClass: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
    dotClass: 'bg-[var(--text-tertiary)]/50',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '⬜',
  },
  validated: {
    label: 'Dev-Refine',
    description: 'Developer reviews and refines the spec',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    dotClass: 'bg-purple-500',
    textClass: 'text-purple-500',
    cliIcon: '✅',
  },
  'waiting-for-approval': {
    label: 'Approve',
    description: "PM reviews the developer's changes",
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-500',
    cliIcon: '⏳',
  },
  ready: {
    label: 'Execute',
    description: 'Spec is final, ready to build',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    dotClass: 'bg-green-500',
    textClass: 'text-green-500',
    cliIcon: '🚀',
  },
  created: {
    label: 'Exported',
    description: 'Sent to your issue tracker',
    badgeClass: 'bg-green-500/15 text-green-600 dark:text-green-400',
    dotClass: 'bg-purple-500',
    textClass: 'text-purple-500',
    cliIcon: '📝',
  },
  complete: {
    label: 'Done',
    description: 'Ticket is complete',
    badgeClass: 'bg-green-500/15 text-green-600 dark:text-green-400',
    dotClass: 'bg-green-500',
    textClass: 'text-green-500',
    cliIcon: '✅',
  },
  drifted: {
    label: 'Drifted',
    description: 'Code or API changed — needs re-review',
    badgeClass: 'bg-red-500/15 text-red-500',
    dotClass: 'bg-red-500',
    textClass: 'text-red-500',
    cliIcon: '⚠️',
  },
};

/** The 4-step lifecycle shown in the lifecycle panel. */
export const LIFECYCLE_STEPS: Array<{ key: string; label: string; description: string; note?: string }> = [
  { key: 'draft', label: 'Write', description: 'PM creates the ticket' },
  { key: 'validated', label: 'Dev-Refine', description: 'Developer reviews and refines the spec' },
  { key: 'waiting-for-approval', label: 'Approve', description: "PM reviews the developer's changes", note: 'Skipped unless approval is required' },
  { key: 'ready', label: 'Execute', description: 'Spec is final, ready to build' },
];

/** Statuses that map to the "Execute" lifecycle step for highlighting. */
export const EXECUTE_STATUSES = new Set(['ready', 'created', 'complete']);

export function getStatusLabel(status: string): string {
  return TICKET_STATUS_CONFIG[status]?.label ?? status;
}
