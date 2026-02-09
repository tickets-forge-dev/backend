import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';
import { Attachment } from '../../domain/value-objects/Attachment';
import { randomUUID } from 'crypto';

@Injectable()
export class AttachmentStorageService {
  private readonly logger = new Logger(AttachmentStorageService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async upload(
    workspaceId: string,
    aecId: string,
    file: Express.Multer.File,
    userEmail: string,
  ): Promise<Attachment> {
    const id = randomUUID();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `attachments/${workspaceId}/${aecId}/${id}-${safeName}`;

    const bucket = this.firebaseService.getStorage().bucket();
    const fileRef = bucket.file(storagePath);

    try {
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userEmail,
            aecId,
            workspaceId,
          },
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to upload to Firebase Storage: ${error.message}`);
      if (error.message?.includes('does not exist')) {
        throw new Error(
          'Firebase Storage bucket not configured. Enable Storage in Firebase Console first.',
        );
      }
      throw error;
    }

    // Make file publicly accessible
    await fileRef.makePublic();

    const storageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    this.logger.log(`Uploaded attachment ${id} to ${storagePath}`);

    return {
      id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageUrl,
      storagePath,
      uploadedAt: new Date(),
      uploadedBy: userEmail,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const bucket = this.firebaseService.getStorage().bucket();
    const fileRef = bucket.file(storagePath);

    try {
      await fileRef.delete();
      this.logger.log(`Deleted attachment at ${storagePath}`);
    } catch (error: any) {
      // File may already be deleted from storage — GCS returns 404 as number or string
      if (error.code === 404 || error.code === '404') {
        this.logger.warn(`Attachment not found in storage: ${storagePath}`);
        return;
      }
      throw error;
    }
  }
}
