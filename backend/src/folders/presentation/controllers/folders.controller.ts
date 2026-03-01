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
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { CreateFolderUseCase } from '../../application/use-cases/CreateFolderUseCase';
import { ListFoldersUseCase } from '../../application/use-cases/ListFoldersUseCase';
import { RenameFolderUseCase } from '../../application/use-cases/RenameFolderUseCase';
import { DeleteFolderUseCase } from '../../application/use-cases/DeleteFolderUseCase';
import { MoveTicketToFolderUseCase } from '../../application/use-cases/MoveTicketToFolderUseCase';
import { CreateFolderDto } from '../dtos/CreateFolderDto';
import { RenameFolderDto } from '../dtos/RenameFolderDto';
import { MoveTicketDto } from '../dtos/MoveTicketDto';

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
   */
  @Get()
  async listFolders(@Param('teamId') teamId: string) {
    const folders = await this.listFoldersUseCase.execute({ teamId });
    return { success: true, folders };
  }

  /**
   * PATCH /teams/:teamId/folders/:folderId
   * Rename a folder
   */
  @Patch(':folderId')
  async renameFolder(
    @Param('teamId') teamId: string,
    @Param('folderId') folderId: string,
    @Body() dto: RenameFolderDto,
  ) {
    try {
      const result = await this.renameFolderUseCase.execute({
        teamId,
        folderId,
        name: dto.name,
      });
      return { success: true, folder: result };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
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
   * DELETE /teams/:teamId/folders/:folderId
   * Delete a folder (tickets inside move back to root)
   */
  @Delete(':folderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFolder(
    @Param('teamId') teamId: string,
    @Param('folderId') folderId: string,
  ) {
    try {
      await this.deleteFolderUseCase.execute({ teamId, folderId });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * PATCH /teams/:teamId/folders/move-ticket/:ticketId
   * Move a ticket into a folder or back to root
   */
  @Patch('move-ticket/:ticketId')
  async moveTicket(
    @Param('teamId') teamId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: MoveTicketDto,
  ) {
    try {
      await this.moveTicketToFolderUseCase.execute({
        teamId,
        ticketId,
        folderId: dto.folderId ?? null,
      });
      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
