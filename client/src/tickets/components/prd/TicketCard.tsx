'use client';

import { useState } from 'react';
import {
  BreakdownTicket,
  usePRDBreakdownStore,
} from '@/tickets/stores/prd-breakdown.store';
import { Button } from '@/core/components/ui/button';
import { ChevronDown, Edit2, Trash2, GripVertical } from 'lucide-react';

/**
 * TicketCard - Individual ticket preview with drag support
 *
 * Displays:
 * - Title, description, type/priority badges
 * - Acceptance criteria (BDD format)
 * - Collapsible for details
 * - Edit/delete buttons
 * - Drag handle for reordering
 */
export function TicketCard({
  ticket,
  index,
  epicIndex,
  onDragStart,
}: {
  ticket: BreakdownTicket;
  index: number;
  epicIndex: number;
  onDragStart?: (e: React.DragEvent, index: number, epicIndex: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(e, index, epicIndex);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
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
      <div
        className="p-4 space-y-4"
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderLeftWidth: '4px',
          borderLeftColor: 'var(--blue)',
        }}
      >
        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Title</label>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
              borderWidth: '1px',
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select
              value={editedType}
              onChange={(e) => setEditedType(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                borderColor: 'var(--border)',
                borderWidth: '1px',
              }}
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Priority
            </label>
            <select
              value={editedPriority}
              onChange={(e) => setEditedPriority(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                borderColor: 'var(--border)',
                borderWidth: '1px',
              }}
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
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="p-4 transition-colors border-l-4 cursor-grab active:cursor-grabbing"
      style={{
        backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        borderLeftColor: isDragging ? 'var(--blue)' : 'transparent',
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          e.currentTarget.style.borderLeftColor = 'var(--blue)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderLeftColor = 'transparent';
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div className="cursor-grab active:cursor-grabbing mt-1" style={{ color: 'var(--text-tertiary)' }}>
          <GripVertical className="w-4 h-4" />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
            style={{ color: 'var(--text-tertiary)' }}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold break-words" style={{ color: 'var(--text)' }}>
                {ticket.epicIndex}.{ticket.storyIndex}: {ticket.title}
              </h4>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
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
              <span
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={{
                  backgroundColor: 'rgba(124, 58, 237, 0.2)',
                  color: 'var(--purple)',
                }}
              >
                {ticket.functionalRequirements.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div
          className="mt-4 ml-7 space-y-3 pt-3"
          style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}
        >
          {/* Acceptance criteria */}
          {ticket.acceptanceCriteria.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                ACCEPTANCE CRITERIA
              </p>
              <div className="space-y-2">
                {ticket.acceptanceCriteria.map((criterion, i) => (
                  <div
                    key={i}
                    className="text-xs space-y-1 p-2 rounded"
                    style={{
                      backgroundColor: 'var(--bg-hover)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <p><strong style={{ color: 'var(--blue)' }}>Given</strong> {criterion.given}</p>
                    <p><strong style={{ color: 'var(--amber)' }}>When</strong> {criterion.when}</p>
                    <p><strong style={{ color: 'var(--green)' }}>Then</strong> {criterion.then}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical notes */}
          {ticket.technicalNotes && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                TECHNICAL NOTES
              </p>
              <p
                className="text-xs p-2 rounded"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                }}
              >
                {ticket.technicalNotes}
              </p>
            </div>
          )}

          {/* Dependencies */}
          {ticket.blockedBy.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                BLOCKED BY
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Story {ticket.blockedBy.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
