import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * FirestoreBreakdownDraftRepository
 *
 * Placeholder for future Firestore persistence of breakdown drafts.
 * Currently not used in Phase 2 since we're using localStorage on the frontend.
 * Can be enabled when implementing Firestore-backed draft persistence.
 */
@Injectable()
export class FirestoreBreakdownDraftRepository {
  constructor(private firestore: Firestore) {}

  /**
   * Save a new breakdown draft or update existing
   */
  async save(_command: any): Promise<string> {
    // Placeholder for future implementation
    const draftId = uuidv4();
    return draftId;
  }

  /**
   * Get a specific draft by ID
   */
  async getById(_workspaceId: string, _userId: string, _draftId: string): Promise<any | null> {
    // Placeholder for future implementation
    return null;
  }

  /**
   * Get the most recent draft for a user/workspace
   */
  async getLatest(_workspaceId: string, _userId: string): Promise<any | null> {
    // Placeholder for future implementation
    return null;
  }

  /**
   * Delete a specific draft
   */
  async delete(_workspaceId: string, _userId: string, _draftId: string): Promise<void> {
    // Placeholder for future implementation
  }

  /**
   * Update an existing draft
   */
  async update(_workspaceId: string, _userId: string, _draftId: string, _updates: any): Promise<void> {
    // Placeholder for future implementation
  }
}
