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

// API endpoint edit
interface ApiEndpointEditState {
  mode: 'apiEndpoint';
  method: string;
  route: string;
  description: string;
  authentication: string;
  status: string;
  requestDto: string;
  responseDto: string;
  headers: string;
  requestBody: string;
}

// Test case edit
interface TestCaseEditState {
  mode: 'testCase';
  description: string;
  type: string;
  testFile: string;
  testName: string;
  action: string;
  assertion: string;
}

export type EditState = StringEditState | BDDEditState | FileChangeEditState | ApiEndpointEditState | TestCaseEditState;

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
      : local.mode === 'apiEndpoint'
      ? 'Edit API Endpoint'
      : local.mode === 'testCase'
      ? 'Edit Test Case'
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

          {local.mode === 'apiEndpoint' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                    Method
                  </label>
                  <select
                    value={local.method}
                    onChange={(e) => setLocal({ ...local, method: e.target.value })}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    autoFocus
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                    Status
                  </label>
                  <select
                    value={local.status}
                    onChange={(e) => setLocal({ ...local, status: e.target.value })}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="modified">Modified</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Route
                </label>
                <Input
                  value={local.route}
                  onChange={(e) => setLocal({ ...local, route: e.target.value })}
                  className="font-mono"
                  placeholder="/api/v1/resource/:id"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Description
                </label>
                <Textarea
                  value={local.description}
                  onChange={(e) => setLocal({ ...local, description: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                    Request DTO
                  </label>
                  <Input
                    value={local.requestDto}
                    onChange={(e) => setLocal({ ...local, requestDto: e.target.value })}
                    className="font-mono text-xs"
                    placeholder="CreateUserDto"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                    Response DTO
                  </label>
                  <Input
                    value={local.responseDto}
                    onChange={(e) => setLocal({ ...local, responseDto: e.target.value })}
                    className="font-mono text-xs"
                    placeholder="UserResponse"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Headers
                </label>
                <Textarea
                  value={local.headers}
                  onChange={(e) => setLocal({ ...local, headers: e.target.value })}
                  rows={2}
                  className="font-mono text-xs resize-none"
                  placeholder={"Content-Type: application/json\nAuthorization: Bearer <token>"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Request Body
                </label>
                <Textarea
                  value={local.requestBody}
                  onChange={(e) => setLocal({ ...local, requestBody: e.target.value })}
                  rows={3}
                  className="font-mono text-xs resize-none"
                  placeholder={'{ "name": "string", "email": "string" }'}
                />
              </div>
            </>
          )}

          {local.mode === 'testCase' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                    Type
                  </label>
                  <select
                    value={local.type}
                    onChange={(e) => setLocal({ ...local, type: e.target.value })}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    autoFocus
                  >
                    <option value="unit">Unit</option>
                    <option value="integration">Integration</option>
                    <option value="e2e">E2E</option>
                    <option value="edge-case">Edge Case</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                    Test File
                  </label>
                  <Input
                    value={local.testFile}
                    onChange={(e) => setLocal({ ...local, testFile: e.target.value })}
                    className="font-mono text-xs"
                    placeholder="path/to/test.spec.ts"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Description
                </label>
                <Textarea
                  value={local.description}
                  onChange={(e) => setLocal({ ...local, description: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Test Name
                </label>
                <Input
                  value={local.testName}
                  onChange={(e) => setLocal({ ...local, testName: e.target.value })}
                  placeholder="describe > it should ..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Action (Act)
                </label>
                <Input
                  value={local.action}
                  onChange={(e) => setLocal({ ...local, action: e.target.value })}
                  placeholder="Method or function call"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Assertion (Assert)
                </label>
                <Input
                  value={local.assertion}
                  onChange={(e) => setLocal({ ...local, assertion: e.target.value })}
                  placeholder="Expected outcome"
                />
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
