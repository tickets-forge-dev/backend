/**
 * Normalized problem statement shape for rendering.
 * Every field is guaranteed to be present (may be empty).
 */
export interface NormalizedProblemStatement {
  narrative: string;
  whyItMatters: string;
  assumptions: string[];
  constraints: string[];
}

/**
 * Recursively extract meaningful strings (>10 chars) from any value.
 */
function collectStrings(value: unknown, maxDepth = 5): string[] {
  if (!value || maxDepth <= 0) return [];
  if (typeof value === 'string' && value.length > 10) return [value];
  if (Array.isArray(value)) {
    return value.flatMap((v) => collectStrings(v, maxDepth - 1));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap((v) => collectStrings(v, maxDepth - 1));
  }
  return [];
}

/**
 * Recursively find arrays of strings from any value.
 */
function collectStringArrays(value: unknown, maxDepth = 5): string[][] {
  if (!value || maxDepth <= 0) return [];
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => typeof v === 'string')
  ) {
    return [value as string[]];
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.values(value).flatMap((v) => collectStringArrays(v, maxDepth - 1));
  }
  return [];
}

/**
 * Detect when a narrative field contains raw JSON and extract readable text.
 * LLMs sometimes echo the user's JSON input into narrative fields.
 */
function sanitizeNarrativeField(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value; // Normal text
  }

  try {
    const parsed = JSON.parse(trimmed);
    const strings = collectStrings(parsed);
    if (strings.length > 0) {
      return strings.slice(0, 3).join('. ');
    }
    return value;
  } catch {
    return value; // Not valid JSON
  }
}

/**
 * Normalizes any problemStatement value into a predictable shape.
 *
 * Handles:
 * - Expected shape: { narrative, whyItMatters, assumptions, constraints }
 * - JSON string containing the expected shape
 * - Arbitrary JSON objects (extracts meaningful text)
 * - Plain string
 * - null/undefined
 */
export function normalizeProblemStatement(raw: unknown): NormalizedProblemStatement {
  if (!raw) {
    return { narrative: '', whyItMatters: '', assumptions: [], constraints: [] };
  }

  // If it's a string, try to parse as JSON first
  let value = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        // Not valid JSON - use as plain narrative
        return { narrative: raw, whyItMatters: '', assumptions: [], constraints: [] };
      }
    } else {
      return { narrative: raw, whyItMatters: '', assumptions: [], constraints: [] };
    }
  }

  // If it's an object, check for expected fields
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;

    // Happy path: has the expected shape
    if (typeof obj.narrative === 'string' && obj.narrative.length > 0) {
      return {
        narrative: sanitizeNarrativeField(obj.narrative as string),
        whyItMatters: typeof obj.whyItMatters === 'string' ? sanitizeNarrativeField(obj.whyItMatters) : '',
        assumptions: Array.isArray(obj.assumptions) ? obj.assumptions.filter((v): v is string => typeof v === 'string') : [],
        constraints: Array.isArray(obj.constraints) ? obj.constraints.filter((v): v is string => typeof v === 'string') : [],
      };
    }

    // Recovery: extract meaningful strings from arbitrary structure
    const strings = collectStrings(value);
    const arrays = collectStringArrays(value);

    return {
      narrative: strings[0] || '',
      whyItMatters: strings[1] || '',
      assumptions: arrays[0] || [],
      constraints: arrays[1] || [],
    };
  }

  return { narrative: '', whyItMatters: '', assumptions: [], constraints: [] };
}
