import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * AvatarStorageService
 *
 * Handles avatar photo upload/delete in Firebase Storage.
 * Files stored under: avatars/{userId}/{filename}
 */
@Injectable()
export class AvatarStorageService {
  private readonly logger = new Logger(AvatarStorageService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Validate file size and MIME type before upload.
   */
  validateFile(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size ${file.size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (2MB)`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(
        `File type '${file.mimetype}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  /**
   * Upload avatar photo to Firebase Storage.
   * Returns the public download URL.
   */
  async upload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ storageUrl: string; storagePath: string }> {
    this.validateFile(file);

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `avatars/${userId}/${safeName}`;

    const bucket = this.firebaseService.getStorage().bucket();
    const fileRef = bucket.file(storagePath);

    try {
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
          },
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to upload avatar to Firebase Storage: ${message}`,
      );
      if (message.includes('does not exist')) {
        throw new Error(
          'Firebase Storage bucket not configured. Enable Storage in Firebase Console first.',
        );
      }
      throw error;
    }

    // Make file publicly accessible
    await fileRef.makePublic();

    const storageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    this.logger.log(`Uploaded avatar for user ${userId} to ${storagePath}`);

    return { storageUrl, storagePath };
  }

  /**
   * Delete an avatar file from Firebase Storage.
   */
  async delete(storagePath: string): Promise<void> {
    const bucket = this.firebaseService.getStorage().bucket();
    const fileRef = bucket.file(storagePath);

    try {
      await fileRef.delete();
      this.logger.log(`Deleted avatar at ${storagePath}`);
    } catch (error: unknown) {
      const code = (error as { code?: number | string }).code;
      // File may already be deleted — GCS returns 404
      if (code === 404 || code === '404') {
        this.logger.warn(`Avatar not found in storage: ${storagePath}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Delete all avatar files for a user (used when resetting avatar).
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const bucket = this.firebaseService.getStorage().bucket();
    const prefix = `avatars/${userId}/`;

    try {
      const [files] = await bucket.getFiles({ prefix });
      await Promise.all(files.map((file) => file.delete()));
      this.logger.log(
        `Deleted ${files.length} avatar file(s) for user ${userId}`,
      );
    } catch (error: unknown) {
      const code = (error as { code?: number | string }).code;
      if (code === 404 || code === '404') {
        this.logger.warn(`No avatar files found for user ${userId}`);
        return;
      }
      throw error;
    }
  }
}
