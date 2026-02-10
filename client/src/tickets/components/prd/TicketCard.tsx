'use client';

import { useState } from 'react';
import {
  BreakdownTicket,
  usePRDBreakdownStore,
} from '@/tickets/stores/prd-breakdown.store';
import { Button } from '@/core/components/ui/button';
import { ChevronDown, Edit2, Trash2 } from 'lucide-react';

/**
 * TicketCard - Individual ticket preview
 *
 * Displays:
 * - Title, description, type/priority badges
 * - Acceptance criteria (BDD format)
 * - Collapsible for details
 * - Edit/delete buttons
 */
export function TicketCard({
  ticket,
  index,
  epicIndex,
}: {
  ticket: BreakdownTicket;
  index: number;
  epicIndex: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { updateTicket, deleteTicket } = usePRDBreakdownStore();

  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const [editedPriority, setEditedPriority] = useState(ticket.priority);
  const [editedType, setEditedType] = useState(ticket.type);

  const handleSaveEdit = () => {
    updateTicket(ticket.id, {
      title: editedTitle,
      priority: editedPriority,
      type: editedType,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(ticket.title);
    setEditedPriority(ticket.priority);
    setEditedType(ticket.type);
    setIsEditing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-green-100 text-green-700';
      case 'bug':
        return 'bg-red-100 text-red-700';
      case 'task':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Title</label>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Type</label>
            <select
              value={editedType}
              onChange={(e) => setEditedType(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Priority
            </label>
            <select
              value={editedPriority}
              onChange={(e) => setEditedPriority(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors border-l-4 border-transparent hover:border-blue-300">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1"
        >
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 break-words">
                {ticket.epicIndex}.{ticket.storyIndex}: {ticket.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {ticket.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTicket(ticket.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeColor(ticket.type)}`}>
              {ticket.type}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
            {ticket.functionalRequirements.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                {ticket.functionalRequirements.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-4 ml-7 space-y-3 border-t border-slate-100 pt-3">
          {/* Acceptance criteria */}
          {ticket.acceptanceCriteria.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                ACCEPTANCE CRITERIA
              </p>
              <div className="space-y-2">
                {ticket.acceptanceCriteria.map((criterion, i) => (
                  <div key={i} className="text-xs text-slate-700 space-y-1 bg-slate-50 p-2 rounded">
                    <p><strong className="text-blue-600">Given</strong> {criterion.given}</p>
                    <p><strong className="text-amber-600">When</strong> {criterion.when}</p>
                    <p><strong className="text-green-600">Then</strong> {criterion.then}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical notes */}
          {ticket.technicalNotes && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                TECHNICAL NOTES
              </p>
              <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded">
                {ticket.technicalNotes}
              </p>
            </div>
          )}

          {/* Dependencies */}
          {ticket.blockedBy.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">
                BLOCKED BY
              </p>
              <p className="text-xs text-slate-700">
                Story {ticket.blockedBy.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
