import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreUserRepository } from '../../infrastructure/persistence/FirestoreUserRepository';

/**
 * UpdateUserProfileUseCase
 *
 * Updates only the user's display name (first + last name).
 * Does NOT modify team membership, roles, or permissions.
 */
@Injectable()
export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: FirestoreUserRepository) {}

  async execute(
    userId: string,
    firstName: string,
    lastName: string,
  ): Promise<{ firstName: string; lastName: string }> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const updatedUser = user.updateDisplayName(displayName);

    await this.userRepository.update(updatedUser);

    return { firstName: firstName.trim(), lastName: lastName.trim() };
  }
}
