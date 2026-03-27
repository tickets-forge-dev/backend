import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { GetUserProfileUseCase } from '../../application/use-cases/GetUserProfileUseCase';
import { UpdateUserProfileUseCase } from '../../application/use-cases/UpdateUserProfileUseCase';
import { UpdateProfileDto } from '../dtos/UpdateProfileDto';

/**
 * UsersController
 *
 * REST API for user profile management.
 * Only exposes name editing — does NOT touch teams, roles, or permissions.
 */
@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
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
}
