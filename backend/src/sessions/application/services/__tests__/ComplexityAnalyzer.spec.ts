import { analyzeComplexity } from '../ComplexityAnalyzer';

describe('ComplexityAnalyzer', () => {
  it('should recommend cloud for small tickets (few file changes)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 3,
      acceptanceCriteriaCount: 2,
      scopeEstimate: 'small',
      specText: 'Add a button to the settings page',
    });
    expect(result.recommendation).toBe('cloud');
    expect(result.eligible).toBe(true);
  });

  it('should recommend developer for many file changes (>12)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 15,
      acceptanceCriteriaCount: 4,
      scopeEstimate: 'medium',
      specText: 'Refactor the auth module',
    });
    expect(result.recommendation).toBe('developer');
    expect(result.eligible).toBe(false);
    expect(result.model).toBe('');
    expect(result.maxDurationMs).toBe(0);
  });

  it('should recommend developer for architectural keywords (migration)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 5,
      acceptanceCriteriaCount: 3,
      scopeEstimate: 'medium',
      specText: 'Migrate the database schema to support multi-tenancy',
    });
    expect(result.recommendation).toBe('developer');
    expect(result.reason).toContain('architectural');
    expect(result.model).toBe('');
    expect(result.maxDurationMs).toBe(0);
  });

  it('should recommend developer for architectural keywords (refactor)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 5,
      acceptanceCriteriaCount: 3,
      scopeEstimate: 'medium',
      specText: 'Refactor the entire payment processing pipeline',
    });
    expect(result.recommendation).toBe('developer');
    expect(result.model).toBe('');
  });

  it('should recommend developer for large scope estimate', () => {
    const result = analyzeComplexity({
      fileChangeCount: 8,
      acceptanceCriteriaCount: 10,
      scopeEstimate: 'large',
      specText: 'Add reporting dashboard',
    });
    expect(result.recommendation).toBe('developer');
    expect(result.model).toBe('');
    expect(result.maxDurationMs).toBe(0);
  });

  it('should recommend developer for too many acceptance criteria (>8)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 5,
      acceptanceCriteriaCount: 9,
      scopeEstimate: 'medium',
      specText: 'Add user profile page',
    });
    expect(result.recommendation).toBe('developer');
    expect(result.model).toBe('');
  });

  it('should recommend cloud for medium scope with few files', () => {
    const result = analyzeComplexity({
      fileChangeCount: 6,
      acceptanceCriteriaCount: 5,
      scopeEstimate: 'medium',
      specText: 'Add rate limiting to API endpoints',
    });
    expect(result.recommendation).toBe('cloud');
    expect(result.eligible).toBe(true);
  });

  it('should recommend cloud for small bug fix', () => {
    const result = analyzeComplexity({
      fileChangeCount: 1,
      acceptanceCriteriaCount: 1,
      scopeEstimate: 'small',
      specText: 'Fix the typo on the settings page header',
    });
    expect(result.recommendation).toBe('cloud');
    expect(result.eligible).toBe(true);
  });

  it('should be case-insensitive for architectural keywords', () => {
    const result = analyzeComplexity({
      fileChangeCount: 3,
      acceptanceCriteriaCount: 2,
      scopeEstimate: 'small',
      specText: 'MIGRATION of the auth schema',
    });
    expect(result.recommendation).toBe('developer');
  });

  it('should include reason in result', () => {
    const result = analyzeComplexity({
      fileChangeCount: 3,
      acceptanceCriteriaCount: 2,
      scopeEstimate: 'small',
      specText: 'Add a button',
    });
    expect(result.reason).toBeTruthy();
    expect(typeof result.reason).toBe('string');
  });

  // Model routing tests
  it('should route small tickets (<=5 files, small scope) to haiku', () => {
    const result = analyzeComplexity({
      fileChangeCount: 3,
      acceptanceCriteriaCount: 2,
      scopeEstimate: 'small',
      specText: 'Add a button to the settings page',
    });
    expect(result.model).toBe('claude-haiku-4-5-20251001');
    expect(result.maxDurationMs).toBe(10 * 60 * 1000);
  });

  it('should route medium tickets (6-12 files or medium scope) to sonnet', () => {
    const result = analyzeComplexity({
      fileChangeCount: 6,
      acceptanceCriteriaCount: 5,
      scopeEstimate: 'medium',
      specText: 'Add rate limiting to API endpoints',
    });
    expect(result.model).toBe('claude-sonnet-4-6-20250514');
    expect(result.maxDurationMs).toBe(20 * 60 * 1000);
  });

  it('should route small file count but medium scope to sonnet', () => {
    const result = analyzeComplexity({
      fileChangeCount: 3,
      acceptanceCriteriaCount: 4,
      scopeEstimate: 'medium',
      specText: 'Add complex validation logic',
    });
    expect(result.model).toBe('claude-sonnet-4-6-20250514');
    expect(result.maxDurationMs).toBe(20 * 60 * 1000);
  });

  it('should give small tickets a 10-min timeout', () => {
    const result = analyzeComplexity({
      fileChangeCount: 2,
      acceptanceCriteriaCount: 1,
      scopeEstimate: 'small',
      specText: 'Fix null check bug',
    });
    expect(result.maxDurationMs).toBe(10 * 60 * 1000);
  });

  it('should give medium tickets a 20-min timeout', () => {
    const result = analyzeComplexity({
      fileChangeCount: 8,
      acceptanceCriteriaCount: 4,
      scopeEstimate: 'medium',
      specText: 'Add pagination to the user list',
    });
    expect(result.maxDurationMs).toBe(20 * 60 * 1000);
  });
});
