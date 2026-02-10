/**
 * PRDBreakdownService
 *
 * Orchestrates the PRD analysis and breakdown workflow adapted from BMAD.
 * Transforms a PRD into structured epics and stories.
 *
 * Workflow:
 * 1. Extract Functional Requirements (FRs) from PRD text
 * 2. Group FRs into epics by user value (not technical layers)
 * 3. Break each epic into vertically-sliced stories with BDD acceptance criteria
 * 4. Map dependencies and validate FR coverage
 * 5. Return structured breakdown ready for review and bulk creation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { ollama } from '../../../shared/infrastructure/mastra/providers/ollama.provider';
import {
  PRDBreakdownCommand,
  PRDBreakdownResult,
  PRDBreakdownTicket,
  PRDBreakdownSummary,
  PRDBreakdownEpic,
  BDDCriterion,
} from '../../domain/prd-breakdown/prd-breakdown.types';

interface ExtractedFR {
  id: string;
  description: string;
}

interface EpicProposal {
  name: string;
  goal: string;
  functionalRequirements: string[];
}

interface GeneratedStory {
  title: string;
  userStory: string;
  type: 'feature' | 'bug' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  acceptanceCriteria: BDDCriterion[];
  technicalNotes?: string;
  blockedBy?: number[];
}

@Injectable()
export class PRDBreakdownService {
  private readonly logger = new Logger(PRDBreakdownService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Execute the PRD breakdown workflow
   */
  async breakdown(command: PRDBreakdownCommand): Promise<PRDBreakdownResult> {
    this.logger.log(
      `📋 Starting PRD breakdown for repo ${command.repositoryOwner}/${command.repositoryName}`,
    );

    // Validate PRD text
    this.validatePRDText(command.prdText);

    // Step 1: Extract functional requirements
    const frInventory = await this.extractFunctionalRequirements(command.prdText);
    this.logger.log(`✅ Extracted ${frInventory.length} functional requirements`);

    // Step 2: Propose epic structure
    const epicProposals = await this.proposeEpicStructure(
      command.prdText,
      frInventory,
      command.projectName,
    );
    this.logger.log(`✅ Proposed ${epicProposals.length} epics`);

    // Step 3: Generate stories for each epic
    const epics: PRDBreakdownEpic[] = [];
    for (let i = 0; i < epicProposals.length; i++) {
      const epicProposal = epicProposals[i];
      const stories = await this.generateStoriesForEpic(
        command.prdText,
        epicProposal,
        frInventory,
        i + 1,
      );

      const tickets = this.convertStoriesToTickets(stories, epicProposal.name, i + 1);
      epics.push({
        index: i + 1,
        name: epicProposal.name,
        goal: epicProposal.goal,
        stories: tickets,
        functionalRequirements: epicProposal.functionalRequirements,
      });
    }
    this.logger.log(
      `✅ Generated ${epics.reduce((sum, e) => sum + e.stories.length, 0)} total stories`,
    );

    // Step 4: Build summary with FR coverage
    const summary = this.buildSummary(epics, frInventory);

    // Step 5: Validate coverage
    this.validateFRCoverage(summary, frInventory);

    return {
      tickets: epics.flatMap((e) => e.stories),
      summary,
    };
  }

  /**
   * Validate PRD text meets minimum requirements
   */
  private validatePRDText(prdText: string): void {
    const trimmed = prdText.trim();
    if (trimmed.length < 100) {
      throw new Error('PRD text is too short. Minimum 100 characters required.');
    }
    if (!trimmed.toLowerCase().includes('requirement') && trimmed.split('\n').length < 3) {
      throw new Error(
        'PRD text does not appear to be a valid requirements document. Include functional requirements.',
      );
    }
  }

  /**
   * Step 1: Extract functional requirements from PRD
   */
  private async extractFunctionalRequirements(prdText: string): Promise<ExtractedFR[]> {
    const model = this.getModel('main');

    const prompt = `You are a product analyst specializing in extracting requirements from Product Requirements Documents.

Extract ALL functional requirements from the following PRD text. Requirements are capabilities that users need or that the system must provide.

PRD TEXT:
${prdText}

Respond with ONLY valid JSON array with no text before or after:
[
  {
    "id": "FR1",
    "description": "Users can create accounts with email or social authentication"
  },
  ...
]

Guidelines:
- Extract EVERY distinct capability or requirement mentioned
- Use simple, clear language (no jargon)
- Start descriptions with "Users can...", "System must...", etc.
- Number sequentially as FR1, FR2, FR3, etc.
- Include both explicit and implicit requirements
- Focus on WHAT, not HOW`;

    try {
      const result = await generateText({
        model,
        system: 'You are a JSON-only assistant. Respond with ONLY valid JSON, no other text.',
        prompt,
        temperature: 0.3, // Low temperature for consistency
      });

      const parsed = JSON.parse(result.text);
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array of requirements');
      }
      return parsed as ExtractedFR[];
    } catch (error) {
      this.logger.error(`Failed to extract FRs: ${error}`);
      // Fallback: return empty array, workflow continues
      return [];
    }
  }

  /**
   * Step 2: Propose epic structure by user value
   */
  private async proposeEpicStructure(
    prdText: string,
    frInventory: ExtractedFR[],
    projectName?: string,
  ): Promise<EpicProposal[]> {
    const model = this.getModel('main');

    const frList = frInventory.map((fr) => `${fr.id}: ${fr.description}`).join('\n');

    const prompt = `You are a product strategist specializing in epic planning and story breakdown.

Given these functional requirements, propose a natural epic structure that groups related requirements by USER VALUE (not technical layers).

PROJECT: ${projectName || 'Unknown'}

FUNCTIONAL REQUIREMENTS:
${frList}

CRITICAL PRINCIPLE:
- ✅ GOOD: "User Authentication", "Content Management", "Social Features" (each delivers USER VALUE)
- ❌ BAD: "Database Layer", "API Endpoints", "Frontend Components" (only tech layers, no user value)

Respond with ONLY valid JSON array with no text before or after:
[
  {
    "name": "Epic name (e.g., 'User Authentication')",
    "goal": "What user value does this epic deliver? (e.g., 'Users can securely register and log in')",
    "functionalRequirements": ["FR1", "FR2", "FR3"]
  },
  ...
]

Guidelines:
- Propose 3-6 epics for typical projects
- Each epic should have 3-8 related stories
- Each epic must deliver meaningful user value
- Exceptions: Foundation epic (setup) at the start is acceptable for greenfield
- Order epics logically (dependencies first)
- Map each FR to at least one epic`;

    try {
      const result = await generateText({
        model,
        system: 'You are a JSON-only assistant. Respond with ONLY valid JSON, no other text.',
        prompt,
        temperature: 0.4,
      });

      const parsed = JSON.parse(result.text);
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array of epic proposals');
      }
      return parsed as EpicProposal[];
    } catch (error) {
      this.logger.error(`Failed to propose epics: ${error}`);
      return [];
    }
  }

  /**
   * Step 3: Generate stories for a specific epic
   */
  private async generateStoriesForEpic(
    prdText: string,
    epic: EpicProposal,
    allFRs: ExtractedFR[],
    epicIndex: number,
  ): Promise<GeneratedStory[]> {
    const model = this.getModel('main');

    const relevantFRs = allFRs.filter((fr) => epic.functionalRequirements.includes(fr.id));
    const frList = relevantFRs.map((fr) => `${fr.id}: ${fr.description}`).join('\n');

    const prompt = `You are a user story writer specializing in Agile/Scrum stories with BDD acceptance criteria.

Given an epic and its functional requirements, generate vertically-sliced user stories that:
1. Deliver complete, usable functionality (not just UI or API)
2. Are small enough for one dev to complete in one session
3. Have clear, testable BDD acceptance criteria
4. Are sequenced logically with dependencies

EPIC: "${epic.name}"
EPIC GOAL: "${epic.goal}"

RELEVANT FUNCTIONAL REQUIREMENTS:
${frList}

Respond with ONLY valid JSON array with no text before or after:
[
  {
    "title": "Story title (noun-based: 'User registration with email')",
    "userStory": "As a [user type], I want [capability], So that [value]",
    "type": "feature|bug|task",
    "priority": "low|medium|high|urgent",
    "acceptanceCriteria": [
      {
        "given": "User is on registration page",
        "when": "User enters email and password",
        "then": "Email is validated against RFC 5322 standard"
      },
      ...
    ],
    "technicalNotes": "Optional implementation guidance",
    "blockedBy": [0]
  },
  ...
]

Guidelines:
- Generate 3-8 stories per epic
- Stories must be vertically sliced (complete functionality, not just one layer)
- BDD criteria must be testable and specific
- blockedBy references story index within this epic (0 = no dependencies, 1 = first story, etc.)
- type: "feature" for new capability, "bug" for fixes, "task" for setup/config
- priority: "urgent" for blocking, "high" for needed soon, "medium" for nice-to-have, "low" for stretch
- technicalNotes: Implementation hints, patterns, libs, specific details
- Title should be concrete: "User registration" not "Create registration functionality"`;

    try {
      const result = await generateText({
        model,
        system: 'You are a JSON-only assistant. Respond with ONLY valid JSON, no other text.',
        prompt,
        temperature: 0.5,
      });

      const parsed = JSON.parse(result.text);
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array of stories');
      }
      return parsed as GeneratedStory[];
    } catch (error) {
      this.logger.error(`Failed to generate stories for epic ${epic.name}: ${error}`);
      return [];
    }
  }

  /**
   * Convert generated stories to PRDBreakdownTicket format
   */
  private convertStoriesToTickets(
    stories: GeneratedStory[],
    epicName: string,
    epicIndex: number,
  ): PRDBreakdownTicket[] {
    let globalId = epicIndex * 100; // Start at 100, 200, 300, etc. for each epic

    return stories.map((story, storyIndex) => {
      globalId++;
      return {
        id: globalId,
        epicName,
        epicIndex,
        storyIndex: storyIndex + 1,
        title: story.title,
        description: story.userStory,
        type: story.type,
        priority: story.priority,
        acceptanceCriteria: story.acceptanceCriteria,
        functionalRequirements: [], // Will be filled later
        blockedBy: story.blockedBy || [],
        technicalNotes: story.technicalNotes,
      };
    });
  }

  /**
   * Build summary with FR coverage mapping
   */
  private buildSummary(epics: PRDBreakdownEpic[], frInventory: ExtractedFR[]): PRDBreakdownSummary {
    const allTickets = epics.flatMap((e) => e.stories);
    const frCoverage: Record<string, string[]> = {};

    // Initialize FR coverage
    for (const fr of frInventory) {
      frCoverage[fr.id] = [];
    }

    // Map FRs to tickets
    for (const epic of epics) {
      for (const fr of epic.functionalRequirements) {
        frCoverage[fr] = frCoverage[fr] || [];
        frCoverage[fr].push(epic.name);
      }
    }

    return {
      totalTickets: allTickets.length,
      epicCount: epics.length,
      epics,
      frCoverage,
      frInventory,
    };
  }

  /**
   * Validate that all FRs are covered by at least one story
   */
  private validateFRCoverage(summary: PRDBreakdownSummary, frInventory: ExtractedFR[]): void {
    const covered = new Set<string>();
    for (const epic of summary.epics) {
      for (const fr of epic.functionalRequirements) {
        covered.add(fr);
      }
    }

    const uncovered = frInventory.filter((fr) => !covered.has(fr.id));
    if (uncovered.length > 0) {
      this.logger.warn(
        `⚠️ ${uncovered.length} functional requirements not covered by any story: ${uncovered.map((fr) => fr.id).join(', ')}`,
      );
      // Don't throw - coverage is best-effort
    }
  }

  /**
   * Get LLM model based on environment
   */
  private getModel(type: 'fast' | 'main'): any {
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'ollama';

    if (provider === 'ollama') {
      const modelName =
        type === 'fast'
          ? this.configService.get('OLLAMA_FAST_MODEL') || 'qwen2.5-coder:latest'
          : this.configService.get('OLLAMA_MAIN_MODEL') || 'qwen2.5-coder:latest';
      return ollama(modelName);
    } else {
      // Anthropic provider - will be implemented when @ai-sdk/anthropic is installed
      throw new Error(
        'Anthropic provider requires @ai-sdk/anthropic to be installed. Currently only Ollama provider is available for PRD breakdown.',
      );
    }
  }
}
