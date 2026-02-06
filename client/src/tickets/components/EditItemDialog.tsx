'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { Input } from '@/core/components/ui/input';
import { Loader2 } from 'lucide-react';

// Simple string edit (assumptions, constraints, steps, scope items)
interface StringEditState {
  mode: 'string';
  value: string;
  label: string;
}

// BDD acceptance criteria edit (given/when/then)
interface BDDEditState {
  mode: 'bdd';
  given: string;
  when: string;
  then: string;
  implementationNotes: string;
}

// File change edit (path + action)
interface FileChangeEditState {
  mode: 'fileChange';
  path: string;
  action: string;
}

export type EditState = StringEditState | BDDEditState | FileChangeEditState;

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editState: EditState | null;
  onSave: (editState: EditState) => void;
  isSaving?: boolean;
}

export function EditItemDialog({
  open,
  onOpenChange,
  editState,
  onSave,
  isSaving,
}: EditItemDialogProps) {
  const [local, setLocal] = useState<EditState | null>(null);

  useEffect(() => {
    if (editState) {
      setLocal({ ...editState } as EditState);
    }
  }, [editState]);

  if (!local) return null;

  const title =
    local.mode === 'string'
      ? `Edit ${local.label}`
      : local.mode === 'bdd'
      ? 'Edit Acceptance Criterion'
      : 'Edit File Change';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {local.mode === 'string' && (
            <Textarea
              value={local.value}
              onChange={(e) =>
                setLocal({ ...local, value: e.target.value })
              }
              rows={3}
              className="resize-none"
              autoFocus
            />
          )}

          {local.mode === 'bdd' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Given
                </label>
                <Textarea
                  value={local.given}
                  onChange={(e) => setLocal({ ...local, given: e.target.value })}
                  rows={2}
                  className="resize-none"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  When
                </label>
                <Textarea
                  value={local.when}
                  onChange={(e) => setLocal({ ...local, when: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Then
                </label>
                <Textarea
                  value={local.then}
                  onChange={(e) => setLocal({ ...local, then: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Notes (optional)
                </label>
                <Input
                  value={local.implementationNotes}
                  onChange={(e) =>
                    setLocal({ ...local, implementationNotes: e.target.value })
                  }
                  placeholder="Implementation notes..."
                />
              </div>
            </>
          )}

          {local.mode === 'fileChange' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Path
                </label>
                <Input
                  value={local.path}
                  onChange={(e) => setLocal({ ...local, path: e.target.value })}
                  className="font-mono"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Action
                </label>
                <select
                  value={local.action}
                  onChange={(e) =>
                    setLocal({ ...local, action: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="modify">Modify</option>
                  <option value="create">Create</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={() => onSave(local)} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
