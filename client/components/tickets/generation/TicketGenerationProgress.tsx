/**
 * TicketGenerationProgress Component - Phase D
 * 
 * Shows step-by-step progress during ticket generation
 * Updates in real-time via Firestore subscription
 * Non-blocking - user can navigate away
 */

'use client';

import { useEffect } from 'react';
import { useWorkflowStore } from '@/src/stores/workflow.store';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

interface TicketGenerationProgressProps {
  aecId: string;
  workspaceId: string;
}

export function TicketGenerationProgress({ aecId, workspaceId }: TicketGenerationProgressProps) {
  const {
    workflowState,
    steps,
    currentStep,
    subscribeToAEC,
    unsubscribeFromAEC,
  } = useWorkflowStore();

  useEffect(() => {
    subscribeToAEC(aecId, workspaceId);
    return () => unsubscribeFromAEC();
  }, [aecId, workspaceId, subscribeToAEC, unsubscribeFromAEC]);

  const getStepIcon = (stepStatus: string, stepId: number) => {
    if (stepStatus === 'complete') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (stepStatus === 'failed') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    if (stepStatus === 'in-progress') {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    if (currentStep > stepId) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  const getStatusMessage = () => {
    switch (workflowState) {
      case 'generating':
        return 'Generating ticket...';
      case 'suspended-findings':
        return 'Waiting for your review';
      case 'suspended-questions':
        return 'Waiting for your answers';
      case 'complete':
        return 'Ticket generation complete';
      case 'failed':
        return 'Generation failed';
      default:
        return 'Ready to generate';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Generation Progress</h3>
        <span className="text-sm text-gray-500">{getStatusMessage()}</span>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getStepIcon(step.status, step.id)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-medium ${
                    step.status === 'complete'
                      ? 'text-gray-900'
                      : step.status === 'in-progress'
                      ? 'text-blue-600'
                      : step.status === 'failed'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>

                {step.status === 'complete' && (
                  <span className="text-xs text-gray-400">Done</span>
                )}
              </div>

              {step.details && (
                <p className="text-xs text-gray-500 mt-1">{step.details}</p>
              )}

              {step.error && (
                <p className="text-xs text-red-600 mt-1">{step.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {workflowState === 'generating' && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing step {currentStep} of {steps.length}...</span>
          </div>
        </div>
      )}

      {workflowState === 'complete' && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ticket ready for review</span>
          </div>
        </div>
      )}

      {workflowState === 'failed' && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="w-4 h-4" />
            <span>Generation failed. Please try again.</span>
          </div>
        </div>
      )}
    </div>
  );
}
