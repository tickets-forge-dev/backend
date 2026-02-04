'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { useTicketsStore } from '@/stores/tickets.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useWorkflowStore } from '@/src/stores/workflow.store';
import { GenerationProgress } from '@/src/tickets/components/GenerationProgress';
import { FindingsReviewModal } from '@/components/tickets/generation/FindingsReviewModal';
import { QuestionsWizard } from '@/components/tickets/generation/QuestionsWizard';
import { RepositorySelector } from '@/src/tickets/components/RepositorySelector';
import { BranchSelector } from '@/src/tickets/components/BranchSelector';
import { useAuthStore } from '@/stores/auth.store';
import { useServices } from '@/hooks/useServices';
import { Settings, ArrowRight } from 'lucide-react';

type WizardStep = 'context' | 'input';

export default function CreateTicketPage() {
  const router = useRouter();
  const { githubService } = useServices();
  const { 
    createTicket, 
    isCreating, 
    createError, 
    clearCreateError,
    selectedRepository,
    selectedBranch,
    validateUserInput,
    isValidating,
    validationError,
    clearValidationError
  } = useTicketsStore();
  
  const {
    githubConnected,
    selectedRepositories,
    loadGitHubStatus,
  } = useSettingsStore();
  
  const { user } = useAuthStore();
  
  // Workflow store for HITL interactions
  const {
    workflowState,
    subscribeToAEC,
    unsubscribeFromAEC,
    reset: resetWorkflow,
  } = useWorkflowStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('context');
  const [userInput, setUserInput] = useState('');
  const [createdAecId, setCreatedAecId] = useState<string | null>(null);
  const [showFindingsModal, setShowFindingsModal] = useState(false);
  const [showQuestionsWizard, setShowQuestionsWizard] = useState(false);

  // Load GitHub status on mount
  useEffect(() => {
    loadGitHubStatus(githubService);
    // Cleanup workflow store on unmount
    return () => {
      unsubscribeFromAEC();
      resetWorkflow();
    };
  }, []);

  // Watch workflowState for HITL suspension points
  useEffect(() => {
    if (workflowState === 'suspended-findings') {
      setShowFindingsModal(true);
    } else if (workflowState === 'suspended-questions') {
      setShowQuestionsWizard(true);
    } else if (workflowState === 'complete') {
      // Auto-navigate to ticket detail on completion
      if (createdAecId) {
        router.push(`/tickets/${createdAecId}`);
      }
    }
  }, [workflowState, createdAecId, router]);

  const handleNextStep = () => {
    if (currentStep === 'context') {
      setCurrentStep('input');
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'input') {
      setCurrentStep('context');
      clearValidationError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) return;

    clearCreateError();
    clearValidationError();

    console.log('🔍 [CreateTicketPage] Validating input:', userInput.trim());

    // Validate user input with AI agent
    const validation = await validateUserInput(userInput.trim());

    console.log('🔍 [CreateTicketPage] Validation result:', validation);

    if (!validation.isValid) {
      // Validation failed - error is already set in store
      console.log('❌ [CreateTicketPage] Validation failed, stopping creation');
      return;
    }

    console.log('✅ [CreateTicketPage] Validation passed, creating ticket');

    // Create ticket with validated input
    const aec = await createTicket(validation.processedInput, undefined);

    if (aec && user) {
      setCreatedAecId(aec.id);
      // Subscribe to workflow store for HITL updates
      const workspaceId = `ws_${user.uid.substring(0, 12)}`;
      subscribeToAEC(aec.id, workspaceId);
    }
  };

  const handleGenerationComplete = () => {
    console.log('🎉 [CreateTicketPage] User clicked View Ticket, navigating to detail');
    if (createdAecId) {
      router.push(`/tickets/${createdAecId}`);
    }
  };

  const handleFindingsModalClose = () => {
    setShowFindingsModal(false);
  };

  const handleQuestionsWizardClose = () => {
    setShowQuestionsWizard(false);
  };

  const handleCancel = () => {
    router.push('/tickets');
  };

  // Show generation progress after ticket created
  if (createdAecId && user) {
    const workspaceId = `ws_${user.uid.substring(0, 12)}`;
    
    return (
      <div className="mx-auto max-w-[var(--content-max)]">
        <div className="mb-8">
          <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
            Generating Ticket
          </h1>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            AI is analyzing your request and building an executable ticket
          </p>
        </div>

        <GenerationProgress
          aecId={createdAecId}
          workspaceId={workspaceId}
          onComplete={handleGenerationComplete}
          showContinueButton={true}
        />

        {/* HITL Suspension Point 1: Critical Findings Review */}
        <FindingsReviewModal
          isOpen={showFindingsModal}
          onClose={handleFindingsModalClose}
        />

        {/* HITL Suspension Point 2: Clarifying Questions */}
        <QuestionsWizard
          isOpen={showQuestionsWizard}
          onClose={handleQuestionsWizardClose}
        />
      </div>
    );
  }

  // Check if user has any indexed repositories
  const hasIndexedRepos = selectedRepositories.length > 0;

  return (
    <div className="mx-auto max-w-[var(--content-narrow)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
          Create Ticket
        </h1>
        <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
          {currentStep === 'context' 
            ? 'Select your project context'
            : 'Describe what you want to create'}
        </p>
      </div>

      {/* GitHub not connected warning */}
      {!githubConnected && (
        <div className="mb-6 p-4 border-l-[3px] border-l-[var(--amber)] bg-[var(--bg-subtle)] rounded">
          <div className="flex items-start gap-4">
            <Settings className="h-5 w-5 text-[var(--amber)] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-1">
                GitHub Not Connected
              </h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mb-3">
                Connect your GitHub account to enable code-aware ticket generation. This allows the AI to understand your codebase and create more accurate, contextual tickets.
              </p>
              <Link href="/settings">
                <Button size="sm" className="gap-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]">
                  <Settings className="h-4 w-4" />
                  Go to Settings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* No indexed repositories warning */}
      {githubConnected && !hasIndexedRepos && (
        <div className="mb-6 p-4 border-l-[3px] border-l-[var(--amber)] bg-[var(--bg-subtle)] rounded">
          <div className="flex items-start gap-4">
            <Settings className="h-5 w-5 text-[var(--amber)] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-1">
                No Repositories Indexed
              </h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mb-3">
                You need to select and index at least one repository to create code-aware tickets. Go to Settings to add repositories.
              </p>
              <Link href="/settings">
                <Button size="sm" className="gap-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]">
                  <Settings className="h-4 w-4" />
                  Go to Settings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`flex items-center gap-2 ${currentStep === 'context' ? 'text-[var(--text)]' : 'text-[var(--text-tertiary)]'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-xs)] font-medium ${currentStep === 'context' ? 'bg-[var(--primary)] text-[var(--text-button)]' : 'bg-[var(--border)]'}`}>
            1
          </div>
          <span className="text-[var(--text-sm)]">Context</span>
        </div>
        <div className="flex-1 h-px bg-[var(--border)]" />
        <div className={`flex items-center gap-2 ${currentStep === 'input' ? 'text-[var(--text)]' : 'text-[var(--text-tertiary)]'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-xs)] font-medium ${currentStep === 'input' ? 'bg-[var(--primary)] text-[var(--text-button)]' : 'bg-[var(--border)]'}`}>
            2
          </div>
          <span className="text-[var(--text-sm)]">Description</span>
        </div>
      </div>

      {/* Error messages */}
      {(createError || validationError) && (
        <div className="mb-6 p-4 border-l-[3px] border-l-[var(--red)] bg-[var(--bg-subtle)] rounded">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-[var(--text-sm)] font-medium text-[var(--red)]">
                {validationError ? 'Invalid Input' : 'Failed to create ticket'}
              </p>
              <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                {validationError || createError}
              </p>

              {/* Show helpful examples when validation fails */}
              {validationError && (
                <div className="mt-3 p-3 bg-[var(--bg)] rounded border-l-2 border-l-[var(--border)]">
                  <p className="text-[var(--text-xs)] font-medium text-[var(--text)] mb-2">
                    💡 Examples of good inputs:
                  </p>
                  <ul className="text-[var(--text-xs)] text-[var(--text-secondary)] space-y-1 list-disc list-inside">
                    <li>"Add user authentication with email and password, including password reset flow"</li>
                    <li>"Fix the bug where images fail to upload when file size exceeds 5MB"</li>
                    <li>"Create a dashboard page showing weekly user activity analytics"</li>
                    <li>"Refactor the payment processing module to use the new Stripe API"</li>
                  </ul>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearCreateError();
                clearValidationError();
              }}
              className="text-[var(--red)]"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="p-6 border border-[var(--border)] rounded-lg bg-[var(--bg)]">
        {/* Step 1: Context Selection */}
        {currentStep === 'context' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-1">
                Select Project Context
              </h3>
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-4">
                Choose a repository and branch for code-aware ticket generation
              </p>
            </div>
            <RepositorySelector />
            <BranchSelector />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleNextStep}
                disabled={!selectedRepository}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: User Input */}
        {currentStep === 'input' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="userInput"
                className="block text-[var(--text-sm)] font-medium text-[var(--text)] mb-2"
              >
                What do you want to create today?
              </label>
              <Textarea
                id="userInput"
                placeholder="E.g., Add user authentication with email and password, support password reset, and store user profiles in Firebase..."
                rows={8}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isCreating || isValidating}
                autoFocus
                className="resize-none"
              />
              <p className="mt-2 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                Describe your requirement in natural language. Our AI will validate and structure it into an executable ticket.
              </p>
            </div>

            {/* Show selected context */}
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
                Selected context:
              </p>
              <div className="flex items-center gap-2 text-[var(--text-sm)]">
                <span className="font-medium">{selectedRepository}</span>
                {selectedBranch && (
                  <>
                    <span className="text-[var(--text-tertiary)]">/</span>
                    <span className="text-[var(--text-secondary)]">{selectedBranch}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackStep}
                disabled={isCreating || isValidating}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={!userInput.trim() || isCreating || isValidating}
              >
                {isValidating ? 'Validating...' : isCreating ? 'Creating...' : 'Generate Ticket'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

