'use client';

import { useState } from 'react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Package, ExternalLink, Info, AlertCircle, X, Plus } from 'lucide-react';
import type { PackageDependency } from '@/types/question-refinement';
import { toast } from 'sonner';

interface DependenciesSectionProps {
  dependencies: PackageDependency[];
  onRemove?: (index: number) => void;
  onAdd?: (dep: PackageDependency) => void;
}

export function DependenciesSection({ dependencies, onRemove, onAdd }: DependenciesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDep, setNewDep] = useState<Partial<PackageDependency>>({
    name: '',
    purpose: '',
    type: 'production',
  });

  const handleAdd = () => {
    if (!newDep.name?.trim()) {
      toast.error('Package name is required');
      return;
    }
    if (!newDep.purpose?.trim()) {
      toast.error('Purpose is required');
      return;
    }
    onAdd?.({
      name: newDep.name.trim(),
      purpose: newDep.purpose.trim(),
      version: newDep.version?.trim() || undefined,
      installCommand: newDep.installCommand?.trim() || `npm install ${newDep.name.trim()}`,
      type: newDep.type || 'production',
    });
    setNewDep({ name: '', purpose: '', type: 'production' });
    setShowAddForm(false);
  };

  if ((!dependencies || dependencies.length === 0) && !onAdd) {
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
          className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors group/dep"
        >
          {/* Header: Package name + type badge + remove button */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <h4 className="text-sm font-semibold text-[var(--text)] font-mono">
                {dep.name}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={dep.type === 'production' ? 'default' : 'outline'}
                className="text-[10px] uppercase"
              >
                {dep.type}
              </Badge>
              {onRemove && (
                <button
                  onClick={() => onRemove(idx)}
                  className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/dep:opacity-100 transition-all"
                  title="Remove dependency"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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

      {/* Add Dependency */}
      {onAdd && (
        <>
          {showAddForm ? (
            <div className="p-4 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                    Package name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newDep.name || ''}
                    onChange={(e) => setNewDep({ ...newDep, name: e.target.value })}
                    placeholder="e.g. lodash"
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-1.5 text-sm font-mono text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                    Version
                  </label>
                  <input
                    value={newDep.version || ''}
                    onChange={(e) => setNewDep({ ...newDep, version: e.target.value })}
                    placeholder="e.g. ^4.17.21"
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-1.5 text-sm font-mono text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                  Purpose <span className="text-red-400">*</span>
                </label>
                <input
                  value={newDep.purpose || ''}
                  onChange={(e) => setNewDep({ ...newDep, purpose: e.target.value })}
                  placeholder="Why is this package needed?"
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                    Type
                  </label>
                  <select
                    value={newDep.type || 'production'}
                    onChange={(e) => setNewDep({ ...newDep, type: e.target.value as 'production' | 'development' })}
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  >
                    <option value="production">Production</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                    Install command
                  </label>
                  <input
                    value={newDep.installCommand || ''}
                    onChange={(e) => setNewDep({ ...newDep, installCommand: e.target.value })}
                    placeholder={`npm install ${newDep.name || '...'}`}
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-1.5 text-sm font-mono text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button onClick={handleAdd} size="sm" variant="outline">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
                <Button onClick={() => { setShowAddForm(false); setNewDep({ name: '', purpose: '', type: 'production' }); }} size="sm" variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 rounded-lg border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add dependency
            </button>
          )}
        </>
      )}
    </div>
  );
}
