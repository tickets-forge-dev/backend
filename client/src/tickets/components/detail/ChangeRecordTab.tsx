'use client';

import type { AECResponse } from '@/services/ticket.service';
import { ChangeRecordDetail } from './ChangeRecordDetail';

interface ChangeRecordTabProps {
  ticket: AECResponse;
  onPreview?: (repoFullName: string, branch: string) => void;
}

/**
 * Thin wrapper for the ticket detail page's "Delivered" tab.
 * Delegates to the shared ChangeRecordDetail in embedded mode.
 */
export function ChangeRecordTab({ ticket, onPreview }: ChangeRecordTabProps) {
  return <ChangeRecordDetail ticket={ticket} variant="embedded" onPreview={onPreview} />;
}
