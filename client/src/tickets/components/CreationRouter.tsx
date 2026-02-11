'use client';

import { Suspense } from 'react';
import { GenerationWizard } from './GenerationWizard';
import { ImportWizard } from './wizard/ImportWizard';

interface Props {
  resumeId?: string;
  mode?: 'new' | 'import';
}

/**
 * CreationRouter
 *
 * Routes to the correct creation flow based on URL params:
 * - resume={id}: Load and resume a draft ticket (GenerationWizard)
 * - mode=new: Create new ticket from scratch (GenerationWizard)
 * - mode=import: Import from Jira/Linear (ImportWizard)
 * - no params: Default to create new (GenerationWizard)
 *
 * Note: CreationChoiceModal is no longer used since users select from
 * the CreationMenu dropdown before visiting this page.
 */
export function CreationRouter({ resumeId, mode }: Props) {
  // If resuming a draft, always use GenerationWizard
  if (resumeId) {
    return <GenerationWizard resumeId={resumeId} />;
  }

  // Route to import wizard if requested
  if (mode === 'import') {
    return (
      <Suspense>
        <ImportWizard />
      </Suspense>
    );
  }

  // Default to create new (handles mode=new and no mode)
  return <GenerationWizard />;
}
