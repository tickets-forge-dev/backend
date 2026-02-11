'use client';

import { useState } from 'react';
import { Check, X, Pencil, Copy, ChevronDown, Shield, Globe, Trash2 } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { generateCurlCommand, copyToClipboard } from '@/tickets/utils/curl-generator';
import type { ApiEndpointSpec } from '@/types/question-refinement';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  POST: 'bg-green-500/10 text-green-600 dark:text-green-400',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  PATCH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400',
  OPTIONS: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  HEAD: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  modified: { label: 'Modified', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  existing: { label: 'Existing', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
  delete: { label: 'Delete', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  deprecated: { label: 'Deprecated', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

export type ReviewStatus = 'pending' | 'accepted' | 'rejected';

interface ApiCardProps {
  endpoint: ApiEndpointSpec;
  reviewStatus: ReviewStatus;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  showReviewActions?: boolean;
}

export function ApiCard({
  endpoint,
  reviewStatus,
  onAccept,
  onReject,
  onEdit,
  onDelete,
  showReviewActions = true,
}: ApiCardProps) {
  const [curlExpanded, setCurlExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const methodColor = METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET;
  const statusInfo = STATUS_STYLES[endpoint.status] || STATUS_STYLES.new;

  const curlCommand = generateCurlCommand({
    method: endpoint.method,
    path: endpoint.route,
    body: endpoint.requestBody ? tryParseJson(endpoint.requestBody) : undefined,
    headers: endpoint.headers ? parseHeaders(endpoint.headers) : undefined,
  });

  const handleCopyCurl = async () => {
    const success = await copyToClipboard(curlCommand);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const reviewBorderClass = 'border-l-2 border-l-transparent';

  return (
    <div
      className={`rounded-lg bg-[var(--bg-subtle)] p-3 space-y-2 ${reviewBorderClass}`}
    >
      {/* Header: Method + Route + Status + Auth */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide flex-shrink-0 ${methodColor}`}
        >
          {endpoint.method}
        </span>
        <code className="font-mono text-xs text-[var(--text-secondary)] break-all">
          {endpoint.route}
        </code>
        <Badge variant="outline" className={`text-[9px] ${statusInfo.className}`}>
          {statusInfo.label}
        </Badge>
        {endpoint.authentication === 'required' && (
          <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Shield className="h-2 w-2 mr-0.5" />
            Auth
          </Badge>
        )}
      </div>

      {/* Description */}
      {endpoint.description && (
        <p className="text-xs text-[var(--text-tertiary)] leading-tight">
          {typeof endpoint.description === 'string' ? endpoint.description : JSON.stringify(endpoint.description)}
        </p>
      )}

      {/* DTOs */}
      {(endpoint.dto?.request || endpoint.dto?.response) && (
        <div className="flex items-center gap-4 text-[10px] text-[var(--text-tertiary)] font-mono">
          {endpoint.dto.request && (
            <span>Req: <span className="text-[var(--text-secondary)]">{typeof endpoint.dto.request === 'string' ? endpoint.dto.request : JSON.stringify(endpoint.dto.request)}</span></span>
          )}
          {endpoint.dto.response && (
            <span>Res: <span className="text-[var(--text-secondary)]">{typeof endpoint.dto.response === 'string' ? endpoint.dto.response : JSON.stringify(endpoint.dto.response)}</span></span>
          )}
        </div>
      )}

      {/* Controller source */}
      {endpoint.controller && (
        <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
          <Globe className="h-3 w-3 inline mr-1" />
          {typeof endpoint.controller === 'string' ? endpoint.controller : JSON.stringify(endpoint.controller)}
        </p>
      )}

      {/* cURL section */}
      <div>
        <button
          onClick={() => setCurlExpanded(!curlExpanded)}
          className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${curlExpanded ? 'rotate-180' : ''}`}
          />
          cURL
        </button>

        {curlExpanded && (
          <div className="mt-2 relative">
            <pre className="bg-[var(--bg-base)] rounded-md p-3 text-[11px] font-mono text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap break-all">
              {curlCommand}
            </pre>
            <button
              onClick={handleCopyCurl}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              title="Copy cURL"
            >
              {copySuccess ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action buttons - Edit and Delete only */}
      {showReviewActions && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="gap-1 text-xs h-6 text-[var(--text-tertiary)] px-1.5"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="gap-1 text-xs h-6 text-red-600 dark:text-red-400 hover:bg-red-500/10 px-1.5"
              title="Delete API endpoint"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function tryParseJson(str: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

function parseHeaders(headersStr: string): Record<string, string> | undefined {
  if (!headersStr.trim()) return undefined;
  const result: Record<string, string> = {};
  for (const line of headersStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      result[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
