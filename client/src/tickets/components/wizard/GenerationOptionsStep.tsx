'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Paintbrush, Zap, SkipForward, Plus, Trash2, Sparkles, Loader2, Eye, X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ToggleOptionCard } from './ToggleOptionCard';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';

/**
 * GenerationOptionsStep — Step between Input and Draft.
 * Two toggle cards side-by-side on desktop (stacked on mobile):
 * 1. UI/Wireframe Guidance — with optional text + image upload
 * 2. API Endpoints — with optional text context + "Let developer decide" option
 * Smart defaults by ticket type: feature=ON, bug/task=OFF.
 */
export function GenerationOptionsStep() {
  const {
    type,
    input,
    includeWireframes,
    includeHtmlWireframes,
    wireframeContext,
    setIncludeWireframes,
    setIncludeHtmlWireframes,
    setWireframeContext,
    includeApiSpec,
    apiSpecDeferred,
    apiContext,
    setIncludeApiSpec,
    setApiSpecDeferred,
    setApiContext,
    analyzeRepository,
    prevStage,
    loading,
    skipQuestions,
    setSkipQuestions,
  } = useWizardStore();

  const isFeature = type === 'feature';

  const hintText = isFeature
    ? 'Recommended for features'
    : `Usually not needed for ${type}s`;

  // ── Wireframe handlers ──

  const handleWireframeToggle = useCallback(() => {
    setIncludeWireframes(!includeWireframes);
  }, [includeWireframes, setIncludeWireframes]);

  // ── AI wireframe description generator ──
  const [isGeneratingUI, setIsGeneratingUI] = useState(false);

  const handleGenerateUIDescription = useCallback(async () => {
    if (!input.title) return;
    setIsGeneratingUI(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const user = auth.currentUser;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      }
      const teamId = useTeamStore.getState().currentTeam?.id;
      if (teamId) {
        headers['x-team-id'] = teamId;
      }
      const res = await fetch(`${API_URL}/tickets/generate-ui-description`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: input.title, description: input.description }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      if (data.uiDescription) {
        setWireframeContext(data.uiDescription);
      }
    } catch {
      // Silently fail — user can still type manually
    } finally {
      setIsGeneratingUI(false);
    }
  }, [input.title, input.description, setWireframeContext]);

  // ── API handlers ──

  const [manualEndpoints, setManualEndpoints] = useState<Array<{ method: string; route: string }>>([]);
  const [newMethod, setNewMethod] = useState('GET');
  const [newRoute, setNewRoute] = useState('');

  const handleApiToggle = useCallback(() => {
    setIncludeApiSpec(!includeApiSpec);
  }, [includeApiSpec, setIncludeApiSpec]);

  const handleDeferToggle = useCallback(() => {
    const next = !apiSpecDeferred;
    setApiSpecDeferred(next);
    if (next) {
      setApiContext('');
      setManualEndpoints([]);
    }
  }, [apiSpecDeferred, setApiSpecDeferred, setApiContext]);

  const addEndpoint = useCallback(() => {
    if (!newRoute.trim()) return;
    const updated = [...manualEndpoints, { method: newMethod, route: newRoute.trim() }];
    setManualEndpoints(updated);
    setNewRoute('');
    setNewMethod('GET');
    // Sync to apiContext as structured text for the LLM
    setApiContext(updated.map((e) => `${e.method} ${e.route}`).join('\n'));
  }, [newMethod, newRoute, manualEndpoints, setApiContext]);

  const removeEndpoint = useCallback((index: number) => {
    const updated = manualEndpoints.filter((_, i) => i !== index);
    setManualEndpoints(updated);
    setApiContext(updated.map((e) => `${e.method} ${e.route}`).join('\n'));
  }, [manualEndpoints, setApiContext]);

  // ── Hi-res wireframe preview ──
  const [showWireframePreview, setShowWireframePreview] = useState(false);

  // ── Continue ──

  const handleContinue = useCallback(() => {
    analyzeRepository();
  }, [analyzeRepository]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Generation Options</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Choose what to include in the generated spec.{' '}
          <span className={isFeature ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
            {hintText}
          </span>
        </p>
      </div>

      {/* Cards Grid — side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ─── Wireframe Card ─── */}
        <ToggleOptionCard
          title="UI / Wireframe Guidance"
          description="Layout guidance, visual QA, components"
          icon={<Paintbrush className={`h-5 w-5 flex-shrink-0 ${includeWireframes ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-tertiary)]'}`} />}
          enabled={includeWireframes}
          onToggle={handleWireframeToggle}
          forceExpanded={true}
        >
          <div className="space-y-4">
            {/* Sub-switches */}
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Basic wireframes</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">ASCII layout specs for developers</span>
                </div>
                <div className="relative w-8 h-[18px] rounded-full bg-green-600 flex-shrink-0 cursor-not-allowed opacity-60" title="Always included with wireframe guidance">
                  <div className="absolute top-[3px] h-3 w-3 rounded-full bg-white shadow-sm translate-x-[14px]" />
                </div>
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setIncludeHtmlWireframes(!includeHtmlWireframes)}>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Hi-res wireframes</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Interactive HTML/CSS preview</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWireframePreview(true)}
                    className="inline-flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Example
                  </button>
                  <div
                    onClick={() => setIncludeHtmlWireframes(!includeHtmlWireframes)}
                    className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 cursor-pointer ${includeHtmlWireframes ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${includeHtmlWireframes ? 'translate-x-[14px]' : 'translate-x-[3px]'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* UI Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Describe the UI
                </label>
                <button
                  type="button"
                  onClick={handleGenerateUIDescription}
                  disabled={isGeneratingUI || !input.title}
                  className="inline-flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isGeneratingUI ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {isGeneratingUI ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <textarea
                value={wireframeContext}
                onChange={(e) => setWireframeContext(e.target.value)}
                placeholder="e.g. A dashboard with a sidebar nav, header with search, and a main content area showing a data table with filters..."
                rows={3}
                className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)] resize-none"
              />
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Optional — helps the AI generate more accurate wireframes</p>
            </div>
          </div>
        </ToggleOptionCard>

        {/* ─── API Card ─── */}
        <ToggleOptionCard
          title="API Endpoints"
          description={apiSpecDeferred ? 'Developer will decide during dev-refine' : 'REST endpoint specs, payloads, routes'}
          icon={<Zap className={`h-5 w-5 flex-shrink-0 ${
            apiSpecDeferred
              ? 'text-blue-500 dark:text-blue-400'
              : includeApiSpec
                ? 'text-green-600 dark:text-green-400'
                : 'text-[var(--text-tertiary)]'
          }`} />}
          enabled={includeApiSpec && !apiSpecDeferred}
          onToggle={handleApiToggle}
          toggleDisabled={apiSpecDeferred}
          accentClass={
            apiSpecDeferred
              ? 'border-l-2 border-l-blue-500 border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/10'
              : undefined
          }
          footer={
            <div className="px-4 pb-3 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiSpecDeferred}
                  onChange={handleDeferToggle}
                  className="h-4 w-4 rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-[var(--text-secondary)]">
                  Let developer decide during dev-refine
                </span>
              </label>
              {apiSpecDeferred && (
                <p className="text-[11px] text-[var(--text-tertiary)] pl-6">
                  API spec decision deferred to the developer
                </p>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Known endpoints (optional)
            </label>

            {/* Existing endpoints */}
            {manualEndpoints.length > 0 && (
              <div className="space-y-1.5">
                {manualEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span className="text-[11px] font-mono font-medium text-blue-500 w-14 flex-shrink-0">{ep.method}</span>
                    <span className="text-xs font-mono text-[var(--text-secondary)] flex-1 truncate">{ep.route}</span>
                    <button
                      type="button"
                      onClick={() => removeEndpoint(i)}
                      className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add endpoint row */}
            <div className="flex items-center gap-2">
              <select
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                className="h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-2 text-xs font-mono text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]"
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEndpoint(); } }}
                placeholder="/api/..."
                className="flex-1 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-2.5 text-xs font-mono text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]"
              />
              <button
                type="button"
                onClick={addEndpoint}
                disabled={!newRoute.trim()}
                className="h-8 px-2 rounded-md border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-tertiary)]">
              {manualEndpoints.length === 0
                ? 'Leave empty to let AI detect from codebase'
                : `${manualEndpoints.length} endpoint${manualEndpoints.length !== 1 ? 's' : ''} — AI will include these in the spec`}
            </p>
          </div>
        </ToggleOptionCard>
      </div>

      {/* Validation Error Banner */}

      {/* Skip Questions Toggle */}
      <div
        onClick={() => setSkipQuestions(!skipQuestions)}
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all ${
          skipQuestions
            ? 'border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/10'
            : 'border-[var(--border-subtle)] hover:border-[var(--border)]'
        }`}
      >
        <SkipForward className={`h-4 w-4 flex-shrink-0 ${skipQuestions ? 'text-blue-500' : 'text-[var(--text-tertiary)]'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)]">Skip clarification questions</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {skipQuestions
              ? <>The spec will be generated from your description. You or a developer can refine it anytime from the ticket or via the{' '}<a href="/docs" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--text-secondary)] transition-colors">CLI / MCP tools</a>.</>
              : 'The AI will ask a few questions to improve the spec quality.'}
          </p>
        </div>
        <div
          className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
            skipQuestions ? 'bg-blue-500' : 'bg-[var(--border)]'
          }`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              skipQuestions ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={prevStage} disabled={loading}>
          ← Back
        </Button>
        <Button onClick={handleContinue} disabled={loading} size="sm" className="min-w-[96px]">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Analyzing...
            </>
          ) : 'Continue'}
        </Button>
      </div>

      {/* Hi-res wireframe example preview */}
      {showWireframePreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWireframePreview(false)}>
          <div className="bg-[var(--bg)] rounded-xl border border-[var(--border-subtle)] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]">Hi-res Wireframe Example</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">This is what AI generates from your ticket description</p>
              </div>
              <button onClick={() => setShowWireframePreview(false)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src="/assets/wireframe-example.html"
                sandbox=""
                title="Hi-res Wireframe Example"
                className="w-full h-full border-0"
                style={{ minHeight: '500px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
