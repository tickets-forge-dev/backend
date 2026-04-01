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
  /** All repositories linked to this ticket */
  repositories?: Array<{ repositoryFullName: string; isPrimary: boolean; role?: string }>;
  /** Callback to open repo connection dialog */
  onConnectRepo?: () => void;
  /** Callback to open preview panel */
  onPreview?: (repoFullName: string, branch: string) => void;
}

export function DevelopSessionBlade({ open, onClose, ticketId, ticketTitle, ticketStatus, repoFullName, branch, fileChangeCount, repositories, onConnectRepo, onPreview }: DevelopSessionBladeProps) {
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
        repositories={repositories}
        onConnectRepo={onConnectRepo}
        onPreview={onPreview}
      />
    </SlideOverPanel>
  );
}
