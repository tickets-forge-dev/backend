import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreUserRepository } from '../../infrastructure/persistence/FirestoreUserRepository';

/**
 * GetUserProfileUseCase
 *
 * Retrieves the user's editable profile fields (first name, last name).
 */
@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly userRepository: FirestoreUserRepository) {}

  async execute(userId: string): Promise<{ firstName: string; lastName: string }> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const displayName = user.getDisplayName();
    const parts = displayName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    return { firstName, lastName };
  }
}
