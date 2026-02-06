import { DeepAnalysisResult } from './deep-analysis.types';

/**
 * File tree entry from GitHub API
 */
export interface FileTreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/**
 * Full file tree from GitHub API
 */
export interface FileTree {
  sha: string;
  url: string;
  tree: FileTreeEntry[];
  truncated: boolean;
}

/**
 * Input for deep analysis
 */
export interface DeepAnalysisInput {
  title: string;
  description?: string;
  owner: string;
  repo: string;
  branch: string;
  fileTree: FileTree;
  configFiles: Map<string, string>;
  octokit: any;
}

/**
 * Domain interface for deep LLM-powered repository analysis.
 *
 * Replaces regex-based ProjectStackDetector + CodebaseAnalyzer
 * with a 3-phase LLM pipeline: tree condensation, file selection, deep analysis.
 */
export interface DeepAnalysisService {
  analyze(input: DeepAnalysisInput): Promise<DeepAnalysisResult>;
}
