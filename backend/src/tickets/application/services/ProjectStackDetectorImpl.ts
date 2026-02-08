import {
  ProjectStackDetector,
  ProjectStack,
  Framework,
  Language,
  PackageManager,
  Dependency,
} from '@tickets/domain/stack-detection/ProjectStackDetector';

/**
 * ProjectStackDetectorImpl - Technology Stack Detection Service
 *
 * Analyzes repository files to detect framework, language, dependencies, and development tools.
 * Handles edge cases like missing files, malformed JSON, workspaces, and monorepos.
 *
 * @implements ProjectStackDetector
 *
 * @example
 * ```typescript
 * const detector = new ProjectStackDetectorImpl();
 * const stack = await detector.detectStack(files);
 * console.log(`Detected: ${stack.framework?.name} with ${stack.language.name}`);
 * ```
 */
export class ProjectStackDetectorImpl implements ProjectStackDetector {
  /**
   * Well-known framework names and their detection patterns
   */
  private readonly FRAMEWORK_PATTERNS: Record<string, { name: string; packages: string[] }> = {
    'next.js': { name: 'next.js', packages: ['next'] },
    react: { name: 'react', packages: ['react', 'react-dom'] },
    vue: { name: 'vue', packages: ['vue'] },
    svelte: { name: 'svelte', packages: ['svelte'] },
    angular: { name: 'angular', packages: ['@angular/core'] },
    nuxt: { name: 'nuxt', packages: ['nuxt'] },
    remix: { name: 'remix', packages: ['remix'] },
    qwik: { name: 'qwik', packages: ['@builder.io/qwik'] },
  };

  /**
   * Dev tool patterns for linters, formatters, testing, bundlers
   */
  private readonly TOOL_PATTERNS = {
    linter: {
      eslint: 'eslint',
      prettier: 'prettier', // Also used as formatter
      tslint: 'tslint',
    },
    formatter: {
      prettier: 'prettier',
      'prettier-eslint': 'prettier-eslint',
    },
    testing: {
      jest: 'jest',
      vitest: 'vitest',
      mocha: 'mocha',
      jasmine: 'jasmine',
      karma: 'karma',
    },
    bundler: {
      webpack: 'webpack',
      vite: 'vite',
      esbuild: 'esbuild',
      parcel: 'parcel',
      rollup: 'rollup',
      turbopack: 'turbopack',
    },
  };

  /**
   * Detects complete project technology stack from repository files
   *
   * Strategy:
   * 1. Parse package.json if available
   * 2. Detect framework from dependencies
   * 3. Detect language from files (tsconfig.json, .py files, etc.)
   * 4. Detect package manager from lock files
   * 5. Extract all dependencies
   * 6. Detect tooling and monorepo structure
   */
  async detectStack(files: Map<string, string>): Promise<ProjectStack> {
    let packageJson: Record<string, any> = {};

    // Parse package.json if available
    const packageJsonContent = files.get('package.json');
    if (packageJsonContent) {
      try {
        packageJson = JSON.parse(packageJsonContent);
      } catch (error) {
        // Malformed package.json - continue with fallback detection
        packageJson = {};
      }
    }

    const framework = this.detectFramework(packageJson);
    const language = this.detectLanguage(files);
    const packageManager = this.detectPackageManager(files);
    const dependencies = this.extractDependencies(packageJson);
    const devDependencies = this.extractDevDependencies(packageJson);
    const tooling = this.detectTooling(packageJson);
    const nodeVersion = packageJson.engines?.node;
    const hasWorkspaces = this.hasWorkspacesConfig(packageJson, files);
    const isMonorepo = this.isMonorepoProject(packageJson, files);

    return {
      framework,
      language,
      packageManager,
      dependencies,
      devDependencies,
      nodeVersion,
      tooling,
      hasWorkspaces,
      isMonorepo,
    };
  }

  /**
   * Detects framework from package.json dependencies
   * Prioritizes in order: Next.js → React → Vue → Others
   */
  detectFramework(packageJson: Record<string, any>): Framework | null {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check Next.js first (includes React)
    if (allDeps['next']) {
      const version = allDeps['next'];
      return {
        name: 'next.js',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // Check React
    if (allDeps['react'] && allDeps['react-dom']) {
      const version = allDeps['react'];
      return {
        name: 'react',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // Check Vue
    if (allDeps['vue']) {
      const version = allDeps['vue'];
      return {
        name: 'vue',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // Check Svelte
    if (allDeps['svelte']) {
      const version = allDeps['svelte'];
      return {
        name: 'svelte',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // Check Angular
    if (allDeps['@angular/core']) {
      const version = allDeps['@angular/core'];
      return {
        name: 'angular',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // Check Nuxt
    if (allDeps['nuxt']) {
      const version = allDeps['nuxt'];
      return {
        name: 'nuxt',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // Check Remix
    if (allDeps['remix']) {
      const version = allDeps['remix'];
      return {
        name: 'remix',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // Check Qwik
    if (allDeps['@builder.io/qwik']) {
      const version = allDeps['@builder.io/qwik'];
      return {
        name: 'qwik',
        version,
        majorVersion: this.extractMajorVersion(version),
        prerelease: this.isPrerelease(version),
      };
    }

    // No known framework detected
    return null;
  }

  /**
   * Detects primary language from repository files
   * Priority: TypeScript > Python > Go > Rust > JavaScript (default)
   */
  detectLanguage(files: Map<string, string>): Language {
    // Check for TypeScript
    if (files.has('tsconfig.json')) {
      return {
        name: 'typescript',
        detected: true,
        confidence: 100,
      };
    }

    // Check for Python
    const pythonFiles = Array.from(files.keys()).filter(
      (f) => f.endsWith('.py') || f.endsWith('setup.py') || f.endsWith('pyproject.toml'),
    );
    if (pythonFiles.length > 0) {
      return {
        name: 'python',
        detected: true,
        confidence: pythonFiles.length >= 3 ? 100 : 90,
      };
    }

    // Check for Go
    const goFiles = Array.from(files.keys()).filter(
      (f) => f.endsWith('.go') || f.endsWith('go.mod'),
    );
    if (goFiles.length > 0) {
      return {
        name: 'go',
        detected: true,
        confidence: 100,
      };
    }

    // Check for Rust
    const rustFiles = Array.from(files.keys()).filter(
      (f) => f.endsWith('.rs') || f.endsWith('Cargo.toml'),
    );
    if (rustFiles.length > 0) {
      return {
        name: 'rust',
        detected: true,
        confidence: 100,
      };
    }

    // Default to JavaScript/TypeScript based on presence of .ts/.tsx/.js files
    const tsxFiles = Array.from(files.keys()).filter(
      (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'),
    );
    if (tsxFiles.length > 0) {
      const hasTs = tsxFiles.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
      if (hasTs) {
        return {
          name: 'typescript',
          detected: true,
          confidence: 75,
        };
      }
    }

    // Default to JavaScript
    return {
      name: 'javascript',
      detected: false,
      confidence: 0,
    };
  }

  /**
   * Detects package manager from lock file presence
   * Priority: yarn.lock > pnpm-lock.yaml > package-lock.json > default npm
   */
  detectPackageManager(files: Map<string, string>): PackageManager {
    // Check for yarn.lock (highest priority - more specific)
    if (files.has('yarn.lock')) {
      return { type: 'yarn' };
    }

    // Check for pnpm-lock.yaml
    if (files.has('pnpm-lock.yaml')) {
      return { type: 'pnpm' };
    }

    // Check for package-lock.json
    if (files.has('package-lock.json')) {
      return { type: 'npm' };
    }

    // Check for bun.lockb
    if (files.has('bun.lockb')) {
      return { type: 'bun' };
    }

    // Default to npm
    return { type: 'npm' };
  }

  /**
   * Extracts runtime dependencies from package.json
   */
  extractDependencies(packageJson: Record<string, any>): Dependency[] {
    return this.extractDependenciesByType(packageJson.dependencies || {}, 'runtime');
  }

  /**
   * Extracts development dependencies from package.json
   */
  private extractDevDependencies(packageJson: Record<string, any>): Dependency[] {
    return this.extractDependenciesByType(packageJson.devDependencies || {}, 'dev');
  }

  /**
   * Extracts dependencies of a specific type
   */
  private extractDependenciesByType(
    deps: Record<string, string>,
    type: 'runtime' | 'dev' | 'peer' | 'optional',
  ): Dependency[] {
    return Object.entries(deps).map(([name, version]) => {
      const { scope, packageName } = this.parseScopedPackage(name);
      return {
        name: packageName,
        version,
        type,
        scope,
      };
    });
  }

  /**
   * Parses scoped package name (e.g., @org/package → org, package)
   */
  private parseScopedPackage(name: string): { scope?: string; packageName: string } {
    if (name.startsWith('@')) {
      const [scope, packageName] = name.substring(1).split('/');
      return { scope, packageName };
    }
    return { packageName: name };
  }

  /**
   * Detects tooling in the project (linter, formatter, testing, bundler)
   */
  private detectTooling(packageJson: Record<string, any>) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const tooling = {
      linter: this.detectTool(allDeps, this.TOOL_PATTERNS.linter),
      formatter: this.detectTool(allDeps, this.TOOL_PATTERNS.formatter),
      testing: this.detectTool(allDeps, this.TOOL_PATTERNS.testing),
      bundler: this.detectTool(allDeps, this.TOOL_PATTERNS.bundler),
    };

    // Remove undefined entries
    return Object.fromEntries(Object.entries(tooling).filter(([_, v]) => v !== undefined));
  }

  /**
   * Detects a single tool category from dependencies
   */
  private detectTool(
    allDeps: Record<string, string>,
    toolPatterns: Record<string, string>,
  ): { name: string; version: string } | undefined {
    for (const [toolName, depName] of Object.entries(toolPatterns)) {
      if (allDeps[depName]) {
        return {
          name: toolName,
          version: allDeps[depName],
        };
      }
    }
    return undefined;
  }

  /**
   * Checks for workspace configuration in package.json or files
   */
  private hasWorkspacesConfig(
    packageJson: Record<string, any>,
    files: Map<string, string>,
  ): boolean {
    // Check for npm v7+ workspaces
    if (packageJson.workspaces) {
      return true;
    }

    // Check for yarn workspaces
    if (packageJson.workspaces && Array.isArray(packageJson.workspaces)) {
      return true;
    }

    // Check for pnpm workspaces (pnpm-workspace.yaml)
    if (files.has('pnpm-workspace.yaml')) {
      return true;
    }

    // Check for lerna.json
    if (files.has('lerna.json')) {
      return true;
    }

    return false;
  }

  /**
   * Checks if project is a monorepo (nx, turborepo, lerna, etc.)
   */
  private isMonorepoProject(packageJson: Record<string, any>, files: Map<string, string>): boolean {
    // Check for lerna.json
    if (files.has('lerna.json')) {
      return true;
    }

    // Check for nx.json
    if (files.has('nx.json')) {
      return true;
    }

    // Check for turbo.json
    if (files.has('turbo.json')) {
      return true;
    }

    // Check for monorepo field in package.json
    if (packageJson.monorepo === true) {
      return true;
    }

    // Check if has workspaces
    return this.hasWorkspacesConfig(packageJson, files);
  }

  /**
   * Extracts major version number from a version string
   * Handles: 1.2.3, ^1.2.3, ~1.2.3, >=1.2.3, 1.2.3-alpha, etc.
   */
  private extractMajorVersion(version: string): number {
    // Remove leading carets, tildes, etc.
    const cleaned = version.replace(/^[\^~>=<*]+/, '');

    // Extract major version (first number)
    const match = cleaned.match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return 0;
  }

  /**
   * Checks if a version string is a prerelease (alpha, beta, rc, etc.)
   */
  private isPrerelease(version: string): boolean {
    const prereleasePrefixes = ['alpha', 'beta', 'rc', 'dev', 'pre', 'next', 'experimental'];
    return prereleasePrefixes.some((prefix) => version.toLowerCase().includes(prefix));
  }
}
