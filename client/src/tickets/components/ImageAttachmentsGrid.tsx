'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Upload, Trash2, Download, Eye, FileText, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AttachmentResponse } from '@/services/ticket.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENTS = 5;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];

interface ImageAttachmentsGridProps {
  attachments: AttachmentResponse[];
  onUpload: (file: File) => Promise<boolean>;
  onDelete: (attachmentId: string) => Promise<boolean>;
  isUploading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function ImageAttachmentsGrid({
  attachments,
  onUpload,
  onDelete,
  isUploading,
}: ImageAttachmentsGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so the same file can be re-selected
      e.target.value = '';

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('File type not allowed. Use PNG, JPEG, GIF, WebP, or PDF.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('File too large. Maximum size is 5MB.');
        return;
      }

      if (attachments.length >= MAX_ATTACHMENTS) {
        toast.error(`Maximum of ${MAX_ATTACHMENTS} attachments reached.`);
        return;
      }

      const success = await onUpload(file);
      if (success) {
        toast.success(`Uploaded ${file.name}`);
      } else {
        toast.error('Upload failed. Check file size and type.');
      }
    },
    [attachments.length, onUpload],
  );

  const handleDelete = useCallback(
    async (attachment: AttachmentResponse) => {
      setDeletingId(attachment.id);
      const success = await onDelete(attachment.id);
      setDeletingId(null);

      if (success) {
        toast('Attachment deleted', {
          description: attachment.fileName,
          duration: 3000,
        });
      } else {
        toast.error('Failed to delete attachment');
      }
    },
    [onDelete],
  );

  const handleDownload = useCallback((attachment: AttachmentResponse) => {
    const a = document.createElement('a');
    a.href = attachment.storageUrl;
    a.download = attachment.fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }, []);

  const canUpload = attachments.length < MAX_ATTACHMENTS && !isUploading;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {attachments.length === 0 && !isUploading ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ImageIcon className="h-8 w-8 text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">No attachments yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">Upload images or PDFs to this ticket</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload File
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {attachments.map((attachment) => {
              const isImage = isImageMimeType(attachment.mimeType);
              const isDeleting = deletingId === attachment.id;

              return (
                <div
                  key={attachment.id}
                  className="group relative rounded-lg border border-[var(--border)]/40 bg-[var(--bg-hover)] overflow-hidden"
                >
                  {/* Thumbnail / Icon */}
                  <div className="aspect-square relative">
                    {isImage ? (
                      <img
                        src={attachment.storageUrl}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-subtle)]">
                        <FileText className="h-10 w-10 text-[var(--text-tertiary)]" />
                      </div>
                    )}

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {isImage && (
                        <button
                          onClick={() => {
                            setLightboxUrl(attachment.storageUrl);
                            setLightboxName(attachment.fileName);
                          }}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(attachment)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-full bg-red-500/40 hover:bg-red-500/60 text-white transition-colors"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* File info */}
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] text-[var(--text-secondary)] truncate" title={attachment.fileName}>
                      {attachment.fileName}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Upload card */}
            {canUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-[var(--border)]/60 hover:border-[var(--primary)]/40 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">Upload</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Upload limit hint */}
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {attachments.length}/{MAX_ATTACHMENTS} files attached. Max 5MB each (PNG, JPEG, GIF, WebP, PDF).
          </p>
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{lightboxName}</DialogTitle>
            <DialogDescription>Full size image preview</DialogDescription>
          </DialogHeader>
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt={lightboxName}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
