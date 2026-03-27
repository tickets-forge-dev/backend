import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { GetUserProfileUseCase } from '../../application/use-cases/GetUserProfileUseCase';
import { UpdateUserProfileUseCase } from '../../application/use-cases/UpdateUserProfileUseCase';
import { UpdateUserAvatarUseCase } from '../../application/use-cases/UpdateUserAvatarUseCase';
import { UpdateProfileDto } from '../dtos/UpdateProfileDto';
import { SetAvatarEmojiDto } from '../dtos/SetAvatarEmojiDto';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * UsersController
 *
 * REST API for user profile management.
 * Only exposes name editing and avatar management — does NOT touch teams, roles, or permissions.
 */
@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly updateUserAvatarUseCase: UpdateUserAvatarUseCase,
  ) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    const profile = await this.getUserProfileUseCase.execute(req.user.uid);
    return { success: true, user: profile };
  }

  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.updateUserProfileUseCase.execute(
      req.user.uid,
      dto.firstName,
      dto.lastName,
    );
    return { success: true, user: profile };
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum of 2MB`,
      );
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed. Allowed: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
      );
    }

    const result = await this.updateUserAvatarUseCase.uploadPhoto(
      req.user.uid,
      file,
    );
    return { success: true, user: result };
  }

  @Put('profile/avatar/emoji')
  async setAvatarEmoji(
    @Request() req: any,
    @Body() dto: SetAvatarEmojiDto,
  ) {
    const result = await this.updateUserAvatarUseCase.setEmoji(
      req.user.uid,
      dto.emoji,
    );
    return { success: true, user: result };
  }

  @Delete('profile/avatar')
  async removeAvatar(@Request() req: any) {
    const result = await this.updateUserAvatarUseCase.removeAvatar(
      req.user.uid,
    );
    return { success: true, user: result };
  }
}
