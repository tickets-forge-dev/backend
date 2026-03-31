import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetSkillCatalogUseCase } from '../../application/use-cases/GetSkillCatalogUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';

@Controller('skills')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class SkillsController {
  constructor(private readonly getSkillCatalogUseCase: GetSkillCatalogUseCase) {}

  @Get('catalog')
  async getCatalog() {
    return this.getSkillCatalogUseCase.execute();
  }
}
