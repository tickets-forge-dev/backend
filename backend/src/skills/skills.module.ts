import { Module } from '@nestjs/common';
import { SkillsController } from './presentation/controllers/skills.controller';
import { GetSkillCatalogUseCase } from './application/use-cases/GetSkillCatalogUseCase';
import { SKILL_REPOSITORY } from './application/ports/SkillRepository.port';
import { FirestoreSkillRepository } from './infrastructure/persistence/FirestoreSkillRepository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [SkillsController],
  providers: [
    GetSkillCatalogUseCase,
    { provide: SKILL_REPOSITORY, useClass: FirestoreSkillRepository },
  ],
  exports: [SKILL_REPOSITORY, GetSkillCatalogUseCase],
})
export class SkillsModule {}
