'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Trash2, Download, Eye, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { AttachmentResponse } from '@/services/ticket.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENTS = 5;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];

interface ImageAttachmentsGridProps {
  attachments: AttachmentResponse[];
  onUpload: (file: File, onProgress?: (percent: number) => void) => Promise<boolean>;
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

/** Circular progress ring SVG */
function UploadProgress({ percent, fileName }: { percent: number; fileName: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative">
        <svg width="72" height="72" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-[var(--border)]"
          />
          {/* Progress ring */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-[var(--primary)] transition-[stroke-dashoffset] duration-200"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--text)]">
          {percent}%
        </span>
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)] truncate max-w-full px-2">
        {fileName}
      </p>
    </div>
  );
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');

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

      setUploadProgress(0);
      setUploadFileName(file.name);

      const success = await onUpload(file, (percent) => {
        setUploadProgress(percent);
      });

      setUploadProgress(null);
      setUploadFileName('');

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
  const isActivelyUploading = uploadProgress !== null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Existing attachments */}
          {attachments.map((attachment) => {
            const isImage = isImageMimeType(attachment.mimeType);
            const isDeleting = deletingId === attachment.id;

            return (
              <div
                key={attachment.id}
                className="group relative rounded-lg border border-[var(--border)]/40 bg-[var(--bg-hover)] overflow-hidden"
              >
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
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                        </svg>
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

          {/* Upload progress card — same dimensions as attachment cards */}
          {isActivelyUploading && (
            <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--bg-subtle)] overflow-hidden">
              <div className="aspect-square flex items-center justify-center">
                <UploadProgress percent={uploadProgress} fileName={uploadFileName} />
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[11px] text-[var(--text-secondary)] truncate">Uploading...</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{uploadProgress}%</p>
              </div>
            </div>
          )}

          {/* Add placeholder — nice background, same dimensions */}
          {canUpload && !isActivelyUploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-dashed border-[var(--text-tertiary)]/25 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 hover:border-[var(--text-tertiary)]/35 transition-all overflow-hidden cursor-pointer group"
            >
              <div className="aspect-square flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/15 group-hover:bg-[var(--primary)]/25 flex items-center justify-center transition-colors">
                  <Plus className="h-5 w-5 text-[var(--primary)] transition-colors" />
                </div>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Add file
                </span>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {attachments.length}/{MAX_ATTACHMENTS} · Max 5MB
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

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
