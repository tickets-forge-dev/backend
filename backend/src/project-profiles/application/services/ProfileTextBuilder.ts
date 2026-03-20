import { RepositoryFingerprint } from '../../../tickets/application/services/RepositoryFingerprintService';

/** Max profile content size in bytes */
const MAX_PROFILE_SIZE = 50_000;

/** Max README excerpt length in chars */
const MAX_README_LENGTH = 2000;

export interface ProfileBuildInput {
  repoOwner: string;
  repoName: string;
  branch: string;
  commitSha: string;
  repoDescription: string | null;
  fingerprint: RepositoryFingerprint;
  fileTree: Array<{ path: string; type: string; size?: number }>;
  configContents: Record<string, string>;
  readmeContent: string | null;
}

/**
 * Pure function that assembles structured data into a plain-text project profile.
 * No side effects, no dependencies — easy to test.
 */
export class ProfileTextBuilder {
  static build(input: ProfileBuildInput): string {
    const sections: string[] = [];

    // Header
    sections.push(`=== PROJECT PROFILE ===`);
    const shortSha = input.commitSha ? input.commitSha.slice(0, 7) : 'unknown';
    sections.push(
      `Repository: ${input.repoOwner}/${input.repoName} | Branch: ${input.branch} | Commit: ${shortSha}`,
    );
    if (input.repoDescription) {
      sections.push(`Description: ${input.repoDescription}`);
    }

    // Tech stack
    sections.push('');
    sections.push(`=== TECH STACK ===`);
    const stackParts: string[] = [];
    if (input.fingerprint.languages.length > 0) {
      stackParts.push(input.fingerprint.languages.join(', '));
    }
    if (input.fingerprint.frameworks.length > 0) {
      stackParts.push(input.fingerprint.frameworks.join(', '));
    }
    if (input.fingerprint.packageManager) {
      stackParts.push(input.fingerprint.packageManager);
    }
    sections.push(stackParts.join(' | ') || 'Unknown');

    // File structure — summarize by top-level directory
    sections.push('');
    sections.push(`=== FILE STRUCTURE ===`);
    const dirCounts = this.buildDirectorySummary(input.fileTree);
    for (const [dir, count] of Object.entries(dirCounts).slice(0, 30)) {
      sections.push(`${dir.padEnd(30)} (${count} files)`);
    }
    const totalFiles = input.fileTree.filter((e) => e.type === 'blob').length;
    sections.push(`Total: ${totalFiles} files`);

    // Key config files
    const configEntries = Object.entries(input.configContents);
    if (configEntries.length > 0) {
      sections.push('');
      sections.push(`=== KEY CONFIG FILES ===`);
      for (const [path, content] of configEntries) {
        // Truncate very large configs (e.g., package-lock.json)
        const truncated =
          content.length > 3000
            ? content.slice(0, 3000) + '\n... (truncated)'
            : content;
        sections.push(`--- ${path} ---`);
        sections.push(truncated);
      }
    }

    // Architecture patterns (from fingerprint)
    sections.push('');
    sections.push(`=== ARCHITECTURE PATTERNS ===`);
    const patterns: string[] = [];
    if (input.fingerprint.entryPoints.length > 0) {
      patterns.push(`Entry points: ${input.fingerprint.entryPoints.join(', ')}`);
    }
    const configFileList = Object.keys(input.fingerprint.configFiles);
    if (configFileList.length > 0) {
      patterns.push(`Config files: ${configFileList.join(', ')}`);
    }
    sections.push(patterns.join('\n') || 'No patterns detected');

    // README excerpt
    if (input.readmeContent) {
      sections.push('');
      sections.push(`=== README EXCERPT ===`);
      const readme =
        input.readmeContent.length > MAX_README_LENGTH
          ? input.readmeContent.slice(0, MAX_README_LENGTH) + '\n... (truncated)'
          : input.readmeContent;
      sections.push(readme);
    }

    let result = sections.join('\n');

    // Cap at MAX_PROFILE_SIZE (single-pass truncation)
    if (Buffer.byteLength(result, 'utf-8') > MAX_PROFILE_SIZE) {
      const suffix = '\n\n... (profile truncated at 50KB limit)';
      const maxContentBytes = MAX_PROFILE_SIZE - Buffer.byteLength(suffix, 'utf-8');
      // Buffer.toString with byte offsets safely handles multi-byte chars
      result = Buffer.from(result, 'utf-8').subarray(0, maxContentBytes).toString('utf-8') + suffix;
    }

    return result;
  }

  private static buildDirectorySummary(
    fileTree: Array<{ path: string; type: string }>,
  ): Record<string, number> {
    const dirs: Record<string, number> = {};
    const skipDirs = new Set([
      'node_modules', '.git', 'dist', '.next', 'build', 'coverage',
      '__pycache__', '.venv', 'venv',
    ]);

    for (const entry of fileTree) {
      if (entry.type !== 'blob') continue;

      const parts = entry.path.split('/');
      if (parts.length === 1) {
        // Root-level file
        const key = '(root)';
        dirs[key] = (dirs[key] || 0) + 1;
        continue;
      }

      // Skip known non-source directories
      if (skipDirs.has(parts[0])) continue;

      // Use first two levels for grouping (e.g., "src/auth/")
      const dirKey =
        parts.length > 2
          ? `${parts[0]}/${parts[1]}/`
          : `${parts[0]}/`;
      dirs[dirKey] = (dirs[dirKey] || 0) + 1;
    }

    // Sort by file count descending
    return Object.fromEntries(
      Object.entries(dirs).sort(([, a], [, b]) => b - a),
    );
  }
}
