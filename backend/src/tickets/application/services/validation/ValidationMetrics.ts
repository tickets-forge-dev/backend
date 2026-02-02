/**
 * Validation Metrics Collection
 * Story 3-1: Task 3 (Telemetry)
 * 
 * Collects and tracks validation metrics for monitoring and analysis
 */

export interface ValidationMetric {
  aecId: string;
  workspaceId: string;
  timestamp: Date;
  overallScore: number;
  passed: boolean;
  validatorScores: {
    validator: string;
    score: number;
    passed: boolean;
    duration?: number;
  }[];
  totalValidators: number;
  passedValidators: number;
  failedValidators: number;
  totalIssues: number;
  criticalIssues: number;
  duration: number;
}

export class ValidationMetrics {
  private static metrics: ValidationMetric[] = [];
  private static readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a validation run
   */
  static recordValidation(metric: ValidationMetric): void {
    this.metrics.push(metric);

    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log to console for observability
    console.log(`📈 [ValidationMetrics] Recorded validation for ${metric.aecId}:`);
    console.log(`   Overall Score: ${(metric.overallScore * 100).toFixed(1)}% (${metric.passed ? 'PASS' : 'FAIL'})`);
    console.log(`   Duration: ${metric.duration}ms`);
    console.log(`   Validators: ${metric.passedValidators}/${metric.totalValidators} passed`);
    console.log(`   Issues: ${metric.totalIssues} (${metric.criticalIssues} critical)`);
  }

  /**
   * Get recent metrics
   */
  static getRecentMetrics(count: number = 10): ValidationMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Get metrics for a specific workspace
   */
  static getWorkspaceMetrics(workspaceId: string): ValidationMetric[] {
    return this.metrics.filter(m => m.workspaceId === workspaceId);
  }

  /**
   * Get average validation score
   */
  static getAverageScore(workspaceId?: string): number {
    const metricsToAnalyze = workspaceId
      ? this.getWorkspaceMetrics(workspaceId)
      : this.metrics;

    if (metricsToAnalyze.length === 0) return 0;

    const sum = metricsToAnalyze.reduce((acc, m) => acc + m.overallScore, 0);
    return sum / metricsToAnalyze.length;
  }

  /**
   * Get pass rate
   */
  static getPassRate(workspaceId?: string): number {
    const metricsToAnalyze = workspaceId
      ? this.getWorkspaceMetrics(workspaceId)
      : this.metrics;

    if (metricsToAnalyze.length === 0) return 0;

    const passedCount = metricsToAnalyze.filter(m => m.passed).length;
    return passedCount / metricsToAnalyze.length;
  }

  /**
   * Get average duration
   */
  static getAverageDuration(workspaceId?: string): number {
    const metricsToAnalyze = workspaceId
      ? this.getWorkspaceMetrics(workspaceId)
      : this.metrics;

    if (metricsToAnalyze.length === 0) return 0;

    const sum = metricsToAnalyze.reduce((acc, m) => acc + m.duration, 0);
    return sum / metricsToAnalyze.length;
  }

  /**
   * Get validator performance stats
   */
  static getValidatorStats(validatorType: string): {
    averageScore: number;
    passRate: number;
    totalRuns: number;
  } {
    const validatorMetrics = this.metrics.flatMap(m =>
      m.validatorScores.filter(v => v.validator === validatorType)
    );

    if (validatorMetrics.length === 0) {
      return { averageScore: 0, passRate: 0, totalRuns: 0 };
    }

    const sum = validatorMetrics.reduce((acc, v) => acc + v.score, 0);
    const passedCount = validatorMetrics.filter(v => v.passed).length;

    return {
      averageScore: sum / validatorMetrics.length,
      passRate: passedCount / validatorMetrics.length,
      totalRuns: validatorMetrics.length,
    };
  }

  /**
   * Get summary statistics
   */
  static getSummaryStats(workspaceId?: string): {
    totalValidations: number;
    averageScore: number;
    passRate: number;
    averageDuration: number;
    validatorStats: Record<string, ReturnType<typeof ValidationMetrics.getValidatorStats>>;
  } {
    const metricsToAnalyze = workspaceId
      ? this.getWorkspaceMetrics(workspaceId)
      : this.metrics;

    // Get unique validator types
    const validatorTypes = new Set<string>();
    metricsToAnalyze.forEach(m => {
      m.validatorScores.forEach(v => validatorTypes.add(v.validator));
    });

    const validatorStats: Record<string, ReturnType<typeof ValidationMetrics.getValidatorStats>> = {};
    validatorTypes.forEach(type => {
      validatorStats[type] = this.getValidatorStats(type);
    });

    return {
      totalValidations: metricsToAnalyze.length,
      averageScore: this.getAverageScore(workspaceId),
      passRate: this.getPassRate(workspaceId),
      averageDuration: this.getAverageDuration(workspaceId),
      validatorStats,
    };
  }

  /**
   * Clear all metrics (for testing)
   */
  static clear(): void {
    this.metrics = [];
  }
}
