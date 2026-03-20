import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TriggerScanUseCase } from '../../application/use-cases/TriggerScanUseCase';
import { GetProfileUseCase } from '../../application/use-cases/GetProfileUseCase';
import { DeleteProfileUseCase } from '../../application/use-cases/DeleteProfileUseCase';
import { TriggerScanDto } from '../dto/TriggerScanDto';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { RateLimitGuard } from '../../../shared/presentation/guards/RateLimitGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';
import { WorkspaceId } from '../../../shared/presentation/decorators/WorkspaceId.decorator';
import { UserId } from '../../../shared/presentation/decorators/UserId.decorator';

@Controller('project-profiles')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class ProjectProfilesController {
  constructor(
    private readonly triggerScanUseCase: TriggerScanUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly deleteProfileUseCase: DeleteProfileUseCase,
  ) {}

  @UseGuards(RateLimitGuard)
  @Post('scan')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerScan(
    @TeamId() teamId: string,
    @WorkspaceId() workspaceId: string,
    @UserId() userId: string,
    @Body() dto: TriggerScanDto,
  ): Promise<{ profileId: string; status: string }> {
    return this.triggerScanUseCase.execute({
      teamId,
      workspaceId,
      userId,
      repoOwner: dto.repoOwner,
      repoName: dto.repoName,
      branch: dto.branch || 'main',
    });
  }

  @Get(':profileId')
  async getById(
    @TeamId() teamId: string,
    @Param('profileId') profileId: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.getProfileUseCase.executeById(profileId, teamId);
    if (!result) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }
    return result;
  }

  @Get()
  async findByRepo(
    @TeamId() teamId: string,
    @Query('repo') repo?: string,
  ): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
    if (repo) {
      const parts = repo.split('/');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new BadRequestException(
          'Invalid repo format. Expected "owner/name".',
        );
      }
      return this.getProfileUseCase.executeByRepo(teamId, parts[0], parts[1]);
    }
    return this.getProfileUseCase.executeAllByTeam(teamId);
  }

  @Delete(':profileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(
    @TeamId() teamId: string,
    @Param('profileId') profileId: string,
  ): Promise<void> {
    await this.deleteProfileUseCase.execute(profileId, teamId);
  }
}
