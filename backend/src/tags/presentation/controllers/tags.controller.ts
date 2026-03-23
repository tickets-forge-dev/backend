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
import { CreateTagUseCase } from '../../application/use-cases/CreateTagUseCase';
import { ListTagsUseCase } from '../../application/use-cases/ListTagsUseCase';
import { UpdateTagUseCase } from '../../application/use-cases/UpdateTagUseCase';
import { DeleteTagUseCase } from '../../application/use-cases/DeleteTagUseCase';
import { CreateTagDto } from '../dtos/CreateTagDto';
import { UpdateTagDto } from '../dtos/UpdateTagDto';
import { TagColor } from '../../domain/Tag';

/**
 * TagsController
 *
 * REST API for team-scoped tag management.
 * All endpoints require authentication and a teamId path parameter.
 */
@Controller('teams/:teamId/tags')
@UseGuards(FirebaseAuthGuard)
export class TagsController {
  constructor(
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly listTagsUseCase: ListTagsUseCase,
    private readonly updateTagUseCase: UpdateTagUseCase,
    private readonly deleteTagUseCase: DeleteTagUseCase,
  ) {}

  /**
   * POST /teams/:teamId/tags
   * Create a new tag in the team
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTag(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Body() dto: CreateTagDto,
  ) {
    try {
      const userId = req.user.uid;
      const result = await this.createTagUseCase.execute({
        teamId,
        userId,
        name: dto.name,
        color: dto.color as TagColor,
        scope: dto.scope,
      });
      return { success: true, tag: result };
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
   * GET /teams/:teamId/tags
   * List all visible tags for the team (team tags + user's private tags)
   */
  @Get()
  async listTags(
    @Request() req: any,
    @Param('teamId') teamId: string,
  ) {
    const userId = req.user.uid;
    const tags = await this.listTagsUseCase.execute({ teamId, userId });
    return { success: true, tags };
  }

  /**
   * PATCH /teams/:teamId/tags/:tagId
   * Update a tag's name and/or color
   */
  @Patch(':tagId')
  async updateTag(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('tagId') tagId: string,
    @Body() dto: UpdateTagDto,
  ) {
    try {
      const userId = req.user.uid;
      const result = await this.updateTagUseCase.execute({
        teamId,
        tagId,
        userId,
        name: dto.name,
        color: dto.color as TagColor | undefined,
      });
      return { success: true, tag: result };
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
   * DELETE /teams/:teamId/tags/:tagId
   * Delete a tag and remove it from all tickets
   */
  @Delete(':tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTag(
    @Request() req: any,
    @Param('teamId') teamId: string,
    @Param('tagId') tagId: string,
  ) {
    try {
      const userId = req.user.uid;
      await this.deleteTagUseCase.execute({ teamId, tagId, userId });
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
