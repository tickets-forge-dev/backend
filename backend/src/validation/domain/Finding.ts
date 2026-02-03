import { z } from 'zod';

/**
 * Finding Category - Type of issue discovered during code analysis
 */
export const FindingCategorySchema = z.enum([
  'gap', // Missing context or information
  'conflict', // Contradictory assumptions
  'missing-dependency', // Required package not installed
  'architectural-mismatch', // Violates architecture patterns
  'security', // Security concern
]);

/**
 * Finding Severity - Impact level
 */
export const FindingSeveritySchema = z.enum([
  'critical', // Blocks implementation
  'high', // Significant issue
  'medium', // Should fix
  'low', // Minor improvement
]);

/**
 * Finding Schema - Concrete, actionable issue with evidence
 */
export const FindingSchema = z.object({
  id: z.string().uuid(),
  category: FindingCategorySchema,
  severity: FindingSeveritySchema,
  description: z.string().min(10).max(500),
  codeLocation: z.string().optional(), // File path or GitHub URL
  suggestion: z.string().min(10), // What to add to ticket
  confidence: z.number().min(0).max(1), // 0-1 confidence score
  evidence: z.string().optional(), // Command output proving the issue
  createdAt: z.date(),
});

export type FindingCategory = z.infer<typeof FindingCategorySchema>;
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;
export type Finding = z.infer<typeof FindingSchema>;

/**
 * Factory for creating Findings with validation
 */
export class FindingFactory {
  static create(input: Omit<Finding, 'id' | 'createdAt'>): Finding {
    const finding: Finding = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };

    // Validate against schema
    return FindingSchema.parse(finding);
  }

  /**
   * Create a gap finding (missing information)
   */
  static createGap(params: {
    description: string;
    suggestion: string;
    severity: FindingSeverity;
    codeLocation?: string;
    evidence?: string;
    confidence?: number;
  }): Finding {
    return this.create({
      category: 'gap',
      ...params,
      confidence: params.confidence ?? 0.8,
    });
  }

  /**
   * Create a security finding
   */
  static createSecurity(params: {
    description: string;
    suggestion: string;
    severity: FindingSeverity;
    codeLocation?: string;
    evidence?: string;
    confidence?: number;
  }): Finding {
    return this.create({
      category: 'security',
      ...params,
      confidence: params.confidence ?? 0.9,
    });
  }

  /**
   * Create an architectural mismatch finding
   */
  static createArchitectureMismatch(params: {
    description: string;
    suggestion: string;
    severity: FindingSeverity;
    codeLocation?: string;
    evidence?: string;
    confidence?: number;
  }): Finding {
    return this.create({
      category: 'architectural-mismatch',
      ...params,
      confidence: params.confidence ?? 0.85,
    });
  }

  /**
   * Create a missing dependency finding
   */
  static createMissingDependency(params: {
    description: string;
    suggestion: string;
    severity: FindingSeverity;
    packageName: string;
    evidence?: string;
  }): Finding {
    return this.create({
      category: 'missing-dependency',
      description: `${params.description} (package: ${params.packageName})`,
      suggestion: params.suggestion,
      severity: params.severity,
      evidence: params.evidence,
      confidence: 0.95, // Dependency checks are very reliable
    });
  }
}
