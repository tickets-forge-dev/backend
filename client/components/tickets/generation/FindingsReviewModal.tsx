/**
 * FindingsReviewModal Component - Phase D
 * 
 * HITL Suspension Point 1: Review critical findings
 * Actions: Proceed / Edit / Cancel
 */

'use client';

import { useState } from 'react';
import { useWorkflowStore, type Finding } from '../../../store/workflowStore';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';

interface FindingsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FindingsReviewModal({ isOpen, onClose }: FindingsReviewModalProps) {
  const { findings, resumeWorkflow, setWorkflowState } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'proceed' | 'edit' | 'cancel' | null>(null);

  if (!isOpen) return null;

  const criticalFindings = findings.filter((f) => f.severity === 'critical');
  const highFindings = findings.filter((f) => f.severity === 'high');
  const otherFindings = findings.filter(
    (f) => f.severity !== 'critical' && f.severity !== 'high'
  );

  const getSeverityIcon = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: Finding['severity']) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity]}`}
      >
        {severity.toUpperCase()}
      </span>
    );
  };

  const handleAction = async (action: 'proceed' | 'edit' | 'cancel') => {
    setIsLoading(true);
    setSelectedAction(action);

    try {
      await resumeWorkflow(action);

      if (action === 'proceed') {
        setWorkflowState('generating');
        onClose();
      } else if (action === 'edit') {
        setWorkflowState('idle');
        onClose();
        // User returns to edit form
      } else if (action === 'cancel') {
        setWorkflowState('idle');
        onClose();
        // Ticket generation cancelled
      }
    } catch (error) {
      console.error('Failed to resume workflow:', error);
      // Error state handled in store
    } finally {
      setIsLoading(false);
      setSelectedAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Review Findings
                  </h2>
                  <p className="text-sm text-gray-600">
                    {criticalFindings.length > 0
                      ? `${criticalFindings.length} critical issue${
                          criticalFindings.length > 1 ? 's' : ''
                        } found`
                      : 'Potential issues detected'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {criticalFindings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Critical Issues
                </h3>
                <div className="space-y-3">
                  {criticalFindings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </div>
              </div>
            )}

            {highFindings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  High Priority Issues
                </h3>
                <div className="space-y-3">
                  {highFindings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </div>
              </div>
            )}

            {otherFindings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Other Issues
                </h3>
                <div className="space-y-3">
                  {otherFindings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                What would you like to do?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('cancel')}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction('edit')}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Edit Ticket
                </button>
                <button
                  onClick={() => handleAction('proceed')}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && selectedAction === 'proceed' && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const getSeverityIcon = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 ${getSeverityColor(finding.severity)}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(finding.severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {finding.category}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              {Math.round(finding.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-2">
            {finding.description}
          </p>
          {finding.codeLocation && (
            <p className="text-xs text-gray-600 mb-2 font-mono">
              {finding.codeLocation}
            </p>
          )}
          <div className="bg-white rounded px-3 py-2 border border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-1">
              Suggestion:
            </p>
            <p className="text-xs text-gray-600">{finding.suggestion}</p>
          </div>
          {finding.evidence && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Evidence: {finding.evidence}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
