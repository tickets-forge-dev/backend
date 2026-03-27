import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreUserRepository } from '../../infrastructure/persistence/FirestoreUserRepository';
import { AvatarStorageService } from '../../infrastructure/storage/AvatarStorageService';

/**
 * UpdateUserAvatarUseCase
 *
 * Two modes:
 * 1. Photo upload — uploads file to storage, saves URL to user, clears emoji
 * 2. Emoji selection — saves emoji string, clears photo URL
 *
 * Does NOT modify team membership, roles, or permissions.
 */
@Injectable()
export class UpdateUserAvatarUseCase {
  constructor(
    private readonly userRepository: FirestoreUserRepository,
    private readonly avatarStorageService: AvatarStorageService,
  ) {}

  /**
   * Upload a photo avatar.
   */
  async uploadPhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ photoURL: string | undefined; avatarEmoji: string | null }> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Delete old avatar files if any
    await this.avatarStorageService.deleteAllForUser(userId);

    // Upload new avatar
    const { storageUrl } = await this.avatarStorageService.upload(
      userId,
      file,
    );

    // Update user: set photoURL, clear emoji
    const updatedUser = user.updateAvatar(storageUrl, null);
    await this.userRepository.update(updatedUser);

    return {
      photoURL: updatedUser.getPhotoURL(),
      avatarEmoji: updatedUser.getAvatarEmoji(),
    };
  }

  /**
   * Set an emoji avatar.
   */
  async setEmoji(
    userId: string,
    emoji: string,
  ): Promise<{ photoURL: string | undefined; avatarEmoji: string | null }> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Delete old photo avatar files if any
    await this.avatarStorageService.deleteAllForUser(userId);

    // Update user: clear photoURL, set emoji
    const updatedUser = user.updateAvatar(undefined, emoji);
    await this.userRepository.update(updatedUser);

    return {
      photoURL: updatedUser.getPhotoURL(),
      avatarEmoji: updatedUser.getAvatarEmoji(),
    };
  }

  /**
   * Remove avatar (reset to default).
   */
  async removeAvatar(
    userId: string,
  ): Promise<{ photoURL: string | undefined; avatarEmoji: string | null }> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Delete old photo avatar files if any
    await this.avatarStorageService.deleteAllForUser(userId);

    // Update user: clear both
    const updatedUser = user.updateAvatar(undefined, null);
    await this.userRepository.update(updatedUser);

    return {
      photoURL: updatedUser.getPhotoURL(),
      avatarEmoji: updatedUser.getAvatarEmoji(),
    };
  }
}
