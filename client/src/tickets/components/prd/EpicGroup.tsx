'use client';

import { BreakdownEpic, usePRDBreakdownStore } from '@/tickets/stores/prd-breakdown.store';
import { TicketCard } from './TicketCard';
import { AddTicketDialog } from './AddTicketDialog';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * EpicGroup - Displays an epic and its stories with drag & drop reordering
 *
 * Shows:
 * - Epic name, goal, FR coverage
 * - List of tickets in the epic
 * - Drag & drop support for reordering
 * - Collapsible for large epics
 */
export function EpicGroup({ epic }: { epic: BreakdownEpic }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [draggedItem, setDraggedItem] = useState<{ index: number; epicIndex: number } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const { reorderTickets } = usePRDBreakdownStore();

  const handleDragStart = (e: React.DragEvent, index: number, epicIndex: number) => {
    setDraggedItem({ index, epicIndex });
    e.dataTransfer?.setData('application/json', JSON.stringify({ index, epicIndex }));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDropIndex(null);

    if (!draggedItem) return;

    // Only allow reordering within the same epic
    if (draggedItem.epicIndex === epic.index && draggedItem.index !== targetIndex) {
      reorderTickets(epic.index, draggedItem.index, targetIndex);
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropIndex(null);
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ borderColor: 'var(--border)', borderWidth: '1px' }}
    >
      {/* Epic header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full flex items-start gap-4 p-4 hover:transition-colors cursor-pointer"
        style={{
          backgroundColor: 'var(--bg-hover)',
          borderBottomColor: 'var(--border)',
          borderBottomWidth: '1px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-active)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        }}
      >
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-transform ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`}
          style={{ color: 'var(--text-secondary)' }}
        />
        <div className="flex-1 text-left min-w-0">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            Epic {epic.index}: {epic.name}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{epic.goal}</p>
          {epic.functionalRequirements.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {epic.functionalRequirements.map((fr) => (
                <span
                  key={fr}
                  className="px-2 py-0.5 text-xs rounded"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: 'var(--blue)',
                  }}
                >
                  {fr}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-semibold px-2 py-1 rounded"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border)',
              borderWidth: '1px',
            }}
          >
            {epic.stories.length} stories
          </span>
          <AddTicketDialog epicIndex={epic.index} epicName={epic.name} />
        </div>
      </div>

      {/* Epic stories */}
      {isExpanded && (
        <div style={{ borderColor: 'var(--border)' }}>
          {epic.stories.map((ticket, index) => (
            <div
              key={`drop-zone-${ticket.id}`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                backgroundColor: dropIndex === index ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderLeftColor: dropIndex === index ? 'var(--blue)' : 'transparent',
                borderLeftWidth: dropIndex === index ? '2px' : '0px',
                borderBottomColor: 'var(--border)',
                borderBottomWidth: index < epic.stories.length - 1 ? '1px' : '0px',
              }}
            >
              <TicketCard
                ticket={ticket}
                index={index}
                epicIndex={epic.index}
                onDragStart={handleDragStart}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
