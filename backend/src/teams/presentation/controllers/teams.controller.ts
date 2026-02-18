import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { CreateTeamUseCase } from '../../application/use-cases/CreateTeamUseCase';
import { UpdateTeamUseCase } from '../../application/use-cases/UpdateTeamUseCase';
import { DeleteTeamUseCase } from '../../application/use-cases/DeleteTeamUseCase';
import { GetTeamUseCase } from '../../application/use-cases/GetTeamUseCase';
import { GetUserTeamsUseCase } from '../../application/use-cases/GetUserTeamsUseCase';
import { SwitchTeamUseCase } from '../../application/use-cases/SwitchTeamUseCase';
import { InviteMemberUseCase } from '../../application/use-cases/InviteMemberUseCase';
import { ListTeamMembersUseCase } from '../../application/use-cases/ListTeamMembersUseCase';
import { ChangeMemberRoleUseCase } from '../../application/use-cases/ChangeMemberRoleUseCase';
import { RemoveMemberUseCase } from '../../application/use-cases/RemoveMemberUseCase';
import { CreateTeamDto } from '../dtos/CreateTeamDto';
import { UpdateTeamDto } from '../dtos/UpdateTeamDto';
import { SwitchTeamDto } from '../dtos/SwitchTeamDto';
import { InvalidTeamException } from '../../domain/exceptions/InvalidTeamException';

/**
 * TeamsController
 *
 * REST API for team management.
 */
@Controller('teams')
@UseGuards(FirebaseAuthGuard)
export class TeamsController {
  constructor(
    private readonly createTeamUseCase: CreateTeamUseCase,
    private readonly updateTeamUseCase: UpdateTeamUseCase,
    private readonly deleteTeamUseCase: DeleteTeamUseCase,
    private readonly getTeamUseCase: GetTeamUseCase,
    private readonly getUserTeamsUseCase: GetUserTeamsUseCase,
    private readonly switchTeamUseCase: SwitchTeamUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly listTeamMembersUseCase: ListTeamMembersUseCase,
    private readonly changeMemberRoleUseCase: ChangeMemberRoleUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
  ) {}

  /**
   * POST /teams
   * Create a new team
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTeam(@Request() req: any, @Body() dto: CreateTeamDto) {
    try {
      const userId = req.user.uid;

      const result = await this.createTeamUseCase.execute({
        userId,
        teamName: dto.name,
        allowMemberInvites: dto.allowMemberInvites,
      });

      return {
        success: true,
        team: result,
      };
    } catch (error) {
      if (error instanceof InvalidTeamException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * GET /teams
   * List all teams for current user
   */
  @Get()
  async getUserTeams(@Request() req: any) {
    const userId = req.user.uid;

    const result = await this.getUserTeamsUseCase.execute({ userId });

    return {
      teams: result.teams,
      currentTeamId: result.currentTeamId,
    };
  }

  /**
   * GET /teams/:id
   * Get team by ID
   */
  @Get(':id')
  async getTeam(@Request() req: any, @Param('id') teamId: string) {
    try {
      const userId = req.user.uid;

      const result = await this.getTeamUseCase.execute({ userId, teamId });

      return {
        success: true,
        team: result,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * PATCH /teams/:id
   * Update team (owner only)
   */
  @Patch(':id')
  async updateTeam(
    @Request() req: any,
    @Param('id') teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    try {
      const userId = req.user.uid;

      const result = await this.updateTeamUseCase.execute({
        userId,
        teamId,
        teamName: dto.name,
        settings: dto.settings,
      });

      return {
        success: true,
        team: result,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof InvalidTeamException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /teams/switch
   * Switch current team
   */
  @Post('switch')
  @HttpCode(HttpStatus.OK)
  async switchTeam(@Request() req: any, @Body() dto: SwitchTeamDto) {
    try {
      const userId = req.user.uid;

      const result = await this.switchTeamUseCase.execute({
        userId,
        teamId: dto.teamId,
      });

      return {
        success: true,
        currentTeam: result,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /teams/:id
   * Delete team (soft delete, owner only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTeam(@Request() req: any, @Param('id') teamId: string) {
    try {
      const userId = req.user.uid;

      await this.deleteTeamUseCase.execute({
        userId,
        teamId,
      });

      // 204 No Content - no response body
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /teams/:id/members
   * Invite a new member to the team
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(
    @Request() req: any,
    @Param('id') teamId: string,
    @Body() dto: { email: string; role: string },
  ) {
    try {
      const userId = req.user.uid;

      const result = await this.inviteMemberUseCase.execute({
        teamId,
        email: dto.email,
        role: dto.role as any, // Role validation happens in use case
        invitedBy: userId,
      });

      return {
        success: true,
        member: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * GET /teams/:id/members
   * List all team members
   */
  @Get(':id/members')
  async listTeamMembers(@Request() req: any, @Param('id') teamId: string) {
    try {
      const userId = req.user.uid;

      const members = await this.listTeamMembersUseCase.execute({
        teamId,
        requesterId: userId,
      });

      return {
        success: true,
        members: members.map((m) => m.toObject()),
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * PATCH /teams/:id/members/:userId
   * Change member role (owner only)
   */
  @Patch(':id/members/:userId')
  async changeMemberRole(
    @Request() req: any,
    @Param('id') teamId: string,
    @Param('userId') memberUserId: string,
    @Body() dto: { role: string },
  ) {
    try {
      const userId = req.user.uid;

      await this.changeMemberRoleUseCase.execute({
        teamId,
        memberUserId,
        newRole: dto.role as any, // Role validation happens in use case
        requesterId: userId,
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /teams/:id/members/:userId
   * Remove member from team (owner only)
   */
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Request() req: any,
    @Param('id') teamId: string,
    @Param('userId') memberUserId: string,
  ) {
    try {
      const userId = req.user.uid;

      await this.removeMemberUseCase.execute({
        teamId,
        memberUserId,
        requesterId: userId,
      });

      // 204 No Content - no response body
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
