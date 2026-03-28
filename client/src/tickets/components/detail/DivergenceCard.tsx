import type { Divergence } from '@/services/ticket.service';

export function DivergenceCard({ divergence }: { divergence: Divergence }) {
  return (
    <div className="flex gap-2 text-[10px]">
      <span className="text-amber-500/60 shrink-0 mt-px">⚡</span>
      <div className="flex-1 min-w-0">
        <span className="text-[var(--text-primary)] font-medium">{divergence.area}</span>
        <span className="text-[var(--text-tertiary)]">
          {' '}— {divergence.intended} → {divergence.actual}
        </span>
        {divergence.justification && (
          <span className="text-[var(--text-tertiary)] opacity-60 italic">
            {' '}({divergence.justification})
          </span>
        )}
      </div>
    </div>
  );
}
