export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number; // bytes
  storageUrl: string; // public/signed URL
  storagePath: string; // internal Firebase Storage path
  uploadedAt: Date;
  uploadedBy: string; // user email
}

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_ATTACHMENTS = 5;
