import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';

export default function TicketsListPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
          Tickets
        </h1>
        <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
          Manage executable tickets
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search tickets..."
          className="max-w-md"
        />
        <Badge variant="secondary" className="cursor-pointer">
          All
        </Badge>
        <Badge variant="outline" className="cursor-pointer">
          Ready
        </Badge>
        <Badge variant="outline" className="cursor-pointer">
          Needs Input
        </Badge>
      </div>

      {/* Tickets list - empty state */}
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="text-center">
          <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
            No tickets yet
          </p>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-tertiary)]">
            Create your first executable ticket to get started
          </p>
        </div>
      </div>
    </div>
  );
}
