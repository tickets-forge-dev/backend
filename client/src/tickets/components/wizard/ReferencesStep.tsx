'use client';

import React from 'react';
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { detectPlatform } from '@repo/shared-types';
import { WizardFileUpload } from './WizardFileUpload';
import { DesignLinkInput } from './DesignLinkInput';

/**
 * ReferencesStep — File attachments and design links.
 *
 * Two sections:
 * 1. File Attachments — drag-and-drop upload (reuses WizardFileUpload)
 * 2. Design Links — paste Figma/Loom/Miro URLs (reuses DesignLinkInput)
 *
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
        <h2 className="text-lg font-semibold text-[var(--text)]">References</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Add files and design links to provide context for better ticket generation.
        </p>
      </div>

      {/* File Attachments */}
      <div className="border border-[var(--border-subtle)] rounded-lg p-5">
        <WizardFileUpload
          files={pendingFiles}
          onAdd={addPendingFile}
          onRemove={removePendingFile}
        />
      </div>

      {/* Design Links */}
      <div className="border border-[var(--border-subtle)] rounded-lg p-5">
        <DesignLinkInput
          links={designLinks}
          onAdd={({ url, title }) => addPendingDesignLink(url, title)}
          onRemove={(tempId) => removePendingDesignLink(String(tempId))}
        />
      </div>

      {/* Skip hint — only visible when no references added */}
      {!hasAnyReferences && (
        <p className="text-center">
          <button
            type="button"
            onClick={nextStage}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            No references? Skip to next step →
          </button>
        </p>
      )}
    </div>
  );
}
