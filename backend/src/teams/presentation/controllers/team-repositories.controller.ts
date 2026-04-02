import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreTeamMemberRepository } from '../../infrastructure/persistence/FirestoreTeamMemberRepository';
import { TeamRepository as TeamRepo, RepositoryRole } from '../../domain/TeamRepository';
import { TeamId } from '../../domain/TeamId';

/**
 * TeamRepositoriesController
 *
 * REST API for managing repositories attached to a team.
 * Routes: /teams/:teamId/repositories
 *
 * Uses WorkspaceGuard to validate the requesting user is a member of the team.
 */
@Controller('teams/:teamId/repositories')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class TeamRepositoriesController {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly teamMemberRepository: FirestoreTeamMemberRepository,
  ) {}

  /**
   * Validate the requesting user is a member (or owner) of the team.
   * WorkspaceGuard validates via x-team-id header, but the teamId here
   * comes from URL params — we must verify independently.
   */
  private async validateMembership(userId: string, teamId: string, team: any): Promise<void> {
    if (team.isOwnedBy(userId)) return;
    const member = await this.teamMemberRepository.findByUserAndTeam(userId, teamId);
    if (!member || !member.isActive()) {
      throw new ForbiddenException('You are not a member of this team');
    }
  }

  /**
   * GET /teams/:teamId/repositories
   * List all repositories for a team. Any team member can access.
   */
  @Get()
  async listRepositories(@Request() req: any, @Param('teamId') teamId: string) {
    const userId: string = req.user.uid;
    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    await this.validateMembership(userId, teamId, team);

    return {
      success: true,
      repositories: team.getSettings().repositories.map((r) => r.toObject()),
    };
  }

  /**
   * POST /teams/:teamId/repositories
   * Add a repository to the team. Owner only.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addRepository(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Body()
    dto: {
      repositoryFullName: string;
      role: RepositoryRole;
      defaultBranch?: string;
    },
  ) {
    const userId: string = req.user.uid;

    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    if (!team.isOwnedBy(userId)) {
      throw new ForbiddenException('Only the team owner can add repositories');
    }

    const existing = team
      .getSettings()
      .repositories.find((r) => r.repositoryFullName === dto.repositoryFullName);
    if (existing) {
      throw new BadRequestException(
        `Repository ${dto.repositoryFullName} is already added to this team`,
      );
    }

    const newRepo = TeamRepo.create(
      dto.repositoryFullName,
      dto.role,
      dto.defaultBranch ?? 'main',
      userId,
    );

    const updatedSettings = team
      .getSettings()
      .withRepositories([...team.getSettings().repositories, newRepo]);

    const updatedTeam = team.updateSettings(updatedSettings);
    await this.teamRepository.save(updatedTeam);

    return {
      success: true,
      repository: newRepo.toObject(),
    };
  }

  /**
   * PATCH /teams/:teamId/repositories/:repoName
   * Update the role or default branch of a repository. Owner only.
   * repoName uses '--' as separator (e.g. 'forge-dev--client' → 'forge-dev/client').
   */
  @Patch(':repoName')
  async updateRepository(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('repoName') repoName: string,
    @Body() dto: { role?: RepositoryRole; defaultBranch?: string },
  ) {
    const userId: string = req.user.uid;
    const repositoryFullName = repoName.replace('--', '/');

    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    if (!team.isOwnedBy(userId)) {
      throw new ForbiddenException('Only the team owner can update repositories');
    }

    const repos = team.getSettings().repositories;
    const repoIndex = repos.findIndex((r) => r.repositoryFullName === repositoryFullName);
    if (repoIndex === -1) {
      throw new NotFoundException(`Repository ${repositoryFullName} not found in this team`);
    }

    let repo = repos[repoIndex];
    if (dto.role !== undefined) {
      repo = repo.withRole(dto.role);
    }
    if (dto.defaultBranch !== undefined) {
      repo = repo.withDefaultBranch(dto.defaultBranch);
    }

    const updatedRepos = [...repos];
    updatedRepos[repoIndex] = repo;

    const updatedSettings = team.getSettings().withRepositories(updatedRepos);
    const updatedTeam = team.updateSettings(updatedSettings);
    await this.teamRepository.save(updatedTeam);

    return {
      success: true,
      repository: repo.toObject(),
    };
  }

  /**
   * DELETE /teams/:teamId/repositories/:repoName
   * Remove a repository from the team. Owner only. Returns 204.
   * repoName uses '--' as separator (e.g. 'forge-dev--client' → 'forge-dev/client').
   */
  @Delete(':repoName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRepository(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('repoName') repoName: string,
  ) {
    const userId: string = req.user.uid;
    const repositoryFullName = repoName.replace('--', '/');

    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    if (!team.isOwnedBy(userId)) {
      throw new ForbiddenException('Only the team owner can remove repositories');
    }

    const repos = team.getSettings().repositories;
    const repoExists = repos.some((r) => r.repositoryFullName === repositoryFullName);
    if (!repoExists) {
      throw new NotFoundException(`Repository ${repositoryFullName} not found in this team`);
    }

    const updatedRepos = repos.filter((r) => r.repositoryFullName !== repositoryFullName);
    const updatedSettings = team.getSettings().withRepositories(updatedRepos);
    const updatedTeam = team.updateSettings(updatedSettings);
    await this.teamRepository.save(updatedTeam);
  }
}
