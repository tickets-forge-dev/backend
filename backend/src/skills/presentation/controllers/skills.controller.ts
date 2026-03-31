import { Controller, Get, Post, Body, Inject, UseGuards, NotFoundException } from '@nestjs/common';
import { GetSkillCatalogUseCase } from '../../application/use-cases/GetSkillCatalogUseCase';
import { RecommendSkillsUseCase } from '../../application/use-cases/RecommendSkillsUseCase';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';

@Controller('skills')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class SkillsController {
  constructor(
    private readonly getSkillCatalogUseCase: GetSkillCatalogUseCase,
    private readonly recommendSkillsUseCase: RecommendSkillsUseCase,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
  ) {}

  @Get('catalog')
  async getCatalog() {
    return this.getSkillCatalogUseCase.execute();
  }

  @Post('recommend')
  async recommend(
    @TeamId() teamId: string,
    @Body() body: { ticketId: string },
  ) {
    // Resolve slug or aec_ ID to internal ID
    const resolvedId = await this.resolveTicketId(body.ticketId, teamId);
    return this.recommendSkillsUseCase.execute(resolvedId, teamId);
  }

  private async resolveTicketId(idOrSlug: string, teamId: string): Promise<string> {
    if (idOrSlug.startsWith('aec_')) {
      return idOrSlug;
    }
    const aec = await this.aecRepository.findBySlug(idOrSlug, teamId);
    if (!aec) {
      throw new NotFoundException('Ticket not found');
    }
    return aec.id;
  }
}
