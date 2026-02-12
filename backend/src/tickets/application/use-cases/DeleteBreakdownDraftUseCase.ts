import { Injectable } from '@nestjs/common';

/**
 * DeleteBreakdownDraftUseCase
 *
 * Placeholder for future draft deletion use case.
 * Currently, drafts are deleted from browser localStorage on the frontend (Phase 2).
 * When Firestore persistence is enabled, this use case will coordinate with the repository.
 */
@Injectable()
export class DeleteBreakdownDraftUseCase {
  async execute(_command: any): Promise<void> {
    // Placeholder for future implementation
  }
}
