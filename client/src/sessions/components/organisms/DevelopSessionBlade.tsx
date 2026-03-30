'use client';
import { GitBranch, FolderGit2 } from 'lucide-react';
import { SlideOverPanel } from '../molecules/SlideOverPanel';
import { SessionMonitorView } from './SessionMonitorView';

interface DevelopSessionBladeProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  ticketStatus: string;
  repoFullName?: string;
  branch?: string;
}

export function DevelopSessionBlade({ open, onClose, ticketId, ticketTitle, ticketStatus, repoFullName, branch }: DevelopSessionBladeProps) {
  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      title="Cloud Develop"
      subtitle={ticketTitle}
      width="w-[520px]"
    >
      {/* Implementation context */}
      {(repoFullName || branch) && (
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-[var(--border-subtle)]">
          {repoFullName && (
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
              <FolderGit2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="font-mono">{repoFullName}</span>
            </div>
          )}
          {branch && (
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
              <GitBranch className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="font-mono">{branch}</span>
            </div>
          )}
        </div>
      )}

      {/* Session content */}
      <SessionMonitorView
        ticketId={ticketId}
        ticketStatus={ticketStatus}
      />
    </SlideOverPanel>
  );
}
