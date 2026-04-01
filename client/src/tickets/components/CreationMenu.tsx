'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/core/components/ui/button';
import { Plus, Bug, Lightbulb, ClipboardList } from 'lucide-react';

/**
 * CreationMenu - Entry point for ticket creation workflows.
 * Import options (Jira/Linear/File) are available inside the wizard's Import button.
 */
export function CreationMenu({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-2 border border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text)] hover:border-[var(--border-hover)]"
      >
        <Plus className="w-4 h-4 text-[var(--text-tertiary)]" />
        Create
      </Button>

      {/* Floating Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg shadow-lg dark:shadow-xl z-50">
          {/* Create Feature */}
          <button
            onClick={() => {
              router.push('/tickets/create?mode=new&type=feature');
              setIsOpen(false);
            }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors first:rounded-t-lg border-b border-[var(--border-subtle)] last:border-b-0"
          >
            <Lightbulb className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-sm text-[var(--text)]">Create Feature</p>
              <p className="text-xs text-[var(--text-secondary)]">New feature with analysis</p>
            </div>
          </button>

          {/* Create Bug */}
          <button
            onClick={() => {
              router.push('/tickets/create?mode=new&type=bug');
              setIsOpen(false);
            }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
          >
            <Bug className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-sm text-[var(--text)]">Create Bug Report</p>
              <p className="text-xs text-[var(--text-secondary)]">Bug with reproduction steps</p>
            </div>
          </button>

          {/* Create Task */}
          <button
            onClick={() => {
              router.push('/tickets/create?mode=new&type=task');
              setIsOpen(false);
            }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
          >
            <ClipboardList className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-sm text-[var(--text)]">Create Task</p>
              <p className="text-xs text-[var(--text-secondary)]">Task with requirements</p>
            </div>
          </button>

          {/* PRD Breakdown - hidden until feature is ready */}
        </div>
      )}
    </div>
  );
}
