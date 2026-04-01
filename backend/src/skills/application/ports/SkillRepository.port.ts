import { Skill } from '../../domain/Skill';

export const SKILL_REPOSITORY = Symbol('SkillRepository');

export interface SkillRepository {
  findAllEnabled(): Promise<Skill[]>;
  findByIds(ids: string[]): Promise<Skill[]>;
}
