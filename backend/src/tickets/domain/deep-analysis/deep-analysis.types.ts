/**
 * DeepAnalysisResult — Complete LLM analysis result
 *
 * All fields are produced by the LLM, replacing regex-based
 * ProjectStackDetector and CodebaseAnalyzer.
 */
export interface DeepAnalysisResult {
  /** Stack detection (replaces regex ProjectStackDetector) */
  stack: {
    framework: { name: string; version?: string } | null;
    language: { name: string };
    packageManager: { type: string; version?: string };
    buildTools: string[];
    dependencies: string[];
    devDependencies: string[];
  };

  /** Codebase patterns (replaces regex CodebaseAnalyzer) */
  analysis: {
    architecture: { type: string; confidence?: number };
    naming: { files: string; variables?: string; classes?: string };
    testing: { runner: string | null; location: string; namingPattern?: string };
    stateManagement: { type: string } | null;
    apiRouting: { type: string } | null;
    directories: Array<{ path: string; description: string }>;
  };

  /** Important files in repo */
  files: Array<{ path: string; name: string; isDirectory: boolean }>;

  /** Task-specific deep analysis (new, LLM-powered) */
  taskAnalysis: {
    filesToModify: Array<{
      path: string;
      reason: string;
      currentPurpose: string;
      suggestedChanges: string;
    }>;
    filesToCreate: Array<{
      path: string;
      reason: string;
      patternToFollow: string;
    }>;
    relevantPatterns: Array<{
      name: string;
      exampleFile: string;
      description: string;
    }>;
    risks: Array<{
      area: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    integrationConcerns: Array<{
      system: string;
      concern: string;
      recommendation: string;
    }>;
    implementationHints: {
      existingPatterns: string[];
      conventionsToFollow: string[];
      testingApproach: string;
      estimatedComplexity: 'low' | 'medium' | 'high';
      recommendedRounds: number;
    };
    llmFilesRead: string[];
    analysisTimestamp: string;
  } | null;
}
