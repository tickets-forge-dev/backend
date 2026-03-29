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
  });

  it('should recommend developer for architectural keywords (refactor)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 5,
      acceptanceCriteriaCount: 3,
      scopeEstimate: 'medium',
      specText: 'Refactor the entire payment processing pipeline',
    });
    expect(result.recommendation).toBe('developer');
  });

  it('should recommend developer for large scope estimate', () => {
    const result = analyzeComplexity({
      fileChangeCount: 8,
      acceptanceCriteriaCount: 10,
      scopeEstimate: 'large',
      specText: 'Add reporting dashboard',
    });
    expect(result.recommendation).toBe('developer');
  });

  it('should recommend developer for too many acceptance criteria (>8)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 5,
      acceptanceCriteriaCount: 9,
      scopeEstimate: 'medium',
      specText: 'Add user profile page',
    });
    expect(result.recommendation).toBe('developer');
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
});
