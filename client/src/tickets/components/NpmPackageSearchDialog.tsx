'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Package, Loader2, Download, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import type { PackageDependency } from '@/types/question-refinement';

interface NpmPackageResult {
  name: string;
  version: string;
  description: string;
  links: {
    npm?: string;
    homepage?: string;
    repository?: string;
  };
  publisher?: { username: string };
  keywords?: string[];
  score: { detail: { popularity: number } };
}

interface NpmPackageSearchDialogProps {
  onAdd: (dep: PackageDependency) => void;
  onClose: () => void;
}

async function searchNpmPackages(query: string, signal?: AbortSignal): Promise<NpmPackageResult[]> {
  if (!query.trim()) return [];
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=12`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return data.objects?.map((obj: any) => ({
    name: obj.package.name,
    version: obj.package.version,
    description: obj.package.description || '',
    links: obj.package.links || {},
    publisher: obj.package.publisher,
    keywords: obj.package.keywords,
    score: obj.score,
  })) || [];
}

export function NpmPackageSearchDialog({ onAdd, onClose }: NpmPackageSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NpmPackageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<NpmPackageResult | null>(null);
  const [purpose, setPurpose] = useState('');
  const [depType, setDepType] = useState<'production' | 'development'>('production');
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSearching(true);
      searchNpmPackages(query, controller.signal)
        .then(setResults)
        .catch(() => {}) // Aborted
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((pkg: NpmPackageResult) => {
    setSelected(pkg);
    setPurpose(pkg.description);
  }, []);

  const handleAdd = useCallback(() => {
    if (!selected) return;
    onAdd({
      name: selected.name,
      version: `^${selected.version}`,
      purpose: purpose.trim() || selected.description,
      installCommand: `npm install ${selected.name}`,
      documentationUrl: selected.links.homepage || selected.links.npm || `https://www.npmjs.com/package/${selected.name}`,
      type: depType,
    });
    onClose();
  }, [selected, purpose, depType, onAdd, onClose]);

  // Format download count from popularity score (approximate)
  const popularityLabel = (score: number): string => {
    if (score > 0.8) return 'Very popular';
    if (score > 0.5) return 'Popular';
    if (score > 0.2) return 'Moderate';
    return '';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1100] w-full max-w-md mx-4">
        <div className="bg-[var(--bg)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                placeholder="Search npm packages..."
                className="flex-1 bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-tertiary)]/50 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                }}
              />
              {isSearching && <Loader2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] animate-spin shrink-0" />}
            </div>
          </div>

          {/* Results or Selected Package */}
          {selected ? (
            <div className="p-4 space-y-3">
              {/* Selected package summary */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--text)] font-mono">{selected.name}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">^{selected.version}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed line-clamp-2">
                    {selected.description}
                  </p>
                  {selected.links.npm && (
                    <a
                      href={selected.links.npm}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mt-1 transition-colors"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      View on npm
                    </a>
                  )}
                </div>
              </div>

              {/* Purpose input */}
              <div>
                <label className="text-[11px] text-[var(--text-tertiary)] mb-1 block">Why is this needed?</label>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Purpose for this dependency..."
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-2.5 py-1.5 text-[12px] text-[var(--text)] placeholder:text-[var(--text-tertiary)]/50 focus:outline-none focus:border-[var(--border)]"
                />
              </div>

              {/* Type selector + actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDepType('production')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      depType === 'production'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    prod
                  </button>
                  <button
                    onClick={() => setDepType('development')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      depType === 'development'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    dev
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSelected(null)}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleAdd}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    disabled={!purpose.trim()}
                  >
                    <Download className="w-3 h-3 mr-1.5" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
              {results.length > 0 ? (
                <div className="py-1">
                  {results.map((pkg) => {
                    const popLabel = popularityLabel(pkg.score.detail.popularity);
                    return (
                      <button
                        key={pkg.name}
                        onClick={() => handleSelect(pkg)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors flex items-start gap-3"
                      >
                        <Package className="w-3.5 h-3.5 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-[var(--text)] font-mono truncate">{pkg.name}</span>
                            <span className="text-[10px] text-[var(--text-tertiary)] font-mono shrink-0">{pkg.version}</span>
                            {popLabel && (
                              <span className="flex items-center gap-0.5 text-[9px] text-amber-500/70 shrink-0">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {popLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 line-clamp-1 leading-relaxed">
                            {pkg.description || 'No description'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query.trim() && !isSearching ? (
                <div className="py-8 text-center">
                  <p className="text-[12px] text-[var(--text-tertiary)]">No packages found for &ldquo;{query}&rdquo;</p>
                </div>
              ) : !query.trim() ? (
                <div className="py-8 text-center">
                  <Package className="w-5 h-5 text-[var(--text-tertiary)]/30 mx-auto mb-2" />
                  <p className="text-[12px] text-[var(--text-tertiary)]">Search the npm registry</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]/50 mt-0.5">Type a package name to get started</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
