import { CodebaseAnalyzerImpl } from '../CodebaseAnalyzerImpl';
import { FileTree } from '@github/domain/github-file.service';

describe('CodebaseAnalyzerImpl', () => {
  let analyzer: CodebaseAnalyzerImpl;

  beforeEach(() => {
    analyzer = new CodebaseAnalyzerImpl();
  });

  describe('analyzeStructure - Integration', () => {
    it('should analyze Next.js project with feature-based architecture', async () => {
      const tree: FileTree = {
        sha: 'abc123',
        url: 'https://github.com/test/repo',
        truncated: false,
        tree: [
          { path: 'src', type: 'tree', mode: '040000', sha: '1', url: 'test' },
          { path: 'src/features', type: 'tree', mode: '040000', sha: '2', url: 'test' },
          { path: 'src/features/auth', type: 'tree', mode: '040000', sha: '3', url: 'test' },
          { path: 'src/components', type: 'tree', mode: '040000', sha: '4', url: 'test' },
          { path: 'package.json', type: 'blob', mode: '100644', sha: '5', url: 'test' },
        ],
      };

      const files = new Map([
        ['package.json', '{"name":"test","dependencies":{"next":"14.0.0"}}'],
        ['jest.config.js', 'module.exports = {}'],
      ]);

      const analysis = await analyzer.analyzeStructure(files, tree);

      expect(analysis.architecture.type).toBe('feature-based');
      expect(analysis.architecture.confidence).toBeGreaterThan(80);
      expect(analysis.directories.length).toBeGreaterThan(0);
      expect(analysis.overallConfidence).toBeGreaterThan(0);
      expect(analysis.recommendations).toBeDefined();
    });

    it('should detect layered architecture', async () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'https://github.com/test/repo',
        truncated: false,
        tree: [
          { path: 'src/presentation', type: 'tree', mode: '040000', sha: '1', url: 'test' },
          { path: 'src/application', type: 'tree', mode: '040000', sha: '2', url: 'test' },
          { path: 'src/domain', type: 'tree', mode: '040000', sha: '3', url: 'test' },
          { path: 'src/infrastructure', type: 'tree', mode: '040000', sha: '4', url: 'test' },
        ],
      };

      const files = new Map();
      const analysis = await analyzer.analyzeStructure(files, tree);

      expect(analysis.architecture.type).toBe('layered');
      expect(analysis.architecture.confidence).toBeGreaterThan(85);
    });

    it('should detect monorepo structure', async () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'https://github.com/test/repo',
        truncated: false,
        tree: [
          { path: 'packages', type: 'tree', mode: '040000', sha: '1', url: 'test' },
          { path: 'packages/backend', type: 'tree', mode: '040000', sha: '2', url: 'test' },
          { path: 'packages/frontend', type: 'tree', mode: '040000', sha: '3', url: 'test' },
          { path: 'lerna.json', type: 'blob', mode: '100644', sha: '4', url: 'test' },
        ],
      };

      const files = new Map();
      const analysis = await analyzer.analyzeStructure(files, tree);

      expect(analysis.architecture.type).toBe('monorepo');
      expect(analysis.architecture.confidence).toBeGreaterThan(85);
    });
  });

  describe('detectArchitecture', () => {
    it('should detect feature-based architecture', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'src/features/auth', type: 'tree', mode: '040000', sha: '1', url: 'test' },
          { path: 'src/features/tickets', type: 'tree', mode: '040000', sha: '2', url: 'test' },
        ],
      };

      const pattern = analyzer.detectArchitecture(tree);

      expect(pattern.type).toBe('feature-based');
      expect(pattern.confidence).toBe(92);
    });

    it('should detect layered architecture', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          {
            path: 'src/presentation/controllers',
            type: 'tree',
            mode: '040000',
            sha: '1',
            url: 'test',
          },
          { path: 'src/application/services', type: 'tree', mode: '040000', sha: '2', url: 'test' },
          { path: 'src/domain/entities', type: 'tree', mode: '040000', sha: '3', url: 'test' },
          {
            path: 'src/infrastructure/persistence',
            type: 'tree',
            mode: '040000',
            sha: '4',
            url: 'test',
          },
        ],
      };

      const pattern = analyzer.detectArchitecture(tree);

      expect(pattern.type).toBe('layered');
      expect(pattern.confidence).toBeGreaterThan(85);
    });

    it('should return unknown for unrecognized pattern', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [{ path: 'index.js', type: 'blob', mode: '100644', sha: '1', url: 'test' }],
      };

      const pattern = analyzer.detectArchitecture(tree);

      expect(pattern.type).toBe('standard');
      expect(pattern.confidence).toBeLessThan(70);
    });
  });

  describe('detectNamingConventions', () => {
    it('should detect PascalCase file names', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'src/Config.ts', type: 'blob', mode: '100644', sha: '1', url: 'test' },
          { path: 'src/Service.ts', type: 'blob', mode: '100644', sha: '2', url: 'test' },
          { path: 'src/Utils.ts', type: 'blob', mode: '100644', sha: '3', url: 'test' },
        ],
      };

      const naming = analyzer.detectNamingConventions(tree, new Map());

      expect(naming.files).toBe('PascalCase');
      expect(naming.confidence).toBeGreaterThan(70);
    });

    it('should detect camelCase file names', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'src/config.ts', type: 'blob', mode: '100644', sha: '1', url: 'test' },
          { path: 'src/service.ts', type: 'blob', mode: '100644', sha: '2', url: 'test' },
          { path: 'src/utils.ts', type: 'blob', mode: '100644', sha: '3', url: 'test' },
        ],
      };

      const naming = analyzer.detectNamingConventions(tree, new Map());

      expect(naming.files).toBe('camelCase');
    });

    it('should detect kebab-case file names', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'src/user-config.ts', type: 'blob', mode: '100644', sha: '1', url: 'test' },
          { path: 'src/auth-service.ts', type: 'blob', mode: '100644', sha: '2', url: 'test' },
        ],
      };

      const naming = analyzer.detectNamingConventions(tree, new Map());

      expect(naming.files).toBe('kebab-case');
    });
  });

  describe('detectTestingStrategy', () => {
    it('should detect Jest', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'jest.config.js', type: 'blob', mode: '100644', sha: '1', url: 'test' },
          {
            path: 'src/__tests__/example.spec.ts',
            type: 'blob',
            mode: '100644',
            sha: '2',
            url: 'test',
          },
        ],
      };

      const strategy = analyzer.detectTestingStrategy(tree);

      expect(strategy.runner).toBe('jest');
      expect(strategy.confidence).toBe(95);
    });

    it('should detect Vitest', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [{ path: 'vitest.config.ts', type: 'blob', mode: '100644', sha: '1', url: 'test' }],
      };

      const strategy = analyzer.detectTestingStrategy(tree);

      expect(strategy.runner).toBe('vitest');
      expect(strategy.confidence).toBe(95);
    });

    it('should detect colocated test location', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          {
            path: 'src/__tests__/service.spec.ts',
            type: 'blob',
            mode: '100644',
            sha: '1',
            url: 'test',
          },
          { path: 'src/service.test.ts', type: 'blob', mode: '100644', sha: '2', url: 'test' },
        ],
      };

      const strategy = analyzer.detectTestingStrategy(tree);

      expect(strategy.location).toBe('colocated');
    });

    it('should detect centralized test location', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'test/service.test.ts', type: 'blob', mode: '100644', sha: '1', url: 'test' },
          { path: 'test/utils.test.ts', type: 'blob', mode: '100644', sha: '2', url: 'test' },
        ],
      };

      const strategy = analyzer.detectTestingStrategy(tree);

      expect(strategy.location).toBe('centralized');
    });
  });

  describe('detectStateManagement', () => {
    it('should detect Zustand', () => {
      const files = new Map([
        [
          'src/store.ts',
          "import { create } from 'zustand';\nconst useStore = create((set) => ({...}))",
        ],
      ]);

      const state = analyzer.detectStateManagement(files, {} as any);

      expect(state.type).toBe('zustand');
      expect(state.confidence).toBeGreaterThan(80);
    });

    it('should detect Redux', () => {
      const files = new Map([
        ['src/store/index.ts', "import { createSlice } from '@reduxjs/toolkit'"],
      ]);

      const state = analyzer.detectStateManagement(files, {} as any);

      expect(state.type).toBe('redux');
      expect(state.confidence).toBeGreaterThan(80);
    });

    it('should detect Context API', () => {
      const files = new Map([
        ['src/context.ts', 'const MyContext = React.createContext(initialValue)'],
      ]);

      const state = analyzer.detectStateManagement(files, {} as any);

      expect(state.type).toBe('context-api');
      expect(state.confidence).toBeGreaterThan(70);
    });
  });

  describe('identifyDirectoryStructure', () => {
    it('should identify and categorize directories', () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'src', type: 'tree', mode: '040000', sha: '1', url: 'test' },
          { path: 'src/components', type: 'tree', mode: '040000', sha: '2', url: 'test' },
          { path: 'src/lib', type: 'tree', mode: '040000', sha: '3', url: 'test' },
          { path: 'src/utils', type: 'tree', mode: '040000', sha: '4', url: 'test' },
          { path: 'src/hooks', type: 'tree', mode: '040000', sha: '5', url: 'test' },
          { path: 'src/types', type: 'tree', mode: '040000', sha: '6', url: 'test' },
        ],
      };

      const dirs = analyzer.identifyDirectoryStructure(tree);

      expect(dirs.length).toBeGreaterThan(0);
      expect(dirs.some((d) => d.type === 'components')).toBe(true);
      expect(dirs.some((d) => d.type === 'lib')).toBe(true);
      expect(dirs.some((d) => d.type === 'utils')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle minimal project', async () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [
          { path: 'index.js', type: 'blob', mode: '100644', sha: '1', url: 'test' },
          { path: 'package.json', type: 'blob', mode: '100644', sha: '2', url: 'test' },
        ],
      };

      const analysis = await analyzer.analyzeStructure(new Map(), tree);

      expect(analysis.architecture.type).toBe('standard');
      expect(analysis.overallConfidence).toBeLessThan(70);
    });

    it('should handle empty tree', async () => {
      const tree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: [],
      };

      const analysis = await analyzer.analyzeStructure(new Map(), tree);

      expect(analysis.architecture.type).toBe('standard');
      expect(analysis.directories.length).toBe(0);
    });

    it('should handle large project sampling', async () => {
      const largeTree: FileTree = {
        sha: 'abc',
        url: 'test',
        truncated: false,
        tree: Array.from({ length: 500 }, (_, i) => ({
          path: `src/file${i}.ts`,
          type: 'blob' as const,
          mode: '100644',
          sha: `${i}`,
          url: 'test',
        })),
      };

      const files = new Map(
        Array.from({ length: 100 }, (_, i) => [
          `src/file${i}.ts`,
          'const x = 1; function test() {}',
        ]),
      );

      const start = Date.now();
      const analysis = await analyzer.analyzeStructure(files, largeTree);
      const duration = Date.now() - start;

      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(500); // Performance baseline
    });
  });
});
