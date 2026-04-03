'use client';

import { useState } from 'react';
import type { AECResponse } from '@/services/ticket.service';
import { useChangeRecordsStore } from '@/tickets/stores/change-records.store';
import { ChangeRecordDetail } from '../detail/ChangeRecordDetail';
import { PreviewPanel } from '@/src/preview/components/PreviewPanel';

interface RecordDetailPanelProps {
  ticket: AECResponse;
}

/**
 * Thin wrapper for the Decision Logs timeline page.
 * Delegates to the shared ChangeRecordDetail in standalone mode,
 * passing the showNames preference from the store.
 */
export function RecordDetailPanel({ ticket }: RecordDetailPanelProps) {
  const showNames = useChangeRecordsStore((s) => s.showNames);
  const [previewTarget, setPreviewTarget] = useState<{ fullName: string; branch: string } | null>(null);

  return (
    <>
      <ChangeRecordDetail
        ticket={ticket}
        variant="standalone"
        showNames={showNames}
        onPreview={(repo, branch) => setPreviewTarget({ fullName: repo, branch })}
      />
      {previewTarget && (
        <PreviewPanel
          open={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          repoFullName={previewTarget.fullName}
          branch={previewTarget.branch}
        />
      )}
    </>
  );
}
