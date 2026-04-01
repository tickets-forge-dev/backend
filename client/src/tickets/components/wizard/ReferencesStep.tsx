'use client';

import React from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { detectPlatform } from '@repo/shared-types';
import { WizardFileUpload } from './WizardFileUpload';
import { DesignLinkInput } from './DesignLinkInput';
import { Paperclip, Link2 } from 'lucide-react';

/**
 * ReferencesStep — File attachments and design links.
 *
 * Two sections side-by-side on desktop, stacked on mobile.
 * Both are optional — user can skip to next step.
 */
export function ReferencesStep() {
  const {
    pendingFiles,
    addPendingFile,
    removePendingFile,
    pendingDesignLinks,
    addPendingDesignLink,
    removePendingDesignLink,
    nextStage,
  } = useWizardStore();

  const hasAnyReferences = pendingFiles.length > 0 || pendingDesignLinks.length > 0;

  // Map store links to the shape DesignLinkInput expects
  const designLinks = pendingDesignLinks.map((link) => ({
    url: link.url,
    title: link.title,
    platform: detectPlatform(link.url),
    tempId: link.tempId,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Attachments & Links</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Add context the AI can reference — screenshots, docs, design links. All optional.
        </p>
      </div>

      {/* Two-column grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* File Attachments */}
        <div className="border border-[var(--border-subtle)] rounded-lg p-4 space-y-3 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Files</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">max 5, 5MB each</span>
          </div>
          <WizardFileUpload
            files={pendingFiles}
            onAdd={addPendingFile}
            onRemove={removePendingFile}
          />
        </div>

        {/* Design Links */}
        <div className="border border-[var(--border-subtle)] rounded-lg p-4 space-y-3 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Design Links</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">optional</span>
          </div>
          <DesignLinkInput
            links={designLinks}
            onAdd={({ url, title }) => addPendingDesignLink(url, title)}
            onRemove={(tempId) => removePendingDesignLink(String(tempId))}
          />
        </div>
      </div>

    </div>
  );
}
