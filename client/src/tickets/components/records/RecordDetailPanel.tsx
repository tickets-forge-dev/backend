'use client';

import type { AECResponse } from '@/services/ticket.service';
import { useChangeRecordsStore } from '@/tickets/stores/change-records.store';
import { ChangeRecordDetail } from '../detail/ChangeRecordDetail';

interface RecordDetailPanelProps {
  ticket: AECResponse;
}

/**
 * Thin wrapper for the Change Records timeline page.
 * Delegates to the shared ChangeRecordDetail in standalone mode,
 * passing the showNames preference from the store.
 */
export function RecordDetailPanel({ ticket }: RecordDetailPanelProps) {
  const showNames = useChangeRecordsStore((s) => s.showNames);
  return <ChangeRecordDetail ticket={ticket} variant="standalone" showNames={showNames} />;
}
