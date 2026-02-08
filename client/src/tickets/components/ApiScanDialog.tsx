'use client';

import { useState, useMemo } from 'react';
import { Search, Loader2, Check, X, Shield, Globe } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import type { ApiEndpointSpec } from '@/types/question-refinement';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  POST: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  PATCH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

interface ApiScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoints: ApiEndpointSpec[];
  isLoading: boolean;
  onSave: (selected: ApiEndpointSpec[]) => Promise<void>;
}

export function ApiScanDialog({
  open,
  onOpenChange,
  endpoints,
  isLoading,
  onSave,
}: ApiScanDialogProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Available methods from the scan results
  const availableMethods = useMemo(() => {
    const methods = new Set(endpoints.map((e) => e.method));
    return ALL_METHODS.filter((m) => methods.has(m));
  }, [endpoints]);

  // Filtered endpoints
  const filtered = useMemo(() => {
    return endpoints
      .map((ep, idx) => ({ ep, idx }))
      .filter(({ ep }) => {
        if (methodFilter && ep.method !== methodFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            ep.route.toLowerCase().includes(q) ||
            (ep.description || '').toLowerCase().includes(q) ||
            (ep.controller || '').toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [endpoints, search, methodFilter]);

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((f) => f.idx)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const selectedEndpoints = endpoints.filter((_, idx) => selected.has(idx));
      await onSave(selectedEndpoints);
      setSelected(new Set());
      setSearch('');
      setMethodFilter(null);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelected(new Set());
    setSearch('');
    setMethodFilter(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-[var(--text-tertiary)]" />
            Codebase APIs
          </DialogTitle>
          <DialogDescription>
            {isLoading
              ? 'Scanning repository for API endpoints...'
              : `Found ${endpoints.length} endpoint${endpoints.length !== 1 ? 's' : ''}. Select the ones relevant to this ticket.`}
          </DialogDescription>
        </DialogHeader>

        {/* Search + Filters */}
        {!isLoading && endpoints.length > 0 && (
          <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)] space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search routes, descriptions, files..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/20"
              />
            </div>

            {/* Method filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setMethodFilter(null)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                  methodFilter === null
                    ? 'bg-[var(--text)] text-[var(--bg)] border-transparent'
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                All
              </button>
              {availableMethods.map((method) => {
                const count = endpoints.filter((e) => e.method === method).length;
                return (
                  <button
                    key={method}
                    onClick={() => setMethodFilter(methodFilter === method ? null : method)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                      methodFilter === method
                        ? METHOD_COLORS[method] + ' border-current'
                        : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {method} ({count})
                  </button>
                );
              })}

              <div className="flex-1" />

              <button
                onClick={selected.size === filtered.length ? deselectAll : selectAll}
                className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {selected.size === filtered.length && filtered.length > 0
                  ? 'Deselect all'
                  : `Select all (${filtered.length})`}
              </button>
            </div>
          </div>
        )}

        {/* Endpoint list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Scanning controllers...</p>
            </div>
          ) : endpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm text-[var(--text-secondary)]">No API endpoints found in codebase.</p>
              <p className="text-xs text-[var(--text-tertiary)]">Try a different repository or branch.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-sm text-[var(--text-secondary)]">No endpoints match your search.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(({ ep, idx }) => {
                const isSelected = selected.has(idx);
                const methodColor = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;

                return (
                  <button
                    key={`${ep.method}-${ep.route}-${idx}`}
                    onClick={() => toggleSelect(idx)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors border ${
                      isSelected
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-transparent border-transparent hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className={`flex-shrink-0 w-4.5 h-4.5 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-green-500 border-green-500'
                            : 'border-[var(--border)] bg-transparent'
                        }`}
                        style={{ width: '18px', height: '18px' }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${methodColor}`}>
                            {ep.method}
                          </span>
                          <code className="font-mono text-xs text-[var(--text-secondary)] truncate">
                            {ep.route}
                          </code>
                          {ep.authentication === 'required' && (
                            <Shield className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          )}
                        </div>
                        {ep.description && typeof ep.description === 'string' && (
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">
                            {ep.description}
                          </p>
                        )}
                        {ep.controller && (
                          <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5 truncate">
                            {typeof ep.controller === 'string' ? ep.controller : JSON.stringify(ep.controller)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && endpoints.length > 0 && (
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-[var(--text-tertiary)]">
                {selected.size} of {endpoints.length} selected
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || selected.size === 0}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {isSaving ? 'Saving...' : `Add ${selected.size} Endpoint${selected.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
