'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Trash2,
  Download,
  Eye,
  FileText,
  FileJson,
  FileSpreadsheet,
  FileType,
  File as FileIcon,
  Paperclip,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AttachmentResponse } from '@/services/ticket.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENTS = 5;
const ALLOWED_TYPES = [
  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/json',
  // Office
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const ACCEPT_STRING = [
  ...ALLOWED_TYPES,
  '.md',
  '.txt',
  '.json',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
].join(',');

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

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function getFileIcon(mimeType: string, fileName: string) {
  if (isImageMimeType(mimeType)) {
    return <Paperclip className="h-4 w-4 text-blue-400" />;
  }
  const ext = getFileExtension(fileName);
  switch (ext) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-400" />;
    case 'md':
      return <FileText className="h-4 w-4 text-blue-400" />;
    case 'txt':
      return <FileType className="h-4 w-4 text-[var(--text-tertiary)]" />;
    case 'json':
      return <FileJson className="h-4 w-4 text-yellow-400" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    case 'ppt':
    case 'pptx':
      return <FileText className="h-4 w-4 text-orange-500" />;
    default:
      return <FileIcon className="h-4 w-4 text-[var(--text-tertiary)]" />;
  }
}

function isAllowedFile(file: File): boolean {
  if (ALLOWED_TYPES.includes(file.type)) return true;
  const ext = getFileExtension(file.name);
  return ['md', 'txt', 'json', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
}

/** Inline progress bar */
function UploadProgressBar({ percent, fileName }: { percent: number; fileName: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--bg-subtle)] px-3 py-2.5">
      <div className="flex-shrink-0">
        <Upload className="h-4 w-4 text-[var(--primary)] animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-secondary)] truncate">{fileName}</p>
        <div className="mt-1 h-1 w-full rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0 tabular-nums">
        {percent}%
      </span>
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
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (!isAllowedFile(file)) {
        toast.error('File type not supported. Use images, PDF, Markdown, text, JSON, or Office files.');
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

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';
      await processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDelete = useCallback(
    async (attachment: AttachmentResponse) => {
      setDeletingId(attachment.id);
      const success = await onDelete(attachment.id);
      setDeletingId(null);

      if (success) {
        toast('Attachment deleted', { description: attachment.fileName, duration: 3000 });
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
  const hasAttachments = attachments.length > 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-1.5">
        {/* File list */}
        {attachments.map((attachment) => {
          const isImage = isImageMimeType(attachment.mimeType);
          const isDeleting = deletingId === attachment.id;

          return (
            <div
              key={attachment.id}
              className="group flex items-center gap-3 rounded-lg bg-[var(--bg-subtle)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors"
            >
              {/* Thumbnail or icon */}
              {isImage ? (
                <button
                  onClick={() => {
                    setLightboxUrl(attachment.storageUrl);
                    setLightboxName(attachment.fileName);
                  }}
                  className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-[var(--bg-active)]"
                >
                  <img
                    src={attachment.storageUrl}
                    alt={attachment.fileName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 rounded bg-[var(--bg-active)] flex items-center justify-center">
                  {getFileIcon(attachment.mimeType, attachment.fileName)}
                </div>
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-secondary)] truncate" title={attachment.fileName}>
                  {attachment.fileName}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isImage && (
                  <button
                    onClick={() => {
                      setLightboxUrl(attachment.storageUrl);
                      setLightboxName(attachment.fileName);
                    }}
                    className="p-1 rounded hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1 rounded hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(attachment)}
                  disabled={isDeleting}
                  className="p-1 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  {isDeleting ? (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* Upload progress */}
        {isActivelyUploading && (
          <UploadProgressBar percent={uploadProgress} fileName={uploadFileName} />
        )}

        {/* Drop zone / add button */}
        {canUpload && !isActivelyUploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`
              w-full flex items-center gap-3 rounded-lg px-3 transition-all cursor-pointer
              ${hasAttachments ? 'py-2' : 'py-4'}
              ${dragOver
                ? 'bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/30'
                : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)]'
              }
            `}
          >
            <div className={`
              flex-shrink-0 rounded flex items-center justify-center
              ${hasAttachments ? 'w-8 h-8' : 'w-9 h-9'}
              ${dragOver ? 'bg-[var(--primary)]/15' : 'bg-[var(--bg-active)]'}
            `}>
              {dragOver ? (
                <Upload className="h-4 w-4 text-[var(--primary)]" />
              ) : (
                <Paperclip className="h-4 w-4 text-[var(--text-tertiary)]" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs text-[var(--text-secondary)]">
                {dragOver ? 'Drop file here' : hasAttachments ? 'Add another file' : 'Add file or drop here'}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {attachments.length}/{MAX_ATTACHMENTS} · Max 5MB · Images, PDF, Markdown, text, JSON, Office
              </p>
            </div>
          </button>
        )}
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
