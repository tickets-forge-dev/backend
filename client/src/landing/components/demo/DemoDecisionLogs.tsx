// DemoDecisionLogs.tsx
'use client';

import { FileCode2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEMO_DECISION_LOGS } from './demo-data';

interface Props {
  onOpenRecord: (index: number) => void;
}

export function DemoDecisionLogs({ onOpenRecord }: Props) {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-sm font-semibold text-[var(--text)]">Decision Logs</h1>
          <p className="text-[10px] text-[var(--text-tertiary)]">Click a log to view details</p>
        </div>

        {/* Records list */}
        <div className="space-y-1">
          {DEMO_DECISION_LOGS.map((record, idx) => {
            const totalAdded = record.filesChanged.reduce((s, f) => s + f.additions, 0);
            const totalRemoved = record.filesChanged.reduce((s, f) => s + f.deletions, 0);

            return (
              <div
                key={idx}
                onClick={() => onOpenRecord(idx)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                {/* Status dot */}
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  record.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors truncate">
                    {record.ticketTitle}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                    <span>{record.developer}</span>
                    <span className="opacity-30">·</span>
                    <span>{record.submittedAt}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-[var(--text-tertiary)]">
                  <div className="flex items-center gap-1">
                    <FileCode2 className="w-3 h-3" />
                    <span>{record.filesChanged.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500/70">+{totalAdded}</span>
                    <span className="text-red-500/70">-{totalRemoved}</span>
                  </div>
                  {record.status === 'accepted' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/50" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500/50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
