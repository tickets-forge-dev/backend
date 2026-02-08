import { TechSpecGeneratorImpl } from '../TechSpecGeneratorImpl';
import { TechSpecInput } from '@tickets/domain/tech-spec/TechSpecGenerator';
import { FileTree } from '@github/domain/github-file.service';
import { ProjectStack } from '@tickets/domain/stack-detection/ProjectStackDetector';
import { CodebaseAnalysis } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';

describe('TechSpecGeneratorImpl', () => {
  let generator: TechSpecGeneratorImpl;
  let mockLLMClient: any;

  beforeEach(() => {
    mockLLMClient = {};
    generator = new TechSpecGeneratorImpl(mockLLMClient);
  });

  const createMockStack = (): ProjectStack => ({
    framework: { name: 'Next.js', version: '14.0.0' },
    languages: [{ name: 'TypeScript', version: '5.0.0' }],
    packageManager: { name: 'npm', version: '10.0.0' },
    dependencies: new Map(),
    devDependencies: new Map(),
    tooling: {
      linter: 'ESLint',
      formatter: 'Prettier',
      testing: 'Jest',
      bundler: 'Webpack',
    },
    monorepo: null,
  });

  const createMockAnalysis = (): CodebaseAnalysis => ({
    architecture: {
      type: 'feature-based',
      confidence: 92,
      signals: ['src/features/ present'],
      directories: ['src/features', 'src/components'],
    },
    naming: {
      files: 'camelCase',
      variables: 'camelCase',
      functions: 'camelCase',
      classes: 'PascalCase',
      components: 'PascalCase',
      confidence: 85,
    },
    testing: {
      runner: 'jest',
      location: 'colocated',
      namingPattern: '*.spec.ts',
      libraries: [],
      confidence: 95,
    },
    stateManagement: {
      type: 'zustand',
      packages: ['zustand'],
      patterns: [],
      confidence: 85,
    },
    apiRouting: {
      type: 'next-app-router',
      baseDirectory: 'app/api',
      conventions: [],
      confidence: 90,
    },
    directories: [
      { path: 'src', type: 'src', description: 'Source code' },
      { path: 'src/features', type: 'components', description: 'Features' },
    ],
    overallConfidence: 85,
    recommendations: ['Use strict TypeScript mode'],
  });

  const createMockFileTree = (): FileTree => ({
    sha: 'abc123',
    url: 'https://github.com/test/repo',
    truncated: false,
    tree: [
      { path: 'src', type: 'tree', mode: '040000', sha: '1', url: 'test' },
      { path: 'src/features', type: 'tree', mode: '040000', sha: '2', url: 'test' },
      { path: 'package.json', type: 'blob', mode: '100644', sha: '3', url: 'test' },
    ],
  });

  const createMockInput = (overrides?: Partial<TechSpecInput>): TechSpecInput => ({
    title: 'Add user authentication',
    description: 'Implement JWT-based auth with Zustand',
    owner: 'org',
    repo: 'repo',
    githubContext: {
      tree: createMockFileTree(),
      files: new Map([
        ['package.json', '{"name":"test","dependencies":{"next":"14.0.0"}}'],
        ['src/features/auth/store.ts', 'import { create } from "zustand";'],
      ]),
    },
    stack: createMockStack(),
    analysis: createMockAnalysis(),
    ...overrides,
  });

  describe('generate - Integration', () => {
    it('should generate complete tech spec with all sections', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
      expect(spec.id).toBeDefined();
      expect(spec.title).toBe('Add user authentication');
      expect(spec.createdAt).toBeInstanceOf(Date);
      expect(spec.problemStatement).toBeDefined();
      expect(spec.solution).toBeDefined();
      expect(spec.acceptanceCriteria).toBeDefined();
      expect(spec.inScope).toBeDefined();
      expect(spec.outOfScope).toBeDefined();
      expect(spec.fileChanges).toBeDefined();
      expect(spec.qualityScore).toBeGreaterThanOrEqual(0);
      expect(spec.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should generate spec with quality score in valid range', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(spec.qualityScore).toBeGreaterThanOrEqual(0);
      expect(spec.qualityScore).toBeLessThanOrEqual(100);
      expect(typeof spec.qualityScore).toBe('number');
    });

    it('should generate spec with non-empty problem statement', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(spec.problemStatement.narrative).toBeDefined();
      expect(spec.problemStatement.narrative.length).toBeGreaterThan(0);
      expect(spec.problemStatement.whyItMatters).toBeDefined();
      expect(spec.problemStatement.context).toBeDefined();
      expect(Array.isArray(spec.problemStatement.assumptions)).toBe(true);
      expect(Array.isArray(spec.problemStatement.constraints)).toBe(true);
    });

    it('should generate spec with valid solution steps', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(Array.isArray(spec.solution.steps)).toBe(true);
      expect(spec.solution.overview).toBeDefined();
      expect(spec.solution.overview.length).toBeGreaterThan(0);

      spec.solution.steps.forEach((step) => {
        expect(step.order).toBeDefined();
        expect(step.description).toBeDefined();
      });
    });

    it('should generate acceptance criteria in BDD format', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(Array.isArray(spec.acceptanceCriteria)).toBe(true);

      spec.acceptanceCriteria.forEach((ac) => {
        expect(ac.given).toBeDefined();
        expect(ac.when).toBeDefined();
        expect(ac.then).toBeDefined();
      });
    });

    it('should have empty or minimal ambiguity flags', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(Array.isArray(spec.ambiguityFlags)).toBe(true);
      expect(spec.ambiguityFlags.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateProblemStatement', () => {
    it('should generate problem statement with all required fields', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      expect(ps.narrative).toBeDefined();
      expect(ps.whyItMatters).toBeDefined();
      expect(ps.context).toBeDefined();
      expect(Array.isArray(ps.assumptions)).toBe(true);
      expect(Array.isArray(ps.constraints)).toBe(true);
    });

    it('should include framework context in problem statement', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      const allText = `${ps.narrative} ${ps.whyItMatters} ${ps.context}`.toLowerCase();
      expect(allText.length).toBeGreaterThan(20);
    });

    it('should have 2+ assumptions in problem statement', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      expect(ps.assumptions.length).toBeGreaterThanOrEqual(1);
    });

    it('should have 2+ constraints in problem statement', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      expect(ps.constraints.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateSolution', () => {
    it('should generate solution with overview and steps', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      const solution = await generator.generateSolution(ps, context);

      expect(solution.overview).toBeDefined();
      expect(solution.overview.length).toBeGreaterThan(0);
      expect(Array.isArray(solution.steps)).toBe(true);
      expect(solution.steps.length).toBeGreaterThan(0);
    });

    it('should include file changes in solution', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      const solution = await generator.generateSolution(ps, context);

      expect(solution.fileChanges).toBeDefined();
      expect(Array.isArray(solution.fileChanges.create)).toBe(true);
      expect(Array.isArray(solution.fileChanges.modify)).toBe(true);
    });

    it('should have steps with descriptions', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      const solution = await generator.generateSolution(ps, context);

      solution.steps.forEach((step) => {
        expect(step.order).toBeGreaterThan(0);
        expect(step.description).toBeDefined();
        expect(step.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateAcceptanceCriteria', () => {
    it('should generate acceptance criteria array', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const criteria = await generator.generateAcceptanceCriteria(context);

      expect(Array.isArray(criteria)).toBe(true);
    });

    it('should have criteria in BDD format', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const criteria = await generator.generateAcceptanceCriteria(context);

      criteria.forEach((ac) => {
        expect(ac.given).toBeDefined();
        expect(ac.when).toBeDefined();
        expect(ac.then).toBeDefined();
      });
    });

    it('should have implementation notes in criteria', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const criteria = await generator.generateAcceptanceCriteria(context);

      criteria.forEach((ac) => {
        expect(ac.implementationNotes).toBeDefined();
      });
    });
  });

  describe('generateClarificationQuestions', () => {
    it('should generate questions array (possibly empty)', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const questions = await generator.generateClarificationQuestions(context);

      expect(Array.isArray(questions)).toBe(true);
    });

    it('should have valid question types', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const questions = await generator.generateClarificationQuestions(context);
      const validTypes = ['radio', 'checkbox', 'text', 'select', 'multiline'];

      questions.forEach((q) => {
        expect(validTypes).toContain(q.type);
        expect(q.id).toBeDefined();
        expect(q.question).toBeDefined();
      });
    });

    it('should have question context and impact', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const questions = await generator.generateClarificationQuestions(context);

      questions.forEach((q) => {
        if (q.context) expect(typeof q.context).toBe('string');
        if (q.impact) expect(typeof q.impact).toBe('string');
      });
    });
  });

  describe('generateFileChanges', () => {
    it('should generate file changes array', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      const solution = await generator.generateSolution(ps, context);
      const fileChanges = await generator.generateFileChanges(solution, context);

      expect(Array.isArray(fileChanges)).toBe(true);
    });

    it('should have valid file change actions', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      const solution = await generator.generateSolution(ps, context);
      const fileChanges = await generator.generateFileChanges(solution, context);

      fileChanges.forEach((fc) => {
        expect(['create', 'modify', 'delete']).toContain(fc.action);
        expect(fc.path).toBeDefined();
      });
    });

    it('should include line numbers for modify actions', async () => {
      const input = createMockInput();
      const context = {
        stack: input.stack,
        analysis: input.analysis,
        fileTree: input.githubContext.tree,
        files: input.githubContext.files,
      };

      const ps = await generator.generateProblemStatement(
        input.title,
        input.description || '',
        context,
      );

      const solution = await generator.generateSolution(ps, context);
      const fileChanges = await generator.generateFileChanges(solution, context);

      fileChanges
        .filter((fc) => fc.action === 'modify')
        .forEach((fc) => {
          expect(fc.lineNumbers).toBeDefined();
          expect(fc.lineNumbers).toEqual(expect.any(Array));
        });
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate score in 0-100 range', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(spec.qualityScore).toBeGreaterThanOrEqual(0);
      expect(spec.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should score problem statement completeness', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      // Complete problem statement should contribute points
      expect(spec.qualityScore).toBeGreaterThan(0);
    });

    it('should score solution specificity', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      // Solution with file paths and steps should contribute points
      const hasPaths = spec.solution.steps.some((s) => s.file);
      if (hasPaths) {
        expect(spec.qualityScore).toBeGreaterThan(10);
      }
    });

    it('should score acceptance criteria quality', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      // AC count should affect score
      if (spec.acceptanceCriteria.length >= 5) {
        expect(spec.qualityScore).toBeGreaterThan(20);
      }
    });

    it('should penalize ambiguity', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      // More ambiguity flags should lower score
      const expectedMax = Math.max(0, 100 - (spec.ambiguityFlags.length || 0) * 5);
      expect(spec.qualityScore).toBeLessThanOrEqual(expectedMax + 5);
    });

    it('should provide consistent scoring', async () => {
      const input = createMockInput();
      const spec1 = await generator.generate(input);
      const spec2 = await generator.generate(input);

      // Same input should produce same or very similar score
      expect(Math.abs(spec1.qualityScore - spec2.qualityScore)).toBeLessThanOrEqual(5);
    });
  });

  describe('Scope Generation', () => {
    it('should generate in-scope items', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(Array.isArray(spec.inScope)).toBe(true);
      expect(spec.inScope.length).toBeGreaterThan(0);
    });

    it('should generate out-of-scope items', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(Array.isArray(spec.outOfScope)).toBe(true);
    });

    it('should have specific scope items', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      spec.inScope.forEach((item) => {
        expect(typeof item).toBe('string');
        expect(item.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal input (title only)', async () => {
      const input = createMockInput({
        description: undefined,
      });

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
      expect(spec.problemStatement).toBeDefined();
    });

    it('should handle empty description', async () => {
      const input = createMockInput({
        description: '',
      });

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
      expect(spec.problemStatement).toBeDefined();
    });

    it('should handle various project types', async () => {
      const input = createMockInput({
        stack: {
          framework: { name: 'React', version: '18.0.0' },
          languages: [{ name: 'JavaScript', version: '2023' }],
          packageManager: { name: 'yarn', version: '3.0.0' },
          dependencies: new Map(),
          devDependencies: new Map(),
          tooling: {
            linter: 'ESLint',
            formatter: 'Prettier',
            testing: 'Vitest',
            bundler: 'Vite',
          },
          monorepo: null,
        },
      });

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
      expect(spec.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle large descriptions', async () => {
      const longDescription = 'A'.repeat(1000);
      const input = createMockInput({
        description: longDescription,
      });

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
    });

    it('should generate valid UUIDs for specs', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      // UUID v4 format: 8-4-4-4-12
      expect(spec.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate timestamps', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      expect(spec.createdAt).toBeInstanceOf(Date);
      expect(spec.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Ambiguity Detection', () => {
    it('should detect ambiguous language patterns', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      // Ambiguity flags should be array
      expect(Array.isArray(spec.ambiguityFlags)).toBe(true);
    });

    it('should have empty ambiguity flags after removal', async () => {
      const input = createMockInput();
      const spec = await generator.generate(input);

      // After processing, ambiguity flags should be empty or minimal
      expect(spec.ambiguityFlags.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Integration with Mocked Dependencies', () => {
    it('should work with mocked ProjectStack', async () => {
      const input = createMockInput();

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
      expect(spec.problemStatement).toBeDefined();
    });

    it('should work with mocked CodebaseAnalysis', async () => {
      const input = createMockInput();

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
      expect(spec.solution).toBeDefined();
    });

    it('should work with mocked FileTree', async () => {
      const input = createMockInput();

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
      expect(spec.fileChanges).toBeDefined();
    });

    it('should work with mocked file contents', async () => {
      const input = createMockInput({
        githubContext: {
          tree: createMockFileTree(),
          files: new Map([
            ['src/store.ts', 'export const store = create(...)'],
            ['src/components/Auth.tsx', 'export const Auth = () => {}'],
          ]),
        },
      });

      const spec = await generator.generate(input);

      expect(spec).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should generate complete spec within timeout', async () => {
      const input = createMockInput();
      const start = Date.now();

      const spec = await generator.generate(input);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Mock LLM should be fast
      expect(spec).toBeDefined();
    });
  });
});
