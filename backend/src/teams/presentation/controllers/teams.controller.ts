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
  NotFoundException,
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
import { AcceptInviteUseCase } from '../../application/use-cases/AcceptInviteUseCase';
import { SyncUserTeamsUseCase } from '../../application/use-cases/SyncUserTeamsUseCase';
import { GetCurrentMemberUseCase } from '../../application/use-cases/GetCurrentMemberUseCase';
import { UpdateOwnRoleUseCase } from '../../application/use-cases/UpdateOwnRoleUseCase';
import { InviteTokenService } from '../../application/services/InviteTokenService';
import { CreateTeamDto } from '../dtos/CreateTeamDto';
import { UpdateTeamDto } from '../dtos/UpdateTeamDto';
import { SwitchTeamDto } from '../dtos/SwitchTeamDto';
import { AcceptInviteDto } from '../dtos/AcceptInviteDto';
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
    private readonly syncUserTeamsUseCase: SyncUserTeamsUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly listTeamMembersUseCase: ListTeamMembersUseCase,
    private readonly changeMemberRoleUseCase: ChangeMemberRoleUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
    private readonly acceptInviteUseCase: AcceptInviteUseCase,
    private readonly getCurrentMemberUseCase: GetCurrentMemberUseCase,
    private readonly updateOwnRoleUseCase: UpdateOwnRoleUseCase,
    private readonly inviteTokenService: InviteTokenService,
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
      // Firebase token includes email and name for auto-creating user if needed
      const userEmail = req.user.email || '';
      const userDisplayName = req.user.name || req.user.displayName;

      const result = await this.createTeamUseCase.execute({
        userId,
        userEmail,
        userDisplayName,
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
   * Switch current team or to personal workspace (teamId: null)
   */
  @Post('switch')
  @HttpCode(HttpStatus.OK)
  async switchTeam(@Request() req: any, @Body() dto: SwitchTeamDto) {
    try {
      const userId = req.user.uid;

      const result = await this.switchTeamUseCase.execute({
        userId,
        teamId: dto.teamId ?? null,
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

  /**
   * POST /teams/accept-invite
   * Accept a team invitation (authenticated user)
   */
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Request() req: any, @Body() dto: AcceptInviteDto) {
    try {
      const userId = req.user.uid;
      const userEmail = req.user.email;

      // 1. Verify and decode invite token
      let tokenPayload;
      try {
        tokenPayload = this.inviteTokenService.verifyInviteToken(dto.token);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid invite token';
        throw new BadRequestException(message);
      }

      // 2. Verify user's email matches the invited email
      if (userEmail.toLowerCase() !== tokenPayload.email.toLowerCase()) {
        throw new BadRequestException(
          `This invitation was sent to ${tokenPayload.email}. Please sign in with that email address.`
        );
      }

      // 3. Accept the invite
      await this.acceptInviteUseCase.execute({
        memberId: tokenPayload.memberId,
        userId,
        displayName: dto.displayName,
      });

      return {
        success: true,
        teamId: tokenPayload.teamId,
        message: 'Successfully joined the team',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException('Invitation not found or expired');
      }
      throw error;
    }
  }

  /**
   * POST /teams/sync
   * Sync user's teamIds array with actual teams (fixes data corruption)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncUserTeams(@Request() req: any) {
    try {
      const userId = req.user.uid;

      const result = await this.syncUserTeamsUseCase.execute({ userId });

      return {
        success: true,
        syncedTeams: result.syncedTeams,
        message: `Synced ${result.syncedTeams.length} team(s)`,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * GET /teams/me/member
   * Get current user's team member info for their active team
   */
  @Get('me/member')
  async getCurrentMember(@Request() req: any) {
    try {
      const userId = req.user.uid;

      const result = await this.getCurrentMemberUseCase.execute({ userId });

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * PATCH /teams/me/member/role
   * Update current user's role in their active team
   */
  @Patch('me/member/role')
  async updateOwnRole(@Request() req: any, @Body() dto: { role: string }) {
    try {
      const userId = req.user.uid;

      const result = await this.updateOwnRoleUseCase.execute({
        userId,
        newRole: dto.role,
      });

      return {
        success: true,
        member: result,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof Error && error.message.includes('Cannot change role')) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
