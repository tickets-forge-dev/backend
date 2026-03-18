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
    label: 'Define',
    description: 'PM creates the ticket',
    badgeClass: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
    dotClass: 'bg-[var(--text-tertiary)]/50',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '⬜',
  },
  'dev-refining': {
    label: 'Dev-Refine',
    description: 'Developer reviews and refines the spec',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    dotClass: 'bg-purple-500',
    textClass: 'text-purple-500',
    cliIcon: '🔧',
  },
  review: {
    label: 'Review (PM)',
    description: "PM reviews the developer's changes",
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-500',
    cliIcon: '⏳',
  },
  forged: {
    label: 'Ready',
    description: 'Approved — ready for the developer to pick up',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-500',
    cliIcon: '✅',
  },
  executing: {
    label: 'Executing',
    description: 'Being built or sent to issue tracker',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    cliIcon: '🚀',
  },
  complete: {
    label: 'Done',
    description: 'Ticket is complete',
    badgeClass: 'bg-green-500/15 text-green-600 dark:text-green-400',
    dotClass: 'bg-green-500',
    textClass: 'text-green-500',
    cliIcon: '✅',
  },
};

/** The lifecycle steps shown in the lifecycle panel. */
export const LIFECYCLE_STEPS: Array<{ key: string; label: string; description: string; note?: string; optional?: boolean }> = [
  { key: 'draft', label: 'Define', description: 'PM creates the ticket' },
  { key: 'dev-refining', label: 'Dev-Refine', description: 'Developer reviews and refines the spec', note: 'Optional — skip if no developer needed', optional: true },
  { key: 'review', label: 'Review (PM)', description: "PM reviews the developer's changes", note: 'Only when a developer submits changes', optional: true },
  { key: 'forged', label: 'Ready', description: 'Approved — ready for the developer to pick up' },
];

/** Statuses that map to the final "Forged" lifecycle step for highlighting. */
export const EXECUTE_STATUSES = new Set(['forged', 'executing', 'complete']);

export function getStatusLabel(status: string): string {
  return TICKET_STATUS_CONFIG[status]?.label ?? status;
}
