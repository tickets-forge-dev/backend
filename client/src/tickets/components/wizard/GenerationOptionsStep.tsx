'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Paintbrush, Zap, Upload, X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ToggleOptionCard } from './ToggleOptionCard';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

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
    includeWireframes,
    wireframeContext,
    setIncludeWireframes,
    setWireframeContext,
    addWireframeImage,
    removeWireframeImage,
    includeApiSpec,
    apiSpecDeferred,
    apiContext,
    setIncludeApiSpec,
    setApiSpecDeferred,
    setApiContext,
    analyzeRepository,
    goBackToInput,
    goBackToContext,
    loading,
  } = useWizardStore();

  const isBug = type === 'bug';
  const isFeature = type === 'feature';

  // Image upload state
  const [uploadedPreviews, setUploadedPreviews] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      uploadedPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hintText = isFeature
    ? 'Recommended for features'
    : `Usually not needed for ${type}s`;

  // ── Wireframe handlers ──

  const handleWireframeToggle = useCallback(() => {
    const next = !includeWireframes;
    setIncludeWireframes(next);
    if (!next) {
      // Revoke object URLs to prevent memory leaks
      uploadedPreviews.forEach((p) => URL.revokeObjectURL(p.url));
      setUploadedPreviews([]);
    }
  }, [includeWireframes, setIncludeWireframes, uploadedPreviews]);

  const handleImageFile = useCallback((file: File) => {
    setUploadError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Only PNG, JPG, WebP, and SVG files are accepted');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError(`${file.name} exceeds 5MB limit`);
      return;
    }
    const tempId = `wireframe_${crypto.randomUUID()}`;
    const url = URL.createObjectURL(file);
    setUploadedPreviews((prev) => [...prev, { id: tempId, name: file.name, url }]);
    addWireframeImage(tempId);
  }, [addWireframeImage]);

  const handleRemoveImage = useCallback((id: string) => {
    setUploadedPreviews((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((p) => p.id !== id);
    });
    removeWireframeImage(id);
  }, [removeWireframeImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(handleImageFile);
  }, [handleImageFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(handleImageFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleImageFile]);

  // ── API handlers ──

  const handleApiToggle = useCallback(() => {
    setIncludeApiSpec(!includeApiSpec);
  }, [includeApiSpec, setIncludeApiSpec]);

  const handleDeferToggle = useCallback(() => {
    const next = !apiSpecDeferred;
    setApiSpecDeferred(next);
    if (next) setApiContext('');
  }, [apiSpecDeferred, setApiSpecDeferred, setApiContext]);

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
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Wireframe Context (optional)
              </label>
              <textarea
                value={wireframeContext}
                onChange={(e) => setWireframeContext(e.target.value)}
                placeholder="Describe the layout, components, interactions..."
                rows={3}
                className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)] resize-none"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Upload Mockup (optional)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-md border border-dashed p-4 text-center cursor-pointer transition-colors min-h-[44px] ${
                  dragOver
                    ? 'border-[var(--blue)] bg-[var(--blue)]/5'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border)] bg-[var(--bg-subtle)]'
                }`}
              >
                <Upload className="mx-auto h-4 w-4 text-[var(--text-tertiary)] mb-1" />
                <p className="text-xs text-[var(--text-tertiary)]">
                  Drop image here or <span className="text-[var(--blue)] font-medium">browse</span>
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  PNG, JPG, WebP, SVG — max 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              {uploadedPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {uploadedPreviews.map((preview) => (
                    <div key={preview.id} className="relative group">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="h-[80px] w-auto rounded-md border border-[var(--border-subtle)] object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(preview.id); }}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[80px] mt-0.5 text-center">
                        {preview.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              API Context (optional)
            </label>
            <textarea
              value={apiContext}
              onChange={(e) => setApiContext(e.target.value)}
              placeholder="Describe endpoints, methods, payloads..."
              rows={3}
              className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)] resize-none"
            />
          </div>
        </ToggleOptionCard>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={isBug ? goBackToContext : goBackToInput} disabled={loading}>
          ← {isBug ? 'Back to Repro Steps' : 'Back'}
        </Button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Continue with defaults →
          </button>
          <Button onClick={handleContinue} disabled={loading} size="sm" className="min-w-[96px]">
            {loading ? 'Analyzing...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
