'use client';

import { useRouter } from 'next/navigation';
import { useServices } from '@/hooks/useServices';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/core/components/ui/button';
import { Plus, Upload, FileText } from 'lucide-react';

/**
 * CreationMenu - Unified entry point for all ticket creation workflows
 *
 * Shows a dropdown menu with three options:
 * 1. Create New Ticket - Single ticket with analysis
 * 2. Import from Jira/Linear - Import existing issue
 * 3. PRD Breakdown - Bulk create from PRD analysis
 */
export function CreationMenu({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const { jiraService, linearService } = useServices();
  const [isOpen, setIsOpen] = useState(false);
  const [hasImportOptions, setHasImportOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load import availability
  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const [jiraStatus, linearStatus] = await Promise.all([
        jiraService.getConnectionStatus(),
        linearService.getConnectionStatus(),
      ]);
      setHasImportOptions(jiraStatus.connected || linearStatus.connected);
    } catch (err) {
      console.error('Failed to load platform availability', err);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Create Button */}
      <Button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create
      </Button>

      {/* Floating Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-xl z-50">
          {/* Create New Ticket */}
          <button
            onClick={() => {
              router.push('/tickets/create?mode=new');
              setIsOpen(false);
            }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-lg border-b border-slate-100 dark:border-slate-700 last:border-b-0"
          >
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">Create New Ticket</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Single ticket with deep analysis</p>
            </div>
          </button>

          {/* Import from Jira/Linear */}
          {hasImportOptions && (
            <button
              onClick={() => {
                router.push('/tickets/create?mode=import');
                setIsOpen(false);
              }}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
            >
              <Upload className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">Import Ticket</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">From Jira or Linear issue</p>
              </div>
            </button>
          )}

          {/* PRD Breakdown */}
          <button
            onClick={() => {
              router.push('/tickets/breakdown');
              setIsOpen(false);
            }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-b-lg"
          >
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">PRD Breakdown</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Bulk create from PRD analysis</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
