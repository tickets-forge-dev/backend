'use client';
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
  /** Number of file changes from the ticket's tech spec — passed to complexity warning */
  fileChangeCount?: number;
}

export function DevelopSessionBlade({ open, onClose, ticketId, ticketTitle, ticketStatus, repoFullName, branch, fileChangeCount }: DevelopSessionBladeProps) {
  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      title="Cloud Develop"
      subtitle={ticketTitle}
      width="w-[520px]"
    >
      {/* Session content */}
      <SessionMonitorView
        ticketId={ticketId}
        ticketStatus={ticketStatus}
        fileChangeCount={fileChangeCount}
        repoFullName={repoFullName}
        branch={branch}
      />
    </SlideOverPanel>
  );
}
