'use client';

import { Suspense } from 'react';
import { usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { PRDInputForm } from '@/tickets/components/prd/PRDInputForm';
import { BreakdownReview } from '@/tickets/components/prd/BreakdownReview';
import { SuccessView } from '@/tickets/components/prd/SuccessView';

/**
 * PRD Breakdown Page
 *
 * Waves approach:
 * Step 1 (Input): User pastes PRD text and selects repository
 * Step 2 (Review): User reviews and edits breakdown before bulk creation
 * Step 3 (Success): Confirmation of created tickets
 */
export default function BreakdownPage() {
  const currentStep = usePRDBreakdownStore((s) => s.currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            PRD Breakdown
          </h1>
          <p className="text-slate-600">
            {currentStep === 'input' &&
              'Analyze your PRD and automatically create executable tickets'}
            {currentStep === 'review' &&
              'Review and refine your breakdown before creating tickets'}
            {currentStep === 'success' &&
              'Your tickets have been created successfully'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className={`h-2 w-24 rounded-full ${
              currentStep !== 'input' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
          />
          <span className="text-sm font-medium text-slate-600">
            {currentStep === 'input' && 'Step 1: Analyze PRD'}
            {currentStep === 'review' && 'Step 2: Review Breakdown'}
            {currentStep === 'success' && 'Step 3: Complete'}
          </span>
        </div>

        {/* Content */}
        <Suspense fallback={<div>Loading...</div>}>
          {currentStep === 'input' && <PRDInputForm />}
          {currentStep === 'review' && <BreakdownReview />}
          {currentStep === 'success' && <SuccessView />}
        </Suspense>
      </div>
    </div>
  );
}
