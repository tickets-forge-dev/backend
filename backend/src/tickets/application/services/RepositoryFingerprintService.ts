/**
 * RepositoryFingerprintService — Fast codebase indexing without reading all files
 *
 * Extracts a lightweight "fingerprint" of a repository:
 * - Detected tech stack (from package.json, tsconfig, etc.)
 * - Directory structure with file counts
 * - Entry points and key config files
 *
 * Used by DeepAnalysisService as Pass 1 for instant feedback.
 * Much faster than reading entire repos (1-2 seconds vs 10+ seconds).
 */

import { Injectable, Logger } from '@nestjs/common';
import { FileTree } from '@tickets/domain/deep-analysis/deep-analysis.service';

export interface RepositoryFingerprint {
  /** Detected programming languages */
  languages: string[];

  /** Detected frameworks and libraries */
  frameworks: string[];

  /** Directory structure with file stats */
  directories: Record<string, { fileCount: number; largestFile?: string }>;

  /** Key config files found */
  configFiles: Record<string, boolean>;

  /** Estimated entry points */
  entryPoints: string[];

  /** Package manager detected */
  packageManager?: string;

  /** Primary language for the repo */
  primaryLanguage?: string;

  /** Timestamp when fingerprint was created */
  createdAt: number;
}

@Injectable()
export class RepositoryFingerprintService {
  private readonly logger = new Logger(RepositoryFingerprintService.name);

  /**
   * Extract fingerprint from file tree and config files
   * This is FAST — no GitHub API calls, just tree analysis
   */
  extractFingerprint(
    fileTree: FileTree,
    configContents: Record<string, string>,
  ): RepositoryFingerprint {
    const startTime = Date.now();

    // Extract language extensions from tree
    const languages = this.detectLanguages(fileTree);
    const packageManager = this.detectPackageManager(configContents);
    const frameworks = this.detectFrameworks(configContents, languages);
    const directories = this.analyzeDirectoryStructure(fileTree);
    const entryPoints = this.detectEntryPoints(fileTree, languages);
    const configFiles = this.identifyConfigFiles(fileTree);

    const fingerprint: RepositoryFingerprint = {
      languages,
      frameworks,
      directories,
      configFiles,
      entryPoints,
      packageManager,
      primaryLanguage: languages[0] || 'Unknown',
      createdAt: Date.now(),
    };

    const elapsed = Date.now() - startTime;
    this.logger.debug(`Fingerprint extracted in ${elapsed}ms`);

    return fingerprint;
  }

  /**
   * Detect programming languages from file extensions
   */
  private detectLanguages(fileTree: FileTree): string[] {
    const extensionMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
    };

    const detected = new Set<string>();

    for (const entry of fileTree.tree) {
      const ext = entry.path.substring(entry.path.lastIndexOf('.'));
      const lang = extensionMap[ext];
      if (lang) detected.add(lang);
    }

    return Array.from(detected).sort();
  }

  /**
   * Detect frameworks from config file contents
   */
  private detectFrameworks(configContents: Record<string, string>, _languages: string[]): string[] {
    const frameworks = new Set<string>();

    // Check package.json dependencies
    const packageJsonStr = configContents['package.json'] || '';
    if (packageJsonStr) {
      const packagePatterns: Record<string, string> = {
        react: 'React',
        vue: 'Vue',
        angular: 'Angular',
        next: 'Next.js',
        nuxt: 'Nuxt',
        nest: 'NestJS',
        express: 'Express',
        fastify: 'Fastify',
        django: 'Django',
        flask: 'Flask',
        rails: 'Rails',
        spring: 'Spring',
        'django-rest': 'Django REST',
        fastapi: 'FastAPI',
        svelte: 'Svelte',
        remix: 'Remix',
        astro: 'Astro',
        qwik: 'Qwik',
      };

      for (const [pattern, framework] of Object.entries(packagePatterns)) {
        if (packageJsonStr.includes(`"${pattern}`)) {
          frameworks.add(framework);
        }
      }
    }

    // Check tsconfig for frontend frameworks
    const tsconfigStr = configContents['tsconfig.json'] || '';
    if (tsconfigStr.includes('jsx')) {
      if (!frameworks.has('React') && !frameworks.has('Vue')) {
        frameworks.add('React (inferred)');
      }
    }

    return Array.from(frameworks).sort();
  }

  /**
   * Detect package manager from lock files
   */
  private detectPackageManager(configContents: Record<string, string>): string | undefined {
    if (configContents['pnpm-lock.yaml']) return 'pnpm';
    if (configContents['yarn.lock']) return 'yarn';
    if (configContents['package-lock.json']) return 'npm';
    if (configContents['Gemfile.lock']) return 'bundler';
    if (configContents['requirements.txt']) return 'pip';
    if (configContents['go.mod']) return 'go mod';
    if (configContents['Cargo.lock']) return 'cargo';
    return undefined;
  }

  /**
   * Analyze directory structure and file counts
   */
  private analyzeDirectoryStructure(
    fileTree: FileTree,
  ): Record<string, { fileCount: number; largestFile?: string }> {
    const dirs: Record<string, { fileCount: number; largestFile?: string }> = {};

    for (const entry of fileTree.tree) {
      const topDir = entry.path.split('/')[0];
      if (!dirs[topDir]) {
        dirs[topDir] = { fileCount: 0 };
      }
      dirs[topDir].fileCount += 1;
    }

    return dirs;
  }

  /**
   * Identify config files present in the repo
   */
  private identifyConfigFiles(fileTree: FileTree): Record<string, boolean> {
    const configFiles = new Set<string>();
    const rootFiles = fileTree.tree.filter((e) => !e.path.includes('/')).map((e) => e.path);

    const knownConfigs = [
      'tsconfig.json',
      'jest.config.js',
      'prettier.config.js',
      '.eslintrc.json',
      'nest-cli.json',
      'Dockerfile',
      '.env.example',
      'CLAUDE.md',
      '.cursorrules',
      'README.md',
    ];

    for (const config of knownConfigs) {
      if (rootFiles.includes(config)) {
        configFiles.add(config);
      }
    }

    const result: Record<string, boolean> = {};
    for (const config of configFiles) {
      result[config] = true;
    }
    return result;
  }

  /**
   * Detect likely entry points based on directory structure
   */
  private detectEntryPoints(fileTree: FileTree, _languages: string[]): string[] {
    const entryPoints = new Set<string>();

    // Common entry point patterns
    const patterns = [
      'src/index.ts',
      'src/index.js',
      'src/main.ts',
      'src/main.js',
      'src/app.ts',
      'src/app.tsx',
      'pages/index.tsx',
      'pages/api/[...].ts',
      'backend/main.py',
      'cmd/main.go',
      'lib/main.rb',
    ];

    const treePaths = new Set(fileTree.tree.map((e) => e.path));
    for (const pattern of patterns) {
      if (treePaths.has(pattern)) {
        entryPoints.add(pattern);
      }
    }

    return Array.from(entryPoints);
  }
}
