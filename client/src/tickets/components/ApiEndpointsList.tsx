'use client';

import { Globe } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { EditableItem } from './EditableItem';
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

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  modified: { label: 'Modified', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  deprecated: { label: 'Deprecated', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

interface ApiEndpointsListProps {
  endpoints: ApiEndpointSpec[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function ApiEndpointsList({ endpoints, onEdit, onDelete }: ApiEndpointsListProps) {
  if (!endpoints || endpoints.length === 0) {
    return (
      <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] italic">
        No API endpoints detected.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {endpoints.map((endpoint, idx) => {
        const methodColor = METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET;
        const statusInfo = STATUS_BADGE[endpoint.status] || STATUS_BADGE.new;

        return (
          <li key={idx}>
            <EditableItem onEdit={() => onEdit(idx)} onDelete={() => onDelete(idx)}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${methodColor}`}>
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {endpoint.route}
                  </code>
                  <Badge variant="outline" className={`text-[10px] ${statusInfo.className}`}>
                    {statusInfo.label}
                  </Badge>
                  {endpoint.authentication === 'required' && (
                    <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      Auth
                    </Badge>
                  )}
                </div>
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                  {endpoint.description}
                </p>
                {(endpoint.dto?.request || endpoint.dto?.response) && (
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] font-mono">
                    {endpoint.dto.request && (
                      <span>Req: {endpoint.dto.request}</span>
                    )}
                    {endpoint.dto.response && (
                      <span>Res: {endpoint.dto.response}</span>
                    )}
                  </div>
                )}
                {endpoint.controller && (
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                    <Globe className="h-3 w-3 inline mr-1" />
                    {endpoint.controller}
                  </p>
                )}
              </div>
            </EditableItem>
          </li>
        );
      })}
    </ul>
  );
}
