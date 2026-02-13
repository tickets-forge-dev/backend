import { Injectable, Logger } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { Builder } from 'xml2js';

/**
 * Serializes an AEC domain object to XML format
 * Suitable for machine consumption by agents and external systems
 */
@Injectable()
export class AECSerializer {
  private readonly logger = new Logger(AECSerializer.name);
  private readonly xmlBuilder: Builder;

  constructor() {
    this.xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      rootName: 'aec',
      cdata: false,
      headless: false,
    });
  }

  serialize(aec: AEC): string {
    try {
      const aecObject = this.buildAECObject(aec);
      return this.xmlBuilder.buildObject(aecObject);
    } catch (error: any) {
      this.logger.error(`Failed to serialize AEC to XML: ${error.message}`);
      throw error;
    }
  }

  private buildAECObject(aec: AEC): any {
    return {
      id: aec.id,
      workspaceId: aec.workspaceId,
      status: aec.status,
      createdAt: aec.createdAt.toISOString(),
      updatedAt: aec.updatedAt.toISOString(),
      metadata: {
        title: aec.title,
        type: aec.type || 'task',
        priority: aec.priority || 'medium',
        readinessScore: aec.readinessScore,
      },
      content: {
        description: aec.description || '',
        acceptanceCriteria: this.serializeArrayForXml(aec.acceptanceCriteria, 'criterion'),
        assumptions: this.serializeArrayForXml(aec.assumptions, 'assumption'),
      },
      technicalDetails: {
        repositoryContext: this.serializeRepositoryContext(aec.repositoryContext),
        codeSnapshot: this.serializeCodeSnapshot(aec.codeSnapshot),
        apiSnapshot: this.serializeApiSnapshot(aec.apiSnapshot),
      },
      analysis: {
        repoPaths: this.serializeArrayForXml(aec.repoPaths, 'path'),
        questions: this.serializeQuestions(aec.questions),
        validationResults: this.serializeValidationResults(aec.validationResults),
      },
      specification: this.serializeTechSpec(aec.techSpec),
      tracking: {
        externalIssue: this.serializeExternalIssue(aec.externalIssue),
        driftDetected: {
          detected: !!aec.driftDetectedAt ? 'true' : 'false',
          reason: aec.driftReason || '',
          detectedAt: aec.driftDetectedAt?.toISOString() || '',
        },
      },
      estimate: this.serializeEstimate(aec.estimate),
      taskAnalysis: aec.taskAnalysis ? JSON.stringify(aec.taskAnalysis) : '',
      attachments: this.serializeAttachments(aec.attachments),
    };
  }

  private serializeArrayForXml(items: any[], itemName: string): any {
    if (!items || items.length === 0) {
      return {};
    }
    return {
      [itemName]: items.map((item) => ({
        value: typeof item === 'string' ? item : JSON.stringify(item),
      })),
    };
  }

  private serializeArray(items: any[], itemName: string): any {
    if (!items || items.length === 0) {
      return {};
    }
    return {
      [itemName]: items.map((item) => ({
        value: typeof item === 'string' ? item : JSON.stringify(item),
      })),
    };
  }

  private serializeRepositoryContext(context: any): any {
    if (!context) return {};
    return {
      owner: context.owner || '',
      name: context.name || '',
      branch: context.branch || '',
      url: context.url || '',
    };
  }

  private serializeCodeSnapshot(snapshot: any): any {
    if (!snapshot) return {};
    return {
      '@': { type: snapshot.type || 'snapshot' },
      files: this.serializeSnapshotFiles(snapshot.files),
      summary: snapshot.summary || '',
    };
  }

  private serializeSnapshotFiles(files: Map<string, string> | Record<string, string> | undefined): any {
    if (!files) return {};

    const fileEntries = files instanceof Map ? Array.from(files.entries()) : Object.entries(files);
    if (fileEntries.length === 0) return {};

    return {
      file: fileEntries.map(([path, content]) => ({
        '@': { path },
        '#text': content.substring(0, 500), // Limit content size for XML
      })),
    };
  }

  private serializeApiSnapshot(snapshot: any): any {
    if (!snapshot) return {};
    return {
      '@': { type: snapshot.type || 'snapshot' },
      endpoints: this.serializeApiEndpoints(snapshot.endpoints),
      summary: snapshot.summary || '',
    };
  }

  private serializeApiEndpoints(endpoints: any[] | undefined): any {
    if (!endpoints || endpoints.length === 0) return {};
    return {
      endpoint: endpoints.map((ep) => ({
        '@': {
          method: ep.method || 'GET',
          route: ep.route || '',
        },
        description: ep.description || '',
        controller: ep.controller || '',
        authentication: ep.authentication || 'none',
      })),
    };
  }

  private serializeQuestions(questions: any[]): any {
    if (!questions || questions.length === 0) return {};
    return {
      question: questions.map((q) => ({
        id: q.id || '',
        type: q.type || 'text',
        text: q.question || q.text || '',
        context: q.context || '',
        impact: q.impact || '',
        options: this.serializeArrayForXml(q.options || [], 'option'),
      })),
    };
  }

  private serializeValidationResults(results: any[]): any {
    if (!results || results.length === 0) return {};
    return {
      result: results.map((r) => ({
        id: r.id || '',
        status: r.status || 'pending',
        timestamp: r.timestamp?.toISOString() || new Date().toISOString(),
        type: r.type || '',
        message: r.message || '',
        details: r.details || '',
      })),
    };
  }

  private serializeTechSpec(techSpec: any): any {
    if (!techSpec) {
      return { '@': { status: 'not-generated' } };
    }

    return {
      '@': { id: techSpec.id || '', status: 'generated' },
      title: techSpec.title || '',
      createdAt: techSpec.createdAt?.toISOString() || '',
      qualityScore: techSpec.qualityScore || 0,
      problemStatement: this.serializeProblemStatement(techSpec.problemStatement),
      solution: this.serializeSolution(techSpec.solution),
      scope: {
        inScope: this.serializeArray(techSpec.inScope || [], 'item'),
        outOfScope: this.serializeArray(techSpec.outOfScope || [], 'item'),
      },
      acceptanceCriteria: this.serializeAcceptanceCriteria(techSpec.acceptanceCriteria),
      clarificationQuestions: this.serializeQuestions(techSpec.clarificationQuestions || []),
      fileChanges: this.serializeFileChanges(techSpec.fileChanges),
      apiChanges: this.serializeApiChanges(techSpec.apiChanges),
      layeredFileChanges: this.serializeLayeredFileChanges(techSpec.layeredFileChanges),
      testPlan: this.serializeTestPlan(techSpec.testPlan),
      visualExpectations: this.serializeVisualExpectations(techSpec.visualExpectations),
      bugDetails: this.serializeBugDetails(techSpec.bugDetails),
      stack: this.serializeStack(techSpec.stack),
      ambiguityFlags: this.serializeArray(techSpec.ambiguityFlags || [], 'flag'),
    };
  }

  private serializeProblemStatement(ps: any): any {
    if (!ps) return {};
    return {
      narrative: ps.narrative || '',
      whyItMatters: ps.whyItMatters || '',
      context: ps.context || '',
      assumptions: this.serializeArray(ps.assumptions || [], 'assumption'),
      constraints: this.serializeArray(ps.constraints || [], 'constraint'),
    };
  }

  private serializeSolution(solution: any): any {
    if (!solution) return {};

    if (typeof solution === 'string') {
      return { overview: solution };
    }

    if (Array.isArray(solution)) {
      return {
        steps: {
          step: solution.map((s, idx) => ({
            '@': { index: idx },
            '#text': typeof s === 'string' ? s : s.description || JSON.stringify(s),
          })),
        },
      };
    }

    return {
      overview: solution.overview || '',
      steps: {
        step: (solution.steps || []).map((s: any, idx: number) => ({
          '@': {
            index: idx,
            order: s.order || idx + 1,
          },
          description: s.description || '',
          file: s.file || '',
          lineNumbers: s.lineNumbers ? `${s.lineNumbers[0]}-${s.lineNumbers[1]}` : '',
        })),
      },
      fileChanges: {
        create: this.serializeArray(solution.fileChanges?.create || [], 'file'),
        modify: this.serializeArray(solution.fileChanges?.modify || [], 'file'),
        delete: this.serializeArray(solution.fileChanges?.delete || [], 'file'),
      },
      databaseChanges: solution.databaseChanges || '',
      environmentChanges: solution.environmentChanges || '',
    };
  }

  private serializeAcceptanceCriteria(criteria: any[]): any {
    if (!criteria || criteria.length === 0) return {};
    return {
      criterion: criteria.map((c) => {
        if (typeof c === 'string') {
          return { text: c };
        }
        return {
          bdd: {
            given: c.given || '',
            when: c.when || '',
            then: c.then || '',
            implementationNotes: c.implementationNotes || '',
          },
        };
      }),
    };
  }

  private serializeFileChanges(changes: any[]): any {
    if (!changes || changes.length === 0) return {};
    return {
      file: changes.map((f) => ({
        '@': {
          path: f.path || '',
          action: f.action || 'modify',
        },
        lineNumbers: f.lineNumbers ? `${f.lineNumbers[0]}-${f.lineNumbers[1]}` : '',
        suggestedContent: f.suggestedContent || '',
        suggestedChanges: f.suggestedChanges || '',
        imports: this.serializeImports(f.imports),
        pattern: f.pattern || '',
      })),
    };
  }

  private serializeImports(imports: any): any {
    if (!imports) return {};
    return {
      add: this.serializeArray(imports.add || [], 'import'),
      remove: this.serializeArray(imports.remove || [], 'import'),
    };
  }

  private serializeApiChanges(apiChanges: any): any {
    if (!apiChanges) return {};
    return {
      endpoints: this.serializeApiEndpoints(apiChanges.endpoints),
      baseUrl: apiChanges.baseUrl || '',
      middlewares: this.serializeArray(apiChanges.middlewares || [], 'middleware'),
      rateLimiting: apiChanges.rateLimiting || '',
    };
  }

  private serializeLayeredFileChanges(layered: any): any {
    if (!layered) return {};
    return {
      backend: this.serializeFileChanges(layered.backend),
      frontend: this.serializeFileChanges(layered.frontend),
      shared: this.serializeFileChanges(layered.shared),
      infrastructure: this.serializeFileChanges(layered.infrastructure),
      documentation: this.serializeFileChanges(layered.documentation),
    };
  }

  private serializeTestPlan(testPlan: any): any {
    if (!testPlan) return {};
    return {
      summary: testPlan.summary || '',
      coverageGoal: testPlan.coverageGoal || 80,
      unitTests: this.serializeTestCases(testPlan.unitTests),
      integrationTests: this.serializeTestCases(testPlan.integrationTests),
      edgeCases: this.serializeTestCases(testPlan.edgeCases),
      testingNotes: testPlan.testingNotes || '',
    };
  }

  private serializeTestCases(testCases: any[]): any {
    if (!testCases || testCases.length === 0) return {};
    return {
      testCase: testCases.map((tc) => ({
        '@': {
          type: tc.type || 'unit',
          testFile: tc.testFile || '',
        },
        description: tc.description || '',
        testName: tc.testName || '',
        setup: tc.setup || '',
        action: tc.action || '',
        assertion: tc.assertion || '',
        dependencies: this.serializeArray(tc.dependencies || [], 'dependency'),
      })),
    };
  }

  private serializeVisualExpectations(visual: any): any {
    if (!visual) return {};
    return {
      summary: visual.summary || '',
      flowDiagram: visual.flowDiagram || '',
      expectations: this.serializeVisualExpectationItems(visual.expectations),
    };
  }

  private serializeVisualExpectationItems(expectations: any[]): any {
    if (!expectations || expectations.length === 0) return {};
    return {
      expectation: expectations.map((e) => ({
        '@': {
          screen: e.screen || '',
          state: e.state || 'default',
        },
        description: e.description || '',
        wireframe: e.wireframe || '',
        steps: this.serializeArray(e.steps || [], 'step'),
        acceptanceCriterionRef: e.acceptanceCriterionRef || '',
      })),
    };
  }

  private serializeBugDetails(bugDetails: any): any {
    if (!bugDetails) return {};
    return {
      reproductionSteps: this.serializeReproductionSteps(bugDetails.reproductionSteps),
      environment: this.serializeEnvironment(bugDetails.environment),
      frequency: bugDetails.frequency || 'sometimes',
      impact: bugDetails.impact || 'medium',
      analysis: {
        relatedFiles: this.serializeArray(bugDetails.relatedFiles || [], 'file'),
        suspectedCause: bugDetails.suspectedCause || '',
        suggestedFix: bugDetails.suggestedFix || '',
      },
    };
  }

  private serializeReproductionSteps(steps: any[]): any {
    if (!steps || steps.length === 0) return {};
    return {
      step: steps.map((s) => ({
        '@': { order: s.order || 0 },
        action: s.action || '',
        expectedBehavior: s.expectedBehavior || '',
        actualBehavior: s.actualBehavior || '',
        apiCall: this.serializeApiCall(s.apiCall),
        consoleLog: s.consoleLog || '',
        codeSnippet: s.codeSnippet || '',
        notes: s.notes || '',
      })),
    };
  }

  private serializeApiCall(apiCall: any): any {
    if (!apiCall) return {};
    return {
      '@': { method: apiCall.method || 'GET' },
      url: apiCall.url || '',
      headers: this.serializeRecord(apiCall.headers),
      body: apiCall.body || '',
      expectedStatus: apiCall.expectedStatus || '',
      actualStatus: apiCall.actualStatus || '',
      responseBody: apiCall.responseBody || '',
      timing: apiCall.timing || '',
    };
  }

  private serializeEnvironment(env: any): any {
    if (!env) return {};
    return {
      browser: env.browser || '',
      os: env.os || '',
      viewport: env.viewport || '',
      userRole: env.userRole || '',
    };
  }

  private serializeStack(stack: any): any {
    if (!stack) return {};
    return {
      language: stack.language || '',
      framework: stack.framework || '',
      packageManager: stack.packageManager || '',
    };
  }

  private serializeEstimate(estimate: any): any {
    if (!estimate) return {};
    return {
      value: estimate.value || 0,
      unit: estimate.unit || 'points',
      range: estimate.range ? `${estimate.range.min}-${estimate.range.max}` : '',
      rationale: estimate.rationale || '',
    };
  }

  private serializeExternalIssue(externalIssue: any): any {
    if (!externalIssue) return {};
    return {
      platform: externalIssue.platform || '',
      issueId: externalIssue.issueId || '',
      issueUrl: externalIssue.issueUrl || '',
    };
  }

  private serializeAttachments(attachments: any[]): any {
    if (!attachments || attachments.length === 0) return {};
    return {
      attachment: attachments.map((a) => ({
        '@': {
          id: a.id || '',
          type: a.type || 'file',
        },
        url: a.url || '',
        fileName: a.fileName || '',
        uploadedAt: a.uploadedAt?.toISOString() || '',
      })),
    };
  }

  private serializeRecord(record: Record<string, any> | undefined): any {
    if (!record) return {};
    return {
      entry: Object.entries(record).map(([key, value]) => ({
        '@': { key },
        '#text': value,
      })),
    };
  }
}
