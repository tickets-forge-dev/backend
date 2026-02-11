'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { generateCurlCommand } from '@/tickets/utils/parseCurlCommand';
import type { ReproductionStepSpec } from '@/types/question-refinement';

interface ReproductionStepCardProps {
  step: ReproductionStepSpec;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

/**
 * Renders a single reproduction step with numbered badge and collapsible details
 *
 * Shows action, expected vs actual behavior, and expandable sections for:
 * - API call details (method, URL, headers, body, status comparison)
 * - Console logs (syntax highlighting)
 * - Screenshot preview
 * - Code snippet
 * - Notes
 *
 * Hover reveals edit/delete icons in top-right corner
 */
export function ReproductionStepCard({
  step,
  index,
  onEdit,
  onDelete,
  readOnly = false,
}: ReproductionStepCardProps) {
  const [showApiDetails, setShowApiDetails] = useState(false);
  const [showConsoleLog, setShowConsoleLog] = useState(false);
  const [copied, setCopied] = useState(false);

  const getMethodBadgeColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
      case 'POST':
        return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300';
      case 'PUT':
        return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300';
      case 'PATCH':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300';
      case 'DELETE':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const handleCopyCurl = async () => {
    if (!step.apiCall) return;

    const curl = generateCurlCommand({
      method: step.apiCall.method,
      url: step.apiCall.url,
      headers: step.apiCall.headers,
      body: step.apiCall.body,
    });

    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--bg-secondary)] transition-colors group">
      {/* Header: Step number, action, edit/delete buttons */}
      <div className="flex items-start gap-3 mb-2">
        {/* Numbered badge */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>

        {/* Action text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)] leading-tight">{step.action}</p>
        </div>

        {/* Edit/Delete buttons (hidden by default, shown on hover) */}
        {!readOnly && (
          <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)]"
              title="Edit step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              title="Delete step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Expected vs Actual Behavior */}
      {(step.expectedBehavior || step.actualBehavior) && (
        <div className="ml-9 mb-3 space-y-1 text-xs">
          {step.expectedBehavior && (
            <p className="text-[var(--text-secondary)]">
              <span className="font-medium text-green-600 dark:text-green-400">Expected:</span> {step.expectedBehavior}
            </p>
          )}
          {step.actualBehavior && (
            <p className="text-[var(--text-secondary)]">
              <span className="font-medium text-red-600 dark:text-red-400">Actual:</span> {step.actualBehavior}
            </p>
          )}
        </div>
      )}

      {/* API Call Details (collapsible) */}
      {step.apiCall && (
        <div>
          <button
            onClick={() => setShowApiDetails(!showApiDetails)}
            className="ml-9 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] py-1 bg-transparent border-0 cursor-pointer"
          >
            <span>📡 API Call Details</span>
            <svg
              className={`w-3 h-3 transition-transform ${showApiDetails ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {showApiDetails && (
            <div className="ml-9 mt-2 space-y-2 text-xs bg-[var(--bg-secondary)] p-3 rounded">
              {/* Method + URL */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded font-mono font-medium ${getMethodBadgeColor(step.apiCall.method)}`}>
                  {step.apiCall.method}
                </span>
                <code className="flex-1 text-[var(--text-secondary)] font-mono break-all">{step.apiCall.url}</code>
              </div>

              {/* Headers */}
              {step.apiCall.headers && Object.keys(step.apiCall.headers).length > 0 && (
                <div>
                  <p className="font-medium text-[var(--text-tertiary)] uppercase mb-1">Headers:</p>
                  <div className="space-y-0.5 text-[var(--text-secondary)]">
                    {Object.entries(step.apiCall.headers).map(([key, value]) => (
                      <div key={key} className="font-mono">
                        <span className="text-purple-600 dark:text-purple-400">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body */}
              {step.apiCall.body && (
                <div>
                  <p className="font-medium text-[var(--text-tertiary)] uppercase mb-1">Request Body:</p>
                  <pre className="bg-[var(--bg-tertiary)] p-2 rounded overflow-x-auto text-[var(--text-secondary)] font-mono text-[0.65rem]">
                    {step.apiCall.body}
                  </pre>
                </div>
              )}

              {/* Status Code Comparison */}
              {(step.apiCall.expectedStatus || step.apiCall.actualStatus) && (
                <div className="flex gap-3 pt-1">
                  {step.apiCall.expectedStatus && (
                    <div>
                      <p className="text-[var(--text-tertiary)] uppercase font-medium mb-0.5">Expected:</p>
                      <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-mono">
                        {step.apiCall.expectedStatus}
                      </span>
                    </div>
                  )}
                  {step.apiCall.actualStatus && (
                    <div>
                      <p className="text-[var(--text-tertiary)] uppercase font-medium mb-0.5">Actual:</p>
                      <span
                        className={`inline-block px-2 py-1 rounded font-mono ${
                          step.apiCall.actualStatus >= 400
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {step.apiCall.actualStatus}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Copy curl button */}
              <Button
                onClick={handleCopyCurl}
                variant="outline"
                size="sm"
                className="w-full text-xs mt-2"
              >
                {copied ? '✓ Copied to clipboard' : '📋 Copy curl command'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Console Logs (collapsible) */}
      {step.consoleLog && (
        <div>
          <button
            onClick={() => setShowConsoleLog(!showConsoleLog)}
            className="ml-9 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] py-1 bg-transparent border-0 cursor-pointer"
          >
            <span>💻 Console Logs</span>
            <svg
              className={`w-3 h-3 transition-transform ${showConsoleLog ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {showConsoleLog && (
            <div className="ml-9 mt-2 bg-black dark:bg-[#1a1a1a] p-3 rounded font-mono text-[0.65rem] text-green-400 overflow-x-auto">
              <pre>{step.consoleLog}</pre>
            </div>
          )}
        </div>
      )}

      {/* Code Snippet */}
      {step.codeSnippet && (
        <div className="ml-9 mt-2">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">Code:</p>
          <pre className="bg-[var(--bg-tertiary)] p-2 rounded overflow-x-auto text-[var(--text-secondary)] font-mono text-[0.65rem]">
            {step.codeSnippet}
          </pre>
        </div>
      )}

      {/* Notes */}
      {step.notes && (
        <div className="ml-9 mt-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded italic">
          {step.notes}
        </div>
      )}
    </div>
  );
}
