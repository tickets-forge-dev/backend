/**
 * CodebaseAnalyzer - Domain Port for Codebase Pattern Analysis
 *
 * Analyzes codebase structure, naming conventions, testing strategies, state management,
 * API routing, and directory organization to understand project patterns and conventions.
 *
 * @example
 * ```typescript
 * const analyzer = new CodebaseAnalyzerImpl();
 * const analysis = await analyzer.analyzeStructure(files, tree);
 * // Returns: {
 * //   architecture: { type: 'feature-based', confidence: 92, signals: [...] },
 * //   naming: { files: 'PascalCase', variables: 'camelCase', confidence: 85 },
 * //   testing: { runner: 'jest', location: 'colocated', confidence: 95 },
 * //   stateManagement: { type: 'zustand', confidence: 88 },
 * //   apiRouting: { type: 'next-app-router', confidence: 95 },
 * //   directories: [...],
 * //   recommendations: ['Consider strict TypeScript mode', ...]
 * // }
 * ```
 */

import { FileTree } from '@github/domain/github-file.service';
import { ProjectStack } from '@tickets/domain/stack-detection/ProjectStackDetector';

/**
 * Architecture pattern types
 */
export type ArchitectureType =
  | 'feature-based'
  | 'layered'
  | 'clean-architecture'
  | 'hexagonal'
  | 'monorepo'
  | 'mvc'
  | 'standard'
  | 'unknown';

/**
 * Detected architecture pattern with confidence scoring
 */
export interface ArchitecturePattern {
  type: ArchitectureType;
  confidence: number; // 0-100
  signals: string[]; // Evidence supporting detection (e.g., "src/features/ present", "src/domain/ present")
  directories: string[]; // Key directories supporting pattern
}

/**
 * Naming convention styles
 */
export type NamingStyle = 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'UPPER_CASE';

/**
 * Detected naming conventions for different code elements
 */
export interface NamingConventions {
  files: NamingStyle; // File naming (index.ts, Config.ts, config.ts, config-module.ts)
  variables: NamingStyle; // Variable naming
  functions: NamingStyle; // Function naming
  classes: NamingStyle; // Class naming
  components: NamingStyle; // Component naming (React, Vue, etc.)
  confidence: number; // 0-100
}

/**
 * Testing framework types
 */
export type TestingRunner = 'jest' | 'vitest' | 'mocha' | 'jasmine' | 'cypress' | 'playwright' | null;

/**
 * Test location patterns
 */
export type TestLocation = 'colocated' | 'centralized' | 'mixed';

/**
 * Detected testing strategy
 */
export interface TestingStrategy {
  runner: TestingRunner; // Main test runner
  location: TestLocation; // Test file location pattern
  namingPattern: string; // e.g., "*.test.ts", "*.spec.ts"
  libraries: string[]; // Testing utilities (testing-library, enzyme, sinon, etc.)
  e2eFramework?: string; // E2E testing framework if detected
  confidence: number; // 0-100
}

/**
 * State management framework types
 */
export type StateManagementType =
  | 'zustand'
  | 'redux'
  | 'context-api'
  | 'vuex'
  | 'pinia'
  | 'mobx'
  | 'signals'
  | 'graphql-apollo'
  | 'none'
  | 'unknown';

/**
 * Detected state management approach
 */
export interface StateManagement {
  type: StateManagementType;
  packages: string[]; // Packages supporting detection (zustand, redux, etc.)
  patterns: string[]; // Detected usage patterns (e.g., "Zustand create() hooks", "Redux slice pattern")
  confidence: number; // 0-100
}

/**
 * API routing framework types
 */
export type APIRoutingType =
  | 'next-app-router'
  | 'next-pages-router'
  | 'express'
  | 'trpc'
  | 'graphql'
  | 'rest-api'
  | 'unknown';

/**
 * Detected API routing convention
 */
export interface APIRouting {
  type: APIRoutingType;
  baseDirectory: string; // e.g., "app/api", "pages/api", "routes/", "src/graphql/"
  conventions: string[]; // Detected routing conventions
  confidence: number; // 0-100
}

/**
 * Directory entry types
 */
export type DirectoryEntryType =
  | 'src'
  | 'app'
  | 'pages'
  | 'components'
  | 'lib'
  | 'utils'
  | 'hooks'
  | 'types'
  | 'api'
  | 'config'
  | 'test'
  | 'other';

/**
 * Entry in project directory structure
 */
export interface DirectoryEntry {
  path: string; // Relative path from project root
  type: DirectoryEntryType; // Category of directory
  description: string; // What this directory contains
}

/**
 * Complete codebase analysis result
 */
export interface CodebaseAnalysis {
  architecture: ArchitecturePattern;
  naming: NamingConventions;
  testing: TestingStrategy;
  stateManagement: StateManagement;
  apiRouting: APIRouting;
  directories: DirectoryEntry[];
  overallConfidence: number; // Aggregate confidence (0-100)
  recommendations: string[]; // Specific recommendations based on detected patterns
}

/**
 * Codebase pattern analyzer interface
 */
export interface CodebaseAnalyzer {
  /**
   * Performs complete codebase analysis across all pattern categories
   *
   * @param files - Map of file paths to file contents
   * @param tree - Repository file tree structure
   * @returns Promise<CodebaseAnalysis> - Comprehensive analysis with all pattern detections
   *
   * @example
   * ```typescript
   * const analysis = await analyzer.analyzeStructure(files, tree);
   * ```
   */
  analyzeStructure(files: Map<string, string>, tree: FileTree): Promise<CodebaseAnalysis>;

  /**
   * Detects architecture pattern (feature-based, layered, monorepo, etc.)
   *
   * Strategy: Look for directory patterns indicating specific architectures
   * - Feature-based: src with features or modules directories
   * - Layered: src with presentation, application, domain, infrastructure directories
   * - Clean Architecture: src with domain, application, ports, adapters directories
   * - Monorepo: packages, apps directories with lerna, nx, or pnpm workspace configs
   * - MVC: routes, controllers, models directories
   * - Standard: generic src with components, pages, api, lib directories
   *
   * @param tree Repository file tree structure
   * @returns ArchitecturePattern object with detected pattern and confidence
   */
  detectArchitecture(tree: FileTree): ArchitecturePattern;

  /**
   * Detects naming conventions across the codebase
   *
   * Strategy: Sample files from each directory, analyze naming patterns
   *
   * @param tree Repository file tree structure
   * @param files Map of file paths to file contents for parsing
   * @returns NamingConventions object with detected naming patterns
   */
  detectNamingConventions(tree: FileTree, files: Map<string, string>): NamingConventions;

  /**
   * Detects testing strategy including framework, location, and patterns
   *
   * - Runner: Identify from package.json (jest, vitest, mocha, etc.)
   * - Location: Check for __tests__/, .test.ts, .spec.ts patterns
   * - Libraries: Identify testing utilities (testing-library, enzyme, etc.)
   * - E2E: Detect Cypress, Playwright if present
   *
   * @param tree - Repository file tree structure
   * @returns TestingStrategy - Detected testing approach with confidence
   *
   * @example
   * ```typescript
   * const testing = analyzer.detectTestingStrategy(tree);
   * // Returns: { runner: 'jest', location: 'colocated', confidence: 95 }
   * ```
   */
  detectTestingStrategy(tree: FileTree): TestingStrategy;

  /**
   * Detects state management approach (Zustand, Redux, Context, etc.)
   *
   * @param files Map of file paths to file contents for import analysis
   * @param stack Project stack information from ProjectStackDetector
   * @returns StateManagement object with detected approach and packages
   */
  detectStateManagement(
    files: Map<string, string>,
    stack: ProjectStack,
  ): StateManagement;

  /**
   * Detects API routing convention (Next.js, Express, tRPC, etc.)
   *
   * Strategy: Look for router configuration and directory patterns
   * - Next.js App Router: app/api/ directory, route handlers
   * - Next.js Pages Router: pages/api/ directory
   * - Express: routes/ directory or router definitions in files
   * - tRPC: trpc packages and router definitions
   * - GraphQL: schema files and resolver patterns
   * - REST: RESTful routing patterns in directory structure
   *
   * @param stack - Project stack information from ProjectStackDetector
   * @param files - Map of file paths to file contents for pattern detection
   * @returns APIRouting - Detected routing approach and base directory
   *
   * @example
   * ```typescript
   * const routing = analyzer.detectAPIRouting(stack, files);
   * // Returns: { type: 'next-app-router', baseDirectory: 'app/api', confidence: 95 }
   * ```
   */
  detectAPIRouting(
    stack: ProjectStack,
    files: Map<string, string>,
  ): APIRouting;

  /**
   * Identifies and maps project directory structure
   *
   * Strategy: Traverse file tree and categorize important directories
   * - Identifies: src/, app/, pages/, components/, lib/, utils/, hooks/, types/, api/, config/, test/
   * - Categorizes each as: src, app, pages, components, lib, utils, hooks, types, api, config, test, other
   * - Provides descriptions of what each directory contains
   *
   * @param tree - Repository file tree structure
   * @returns DirectoryEntry[] - Identified directories with types and descriptions
   *
   * @example
   * ```typescript
   * const dirs = analyzer.identifyDirectoryStructure(tree);
   * // Returns: [
   * //   { path: 'src', type: 'src', description: 'Main source code' },
   * //   { path: 'src/components', type: 'components', description: 'React components' },
   * //   ...
   * // ]
   * ```
   */
  identifyDirectoryStructure(
    tree: FileTree,
  ): DirectoryEntry[];
}
