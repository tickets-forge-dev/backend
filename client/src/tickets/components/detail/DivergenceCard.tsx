import type { Divergence } from '@/services/ticket.service';

export function DivergenceCard({ divergence }: { divergence: Divergence }) {
  return (
    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3.5">
      <div className="flex items-start gap-2">
        <span className="text-amber-500 text-sm mt-0.5">⚡</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">
            {divergence.area}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                Intended
              </div>
              <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {divergence.intended}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                Actual
              </div>
              <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {divergence.actual}
              </div>
            </div>
          </div>
          <div className="text-[12px] text-[var(--text-tertiary)] italic">
            {divergence.justification}
          </div>
        </div>
      </div>
    </div>
  );
}
