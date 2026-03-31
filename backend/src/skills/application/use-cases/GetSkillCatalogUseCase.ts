import { Injectable, Inject } from '@nestjs/common';
import { SKILL_REPOSITORY, SkillRepository } from '../ports/SkillRepository.port';

export interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  expandedDescription: string;
  icon: string;
  category: string;
}

@Injectable()
export class GetSkillCatalogUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(): Promise<SkillCatalogItem[]> {
    const skills = await this.skillRepository.findAllEnabled();
    return skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      expandedDescription: s.expandedDescription,
      icon: s.icon,
      category: s.category,
    }));
  }
}
