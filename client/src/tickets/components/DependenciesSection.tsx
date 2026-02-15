'use client';

import { Badge } from '@/core/components/ui/badge';
import { Package, ExternalLink, Info, AlertCircle } from 'lucide-react';
import type { PackageDependency } from '@/types/question-refinement';

interface DependenciesSectionProps {
  dependencies: PackageDependency[];
}

export function DependenciesSection({ dependencies }: DependenciesSectionProps) {
  if (!dependencies || dependencies.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 rounded-lg bg-[var(--bg-subtle)] border border-dashed border-[var(--border)]">
        <div className="text-center">
          <Package className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No new dependencies required</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            This feature works with existing packages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dependencies.map((dep, idx) => (
        <div
          key={idx}
          className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
        >
          {/* Header: Package name + type badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <h4 className="text-sm font-semibold text-[var(--text)] font-mono">
                {dep.name}
              </h4>
            </div>
            <Badge
              variant={dep.type === 'production' ? 'default' : 'outline'}
              className="text-[10px] uppercase"
            >
              {dep.type}
            </Badge>
          </div>

          {/* Purpose */}
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            {dep.purpose}
          </p>

          {/* Version + Install Command */}
          <div className="space-y-2">
            {dep.version && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-tertiary)]">Version:</span>
                <code className="px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text)] font-mono">
                  {dep.version}
                </code>
              </div>
            )}

            {dep.installCommand && (
              <div className="space-y-1">
                <span className="text-xs text-[var(--text-tertiary)]">Install command:</span>
                <div className="flex items-center gap-2 group">
                  <code className="flex-1 px-3 py-2 rounded bg-[var(--bg-tertiary)] text-[var(--text)] font-mono text-xs border border-[var(--border)]">
                    {dep.installCommand}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(dep.installCommand!);
                    }}
                    className="px-2 py-1.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text)] text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Documentation Link */}
          {dep.documentationUrl && (
            <a
              href={dep.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-3"
            >
              <Info className="h-3 w-3" />
              View Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Alternatives Considered */}
          {dep.alternativesConsidered && dep.alternativesConsidered.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]/50">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">
                  Alternatives Considered
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dep.alternativesConsidered.map((alt, altIdx) => (
                  <Badge key={altIdx} variant="outline" className="text-[10px] font-mono">
                    {alt}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
