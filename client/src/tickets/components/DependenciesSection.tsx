'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Package, ExternalLink, X, Plus, Copy, Check } from 'lucide-react';
import type { PackageDependency } from '@/types/question-refinement';
import { toast } from 'sonner';

interface DependenciesSectionProps {
  dependencies: PackageDependency[];
  onRemove?: (index: number) => void;
  onAdd?: (dep: PackageDependency) => void;
}

export function DependenciesSection({ dependencies, onRemove, onAdd }: DependenciesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [newDep, setNewDep] = useState<Partial<PackageDependency>>({
    name: '',
    purpose: '',
    type: 'production',
  });

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

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

      {/* Add Dependency */}
      {onAdd && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add dependency
        </button>
      )}

      {onAdd && showAddForm && (
        <div className="px-3 py-3 space-y-2 rounded-md bg-[var(--bg-hover)]">
          <div className="flex gap-2">
            <input
              value={newDep.name || ''}
              onChange={(e) => setNewDep({ ...newDep, name: e.target.value })}
              placeholder="Package name"
              className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-2.5 py-1.5 text-[12px] font-mono text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
            />
            <select
              value={newDep.type || 'production'}
              onChange={(e) => setNewDep({ ...newDep, type: e.target.value as 'production' | 'development' })}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-2 py-1.5 text-[11px] text-[var(--text)] focus:outline-none"
            >
              <option value="production">prod</option>
              <option value="development">dev</option>
            </select>
          </div>
          <input
            value={newDep.purpose || ''}
            onChange={(e) => setNewDep({ ...newDep, purpose: e.target.value })}
            placeholder="Why is this needed?"
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-2.5 py-1.5 text-[12px] text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
          />
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleAdd} size="sm" variant="outline" className="h-7 text-[11px]">
              Add
            </Button>
            <Button onClick={() => { setShowAddForm(false); setNewDep({ name: '', purpose: '', type: 'production' }); }} size="sm" variant="ghost" className="h-7 text-[11px]">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
