import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { SKILL_REPOSITORY, SkillRepository } from '../ports/SkillRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import { DEFAULT_FAST_MODEL } from '../../../shared/infrastructure/llm/llm.config';

export interface SkillRecommendation {
  skillId: string;
  reason: string;
}

@Injectable()
export class RecommendSkillsUseCase {
  private readonly logger = new Logger(RecommendSkillsUseCase.name);

  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(ticketId: string, teamId: string): Promise<{ recommended: SkillRecommendation[] }> {
    const [skills, aec] = await Promise.all([
      this.skillRepository.findAllEnabled(),
      this.aecRepository.findById(ticketId),
    ]);

    if (!aec || skills.length === 0) {
      return { recommended: [] };
    }

    const ticketSummary = [
      `Title: ${aec.title}`,
      aec.description ? `Description: ${aec.description}` : '',
      aec.techSpec?.acceptanceCriteria?.length
        ? `Acceptance Criteria: ${aec.techSpec.acceptanceCriteria.join('; ')}`
        : '',
      aec.techSpec?.fileChanges?.length
        ? `Files to change: ${aec.techSpec.fileChanges.map((f: any) => f.path).join(', ')}`
        : '',
      aec.techSpec?.apiChanges?.endpoints?.length
        ? `API endpoints: ${aec.techSpec.apiChanges.endpoints.length}`
        : '',
    ].filter(Boolean).join('\n');

    const skillMenu = skills.map(s =>
      `- ${s.id}: ${s.name} — ${s.description}`
    ).join('\n');

    try {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        this.logger.warn('ANTHROPIC_API_KEY not set, skipping skill recommendation');
        return { recommended: [] };
      }

      const anthropic = createAnthropic({ apiKey });
      const model = anthropic(
        this.configService.get<string>('ANTHROPIC_FAST_MODEL') || DEFAULT_FAST_MODEL,
      );

      const { text } = await generateText({
        model,
        prompt: `You are selecting development skills for an AI coding agent. Given this ticket and available skills, pick up to 3 that would be most helpful. Return ONLY valid JSON.

TICKET:
${ticketSummary}

AVAILABLE SKILLS:
${skillMenu}

Return JSON: {"recommended": [{"skillId": "id", "reason": "one sentence why"}]}
Pick 1-3 skills. If none are clearly helpful, return an empty array.`,
        maxOutputTokens: 300,
      });

      const parsed = JSON.parse(text);
      return {
        recommended: (parsed.recommended || []).slice(0, 3),
      };
    } catch (error) {
      this.logger.warn(`Skill recommendation failed: ${error}`);
      return { recommended: [] };
    }
  }
}
