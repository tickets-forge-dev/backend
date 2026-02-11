import { Injectable } from '@nestjs/common';

/**
 * LoadBreakdownDraftUseCase
 *
 * Placeholder for future draft loading use case.
 * Currently, drafts are loaded from browser localStorage on the frontend (Phase 2).
 * When Firestore persistence is enabled, this use case will fetch from the repository.
 */
@Injectable()
export class LoadBreakdownDraftUseCase {
  async execute(command: any): Promise<any> {
    // Placeholder for future implementation
    return null;
  }

  async getLatest(workspaceId: string, userId: string): Promise<any | null> {
    // Placeholder for future implementation
    return null;
  }
}
