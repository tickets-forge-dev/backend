# Story 9-3: Codebase Analyzer (Pattern Analysis)

## User Story

**As a** backend developer
**I want** a service that analyzes codebase patterns and conventions
**So that** generated specs follow existing patterns in the code and recommendations are aligned with the project's practices

---

## Acceptance Criteria

- **AC-1:** Detects architecture pattern (feature-based, layered, monorepo, hexagonal, clean architecture, etc.)
- **AC-2:** Detects naming conventions (camelCase vs snake_case for functions/variables/files, PascalCase for classes/components)
- **AC-3:** Detects testing strategy (Jest/Vitest, test location patterns, test file naming)
- **AC-4:** Detects state management approach (Zustand, Redux, Context API, Vuex, MobX, etc.)
- **AC-5:** Detects API routing convention (Next.js App Router vs Pages Router, Express routes, tRPC, etc.)
- **AC-6:** Identifies project structure (root, src/, app/, pages/, lib/, utils/, hooks/, components/ etc.)
- **AC-7:** Returns comprehensive structured analysis object with detected patterns and confidence scores
- **AC-8:** Handles various project structures gracefully (single repo, monorepo, minimal projects)
- **AC-9:** Comprehensive unit tests (100% coverage)
- **AC-10:** JSDoc documentation with examples

---

## Tasks

### Implementation

- [ ] Create `CodebaseAnalyzer` interface in domain layer
  - `analyzeStructure(files: Map<string, string>, tree: FileTree): Promise<CodebaseAnalysis>`
  - `detectArchitecture(tree: FileTree): ArchitecturePattern`
  - `detectNamingConventions(tree: FileTree, files: Map<string, string>): NamingConventions`
  - `detectTestingStrategy(tree: FileTree): TestingStrategy`
  - `detectStateManagement(files: Map<string, string>, stack: ProjectStack): StateManagement`
  - `detectAPIRouting(stack: ProjectStack, files: Map<string, string>): APIRouting`
  - `identifyDirectoryStructure(tree: FileTree): DirectoryMap`

- [ ] Implement `CodebaseAnalyzerImpl` in application/use-cases layer

  **Architecture Detection:**
  - Feature-based: `src/features/*/` or `src/modules/*/` pattern
  - Layered: `src/presentation/`, `src/application/`, `src/domain/`, `src/infrastructure/` directories
  - Monorepo: workspace configuration in package.json, `packages/*/` or `apps/*/`, lerna.json, nx.json, pnpm-workspace.yaml
  - Hexagonal/Clean: `src/domain/`, `src/ports/`, `src/adapters/`, `src/application/`
  - Standard: `src/` with `components/`, `pages/`, `api/`, `lib/`, `utils/`
  - MVC/Express: `routes/`, `controllers/`, `models/` directories
  - Detect confidence score (0-100) based on pattern completeness

  **Naming Convention Detection:**
  - Sample function/variable names from `.js/.ts` files (exclude node_modules, .next, dist, build)
  - Analyze file names from actual files in repo
  - Detect camelCase vs snake_case vs PascalCase patterns
  - Check component naming (PascalCase.tsx vs index.tsx pattern)
  - Analyze class names, function names, variable names separately
  - Calculate frequency distribution and return dominant pattern

  **Testing Strategy Detection:**
  - Identify test runner: Jest, Vitest, Mocha, Jasmine from package.json
  - Locate test files: `__tests__/`, `.test.ts`, `.spec.ts`, `test/` directories
  - Detect test file naming pattern (e.g., `fileName.test.ts` vs `fileName.spec.ts`)
  - Detect test structure: unit tests, integration tests, e2e tests location
  - Identify testing utilities: Testing Library, Enzyme, Sinon from dependencies
  - Identify coverage tools: Istanbul, nyc from dependencies

  **State Management Detection:**
  - Zustand: `import { create } from 'zustand'` or store files in specific locations
  - Redux: `redux`, `@reduxjs/toolkit` packages, store directory pattern
  - Context API: React Context usage patterns (no external package)
  - Vuex: For Vue projects, presence of `vuex` package
  - MobX: Presence of `mobx`, `mobx-react` packages
  - Pinia: For Vue 3, presence of `pinia` package
  - Signals (Solid/Angular): Presence of specific signal frameworks
  - GraphQL: Presence of Apollo Client, Relay, URQL
  - Search files for import patterns and hook usage

  **API Routing Detection:**
  - Next.js: Detect `app/` directory structure (App Router) vs `pages/api/` (Pages Router)
  - Check for route handlers in app/api or pages/api
  - Express/Node: Look for `routes/` or `api/` with router definitions
  - tRPC: Presence of `trpc` packages and router definitions
  - GraphQL: Presence of GraphQL schema files
  - REST conventions: Detect RESTful patterns in route structure
  - Nested routing: Detect route structure complexity

  **Directory Structure Mapping:**
  - Build a map of significant directories (src/, app/, pages/, lib/, components/, etc.)
  - Identify entry points (index.ts, main.ts, app.tsx, etc.)
  - Identify configuration files and their purpose
  - Map dependency directories (node_modules, vendor, etc.)

- [ ] Create comprehensive scoring system
  - Each pattern has confidence score (0-100)
  - Aggregate multiple signals for each pattern type
  - Return "recommended" pattern when confidence > 80%
  - Return "detected" when confidence 50-80%
  - Return "uncertain" when confidence < 50%

- [ ] Write unit tests in `__tests__/codebase-analyzer.spec.ts`
  - Test Next.js App Router detection
  - Test Next.js Pages Router detection
  - Test feature-based architecture detection
  - Test layered architecture detection
  - Test monorepo detection (nx, lerna, pnpm workspaces)
  - Test naming convention detection (camelCase, PascalCase, snake_case)
  - Test testing strategy detection (Jest, Vitest, Mocha)
  - Test state management detection (Zustand, Redux, Context)
  - Test API routing detection (Express, tRPC, GraphQL)
  - Test with minimal/incomplete projects
  - Test with various file encodings and structures
  - Test confidence scoring accuracy

- [ ] Add JSDoc documentation
  - Document each detection method with algorithm explanation
  - Include examples of detected patterns
  - Document confidence scoring methodology

---

## Development Notes

### Architecture Layer
**Application** - Use case for pattern analysis

### Design Patterns
- Strategy pattern for each detection type
- Chain of responsibility for pattern detection (try multiple signals)
- Mapper pattern for file tree to directory map conversion

### Dependencies
- Story 9-1: GitHub File Service
- Story 9-2: Project Stack Detector
- File glob patterns using minimatch (already in 9-1)

### Edge Cases to Handle
1. Empty or minimal projects (no clear patterns)
2. Monorepo with inconsistent patterns across packages
3. Legacy code with mixed patterns
4. Scaffolded projects with multiple patterns
5. Ignored directories (node_modules, dist, build, .next, etc.)
6. Symbolic links in directory structure
7. Projects with multiple testing frameworks
8. Projects with no tests
9. Projects with non-standard directory layouts
10. Very large codebases (10000+ files)

### Performance Considerations
- Sample files instead of analyzing entire codebase (first 100 files per directory)
- Cache analysis results (same repository, same branch)
- Implement early exit strategies (stop searching once pattern confident)
- Parallel processing for independent analyses
- Limit file read size (first 1000 lines for import analysis)

---

## Dependencies

**Must complete before:**
- Story 9-4: Tech-Spec Generator

**Depends on:**
- Story 9-1: GitHub File Service
- Story 9-2: Project Stack Detector

---

## Implementation Reference

### Example Domain Types

```typescript
export type ArchitectureType =
  | 'feature-based'
  | 'layered'
  | 'clean-architecture'
  | 'hexagonal'
  | 'monorepo'
  | 'mvc'
  | 'standard'
  | 'unknown';

export interface ArchitecturePattern {
  type: ArchitectureType;
  confidence: number; // 0-100
  signals: string[]; // Evidence supporting detection
  directories: string[]; // Key directories supporting pattern
}

export type NamingStyle = 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'UPPER_CASE';

export interface NamingConventions {
  files: NamingStyle;
  variables: NamingStyle;
  functions: NamingStyle;
  classes: NamingStyle;
  components: NamingStyle;
  confidence: number;
}

export interface TestingStrategy {
  runner: 'jest' | 'vitest' | 'mocha' | 'jasmine' | 'cypress' | 'playwright' | null;
  location: 'colocated' | 'centralized' | 'mixed'; // colocated = __tests__/ near files
  namingPattern: string; // e.g., "*.test.ts", "*.spec.ts"
  libraries: string[]; // testing-library, enzyme, sinon, etc.
  e2eFramework?: string;
  confidence: number;
}

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

export interface StateManagement {
  type: StateManagementType;
  packages: string[];
  patterns: string[]; // Detected usage patterns
  confidence: number;
}

export type APIRoutingType =
  | 'next-app-router'
  | 'next-pages-router'
  | 'express'
  | 'trpc'
  | 'graphql'
  | 'rest-api'
  | 'unknown';

export interface APIRouting {
  type: APIRoutingType;
  baseDirectory: string; // app/api, pages/api, routes/, etc.
  conventions: string[]; // Detected routing conventions
  confidence: number;
}

export interface DirectoryEntry {
  path: string;
  type: 'src' | 'app' | 'pages' | 'components' | 'lib' | 'utils' | 'hooks' | 'types' | 'api' | 'config' | 'test' | 'other';
  description: string;
}

export interface CodebaseAnalysis {
  architecture: ArchitecturePattern;
  naming: NamingConventions;
  testing: TestingStrategy;
  stateManagement: StateManagement;
  apiRouting: APIRouting;
  directories: DirectoryEntry[];
  overallConfidence: number; // Aggregate confidence
  recommendations: string[]; // Specific recommendations based on detected patterns
}

export interface CodebaseAnalyzer {
  analyzeStructure(files: Map<string, string>, tree: FileTree): Promise<CodebaseAnalysis>;
  detectArchitecture(tree: FileTree): ArchitecturePattern;
  detectNamingConventions(tree: FileTree, files: Map<string, string>): NamingConventions;
  detectTestingStrategy(tree: FileTree): TestingStrategy;
  detectStateManagement(files: Map<string, string>, stack: ProjectStack): StateManagement;
  detectAPIRouting(stack: ProjectStack, files: Map<string, string>): APIRouting;
  identifyDirectoryStructure(tree: FileTree): DirectoryEntry[];
}
```

### Example Usage

```typescript
const analyzer = new CodebaseAnalyzerImpl();

const analysis = await analyzer.analyzeStructure(files, tree);
// Returns:
// {
//   architecture: { type: 'feature-based', confidence: 92, ... },
//   naming: { files: 'PascalCase', variables: 'camelCase', ... },
//   testing: { runner: 'jest', location: 'colocated', ... },
//   stateManagement: { type: 'zustand', confidence: 85, ... },
//   apiRouting: { type: 'next-app-router', confidence: 95, ... },
//   directories: [...],
//   recommendations: ['Consider adopting TypeScript strict mode', ...]
// }
```

---

## Testing Strategy

- **Unit tests:** Each detection method tested independently with fixture directories
- **Integration tests:** Analyze real open-source projects and verify patterns
- **Fixtures:** Create sample directory structures for each architecture type
- **Confidence validation:** Verify scoring algorithm produces consistent results

---

## Definition of Done

- [ ] Implementation passes all unit tests (100% coverage)
- [ ] Detects all major architecture and pattern types
- [ ] Confidence scoring is accurate and consistent
- [ ] JSDoc documentation complete with examples
- [ ] Code reviewed and approved
- [ ] Performance acceptable (baseline: <500ms for full analysis)
- [ ] Works seamlessly with 9-1 and 9-2 services
