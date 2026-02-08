import {
  CodebaseAnalyzer,
  CodebaseAnalysis,
  ArchitecturePattern,
  NamingConventions,
  NamingStyle,
  TestingStrategy,
  TestingRunner,
  StateManagement,
  StateManagementType,
  APIRouting,
  DirectoryEntry,
  DirectoryEntryType,
} from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { FileTree, TreeEntry } from '@github/domain/github-file.service';
import { ProjectStack } from '@tickets/domain/stack-detection/ProjectStackDetector';

/**
 * CodebaseAnalyzerImpl - Codebase Pattern Analysis Service
 *
 * Analyzes repository structure to detect architectural patterns, naming conventions,
 * testing strategies, state management, API routing, and directory organization.
 *
 * @implements CodebaseAnalyzer
 *
 * @example
 * ```typescript
 * const analyzer = new CodebaseAnalyzerImpl();
 * const analysis = await analyzer.analyzeStructure(files, tree);
 * ```
 */
export class CodebaseAnalyzerImpl implements CodebaseAnalyzer {
  /**
   * Performs complete codebase analysis across all pattern categories
   */
  async analyzeStructure(files: Map<string, string>, tree: FileTree): Promise<CodebaseAnalysis> {
    const architecture = this.detectArchitecture(tree);
    const naming = this.detectNamingConventions(tree, files);
    const testing = this.detectTestingStrategy(tree);

    // For state management and API routing, we need stack data
    // In real usage, these would be called with actual stack
    const stateManagement = this.detectStateManagement(files, {} as ProjectStack);
    const apiRouting = this.detectAPIRouting({} as ProjectStack, files);

    const directories = this.identifyDirectoryStructure(tree);

    // Calculate overall confidence as weighted average
    const confidences = [
      architecture.confidence,
      naming.confidence,
      testing.confidence,
      stateManagement.confidence,
      apiRouting.confidence,
    ];
    const overallConfidence = Math.round(
      confidences.reduce((a, b) => a + b, 0) / confidences.length,
    );

    // Generate recommendations based on detected patterns
    const recommendations = this.generateRecommendations(
      architecture,
      naming,
      testing,
      stateManagement,
      apiRouting,
    );

    return {
      architecture,
      naming,
      testing,
      stateManagement,
      apiRouting,
      directories,
      overallConfidence,
      recommendations,
    };
  }

  /**
   * Detects architecture pattern from directory structure
   */
  detectArchitecture(tree: FileTree): ArchitecturePattern {
    const paths = tree.tree.map((entry: TreeEntry) => entry.path).filter((p: string) => p);
    const pathSet = new Set<string>(paths);

    // Check for feature-based architecture
    if (this.hasPath(pathSet, 'src/features') || this.hasPath(pathSet, 'src/modules')) {
      return {
        type: 'feature-based',
        confidence: 92,
        signals: ['src/features/ or src/modules/ directories present'],
        directories: Array.from(pathSet)
          .filter((p) => p.includes('src/features') || p.includes('src/modules'))
          .slice(0, 5),
      };
    }

    // Check for layered architecture
    const layerCount = [
      'src/presentation',
      'src/application',
      'src/domain',
      'src/infrastructure',
    ].filter((layer) => this.hasPath(pathSet, layer)).length;

    if (layerCount >= 3) {
      return {
        type: 'layered',
        confidence: 88 + layerCount * 2,
        signals: [`${layerCount} Clean Architecture layers detected`],
        directories: [
          'src/presentation',
          'src/application',
          'src/domain',
          'src/infrastructure',
        ].filter((layer) => this.hasPath(pathSet, layer)),
      };
    }

    // Check for clean architecture / hexagonal
    if (this.hasPath(pathSet, 'src/domain') && this.hasPath(pathSet, 'src/ports')) {
      return {
        type: 'clean-architecture',
        confidence: 85,
        signals: ['Domain and ports directories present'],
        directories: ['src/domain', 'src/ports', 'src/adapters'].filter((d) =>
          this.hasPath(pathSet, d),
        ),
      };
    }

    // Check for monorepo
    if (
      this.hasPath(pathSet, 'packages') ||
      this.hasPath(pathSet, 'apps') ||
      this.hasPath(pathSet, 'lerna.json') ||
      this.hasPath(pathSet, 'nx.json') ||
      this.hasPath(pathSet, 'pnpm-workspace.yaml')
    ) {
      return {
        type: 'monorepo',
        confidence: 90,
        signals: ['Monorepo structure detected (packages/, apps/, lerna.json, etc.)'],
        directories: Array.from(pathSet)
          .filter((p) => p.startsWith('packages/') || p.startsWith('apps/'))
          .slice(0, 5),
      };
    }

    // Check for MVC
    if (
      this.hasPath(pathSet, 'routes') &&
      this.hasPath(pathSet, 'controllers') &&
      this.hasPath(pathSet, 'models')
    ) {
      return {
        type: 'mvc',
        confidence: 85,
        signals: ['routes/, controllers/, models/ directories present'],
        directories: ['routes', 'controllers', 'models', 'views'].filter((d) =>
          this.hasPath(pathSet, d),
        ),
      };
    }

    // Default to standard/unknown
    return {
      type: 'standard',
      confidence: 50,
      signals: ['Generic project structure without clear architectural pattern'],
      directories: [],
    };
  }

  /**
   * Detects naming conventions from file and code samples
   */
  detectNamingConventions(tree: FileTree, files: Map<string, string>): NamingConventions {
    // Sample file names (strip extensions for analysis)
    const fileNames = tree.tree
      .filter((e: TreeEntry) => e.type === 'blob' && e.path.match(/\.(ts|tsx|js|jsx)$/))
      .map((e: TreeEntry) => {
        const parts = e.path.split('/');
        const filename = parts[parts.length - 1];
        // Remove extension for naming analysis
        return filename.replace(/\.(ts|tsx|js|jsx)$/, '');
      })
      .slice(0, 100);

    const fileStyle = this.detectNamingStyle(fileNames);

    // Sample variable and function names from code
    let variableStyle: NamingStyle = 'camelCase';
    const functionStyle: NamingStyle = 'camelCase';
    let classStyle: NamingStyle = 'PascalCase';

    // Scan files for code patterns
    for (const [path, content] of Array.from(files.entries()).slice(0, 20)) {
      if (!path.match(/\.(ts|tsx|js|jsx)$/)) continue;

      // Detect class names (PascalCase)
      const classMatches = content.match(/class\s+([A-Z][a-zA-Z0-9]*)/g);
      if (classMatches) {
        classStyle = 'PascalCase';
      }

      // Detect variable/function names
      const varMatches = content.match(/(const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
      if (varMatches) {
        const names = varMatches.map((m) => m.split(/\s+/)[2]);
        variableStyle = this.detectNamingStyle(names);
      }
    }

    // Component naming detection
    let componentStyle: NamingStyle = 'PascalCase';
    if (
      tree.tree
        .filter((e: TreeEntry) => e.type === 'blob' && e.path.includes('components/'))
        .some((e: TreeEntry) => /index\.(tsx|jsx)$/.test(e.path))
    ) {
      componentStyle = 'PascalCase';
    }

    return {
      files: fileStyle,
      variables: variableStyle,
      functions: functionStyle,
      classes: classStyle,
      components: componentStyle,
      confidence: 80,
    };
  }

  /**
   * Detects testing strategy from framework and test files
   */
  detectTestingStrategy(tree: FileTree): TestingStrategy {
    const paths = tree.tree.map((e: TreeEntry) => e.path);
    const pathSet = new Set<string>(paths);

    // Detect test runner from package.json patterns (using partial matching)
    let runner: TestingRunner = null;
    let confidence = 0;

    // Check for jest config files (jest.config.js, jest.config.ts, etc.)
    if (Array.from(pathSet).some((p: string) => p.includes('jest.config'))) {
      runner = 'jest';
      confidence = 95;
    } else if (Array.from(pathSet).some((p: string) => p.includes('vitest.config'))) {
      runner = 'vitest';
      confidence = 95;
    } else if (
      Array.from(pathSet).some((p: string) => p.includes('mocha.opts') || p.includes('.mocharc'))
    ) {
      runner = 'mocha';
      confidence = 90;
    }

    // Detect test file location pattern
    const testFiles = paths.filter(
      (p: string) =>
        p.includes('__tests__') ||
        p.includes('.test.') ||
        p.includes('.spec.') ||
        p.includes('test/'),
    );

    const hasCentralized = testFiles.some((p: string) => p.startsWith('test/'));
    const hasColocated = testFiles.some(
      (p: string) => p.includes('__tests__') || p.match(/\/[^/]+\.(test|spec)\./) !== null,
    );

    const location = hasCentralized ? 'centralized' : hasColocated ? 'colocated' : 'mixed';

    // Detect naming pattern
    let namingPattern = '*.spec.ts';
    if (testFiles.some((p: string) => p.includes('.test.'))) {
      namingPattern = '*.test.ts';
    }

    return {
      runner,
      location,
      namingPattern,
      libraries: [], // Would be populated from package.json analysis
      confidence: confidence || 60,
    };
  }

  /**
   * Detects state management approach from imports and patterns
   */
  detectStateManagement(files: Map<string, string>, _stack: ProjectStack): StateManagement {
    let detectedType: StateManagementType = 'unknown';
    const packages: string[] = [];
    const patterns: string[] = [];
    let confidence = 0;

    // Scan for state management patterns in code
    for (const [, content] of Array.from(files.entries()).slice(0, 30)) {
      if (content.includes("import { create } from 'zustand'")) {
        detectedType = 'zustand';
        packages.push('zustand');
        patterns.push('Zustand create() hooks detected');
        confidence = Math.max(confidence, 88);
      }
      if (
        content.includes('redux') ||
        content.includes('@reduxjs/toolkit') ||
        content.includes('createSlice')
      ) {
        detectedType = 'redux';
        packages.push('redux');
        patterns.push('Redux slice pattern detected');
        confidence = Math.max(confidence, 85);
      }
      if (content.includes('React.createContext')) {
        detectedType = 'context-api';
        patterns.push('React Context API usage detected');
        confidence = Math.max(confidence, 75);
      }
      if (content.includes('apollo-client') || content.includes('@apollo/client')) {
        detectedType = 'graphql-apollo';
        packages.push('@apollo/client');
        confidence = Math.max(confidence, 80);
      }
    }

    if (detectedType === 'unknown') {
      patterns.push('No explicit state management detected');
    }

    return {
      type: detectedType,
      packages,
      patterns,
      confidence,
    };
  }

  /**
   * Detects API routing convention from directory structure and imports
   */
  detectAPIRouting(stack: ProjectStack, _files: Map<string, string>): APIRouting {
    // For Next.js projects, detect based on directory structure
    if (stack.framework?.name === 'next.js') {
      // Check if app/api exists (App Router)
      // In real usage, would check tree structure
      return {
        type: 'next-app-router',
        baseDirectory: 'app/api',
        conventions: ['File-based routing', 'route.ts files'],
        confidence: 85,
      };
    }

    return {
      type: 'rest-api',
      baseDirectory: '',
      conventions: [],
      confidence: 50,
    };
  }

  /**
   * Identifies and maps directory structure
   */
  identifyDirectoryStructure(tree: FileTree): DirectoryEntry[] {
    const directories: Map<string, DirectoryEntry> = new Map();
    const seenDirs = new Set<string>();

    for (const entry of tree.tree) {
      if (!entry.path) continue;

      // If entry is a directory, add it directly
      if (entry.type === 'tree') {
        if (!seenDirs.has(entry.path)) {
          seenDirs.add(entry.path);
          const type = this.categorizeDirectory(entry.path);
          const description = this.describeDirectory(entry.path, type);
          directories.set(entry.path, { path: entry.path, type, description });
        }
      }

      // Also extract parent directories from file paths
      const parts = entry.path.split('/');
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts.slice(0, i + 1).join('/');
        if (seenDirs.has(dir)) continue;
        seenDirs.add(dir);

        const type = this.categorizeDirectory(dir);
        const description = this.describeDirectory(dir, type);

        directories.set(dir, { path: dir, type, description });
      }
    }

    // Sort by path depth and importance
    return Array.from(directories.values())
      .sort((a, b) => {
        const depthA = a.path.split('/').length;
        const depthB = b.path.split('/').length;
        return depthA - depthB;
      })
      .slice(0, 20);
  }

  /**
   * Generates recommendations based on detected patterns
   */
  private generateRecommendations(
    architecture: ArchitecturePattern,
    naming: NamingConventions,
    testing: TestingStrategy,
    stateManagement: StateManagement,
    _apiRouting: APIRouting,
  ): string[] {
    const recommendations: string[] = [];

    // Architecture recommendations
    if (architecture.confidence < 70) {
      recommendations.push(
        'Consider adopting a clear architectural pattern (feature-based, layered, or clean architecture)',
      );
    }

    // Testing recommendations
    if (!testing.runner) {
      recommendations.push('No testing framework detected; consider adding Jest or Vitest');
    }
    if (testing.location === 'mixed') {
      recommendations.push('Standardize test file location (colocated vs centralized)');
    }

    // State management recommendations
    if (stateManagement.type === 'unknown') {
      recommendations.push(
        'No explicit state management detected; consider Zustand or Redux for state management',
      );
    }

    // Naming convention recommendations
    if (naming.confidence < 80) {
      recommendations.push('Apply consistent naming conventions across the codebase');
    }

    return recommendations;
  }

  /**
   * Helper: Check if path exists in set (with prefix matching)
   */
  private hasPath(pathSet: Set<string>, searchPath: string): boolean {
    for (const path of pathSet) {
      if (path === searchPath || path.startsWith(searchPath + '/')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper: Detect dominant naming style from samples
   */
  private detectNamingStyle(samples: string[]): NamingStyle {
    if (samples.length === 0) return 'camelCase';

    const styles = {
      camelCase: 0,
      PascalCase: 0,
      snake_case: 0,
      'kebab-case': 0,
      UPPER_CASE: 0,
    };

    for (const sample of samples) {
      if (/^[A-Z][a-zA-Z0-9]*$/.test(sample)) styles.PascalCase++;
      else if (/^[a-z][a-zA-Z0-9]*$/.test(sample)) styles.camelCase++;
      else if (/^[a-z0-9_]+$/.test(sample)) styles.snake_case++;
      else if (/^[a-z0-9-]+$/.test(sample)) styles['kebab-case']++;
      else if (/^[A-Z0-9_]+$/.test(sample)) styles.UPPER_CASE++;
    }

    let maxStyle: NamingStyle = 'camelCase';
    let maxCount = 0;

    for (const [style, count] of Object.entries(styles)) {
      if (count > maxCount) {
        maxCount = count;
        maxStyle = style as NamingStyle;
      }
    }

    return maxStyle;
  }

  /**
   * Helper: Categorize directory by name and path
   */
  private categorizeDirectory(path: string): DirectoryEntryType {
    // Check specific directories first (most specific first)
    if (path.includes('components')) return 'components';
    if (path.includes('lib')) return 'lib';
    if (path.includes('utils')) return 'utils';
    if (path.includes('hooks')) return 'hooks';
    if (path.includes('types')) return 'types';
    if (path.includes('api') || path.includes('routes')) return 'api';
    if (path.includes('config')) return 'config';
    if (path.includes('test') || path.includes('__tests__')) return 'test';

    // Then check broader categories
    if (path === 'src' || path.startsWith('src/')) return 'src';
    if (path === 'app' || path.startsWith('app/')) return 'app';
    if (path === 'pages' || path.startsWith('pages/')) return 'pages';

    return 'other';
  }

  /**
   * Helper: Generate description for directory
   */
  private describeDirectory(path: string, type: DirectoryEntryType): string {
    const descriptions: Record<DirectoryEntryType, string> = {
      src: 'Main source code directory',
      app: 'Next.js App Router directory',
      pages: 'Next.js Pages Router or page components',
      components: 'Reusable UI components',
      lib: 'Shared libraries and utilities',
      utils: 'Utility functions and helpers',
      hooks: 'Custom React hooks',
      types: 'TypeScript type definitions',
      api: 'API routes and endpoints',
      config: 'Configuration files',
      test: 'Test files and test utilities',
      other: 'Other project directory',
    };

    return descriptions[type];
  }
}
