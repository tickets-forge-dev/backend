'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Badge } from '@/core/components/ui/badge';
import { CheckCircle2, Circle, Loader2, XCircle, AlertTriangle } from 'lucide-react';

interface GenerationStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed' | 'suspended';
  details?: string;
  error?: string;
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
  questions?: Question[];
}

interface GenerationProgressNewProps {
  aecId: string;
  workspaceId: string;
  onComplete?: () => void;
  onQuestionsReady?: (questions: Question[]) => void;
}

export function GenerationProgressNew({
  aecId,
  workspaceId,
  onComplete,
  onQuestionsReady,
}: GenerationProgressNewProps) {
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [startTime] = useState(Date.now());
  const TIMEOUT_MS = 120000; // 2 minutes timeout

  useEffect(() => {
    const aecRef = doc(firestore, `workspaces/${workspaceId}/aecs/${aecId}`);

    const unsubscribe = onSnapshot(
      aecRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const genState = data.generationState;
          setGenerationState(genState);

          const steps = genState?.steps || [];
          const allStepsComplete = steps.length > 0 && steps.every((s: GenerationStep) => s.status === 'complete');
          const hasFailedStep = steps.some((s: GenerationStep) => s.status === 'failed');

          if (allStepsComplete) {
            setIsComplete(true);
            if (data.generationState?.questions?.length > 0 && onQuestionsReady) {
              onQuestionsReady(data.generationState.questions);
            }
            onComplete?.();
          }

          if (hasFailedStep) {
            setIsFailed(true);
          }
        }
      }
    );

    // Timeout checker
    const timeoutChecker = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > TIMEOUT_MS && !isComplete && !isFailed) {
        setTimeoutReached(true);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(timeoutChecker);
    };
  }, [aecId, workspaceId, onComplete, onQuestionsReady, startTime, isComplete, isFailed]);

  const handleCancel = async () => {
    // TODO: Implement cancel workflow API call
    console.log('Cancel workflow:', aecId);
    // For now, just refresh the page or navigate back
    window.location.reload();
  };

  if (!generationState) {
    const elapsed = Date.now() - startTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);
    
    if (timeoutReached) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Workflow initialization timed out</span>
          </div>
          <p className="text-xs text-gray-500 text-center max-w-md">
            The workflow is taking longer than expected. This might be due to backend issues.
          </p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Cancel & Retry
          </button>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Initializing workflow...</span>
        </div>
        <div className="text-xs text-gray-400">
          {elapsedSeconds}s elapsed
        </div>
        {elapsedSeconds > 30 && (
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  const steps = generationState.steps || [];
  const currentStep = generationState.currentStep || 0;
  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
      {/* Header with progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Generating Ticket</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedSteps}/{totalSteps} steps complete
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm"
          >
            <div className="mt-0.5 flex-shrink-0">{getStepIcon(step.status)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900 dark:text-white">{step.title}</span>
                {step.status === 'in-progress' && (
                  <Badge className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 border-0">
                    Running
                  </Badge>
                )}
                {step.status === 'failed' && (
                  <Badge className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 border-0">
                    Failed
                  </Badge>
                )}
                {step.status === 'complete' && (
                  <Badge className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 border-0">
                    Done
                  </Badge>
                )}
              </div>
              {step.details && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{step.details}</p>
              )}
              {step.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  {step.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Messages */}
      {isComplete && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">✓ Ticket generation complete!</p>
        </div>
      )}

      {isFailed && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">⚠ Workflow failed. Please check details above.</p>
        </div>
      )}
    </div>
  );
}
