'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Plus, X } from 'lucide-react';
import { usePRDBreakdownStore, BDDCriterion } from '@/tickets/stores/prd-breakdown.store';

/**
 * AddTicketDialog - Modal to create a new ticket manually
 *
 * Allows user to:
 * - Enter title, description
 * - Select type and priority
 * - Add BDD acceptance criteria
 */
export function AddTicketDialog({ epicIndex, epicName }: { epicIndex: number; epicName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'feature' | 'bug' | 'task'>('feature');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [criteria, setCriteria] = useState<BDDCriterion[]>([
    { given: '', when: '', then: '' },
  ]);

  const { addTicket } = usePRDBreakdownStore();

  const handleAddCriteria = () => {
    setCriteria([...criteria, { given: '', when: '', then: '' }]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriteriaChange = (index: number, field: keyof BDDCriterion, value: string) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    const validCriteria = criteria.filter((c) => c.given && c.when && c.then);

    addTicket(epicIndex, {
      epicName,
      epicIndex,
      storyIndex: 0, // Will be set by store
      title,
      description,
      type,
      priority,
      acceptanceCriteria: validCriteria,
      functionalRequirements: [],
      blockedBy: [],
    });

    // Reset form
    setTitle('');
    setDescription('');
    setType('feature');
    setPriority('medium');
    setCriteria([{ given: '', when: '', then: '' }]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Ticket
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Add New Ticket</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., User authentication with email"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="User story: As a... I want... So that..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="task">Task</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-900">
                Acceptance Criteria (BDD)
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCriteria}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Criterion
              </Button>
            </div>

            <div className="space-y-3">
              {criteria.map((criterion, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div>
                    <input
                      type="text"
                      value={criterion.given}
                      onChange={(e) => handleCriteriaChange(idx, 'given', e.target.value)}
                      placeholder="Given (precondition)"
                      className="w-full px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={criterion.when}
                      onChange={(e) => handleCriteriaChange(idx, 'when', e.target.value)}
                      placeholder="When (action)"
                      className="w-full px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={criterion.then}
                      onChange={(e) => handleCriteriaChange(idx, 'then', e.target.value)}
                      placeholder="Then (expected outcome)"
                      className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {criteria.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCriteria(idx)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 p-6 border-t border-slate-200 bg-white">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Ticket</Button>
        </div>
      </div>
    </div>
  );
}
