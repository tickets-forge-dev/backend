'use client';
import { SlideOverPanel } from '../molecules/SlideOverPanel';
import { SessionMonitorView } from './SessionMonitorView';

interface DevelopSessionBladeProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  ticketStatus: string;
}

export function DevelopSessionBlade({ open, onClose, ticketId, ticketTitle, ticketStatus }: DevelopSessionBladeProps) {
  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      title="Cloud Develop"
      subtitle={ticketTitle}
      width="w-[520px]"
    >
      <SessionMonitorView
        ticketId={ticketId}
        ticketStatus={ticketStatus}
      />
    </SlideOverPanel>
  );
}
