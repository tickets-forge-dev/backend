'use client';

import { useState } from 'react';
import { Package, ExternalLink, X, Plus, Copy, Check } from 'lucide-react';
import type { PackageDependency } from '@/types/question-refinement';
import { NpmPackageSearchDialog } from './NpmPackageSearchDialog';

interface DependenciesSectionProps {
  dependencies: PackageDependency[];
  onRemove?: (index: number) => void;
  onAdd?: (dep: PackageDependency) => void;
}

export function DependenciesSection({ dependencies, onRemove, onAdd }: DependenciesSectionProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  if ((!dependencies || dependencies.length === 0) && !onAdd) {
    return (
      <p className="text-[12px] text-[var(--text-tertiary)] py-4 text-center">
        No new dependencies required
      </p>
    );
  }

  return (
    <div className="space-y-px">
      {dependencies.map((dep, idx) => (
        <div
          key={idx}
          className="group/dep flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Package className="w-3.5 h-3.5 text-[var(--text-tertiary)] mt-0.5 shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[var(--text)] font-mono">{dep.name}</span>
              {dep.version && (
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{dep.version}</span>
              )}
              <span className={`text-[9px] uppercase font-medium px-1.5 py-0.5 rounded ${
                dep.type === 'production'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-purple-500/10 text-purple-500'
              }`}>
                {dep.type === 'production' ? 'prod' : 'dev'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed line-clamp-2">
              {dep.purpose}
            </p>
            {(dep.alternativesConsidered?.length ?? 0) > 0 && (
              <p className="text-[10px] text-[var(--text-tertiary)]/60 mt-1">
                Alternatives: {dep.alternativesConsidered!.join(', ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/dep:opacity-100 transition-opacity">
            {dep.installCommand && (
              <button
                onClick={() => handleCopy(dep.installCommand!, idx)}
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-active)] transition-colors"
                title={`Copy: ${dep.installCommand}`}
              >
                {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
            {dep.documentationUrl && (
              <a
                href={dep.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-active)] transition-colors"
                title="Documentation"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(idx)}
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Dependency — opens npm search dialog */}
      {onAdd && (
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add dependency
        </button>
      )}

      {onAdd && showSearch && (
        <NpmPackageSearchDialog
          onAdd={onAdd}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
