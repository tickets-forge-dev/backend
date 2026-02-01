'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/core/components/ui/accordion';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { CheckCircle2, Circle, Loader2, XCircle, RefreshCw } from 'lucide-react';

interface GenerationStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
  details?: string;
  error?: string;
}

interface GenerationState {
  currentStep: number;
  steps: GenerationStep[];
}

interface GenerationProgressProps {
  aecId: string;
  workspaceId: string;
  onComplete?: () => void;
}

export function GenerationProgress({ aecId, workspaceId, onComplete }: GenerationProgressProps) {
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          
          // Check if all steps complete
          if (data.generationState?.steps?.every((s: GenerationStep) => s.status === 'complete')) {
            console.log('✅ [GenerationProgress] All steps complete!');
            onComplete?.();
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
  }, [aecId, workspaceId, onComplete]);

  const handleRetry = async (stepId: number) => {
    console.log('🔄 [GenerationProgress] Retry step:', stepId);
    // TODO: Call retry endpoint (Task 4)
    alert('Retry functionality coming in next task');
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[var(--text-lg)] font-medium text-[var(--text)]">
          Generation Progress
        </h2>
        <Badge variant="outline">
          Step {generationState.currentStep} of 8
        </Badge>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
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
                  </div>
                </div>
                <StepBadge status={step.status} />
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

              {step.details && !step.error && (
                <div className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                  <pre className="whitespace-pre-wrap break-words font-sans">
                    {formatDetails(step.details)}
                  </pre>
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
    case 'pending':
    default:
      return <Circle className="h-5 w-5 text-[var(--text-tertiary)]" />;
  }
}

function StepBadge({ status }: { status: GenerationStep['status'] }) {
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
  try {
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
}
