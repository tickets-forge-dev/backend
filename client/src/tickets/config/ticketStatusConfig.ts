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
  defined: {
    label: 'Dev Review',
    description: 'Developer reviews and refines the spec',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    dotClass: 'bg-purple-500',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '🔧',
  },
  refined: {
    label: 'PM Review',
    description: "PM reviews the developer's changes",
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '⏳',
  },
  approved: {
    label: 'Ready',
    description: 'Ready for the developer to pick up',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '✅',
  },
  executing: {
    label: 'Executing',
    description: 'Developer or AI agent is implementing',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '🚀',
  },
  delivered: {
    label: 'Done',
    description: 'Implementation is complete',
    badgeClass: 'bg-green-500/15 text-green-600 dark:text-green-400',
    dotClass: 'bg-green-500',
    textClass: 'text-[var(--text-tertiary)]',
    cliIcon: '✅',
  },
};

/** The lifecycle steps shown in the lifecycle panel. */
export const LIFECYCLE_STEPS: Array<{ key: string; label: string; description: string; note?: string; optional?: boolean }> = [
  { key: 'draft', label: 'Define', description: 'PM creates the ticket' },
  { key: 'defined', label: 'Dev Review', description: 'Developer reviews and refines the spec', note: 'Optional — skip if no developer needed', optional: true },
  { key: 'refined', label: 'PM Review', description: "PM reviews the developer's changes", note: 'Only when a developer submits changes', optional: true },
  { key: 'approved', label: 'Ready', description: 'Ready for the developer to pick up' },
  { key: 'executing', label: 'Executing', description: 'Developer or AI agent is implementing' },
  { key: 'delivered', label: 'Done', description: 'Implementation is complete' },
];

/** Statuses where the AEC is locked and verified — used for crown card styling. */
export const EXECUTE_STATUSES = new Set(['approved', 'executing', 'delivered']);

export function getStatusLabel(status: string): string {
  return TICKET_STATUS_CONFIG[status]?.label ?? status;
}
