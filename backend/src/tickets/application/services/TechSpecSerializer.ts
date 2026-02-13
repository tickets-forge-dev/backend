import { Injectable, Logger } from '@nestjs/common';
import { TechSpec } from '../../domain/tech-spec/TechSpecGenerator';

/**
 * Serializes a TechSpec to JSON format
 * Suitable for programmatic consumption by agents and development tools
 */
@Injectable()
export class TechSpecSerializer {
  private readonly logger = new Logger(TechSpecSerializer.name);

  serialize(techSpec: TechSpec | null): string {
    if (!techSpec) {
      return JSON.stringify(
        {
          status: 'not-generated',
          message: 'No technical specification has been generated yet',
        },
        null,
        2,
      );
    }

    try {
      const serialized = this.buildTechSpecObject(techSpec);
      return JSON.stringify(serialized, null, 2);
    } catch (error: any) {
      this.logger.error(`Failed to serialize TechSpec to JSON: ${error.message}`);
      throw error;
    }
  }

  private buildTechSpecObject(techSpec: TechSpec): any {
    return {
      metadata: {
        id: techSpec.id,
        title: techSpec.title,
        createdAt: techSpec.createdAt?.toISOString(),
        qualityScore: techSpec.qualityScore,
        status: 'generated',
      },
      problemStatement: {
        narrative: techSpec.problemStatement.narrative,
        whyItMatters: techSpec.problemStatement.whyItMatters,
        context: techSpec.problemStatement.context,
        assumptions: techSpec.problemStatement.assumptions || [],
        constraints: techSpec.problemStatement.constraints || [],
      },
      solution: this.serializeSolution(techSpec.solution),
      scope: {
        inScope: techSpec.inScope || [],
        outOfScope: techSpec.outOfScope || [],
      },
      acceptanceCriteria: this.serializeAcceptanceCriteria(techSpec.acceptanceCriteria),
      clarificationQuestions: techSpec.clarificationQuestions || [],
      fileChanges: {
        summary: {
          total: techSpec.fileChanges?.length || 0,
          create: techSpec.fileChanges?.filter((f) => f.action === 'create').length || 0,
          modify: techSpec.fileChanges?.filter((f) => f.action === 'modify').length || 0,
          delete: techSpec.fileChanges?.filter((f) => f.action === 'delete').length || 0,
        },
        files: techSpec.fileChanges || [],
      },
      apiChanges: techSpec.apiChanges || null,
      layeredFileChanges: techSpec.layeredFileChanges || null,
      testPlan: this.serializeTestPlan(techSpec.testPlan),
      visualExpectations: techSpec.visualExpectations || null,
      bugDetails: techSpec.bugDetails || null,
      stack: techSpec.stack || null,
      ambiguityFlags: techSpec.ambiguityFlags || [],
    };
  }

  private serializeSolution(solution: any): any {
    if (typeof solution === 'string') {
      return {
        type: 'text',
        content: solution,
      };
    }

    if (Array.isArray(solution)) {
      return {
        type: 'steps',
        steps: solution.map((step, idx) => ({
          order: idx + 1,
          content: typeof step === 'string' ? step : step.description,
        })),
      };
    }

    return {
      type: 'structured',
      overview: solution.overview,
      steps: (solution.steps || []).map((step: any) => ({
        order: step.order,
        description: step.description,
        file: step.file,
        lineNumbers: step.lineNumbers,
        codeSnippet: step.codeSnippet,
      })),
      fileChanges: solution.fileChanges || {
        create: [],
        modify: [],
        delete: [],
      },
      databaseChanges: solution.databaseChanges,
      environmentChanges: solution.environmentChanges,
    };
  }

  private serializeAcceptanceCriteria(criteria: any[]): any {
    if (!criteria) return [];

    return criteria.map((criterion) => {
      if (typeof criterion === 'string') {
        return {
          type: 'text',
          text: criterion,
        };
      }

      return {
        type: 'bdd',
        given: criterion.given,
        when: criterion.when,
        then: criterion.then,
        implementationNotes: criterion.implementationNotes,
      };
    });
  }

  private serializeTestPlan(testPlan: any): any {
    if (!testPlan) {
      return null;
    }

    return {
      summary: testPlan.summary,
      coverageGoal: testPlan.coverageGoal || 80,
      statistics: {
        unitTests: testPlan.unitTests?.length || 0,
        integrationTests: testPlan.integrationTests?.length || 0,
        edgeCases: testPlan.edgeCases?.length || 0,
        total: (testPlan.unitTests?.length || 0) + (testPlan.integrationTests?.length || 0) + (testPlan.edgeCases?.length || 0),
      },
      unitTests: testPlan.unitTests || [],
      integrationTests: testPlan.integrationTests || [],
      edgeCases: testPlan.edgeCases || [],
      testingNotes: testPlan.testingNotes,
    };
  }
}
