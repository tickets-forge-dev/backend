'use client';

import type { AECResponse } from '@/services/ticket.service';
import { ChangeRecordDetail } from './ChangeRecordDetail';

interface ChangeRecordTabProps {
  ticket: AECResponse;
}

/**
 * Thin wrapper for the ticket detail page's "Delivered" tab.
 * Delegates to the shared ChangeRecordDetail in embedded mode.
 */
export function ChangeRecordTab({ ticket }: ChangeRecordTabProps) {
  return <ChangeRecordDetail ticket={ticket} variant="embedded" />;
}
