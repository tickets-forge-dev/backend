'use client';

import { Suspense } from 'react';
import { GenerationWizard } from './GenerationWizard';
import { ImportWizard } from './wizard/ImportWizard';
import { CreationChoiceModal } from './CreationChoiceModal';

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
 * - no params: Show choice modal (CreationChoiceModal)
 */
export function CreationRouter({ resumeId, mode }: Props) {
  // If resuming a draft, always use GenerationWizard
  if (resumeId) {
    return <GenerationWizard resumeId={resumeId} />;
  }

  // If mode not set, show choice modal
  if (!mode) {
    return (
      <Suspense>
        <CreationChoiceModal />
      </Suspense>
    );
  }

  // Route to appropriate wizard
  if (mode === 'import') {
    return (
      <Suspense>
        <ImportWizard />
      </Suspense>
    );
  }

  // Default to create new
  return <GenerationWizard />;
}
