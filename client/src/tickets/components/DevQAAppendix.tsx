'use client';

import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { AECResponse } from '@/services/ticket.service';

interface DevQAAppendixProps {
  ticket: AECResponse;
}

export function DevQAAppendix({ ticket }: DevQAAppendixProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Extract affected files from repoPaths
  const affectedFiles = ticket.repoPaths || [];

  // Extract test cases from estimate drivers (as placeholder for verification steps)
  const testCases = ticket.estimate?.drivers || [];

  // Check if we have any content to display
  const hasContent = affectedFiles.length > 0 || testCases.length > 0;

  if (!hasContent) {
    return null;
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatContent = () => {
    const sections = [];

    if (affectedFiles.length > 0) {
      sections.push('Code Impact (Affected Files):');
      affectedFiles.forEach((file) => {
        sections.push(`  • ${file}`);
      });
      sections.push('');
    }

    if (testCases.length > 0) {
      sections.push('Suggested Test Cases:');
      testCases.forEach((testCase: any) => {
        sections.push(`  • ${testCase}`);
      });
    }

    return sections.join('\n');
  };

  return (
    <section className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
          Dev/QA Appendix
        </h2>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
        )}
      </button>

      {isExpanded && (
        <Card className="p-5">
          <div className="space-y-6">
            {/* Code Impact */}
            {affectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[var(--text-base)] font-medium text-[var(--text)]">
                    Code Impact
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = affectedFiles.join('\n');
                      copyToClipboard(text, 0);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    {copiedIndex === 0 ? (
                      <Check className="h-4 w-4 text-[var(--green)]" />
                    ) : (
                      <Copy className="h-4 w-4 text-[var(--text-tertiary)]" />
                    )}
                  </Button>
                </div>
                <div className="space-y-2">
                  {affectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="text-sm font-mono bg-[var(--bg)] px-3 py-2 rounded border border-[var(--border)] text-[var(--text-secondary)] break-all"
                    >
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Cases */}
            {testCases.length > 0 && (
              <div className="space-y-3 border-t border-[var(--border)] pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[var(--text-base)] font-medium text-[var(--text)]">
                    Suggested Test Cases
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = testCases.join('\n');
                      copyToClipboard(text, 1);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    {copiedIndex === 1 ? (
                      <Check className="h-4 w-4 text-[var(--green)]" />
                    ) : (
                      <Copy className="h-4 w-4 text-[var(--text-tertiary)]" />
                    )}
                  </Button>
                </div>
                <div className="space-y-2">
                  {testCases.map((testCase: any, index: number) => (
                    <div
                      key={index}
                      className="text-sm bg-[var(--bg)] px-3 py-2 rounded border border-[var(--border)] text-[var(--text-secondary)]"
                    >
                      {index + 1}. {testCase}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Copy All Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allContent = formatContent();
                copyToClipboard(allContent, 2);
              }}
              className="w-full"
            >
              {copiedIndex === 2 ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-[var(--green)]" />
                  Copied All
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Content
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
}
