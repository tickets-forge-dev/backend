'use client';

import { BreakdownEpic } from '@/tickets/stores/prd-breakdown.store';
import { TicketCard } from './TicketCard';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * EpicGroup - Displays an epic and its stories
 *
 * Shows:
 * - Epic name, goal, FR coverage
 * - List of tickets in the epic
 * - Collapsible for large epics
 */
export function EpicGroup({ epic }: { epic: BreakdownEpic }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Epic header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 border-b border-slate-200 transition-colors"
      >
        <ChevronDown
          className={`w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5 transition-transform ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
        <div className="flex-1 text-left min-w-0">
          <h3 className="text-sm font-bold text-slate-900">
            Epic {epic.index}: {epic.name}
          </h3>
          <p className="text-xs text-slate-600 mt-1">{epic.goal}</p>
          {epic.functionalRequirements.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {epic.functionalRequirements.map((fr) => (
                <span
                  key={fr}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                >
                  {fr}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs font-semibold text-slate-600 flex-shrink-0 bg-white px-2 py-1 rounded border border-slate-200">
          {epic.stories.length} stories
        </span>
      </button>

      {/* Epic stories */}
      {isExpanded && (
        <div className="divide-y divide-slate-100">
          {epic.stories.map((ticket, index) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              index={index}
              epicIndex={epic.index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
