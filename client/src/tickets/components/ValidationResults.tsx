'use client';

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

export function ValidationResults({ validationResults, overallScore }: ValidationResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!validationResults || validationResults.length === 0) {
    return null;
  }

  // Calculate overall pass/fail
  const passedCount = validationResults.filter((v) => v.passed).length;
  const totalCount = validationResults.length;
  const allPassed = passedCount === totalCount;

  // Calculate score if not provided
  const score =
    overallScore ??
    Math.round(
      validationResults.reduce((sum, v) => sum + v.score * v.weight, 0) /
        validationResults.reduce((sum, v) => sum + v.weight, 0) *
        100
    );

  // Count issues
  const totalIssues = validationResults.reduce((sum, v) => sum + v.issues.length, 0);
  const totalBlockers = validationResults.reduce((sum, v) => sum + v.blockers.length, 0);

  return (
    <section className="space-y-3">
      <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
        Validation
      </h2>
      <Card className="p-4">
        {/* Overall Score Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {allPassed ? (
              <CheckCircle2 className="h-5 w-5 text-[var(--green)]" />
            ) : (
              <AlertCircle className="h-5 w-5 text-[var(--amber)]" />
            )}
            <div>
              <p className="text-[var(--text-base)] font-medium text-[var(--text)]">
                Validation Score: {score}%
              </p>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                {passedCount}/{totalCount} validators passed
                {totalIssues > 0 && ` • ${totalIssues} issue${totalIssues > 1 ? 's' : ''}`}
                {totalBlockers > 0 && ` • ${totalBlockers} blocker${totalBlockers > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`${
                allPassed
                  ? 'bg-[var(--green)]'
                  : score >= 70
                  ? 'bg-[var(--amber)]'
                  : 'bg-[var(--red)]'
              } text-white`}
            >
              {allPassed ? 'PASS' : score >= 70 ? 'PASS' : 'FAIL'}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
            {validationResults.map((result) => (
              <div
                key={result.criterion}
                className="flex items-start gap-3 p-3 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                {result.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--green)] mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-[var(--red)] mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[var(--text-sm)] font-medium text-[var(--text)] capitalize">
                      {result.criterion}
                    </p>
                    <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] whitespace-nowrap">
                      {Math.round(result.score * 100)}%
                    </span>
                  </div>
                  {result.message && (
                    <p className="text-[var(--text-xs)] text-[var(--text-secondary)] mb-2">
                      {result.message}
                    </p>
                  )}
                  {result.issues.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {result.issues.map((issue, index) => (
                        <li
                          key={index}
                          className="text-[var(--text-xs)] text-[var(--amber)] flex items-start gap-1"
                        >
                          <span className="mt-0.5">⚠️</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.blockers.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {result.blockers.map((blocker, index) => (
                        <li
                          key={index}
                          className="text-[var(--text-xs)] text-[var(--red)] flex items-start gap-1"
                        >
                          <span className="mt-0.5">🚫</span>
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
