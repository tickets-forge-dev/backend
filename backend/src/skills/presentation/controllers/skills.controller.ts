import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { GetSkillCatalogUseCase } from '../../application/use-cases/GetSkillCatalogUseCase';
import { RecommendSkillsUseCase } from '../../application/use-cases/RecommendSkillsUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';

@Controller('skills')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class SkillsController {
  constructor(
    private readonly getSkillCatalogUseCase: GetSkillCatalogUseCase,
    private readonly recommendSkillsUseCase: RecommendSkillsUseCase,
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
    return this.recommendSkillsUseCase.execute(body.ticketId, teamId);
  }
}
