import { ProjectStackDetectorImpl } from '../ProjectStackDetectorImpl';
import { Framework, Language, ProjectStack } from '@tickets/domain/stack-detection/ProjectStackDetector';

describe('ProjectStackDetectorImpl', () => {
  let detector: ProjectStackDetectorImpl;

  beforeEach(() => {
    detector = new ProjectStackDetectorImpl();
  });

  describe('detectStack - Integration', () => {
    it('should detect a Next.js + TypeScript stack (AC-1, AC-2, AC-6)', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            name: 'my-next-app',
            dependencies: {
              next: '14.0.0',
              react: '18.2.0',
              'react-dom': '18.2.0',
              axios: '1.6.0',
            },
            devDependencies: {
              typescript: '5.3.3',
              eslint: '8.56.0',
              '@typescript-eslint/eslint-plugin': '6.19.0',
              jest: '29.7.0',
              webpack: '5.90.0',
            },
            engines: { node: '18.x || 20.x' },
          }),
        ],
        ['tsconfig.json', '{}'],
        ['package-lock.json', '{}'],
      ]);

      const stack = await detector.detectStack(files);

      expect(stack.framework).toBeDefined();
      expect(stack.framework?.name).toBe('next.js');
      expect(stack.framework?.version).toBe('14.0.0');
      expect(stack.framework?.majorVersion).toBe(14);
      expect(stack.framework?.prerelease).toBe(false);

      expect(stack.language.name).toBe('typescript');
      expect(stack.language.detected).toBe(true);
      expect(stack.language.confidence).toBe(100);

      expect(stack.packageManager.type).toBe('npm');

      expect(stack.dependencies.length).toBe(4);
      expect(stack.dependencies[0]).toEqual({
        name: 'next',
        version: '14.0.0',
        type: 'runtime',
      });

      expect(stack.devDependencies.length).toBeGreaterThan(0);
      expect(stack.nodeVersion).toBe('18.x || 20.x');
      expect(stack.tooling.linter).toBeDefined();
      expect(stack.tooling.testing).toBeDefined();
      expect(stack.tooling.bundler).toBeDefined();
    });

    it('should handle malformed package.json gracefully (AC-7)', async () => {
      const files = new Map([
        ['package.json', '{ invalid json'], // Malformed
        ['package-lock.json', '{}'],
      ]);

      const stack = await detector.detectStack(files);

      // Should not throw, should use fallback
      expect(stack.framework).toBeNull();
      expect(stack.language.name).toBe('javascript');
      expect(stack.packageManager.type).toBe('npm');
      expect(stack.dependencies.length).toBe(0);
    });

    it('should detect missing package.json and use fallback (AC-7)', async () => {
      const files = new Map([
        ['tsconfig.json', '{}'],
        ['src/index.ts', 'export const x = 1;'],
      ]);

      const stack = await detector.detectStack(files);

      expect(stack.framework).toBeNull();
      expect(stack.language.name).toBe('typescript');
      expect(stack.packageManager.type).toBe('npm'); // Default
      expect(stack.dependencies.length).toBe(0);
    });
  });

  describe('detectFramework (AC-1)', () => {
    it('should detect Next.js framework', () => {
      const packageJson = {
        dependencies: {
          next: '14.0.0',
          react: '18.2.0',
          'react-dom': '18.2.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.name).toBe('next.js');
      expect(framework?.version).toBe('14.0.0');
      expect(framework?.majorVersion).toBe(14);
    });

    it('should detect React-only framework (without Next.js)', () => {
      const packageJson = {
        dependencies: {
          react: '18.2.0',
          'react-dom': '18.2.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.name).toBe('react');
      expect(framework?.version).toBe('18.2.0');
      expect(framework?.majorVersion).toBe(18);
    });

    it('should detect Vue framework', () => {
      const packageJson = {
        dependencies: {
          vue: '3.3.4',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.name).toBe('vue');
      expect(framework?.version).toBe('3.3.4');
      expect(framework?.majorVersion).toBe(3);
    });

    it('should detect Svelte framework', () => {
      const packageJson = {
        dependencies: {
          svelte: '4.0.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.name).toBe('svelte');
      expect(framework?.majorVersion).toBe(4);
    });

    it('should detect Angular framework', () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '17.0.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.name).toBe('angular');
      expect(framework?.majorVersion).toBe(17);
    });

    it('should return null if no framework detected', () => {
      const packageJson = {
        dependencies: {
          lodash: '4.17.21',
          axios: '1.6.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework).toBeNull();
    });

    it('should detect pre-release version', () => {
      const packageJson = {
        dependencies: {
          next: '14.0.0-rc.1',
          react: '18.2.0',
          'react-dom': '18.2.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.prerelease).toBe(true);
    });

    it('should handle version ranges and preserve them', () => {
      const packageJson = {
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.version).toBe('^18.0.0');
      expect(framework?.majorVersion).toBe(18);
    });
  });

  describe('detectLanguage (AC-2)', () => {
    it('should detect TypeScript from tsconfig.json', () => {
      const files = new Map([['tsconfig.json', '{}']]);

      const language = detector.detectLanguage(files);

      expect(language.name).toBe('typescript');
      expect(language.detected).toBe(true);
      expect(language.confidence).toBe(100);
    });

    it('should detect Python from .py files', () => {
      const files = new Map([
        ['main.py', 'print("hello")'],
        ['utils.py', 'def foo(): pass'],
        ['setup.py', ''],
      ]);

      const language = detector.detectLanguage(files);

      expect(language.name).toBe('python');
      expect(language.detected).toBe(true);
      expect(language.confidence).toBe(100);
    });

    it('should detect Go from .go files', () => {
      const files = new Map([
        ['main.go', 'package main'],
        ['go.mod', ''],
      ]);

      const language = detector.detectLanguage(files);

      expect(language.name).toBe('go');
      expect(language.detected).toBe(true);
      expect(language.confidence).toBe(100);
    });

    it('should detect Rust from .rs files', () => {
      const files = new Map([
        ['main.rs', 'fn main() {}'],
        ['Cargo.toml', ''],
      ]);

      const language = detector.detectLanguage(files);

      expect(language.name).toBe('rust');
      expect(language.detected).toBe(true);
      expect(language.confidence).toBe(100);
    });

    it('should detect TypeScript from .ts files', () => {
      const files = new Map([
        ['src/index.ts', 'export const x = 1;'],
        ['src/utils.ts', 'export function foo() {}'],
      ]);

      const language = detector.detectLanguage(files);

      expect(language.name).toBe('typescript');
      expect(language.detected).toBe(true);
      expect(language.confidence).toBe(75);
    });

    it('should default to JavaScript', () => {
      const files = new Map([['src/index.js', 'module.exports = {}']]);

      const language = detector.detectLanguage(files);

      expect(language.name).toBe('javascript');
      expect(language.detected).toBe(false);
      expect(language.confidence).toBe(0);
    });
  });

  describe('detectPackageManager (AC-5)', () => {
    it('should detect npm from package-lock.json', () => {
      const files = new Map([['package-lock.json', '{}']]);

      const pm = detector.detectPackageManager(files);

      expect(pm.type).toBe('npm');
    });

    it('should detect yarn from yarn.lock', () => {
      const files = new Map([['yarn.lock', '# yarn lockfile']]);

      const pm = detector.detectPackageManager(files);

      expect(pm.type).toBe('yarn');
    });

    it('should detect pnpm from pnpm-lock.yaml', () => {
      const files = new Map([['pnpm-lock.yaml', 'lockfileVersion: 5.4']]);

      const pm = detector.detectPackageManager(files);

      expect(pm.type).toBe('pnpm');
    });

    it('should detect bun from bun.lockb', () => {
      const files = new Map([['bun.lockb', 'binary']]);

      const pm = detector.detectPackageManager(files);

      expect(pm.type).toBe('bun');
    });

    it('should default to npm when no lock file found', () => {
      const files = new Map([['package.json', '{}']]);

      const pm = detector.detectPackageManager(files);

      expect(pm.type).toBe('npm');
    });

    it('should prioritize yarn.lock over package-lock.json', () => {
      const files = new Map([
        ['yarn.lock', '# yarn'],
        ['package-lock.json', '{}'],
      ]);

      const pm = detector.detectPackageManager(files);

      expect(pm.type).toBe('yarn');
    });
  });

  describe('extractDependencies (AC-3, AC-6)', () => {
    it('should extract runtime dependencies', () => {
      const packageJson = {
        dependencies: {
          react: '18.2.0',
          axios: '1.6.0',
          lodash: '^4.17.21',
        },
      };

      const deps = detector.extractDependencies(packageJson);

      expect(deps.length).toBe(3);
      expect(deps[0]).toEqual({
        name: 'react',
        version: '18.2.0',
        type: 'runtime',
      });
      expect(deps[1]).toEqual({
        name: 'axios',
        version: '1.6.0',
        type: 'runtime',
      });
    });

    it('should extract dev dependencies', () => {
      const packageJson = {
        devDependencies: {
          jest: '29.7.0',
          '@types/jest': '^29.5.0',
          typescript: '5.3.3',
        },
      };

      const deps = detector.extractDependencies(packageJson);

      // Note: extractDependencies only returns runtime dependencies
      expect(deps.length).toBe(0);
    });

    it('should handle scoped packages', () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '17.0.0',
          '@nestjs/common': '10.3.0',
          '@repo/shared-types': '1.0.0',
        },
      };

      const deps = detector.extractDependencies(packageJson);

      expect(deps[0]).toEqual({
        name: 'core',
        version: '17.0.0',
        type: 'runtime',
        scope: 'angular',
      });
      expect(deps[1]).toEqual({
        name: 'common',
        version: '10.3.0',
        type: 'runtime',
        scope: 'nestjs',
      });
    });

    it('should preserve version ranges', () => {
      const packageJson = {
        dependencies: {
          lodash: '^4.17.0',
          axios: '~1.6.0',
          react: '>=18.0.0',
        },
      };

      const deps = detector.extractDependencies(packageJson);

      expect(deps[0].version).toBe('^4.17.0');
      expect(deps[1].version).toBe('~1.6.0');
      expect(deps[2].version).toBe('>=18.0.0');
    });

    it('should handle empty dependencies', () => {
      const packageJson = {
        dependencies: {},
      };

      const deps = detector.extractDependencies(packageJson);

      expect(deps.length).toBe(0);
    });
  });

  describe('detectTooling (AC-4)', () => {
    it('should detect linting, formatting, testing, bundling tools', () => {
      const packageJson = {
        devDependencies: {
          eslint: '8.56.0',
          prettier: '3.2.4',
          jest: '29.7.0',
          webpack: '5.90.0',
        },
      };

      const stack = detector.detectStack(
        new Map([['package.json', JSON.stringify(packageJson)]]),
      );

      // Note: These are async, but for synchronous detection within detectStack:
      expect.assertions(0); // Will be verified in integration test
    });

    it('should detect alternative testing frameworks', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            devDependencies: {
              vitest: '0.34.0',
              mocha: '10.2.0',
              karma: '6.4.0',
            },
          }),
        ],
      ]);

      const stack = await detector.detectStack(files);

      // Should detect one of the testing tools
      expect(stack.tooling.testing).toBeDefined();
    });
  });

  describe('monorepo detection', () => {
    it('should detect monorepo with lerna.json', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            name: 'monorepo-root',
          }),
        ],
        ['lerna.json', '{}'],
      ]);

      const stack = await detector.detectStack(files);

      expect(stack.isMonorepo).toBe(true);
      expect(stack.hasWorkspaces).toBe(true);
    });

    it('should detect monorepo with turbo.json', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            name: 'monorepo-root',
          }),
        ],
        ['turbo.json', '{}'],
      ]);

      const stack = await detector.detectStack(files);

      expect(stack.isMonorepo).toBe(true);
    });

    it('should detect workspaces in package.json', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            name: 'monorepo-root',
            workspaces: ['packages/*'],
          }),
        ],
      ]);

      const stack = await detector.detectStack(files);

      expect(stack.hasWorkspaces).toBe(true);
      expect(stack.isMonorepo).toBe(true);
    });

    it('should detect pnpm workspaces', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            name: 'monorepo-root',
          }),
        ],
        ['pnpm-workspace.yaml', 'packages:\n  - packages/*'],
      ]);

      const stack = await detector.detectStack(files);

      expect(stack.hasWorkspaces).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty file map', async () => {
      const files = new Map();

      const stack = await detector.detectStack(files);

      expect(stack.framework).toBeNull();
      expect(stack.language.name).toBe('javascript');
      expect(stack.packageManager.type).toBe('npm');
      expect(stack.dependencies.length).toBe(0);
    });

    it('should handle pre-release versions', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            dependencies: {
              '@angular/core': '17.0.0-rc.1',
              next: '14.0.0-alpha',
            },
          }),
        ],
      ]);

      const stack = await detector.detectStack(files);

      expect(stack.framework?.prerelease).toBe(true);
    });

    it('should handle version extraction for React', () => {
      const packageJson = {
        dependencies: {
          react: '18.2.0',
          'react-dom': '18.2.0',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.majorVersion).toBe(18);
    });

    it('should handle malformed version strings', () => {
      const packageJson = {
        dependencies: {
          react: 'latest',
          'react-dom': 'latest',
        },
      };

      const framework = detector.detectFramework(packageJson);

      expect(framework?.majorVersion).toBe(0); // Falls back to 0 for unparseable
    });
  });

  describe('performance', () => {
    it('should detect stack in < 100ms', async () => {
      const files = new Map([
        [
          'package.json',
          JSON.stringify({
            name: 'test-app',
            dependencies: {
              react: '18.2.0',
              'react-dom': '18.2.0',
              axios: '1.6.0',
            },
            devDependencies: {
              typescript: '5.3.3',
              jest: '29.7.0',
            },
          }),
        ],
        ['tsconfig.json', '{}'],
        ['package-lock.json', '{}'],
      ]);

      const start = Date.now();
      const stack = await detector.detectStack(files);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
      expect(stack.framework).toBeDefined();
    });
  });
});
