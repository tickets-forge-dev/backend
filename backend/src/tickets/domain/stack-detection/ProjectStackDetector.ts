/**
 * ProjectStackDetector - Domain Port for Technology Stack Detection
 *
 * Detects framework, language, package manager, and dependencies from a set of repository files.
 * This interface defines the contract for stack detection without coupling to specific implementation
 * details (GitHub API, file systems, etc.).
 *
 * @example
 * ```typescript
 * const detector = new ProjectStackDetectorImpl();
 * const files = new Map([
 *   ['package.json', '{"name":"my-app","dependencies":{"next":"14.0.0"}}'],
 *   ['tsconfig.json', '{}'],
 *   ['package-lock.json', '{}'],
 * ]);
 * const stack = await detector.detectStack(files);
 * // Returns: {
 * //   framework: { name: 'next.js', version: '14.0.0', majorVersion: 14 },
 * //   language: { name: 'typescript', detected: true, confidence: 100 },
 * //   packageManager: { type: 'npm' },
 * //   dependencies: [...],
 * //   devDependencies: [...],
 * //   tooling: { linter: { name: 'eslint', version: '8.x' }, ... },
 * //   hasWorkspaces: false,
 * //   isMonorepo: false
 * // }
 * ```
 */

/**
 * Normalized package dependency information
 */
export interface Dependency {
  name: string;
  version: string;
  type: 'runtime' | 'dev' | 'peer' | 'optional';
  scope?: string; // For scoped packages like @org/package
}

/**
 * Detected framework information with version parsing
 */
export interface Framework {
  name: 'next.js' | 'react' | 'vue' | 'svelte' | 'angular' | 'nuxt' | 'remix' | 'qwik' | string;
  version: string;
  majorVersion: number;
  prerelease?: boolean;
}

/**
 * Detected primary language of the project
 */
export interface Language {
  name: 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | string;
  detected: boolean;
  confidence: number; // 0-100
}

/**
 * Detected package manager
 */
export interface PackageManager {
  type: 'npm' | 'yarn' | 'pnpm' | 'bun';
  version?: string;
}

/**
 * Detected tooling in the project (linter, formatter, testing, bundler)
 */
export interface ProjectTooling {
  linter?: { name: string; version: string };
  formatter?: { name: string; version: string };
  testing?: { name: string; version: string };
  bundler?: { name: string; version: string };
}

/**
 * Complete detected technology stack for a project
 */
export interface ProjectStack {
  framework: Framework | null;
  language: Language;
  packageManager: PackageManager;
  dependencies: Dependency[];
  devDependencies: Dependency[];
  nodeVersion?: string; // From engines.node in package.json
  tooling: ProjectTooling;
  hasWorkspaces: boolean; // yarn workspaces, npm v7+ workspaces, pnpm workspaces
  isMonorepo: boolean; // lerna.json, turborepo, nx, etc.
}

/**
 * Interface for technology stack detection
 */
export interface ProjectStackDetector {
  /**
   * Detects complete project technology stack from a set of repository files
   *
   * @param files - Map of file paths to file contents (e.g., from GitHubFileService)
   * @returns Promise<ProjectStack> - Detected stack with framework, language, dependencies, etc.
   * @throws Error if files cannot be parsed
   *
   * @example
   * ```typescript
   * const files = new Map([
   *   ['package.json', JSON.stringify({ dependencies: { react: '18.2.0' } })],
   *   ['tsconfig.json', '{}'],
   *   ['package-lock.json', '{}'],
   * ]);
   * const stack = await detector.detectStack(files);
   * ```
   */
  detectStack(files: Map<string, string>): Promise<ProjectStack>;

  /**
   * Detects framework (Next.js, React, Vue, etc.) from package.json data
   *
   * @param packageJson - Parsed package.json object
   * @returns Framework | null - Detected framework or null if not found
   *
   * @example
   * ```typescript
   * const framework = detector.detectFramework({
   *   dependencies: { next: '14.0.0', react: '18.2.0', 'react-dom': '18.2.0' }
   * });
   * // Returns: { name: 'next.js', version: '14.0.0', majorVersion: 14 }
   * ```
   */
  detectFramework(packageJson: Record<string, any>): Framework | null;

  /**
   * Detects primary language (TypeScript, JavaScript, Python, etc.) from repository files
   *
   * @param files - Map of file paths to file contents
   * @returns Language - Detected language with confidence score
   *
   * @example
   * ```typescript
   * const files = new Map([
   *   ['tsconfig.json', '{}'],
   *   ['src/index.ts', 'export const x = 1;'],
   * ]);
   * const language = detector.detectLanguage(files);
   * // Returns: { name: 'typescript', detected: true, confidence: 100 }
   * ```
   */
  detectLanguage(files: Map<string, string>): Language;

  /**
   * Detects package manager (npm, yarn, pnpm, bun) from lock files
   *
   * @param files - Map of file paths to file contents
   * @returns PackageManager - Detected package manager
   *
   * @example
   * ```typescript
   * const files = new Map([['yarn.lock', '...']]);
   * const pm = detector.detectPackageManager(files);
   * // Returns: { type: 'yarn' }
   * ```
   */
  detectPackageManager(files: Map<string, string>): PackageManager;

  /**
   * Extracts all dependencies (runtime, dev, peer, optional) from package.json
   *
   * @param packageJson - Parsed package.json object
   * @returns Dependency[] - Array of normalized dependencies
   *
   * @example
   * ```typescript
   * const deps = detector.extractDependencies({
   *   dependencies: { react: '^18.0.0', axios: '~1.6.0' },
   *   devDependencies: { jest: '^29.0.0' },
   *   peerDependencies: { react: '>=16.0.0' }
   * });
   * // Returns: [
   * //   { name: 'react', version: '^18.0.0', type: 'runtime' },
   * //   { name: 'axios', version: '~1.6.0', type: 'runtime' },
   * //   { name: 'jest', version: '^29.0.0', type: 'dev' },
   * //   { name: 'react', version: '>=16.0.0', type: 'peer' }
   * // ]
   * ```
   */
  extractDependencies(packageJson: Record<string, any>): Dependency[];
}
