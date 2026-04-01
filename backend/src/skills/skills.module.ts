import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { SkillsController } from './presentation/controllers/skills.controller';
import { GetSkillCatalogUseCase } from './application/use-cases/GetSkillCatalogUseCase';
import { RecommendSkillsUseCase } from './application/use-cases/RecommendSkillsUseCase';
import { SKILL_REPOSITORY } from './application/ports/SkillRepository.port';
import { FirestoreSkillRepository } from './infrastructure/persistence/FirestoreSkillRepository';
import { SharedModule } from '../shared/shared.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [SharedModule, TicketsModule],
  controllers: [SkillsController],
  providers: [
    GetSkillCatalogUseCase,
    RecommendSkillsUseCase,
    { provide: SKILL_REPOSITORY, useClass: FirestoreSkillRepository },
  ],
  exports: [SKILL_REPOSITORY, GetSkillCatalogUseCase],
})
export class SkillsModule implements OnModuleInit {
  private readonly logger = new Logger(SkillsModule.name);

  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: FirestoreSkillRepository,
  ) {}

  async onModuleInit() {
    try {
      await this.skillRepository.seedIfEmpty();
    } catch (error) {
      this.logger.warn(`Skill seeding failed (non-fatal): ${error}`);
    }
  }
}
