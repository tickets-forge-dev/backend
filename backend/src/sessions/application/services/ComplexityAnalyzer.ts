const ARCHITECTURAL_KEYWORDS = [
  'migration', 'migrate', 'schema', 'refactor', 'redesign',
  'rewrite', 'overhaul', 'restructure', 'multi-tenancy',
  'breaking change', 'database change',
];

const FILE_CHANGE_THRESHOLD_BLOCK = 12;
const FILE_CHANGE_THRESHOLD_SMALL = 5;
const ACCEPTANCE_CRITERIA_THRESHOLD = 8;

// Model routing — cheapest model that can handle the ticket
const MODEL_SMALL = 'claude-haiku-4-5-20251001';
const MODEL_MEDIUM = 'claude-sonnet-4-6-20250514';

export interface ComplexityInput {
  fileChangeCount: number;
  acceptanceCriteriaCount: number;
  scopeEstimate: 'small' | 'medium' | 'large';
  specText: string;
}

export interface ComplexityResult {
  recommendation: 'cloud' | 'developer';
  eligible: boolean;
  reason: string;
  model: string;
  maxDurationMs: number;
}

export function analyzeComplexity(input: ComplexityInput): ComplexityResult {
  const specLower = input.specText.toLowerCase();

  if (input.fileChangeCount > FILE_CHANGE_THRESHOLD_BLOCK) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: `High file count (${input.fileChangeCount} files). Assign a developer for best results.`,
      model: '',
      maxDurationMs: 0,
    };
  }

  const hasArchitecturalKeywords = ARCHITECTURAL_KEYWORDS.some(kw => specLower.includes(kw));
  if (hasArchitecturalKeywords) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: 'This ticket involves architectural changes. Assign a developer for best results.',
      model: '',
      maxDurationMs: 0,
    };
  }

  if (input.acceptanceCriteriaCount > ACCEPTANCE_CRITERIA_THRESHOLD) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: `High acceptance criteria count (${input.acceptanceCriteriaCount}). Assign a developer for best results.`,
      model: '',
      maxDurationMs: 0,
    };
  }

  if (input.scopeEstimate === 'large') {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: 'Large scope estimate. Assign a developer for best results.',
      model: '',
      maxDurationMs: 0,
    };
  }

  // Small ticket: few files + small scope — use the fast/cheap model
  if (input.fileChangeCount <= FILE_CHANGE_THRESHOLD_SMALL && input.scopeEstimate === 'small') {
    return {
      recommendation: 'cloud',
      eligible: true,
      reason: 'Small ticket — using fast model.',
      model: MODEL_SMALL,
      maxDurationMs: 10 * 60 * 1000, // 10 min
    };
  }

  // Medium ticket — use standard model
  return {
    recommendation: 'cloud',
    eligible: true,
    reason: 'This ticket is a good fit for Cloud Develop.',
    model: MODEL_MEDIUM,
    maxDurationMs: 20 * 60 * 1000, // 20 min
  };
}
