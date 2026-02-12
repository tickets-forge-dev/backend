import { Injectable } from '@nestjs/common';

/**
 * SaveBreakdownDraftUseCase
 *
 * Placeholder for future draft saving use case.
 * Currently, drafts are saved to browser localStorage on the frontend (Phase 2).
 * When Firestore persistence is enabled, this use case will coordinate
 * the save operation with the repository.
 */
@Injectable()
export class SaveBreakdownDraftUseCase {
  async execute(_command: any): Promise<string> {
    // Placeholder for future implementation
    return 'draft-' + Date.now();
  }
}
