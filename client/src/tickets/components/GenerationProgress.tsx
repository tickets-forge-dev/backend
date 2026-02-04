'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/core/components/ui/accordion';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { CheckCircle2, Circle, Loader2, XCircle, RefreshCw, PauseCircle, AlertTriangle } from 'lucide-react';

interface GenerationStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed' | 'suspended';
  details?: string;
  error?: string;
  suspensionReason?: 'critical_findings' | 'questions';
}

interface Finding {
  id?: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

interface Question {
  id: string;
  text: string;
  type?: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required?: boolean;
}

interface GenerationState {
  currentStep: number;
  steps: GenerationStep[];
  suspendedAt?: string;
  findings?: Finding[];
  questions?: Question[];
}

interface GenerationProgressProps {
  aecId: string;
  workspaceId: string;
  onComplete?: () => void;
  onSuspendedFindings?: (findings: Finding[]) => void;
  onSuspendedQuestions?: (questions: Question[]) => void;
  showContinueButton?: boolean;
}

// Step count based on workflow mode
const LEGACY_STEP_COUNT = 8;
const HITL_STEP_COUNT = 12;

export function GenerationProgress({ 
  aecId, 
  workspaceId, 
  onComplete, 
  onSuspendedFindings,
  onSuspendedQuestions,
  showContinueButton = false 
}: GenerationProgressProps) {
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log('🔵 [GenerationProgress] Subscribing to AEC updates:', aecId);
    console.log('🔵 [GenerationProgress] WorkspaceId:', workspaceId);
    console.log('🔵 [GenerationProgress] Full path:', `workspaces/${workspaceId}/aecs/${aecId}`);

    // Subscribe to AEC document updates
    const aecRef = doc(firestore, `workspaces/${workspaceId}/aecs/${aecId}`);
    
    const unsubscribe = onSnapshot(
      aecRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('🔵 [GenerationProgress] AEC updated:', data.generationState);

          setGenerationState(data.generationState);

          const steps = data.generationState?.steps || [];
          const stepCount = steps.length;
          
          // Detect suspended state
          const suspendedStep = steps.find((s: GenerationStep) => s.status === 'suspended');
          if (suspendedStep) {
            setIsSuspended(true);
            setExpandedStep(`step-${suspendedStep.id}`);
            
            // Notify parent of suspension
            if (suspendedStep.suspensionReason === 'critical_findings' && onSuspendedFindings) {
              onSuspendedFindings(data.generationState?.findings || []);
            } else if (suspendedStep.suspensionReason === 'questions' && onSuspendedQuestions) {
              onSuspendedQuestions(data.generationState?.questions || []);
            }
            return;
          }
          
          setIsSuspended(false);

          // Check if all steps complete
          const allStepsComplete = steps.length > 0 && steps.every((s: GenerationStep) => s.status === 'complete');

          // Auto-expand the step that's currently in progress
          const inProgressStep = steps.find((s: GenerationStep) => s.status === 'in-progress');
          if (inProgressStep) {
            setExpandedStep(`step-${inProgressStep.id}`);
          }

          if (allStepsComplete) {
            console.log(`✅ [GenerationProgress] All ${stepCount} steps complete!`);
            setIsComplete(true);

            // Only auto-navigate if showContinueButton is false
            if (!showContinueButton) {
              onComplete?.();
            }
          }
        }
      },
      (err) => {
        console.error('❌ [GenerationProgress] Firestore error:', err);
        setError('Failed to load generation progress');
      }
    );

    return () => {
      console.log('🔴 [GenerationProgress] Unsubscribing from AEC updates');
      unsubscribe();
    };
  }, [aecId, workspaceId, onComplete, onSuspendedFindings, onSuspendedQuestions, showContinueButton]);

  const handleRetry = async (stepId: number) => {
    console.log('🔄 [GenerationProgress] Retry step:', stepId);
    // TODO: Call retry endpoint
    alert('Retry functionality coming soon');
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-[var(--red)] mx-auto mb-4" />
          <p className="text-[var(--text-base)] text-[var(--red)]">{error}</p>
        </div>
      </Card>
    );
  }

  if (!generationState) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4 animate-spin" />
          <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
            Initializing generation...
          </p>
        </div>
      </Card>
    );
  }

  const stepCount = generationState.steps.length;
  const isHITL = stepCount === HITL_STEP_COUNT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[var(--text-lg)] font-medium text-[var(--text)]">
          Generation Progress
        </h2>
        {isComplete ? (
          <Badge className="bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20">
            ✓ Complete
          </Badge>
        ) : isSuspended ? (
          <Badge className="bg-[var(--yellow)]/10 text-[var(--yellow)] border-[var(--yellow)]/20">
            ⏸ Action Required
          </Badge>
        ) : (
          <Badge variant="outline">
            Step {generationState.currentStep} of {stepCount}
          </Badge>
        )}
      </div>

      <Accordion
        type="single"
        collapsible
        className="space-y-3"
        value={expandedStep}
        onValueChange={setExpandedStep}
      >
        {generationState.steps.map((step) => (
          <AccordionItem
            key={step.id}
            value={`step-${step.id}`}
            className="border border-[var(--border)] rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[var(--bg-hover)]">
              <div className="flex items-center gap-3 flex-1">
                <StepIcon status={step.status} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                      {step.id}.
                    </span>
                    <span className="text-[var(--text-base)] text-[var(--text)]">
                      {step.title}
                    </span>
                    {/* Show suspension indicator for HITL steps */}
                    {isHITL && (step.id === 4 || step.id === 9) && step.status !== 'complete' && (
                      <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                        (may require input)
                      </span>
                    )}
                  </div>
                </div>
                <StepBadge status={step.status} suspensionReason={step.suspensionReason} />
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 py-3 bg-[var(--bg-subtle)] border-t border-[var(--border)]">
              {step.error && (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border border-[var(--red)]">
                    <p className="text-[var(--text-sm)] text-[var(--red)]">
                      {step.error}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRetry(step.id)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Step
                  </Button>
                </div>
              )}

              {step.status === 'suspended' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-[var(--yellow)]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-[var(--yellow)]" />
                    <span className="text-[var(--text-sm)] font-medium text-[var(--yellow)]">
                      {step.suspensionReason === 'critical_findings' 
                        ? 'Critical findings require your review'
                        : 'Clarifying questions need your input'}
                    </span>
                  </div>
                  <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                    {step.suspensionReason === 'critical_findings'
                      ? 'Review the findings and choose to proceed, edit, or cancel.'
                      : 'Answer the questions to improve ticket quality, or skip to continue.'}
                  </p>
                </div>
              )}

              {step.details && !step.error && step.status !== 'suspended' && (
                <div className="p-3 rounded bg-[var(--bg)] border border-[var(--border)]">
                  <p className="text-[var(--text-sm)] text-[var(--text-secondary)] whitespace-pre-wrap">
                    {formatDetails(step.details)}
                  </p>
                </div>
              )}

              {step.status === 'pending' && (
                <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] italic">
                  Waiting for previous steps to complete...
                </p>
              )}

              {step.status === 'in-progress' && !step.error && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--blue)]" />
                  <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                    Processing...
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Show Continue button when complete and showContinueButton prop is true */}
      {isComplete && showContinueButton && (
        <Card className="p-6 mt-6 bg-[var(--green)]/5 border-[var(--green)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-[var(--green)]" />
              <div>
                <h3 className="text-[var(--text-base)] font-medium text-[var(--text)]">
                  Ticket Generated Successfully
                </h3>
                <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-0.5">
                  Your executable ticket is ready to review
                </p>
              </div>
            </div>
            <Button onClick={onComplete} size="lg">
              View Ticket
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function StepIcon({ status }: { status: GenerationStep['status'] }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-5 w-5 text-[var(--green)]" />;
    case 'in-progress':
      return <Loader2 className="h-5 w-5 text-[var(--blue)] animate-spin" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-[var(--red)]" />;
    case 'suspended':
      return <PauseCircle className="h-5 w-5 text-[var(--yellow)]" />;
    case 'pending':
    default:
      return <Circle className="h-5 w-5 text-[var(--text-tertiary)]" />;
  }
}

function StepBadge({ status, suspensionReason }: { status: GenerationStep['status']; suspensionReason?: string }) {
  switch (status) {
    case 'complete':
      return (
        <Badge className="bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20">
          Complete
        </Badge>
      );
    case 'in-progress':
      return (
        <Badge className="bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/20">
          In Progress
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20">
          Failed
        </Badge>
      );
    case 'suspended':
      return (
        <Badge className="bg-[var(--yellow)]/10 text-[var(--yellow)] border-[var(--yellow)]/20">
          {suspensionReason === 'critical_findings' ? 'Review Required' : 'Input Required'}
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge variant="outline" className="text-[var(--text-tertiary)]">
          Pending
        </Badge>
      );
  }
}

function formatDetails(details: string): string {
  // If it's already human-readable, return as-is
  if (!details.startsWith('{') && !details.startsWith('[')) {
    return details;
  }

  try {
    const parsed = JSON.parse(details);
    
    // Convert common structures to readable format
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => `${idx + 1}. ${typeof item === 'object' ? JSON.stringify(item) : item}`).join('\n');
    }
    
    if (typeof parsed === 'object' && parsed !== null) {
      // Convert objects to key-value list
      return Object.entries(parsed)
        .map(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
          const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
          return `${capitalizedLabel}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`;
        })
        .join('\n');
    }
    
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
}
