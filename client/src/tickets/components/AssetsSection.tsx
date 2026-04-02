'use client';

import type { AttachmentResponse } from '@/services/ticket.service';
import { ImageAttachmentsGrid } from './ImageAttachmentsGrid';

interface AssetsSectionProps {
  ticketId: string;
  ticketTitle: string;
  ticketUpdatedAt?: string;
  attachments?: AttachmentResponse[];
  onUploadAttachment?: (file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
  onDeleteAttachment?: (attachmentId: string) => Promise<boolean>;
  isUploadingAttachment?: boolean;
}

/**
 * AssetsSection — User-uploaded attachments (images, documents, files).
 * Exports (Tech Spec, AEC Contract) have been moved to the Exports tab.
 */
export function AssetsSection({ attachments, onUploadAttachment, onDeleteAttachment, isUploadingAttachment }: AssetsSectionProps) {
  if (!onUploadAttachment || !onDeleteAttachment) return null;

  return (
    <ImageAttachmentsGrid
      attachments={attachments || []}
      onUpload={onUploadAttachment}
      onDelete={onDeleteAttachment}
      isUploading={isUploadingAttachment || false}
    />
  );
}
