const ARCHITECTURAL_KEYWORDS = [
  'migration', 'migrate', 'schema', 'refactor', 'redesign',
  'rewrite', 'overhaul', 'restructure', 'multi-tenancy',
  'breaking change', 'database change',
];

const FILE_CHANGE_THRESHOLD = 12;
const ACCEPTANCE_CRITERIA_THRESHOLD = 8;

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
}

export function analyzeComplexity(input: ComplexityInput): ComplexityResult {
  const specLower = input.specText.toLowerCase();

  if (input.fileChangeCount > FILE_CHANGE_THRESHOLD) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: `High file count (${input.fileChangeCount} files). Assign a developer for best results.`,
    };
  }

  const hasArchitecturalKeywords = ARCHITECTURAL_KEYWORDS.some(kw => specLower.includes(kw));
  if (hasArchitecturalKeywords) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: 'This ticket involves architectural changes. Assign a developer for best results.',
    };
  }

  if (input.acceptanceCriteriaCount > ACCEPTANCE_CRITERIA_THRESHOLD) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: `High acceptance criteria count (${input.acceptanceCriteriaCount}). Assign a developer for best results.`,
    };
  }

  if (input.scopeEstimate === 'large') {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: 'Large scope estimate. Assign a developer for best results.',
    };
  }

  return {
    recommendation: 'cloud',
    eligible: true,
    reason: 'This ticket is a good fit for Cloud Develop.',
  };
}
