import { ChevronDown } from 'lucide-react';

interface TicketGroupHeaderProps {
  label: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function TicketGroupHeader({ label, count, isCollapsed, onToggle }: TicketGroupHeaderProps) {
  return (
    <div
      onClick={onToggle}
      className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-[var(--bg-subtle)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
    >
      <ChevronDown
        className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform ${
          isCollapsed ? '-rotate-90' : ''
        }`}
      />
      <h3 className="text-sm font-medium text-[var(--text-secondary)]">{label}</h3>
      <span className="ml-auto text-xs font-medium text-[var(--text-tertiary)]">
        {count}
      </span>
    </div>
  );
}
