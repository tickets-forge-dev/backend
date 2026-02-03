'use client';

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState } from 'react';

export interface ValidationResultData {
  criterion: string;
  passed: boolean;
  score: number;
  weight: number;
  issues: string[];
  blockers: string[];
  message: string;
}

interface ValidationResultsProps {
  validationResults: ValidationResultData[];
  overallScore?: number;
}

// PM-friendly explanations for each criterion
const CRITERION_GUIDE: Record<string, {
  title: string;
  whatItMeans: string;
  whyItMatters: string;
  whatToDo: string;
}> = {
  completeness: {
    title: 'Complete Requirements',
    whatItMeans: 'All essential ticket fields are filled in',
    whyItMatters: 'Engineers need clear context to start work',
    whatToDo: 'Add missing title, description, or acceptance criteria',
  },
  testability: {
    title: 'Can Be Tested',
    whatItMeans: 'Success criteria are measurable and verifiable',
    whyItMatters: 'QA and engineers need to know when the ticket is done',
    whatToDo: 'Rewrite vague criteria using "Given-When-Then" format',
  },
  clarity: {
    title: 'Clear Language',
    whatItMeans: 'Requirements use simple, unambiguous language',
    whyItMatters: 'Prevents misunderstandings and back-and-forth questions',
    whatToDo: 'Remove jargon, define technical terms, be specific',
  },
  scope: {
    title: 'Right Size',
    whatItMeans: 'Work can be completed in a reasonable timeframe',
    whyItMatters: 'Large tickets are hard to estimate and often get stuck',
    whatToDo: 'Split into smaller tasks if >8 hours or multiple features',
  },
  feasibility: {
    title: 'Achievable',
    whatItMeans: 'Requirements are technically possible with current resources',
    whyItMatters: 'Avoids wasted effort on impossible tasks',
    whatToDo: 'Validate assumptions with engineering team',
  },
  consistency: {
    title: 'No Conflicts',
    whatItMeans: 'Requirements don\'t contradict each other',
    whyItMatters: 'Contradictions block implementation and confuse developers',
    whatToDo: 'Review and align conflicting acceptance criteria',
  },
  'context-alignment': {
    title: 'Matches Codebase',
    whatItMeans: 'Ticket aligns with actual code structure',
    whyItMatters: 'Ensures work is relevant to the repository',
    whatToDo: 'Verify repository context or update file references',
  },
};

export function ValidationResults({ validationResults, overallScore }: ValidationResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!validationResults || validationResults.length === 0) {
    return null;
  }

  // Calculate overall pass/fail
  const passedCount = validationResults.filter((v) => v.passed).length;
  const totalCount = validationResults.length;
  const allPassed = passedCount === totalCount;

  // Calculate score if not provided (score is 0-1, convert to percentage)
  const score =
    overallScore ??
    Math.round(
      (validationResults.reduce((sum, v) => sum + v.score * v.weight, 0) /
        validationResults.reduce((sum, v) => sum + v.weight, 0)) *
        100
    );

  // Count issues and blockers
  const totalIssues = validationResults.reduce((sum, v) => sum + v.issues.length, 0);
  const totalBlockers = validationResults.reduce((sum, v) => sum + v.blockers.length, 0);
  
  // Get failing validators
  const failingValidators = validationResults.filter((v) => !v.passed);
  const hasActionItems = totalIssues > 0 || totalBlockers > 0;

  // Overall readiness message
  const getReadinessMessage = () => {
    if (score >= 90 && totalBlockers === 0) {
      return 'Excellent! This ticket is ready for development.';
    }
    if (score >= 70 && totalBlockers === 0) {
      return 'Good enough to start, but consider addressing the suggestions below.';
    }
    if (totalBlockers > 0) {
      return '⚠️ Critical issues found. Please fix blockers before assigning to engineers.';
    }
    return '⚠️ This ticket needs work before it\'s ready for development.';
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
          Ticket Quality Check
        </h2>
        <Info className="h-4 w-4 text-[var(--text-tertiary)]" />
      </div>
      
      <Card className="p-5">
        {/* Overall Readiness */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  score >= 90 ? 'bg-[var(--green)]/10' :
                  score >= 70 ? 'bg-[var(--amber)]/10' :
                  'bg-[var(--red)]/10'
                }`}>
                  <span className={`text-lg font-bold ${
                    score >= 90 ? 'text-[var(--green)]' :
                    score >= 70 ? 'text-[var(--amber)]' :
                    'text-[var(--red)]'
                  }`}>
                    {score}
                  </span>
                </div>
                <div>
                  <h3 className="text-[var(--text-base)] font-semibold text-[var(--text)]">
                    Quality Score
                  </h3>
                  <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {getReadinessMessage()}
                  </p>
                </div>
              </div>
            </div>
            <Badge
              className={`${
                score >= 90 ? 'bg-[var(--green)]' :
                score >= 70 ? 'bg-[var(--amber)]' :
                'bg-[var(--red)]'
              } text-white`}
            >
              {score >= 70 ? 'READY' : 'NEEDS WORK'}
            </Badge>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-4 text-[var(--text-sm)] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {passedCount}/{totalCount} checks passed
            </span>
            {totalBlockers > 0 && (
              <span className="flex items-center gap-1 text-[var(--red)]">
                <AlertTriangle className="h-4 w-4" />
                {totalBlockers} blocker{totalBlockers > 1 ? 's' : ''}
              </span>
            )}
            {totalIssues > 0 && (
              <span className="flex items-center gap-1 text-[var(--amber)]">
                <AlertTriangle className="h-4 w-4" />
                {totalIssues} suggestion{totalIssues > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Action Items (if any) */}
          {hasActionItems && (
            <div className="mt-4 p-4 rounded-md bg-[var(--bg-subtle)] border border-[var(--border)]">
              <h4 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-3">
                📋 What You Should Do:
              </h4>
              <div className="space-y-3">
                {failingValidators.map((result) => {
                  const guide = CRITERION_GUIDE[result.criterion] || {
                    title: result.criterion,
                    whatItMeans: '',
                    whyItMatters: '',
                    whatToDo: result.message,
                  };
                  
                  return (
                    <div key={result.criterion} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-[var(--red)] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                            {guide.title}
                          </p>
                          {result.blockers.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {result.blockers.map((blocker, idx) => (
                                <li key={idx} className="text-[var(--text-xs)] text-[var(--red)] flex items-start gap-2">
                                  <span className="font-bold">🚫</span>
                                  <span>{blocker}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {result.issues.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {result.issues.map((issue, idx) => (
                                <li key={idx} className="text-[var(--text-xs)] text-[var(--text-secondary)] flex items-start gap-2">
                                  <span>💡</span>
                                  <span>{issue}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {guide.whatToDo && (
                            <p className="mt-2 text-[var(--text-xs)] text-[var(--text-tertiary)] italic">
                              → {guide.whatToDo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toggle Detailed View */}
          {validationResults.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-3 text-[var(--text-tertiary)] hover:text-[var(--text)]"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide detailed breakdown
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show detailed breakdown ({totalCount} checks)
                </>
              )}
            </Button>
          )}
        </div>

        {/* Expanded Detailed View */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
            {validationResults.map((result) => {
              const guide = CRITERION_GUIDE[result.criterion] || {
                title: result.criterion,
                whatItMeans: result.message,
                whyItMatters: '',
                whatToDo: '',
              };
              
              return (
                <div
                  key={result.criterion}
                  className="p-4 rounded-md bg-[var(--bg)] border border-[var(--border)]"
                >
                  <div className="flex items-start gap-3">
                    {result.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--green)] mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-[var(--red)] mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="text-[var(--text-sm)] font-semibold text-[var(--text)]">
                          {guide.title}
                        </h4>
                        <span className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)]">
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                      
                      <p className="text-[var(--text-xs)] text-[var(--text-secondary)] mb-1">
                        <span className="font-medium">What it means:</span> {guide.whatItMeans}
                      </p>
                      
                      {guide.whyItMatters && (
                        <p className="text-[var(--text-xs)] text-[var(--text-secondary)] mb-2">
                          <span className="font-medium">Why it matters:</span> {guide.whyItMatters}
                        </p>
                      )}

                      {result.message && (
                        <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic mt-2">
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
