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
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { CreateFolderUseCase } from '../../application/use-cases/CreateFolderUseCase';
import { ListFoldersUseCase } from '../../application/use-cases/ListFoldersUseCase';
import { RenameFolderUseCase } from '../../application/use-cases/RenameFolderUseCase';
import { DeleteFolderUseCase } from '../../application/use-cases/DeleteFolderUseCase';
import { MoveTicketToFolderUseCase } from '../../application/use-cases/MoveTicketToFolderUseCase';
import { UpdateFolderScopeUseCase } from '../../application/use-cases/UpdateFolderScopeUseCase';
import { CreateFolderDto } from '../dtos/CreateFolderDto';
import { RenameFolderDto } from '../dtos/RenameFolderDto';
import { MoveTicketDto } from '../dtos/MoveTicketDto';
import { UpdateFolderScopeDto } from '../dtos/UpdateFolderScopeDto';

/**
 * FoldersController
 *
 * REST API for team-scoped folder management.
 * All endpoints require authentication and a teamId path parameter.
 */
@Controller('teams/:teamId/folders')
@UseGuards(FirebaseAuthGuard)
export class FoldersController {
  constructor(
    private readonly createFolderUseCase: CreateFolderUseCase,
    private readonly listFoldersUseCase: ListFoldersUseCase,
    private readonly renameFolderUseCase: RenameFolderUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
    private readonly moveTicketToFolderUseCase: MoveTicketToFolderUseCase,
    private readonly updateFolderScopeUseCase: UpdateFolderScopeUseCase,
  ) {}

  /**
   * POST /teams/:teamId/folders
   * Create a new folder in the team
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFolder(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Body() dto: CreateFolderDto,
  ) {
    try {
      const userId = req.user.uid;
      const result = await this.createFolderUseCase.execute({
        teamId,
        userId,
        name: dto.name,
        scope: dto.scope,
      });
      return { success: true, folder: result };
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * GET /teams/:teamId/folders
   * List all folders for the team (alphabetical, with ticket counts)
   * Filters by visibility: team folders + user's own private folders
   */
  @Get()
  async listFolders(
    @Request() req: any,
    @Param('teamId') teamId: string,
  ) {
    const userId = req.user.uid;
    const folders = await this.listFoldersUseCase.execute({ teamId, userId });
    return { success: true, folders };
  }

  /**
   * PATCH /teams/:teamId/folders/move-ticket/:ticketId
   * Move a ticket into a folder or back to root
   *
   * IMPORTANT: This route MUST be declared before the generic :folderId route
   * so NestJS matches the literal "move-ticket" segment instead of treating it
   * as a folderId parameter.
   */
  @Patch('move-ticket/:ticketId')
  async moveTicket(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: MoveTicketDto,
  ) {
    try {
      const userId = req.user.uid;
      await this.moveTicketToFolderUseCase.execute({
        teamId,
        ticketId,
        folderId: dto.folderId ?? null,
        userId,
      });
      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('permission')) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * PATCH /teams/:teamId/folders/:folderId/scope
   * Update a folder's scope (team/private)
   *
   * IMPORTANT: This route MUST be declared before the generic :folderId route
   * so NestJS matches the literal "scope" segment.
   */
  @Patch(':folderId/scope')
  async updateFolderScope(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('folderId') folderId: string,
    @Body() dto: UpdateFolderScopeDto,
  ) {
    try {
      const userId = req.user.uid;
      const result = await this.updateFolderScopeUseCase.execute({
        teamId,
        folderId,
        userId,
        scope: dto.scope,
        confirm: dto.confirm,
      });
      return { success: true, ...result };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('permission')) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * PATCH /teams/:teamId/folders/:folderId
   * Rename a folder
   */
  @Patch(':folderId')
  async renameFolder(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('folderId') folderId: string,
    @Body() dto: RenameFolderDto,
  ) {
    try {
      const userId = req.user.uid;
      const result = await this.renameFolderUseCase.execute({
        teamId,
        folderId,
        name: dto.name,
        userId,
      });
      return { success: true, folder: result };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof Error && error.message.includes('permission')) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /teams/:teamId/folders/:folderId
   * Delete a folder (tickets inside move back to root)
   */
  @Delete(':folderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFolder(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('folderId') folderId: string,
  ) {
    try {
      const userId = req.user.uid;
      await this.deleteFolderUseCase.execute({ teamId, folderId, userId });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error && error.message.includes('permission')) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
