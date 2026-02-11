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
import { parseCurlCommand } from '@/tickets/utils/parseCurlCommand';
import type { ApiCallDetailsSpec } from '@/types/question-refinement';

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

// Reproduction step edit (bug tickets)
interface ReproductionStepEditState {
  mode: 'reproductionStep';
  order: number;
  action: string;
  expectedBehavior: string;
  actualBehavior: string;
  apiCall?: ApiCallDetailsSpec;
  consoleLog: string;
  codeSnippet: string;
  notes: string;
  curlCommand: string; // Temp field for curl input
}

export type EditState = StringEditState | BDDEditState | FileChangeEditState | ApiEndpointEditState | TestCaseEditState | ReproductionStepEditState;

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editState: EditState | null;
  onSave: (editState: EditState) => void;
  isSaving?: boolean;
  onError?: (message: string) => void;
}

export function EditItemDialog({
  open,
  onOpenChange,
  editState,
  onSave,
  isSaving,
  onError,
}: EditItemDialogProps) {
  const [local, setLocal] = useState<EditState | null>(null);

  useEffect(() => {
    if (editState) {
      setLocal({ ...editState } as EditState);
    }
  }, [editState]);

  const handleSave = () => {
    if (!local) return;

    // Validate based on mode
    if (local.mode === 'reproductionStep') {
      // Validate required field: action
      if (!local.action || local.action.trim() === '') {
        onError?.('Action is required - please describe what the user does');
        return;
      }

      // Validate API call if present
      if (local.apiCall) {
        if (!local.apiCall.url || local.apiCall.url.trim() === '') {
          onError?.('API URL is required when API call is present');
          return;
        }

        // Validate status codes if present
        if (local.apiCall.expectedStatus !== undefined) {
          const status = local.apiCall.expectedStatus;
          if (status < 100 || status > 599 || !Number.isInteger(status)) {
            onError?.('Expected status must be a valid HTTP status code (100-599)');
            return;
          }
        }

        if (local.apiCall.actualStatus !== undefined) {
          const status = local.apiCall.actualStatus;
          if (status < 100 || status > 599 || !Number.isInteger(status)) {
            onError?.('Actual status must be a valid HTTP status code (100-599)');
            return;
          }
        }
      }
    }

    // Validation passed, save
    onSave(local);
  };

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
      : local.mode === 'reproductionStep'
      ? `Edit Reproduction Step ${local.order}`
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

          {local.mode === 'reproductionStep' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Action *
                </label>
                <Textarea
                  value={local.action}
                  onChange={(e) =>
                    setLocal({ ...local, action: e.target.value })
                  }
                  placeholder="Describe what the user does"
                  rows={2}
                  className="resize-none"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Expected Behavior
                </label>
                <Textarea
                  value={local.expectedBehavior}
                  onChange={(e) =>
                    setLocal({ ...local, expectedBehavior: e.target.value })
                  }
                  placeholder="What should happen"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Actual Behavior (Bug)
                </label>
                <Textarea
                  value={local.actualBehavior}
                  onChange={(e) =>
                    setLocal({ ...local, actualBehavior: e.target.value })
                  }
                  placeholder="What actually happens"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* API Call Section */}
              <div className="border-t pt-3">
                <button
                  onClick={() => {
                    if (!local.apiCall) {
                      setLocal({
                        ...local,
                        apiCall: { method: 'GET', url: '' },
                      });
                    } else {
                      setLocal({ ...local, apiCall: undefined, curlCommand: '' });
                    }
                  }}
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] bg-transparent border-0 cursor-pointer"
                >
                  {local.apiCall ? '📡 Edit API Call' : '+ Add API Call'}
                </button>

                {local.apiCall && (
                  <div className="space-y-3 mt-3 pl-3 border-l-2 border-[var(--border)]">
                    {/* Curl command paste */}
                    <div className="space-y-1.5">
                      <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                        Paste curl command (optional)
                      </label>
                      <div className="flex gap-2">
                        <Textarea
                          value={local.curlCommand}
                          onChange={(e) =>
                            setLocal({ ...local, curlCommand: e.target.value })
                          }
                          placeholder="curl -X POST https://api.example.com/tickets ..."
                          rows={2}
                          className="font-mono text-xs resize-none flex-1"
                        />
                        <Button
                          onClick={() => {
                            if (!local.curlCommand?.trim()) {
                              onError?.('Please paste a curl command first');
                              return;
                            }

                            try {
                              const parsed = parseCurlCommand(local.curlCommand);
                              // Method is validated by parseCurlCommand
                              setLocal({
                                ...local,
                                apiCall: {
                                  method: parsed.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
                                  url: parsed.url,
                                  headers: parsed.headers,
                                  body: parsed.body,
                                },
                              });
                            } catch (err) {
                              const message = err instanceof Error ? err.message : 'Failed to parse curl command';
                              onError?.(`Curl parsing error: ${message}`);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 h-fit"
                        >
                          Parse
                        </Button>
                      </div>
                    </div>

                    {/* Method & URL */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                          Method
                        </label>
                        <select
                          value={local.apiCall.method}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Validate against allowed methods
                            if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(value)) {
                              setLocal({
                                ...local,
                                apiCall: {
                                  ...local.apiCall!,
                                  method: value as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
                                },
                              });
                            }
                          }}
                          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                          <option value="HEAD">HEAD</option>
                          <option value="OPTIONS">OPTIONS</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                          URL
                        </label>
                        <Input
                          value={local.apiCall.url}
                          onChange={(e) =>
                            setLocal({
                              ...local,
                              apiCall: { ...local.apiCall!, url: e.target.value },
                            })
                          }
                          placeholder="/api/tickets/create"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>

                    {/* Headers */}
                    <div className="space-y-1.5">
                      <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                        Headers (JSON)
                      </label>
                      <Textarea
                        value={JSON.stringify(
                          local.apiCall.headers || {},
                          null,
                          2
                        )}
                        onChange={(e) => {
                          try {
                            const headers = JSON.parse(e.target.value);
                            setLocal({
                              ...local,
                              apiCall: { ...local.apiCall!, headers },
                            });
                          } catch {
                            // Allow invalid JSON while typing
                          }
                        }}
                        placeholder='{ "Authorization": "Bearer ..." }'
                        rows={3}
                        className="font-mono text-xs resize-none"
                      />
                    </div>

                    {/* Request Body */}
                    <div className="space-y-1.5">
                      <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                        Request Body
                      </label>
                      <Textarea
                        value={local.apiCall.body || ''}
                        onChange={(e) =>
                          setLocal({
                            ...local,
                            apiCall: { ...local.apiCall!, body: e.target.value },
                          })
                        }
                        placeholder='{ "title": "Test ticket" }'
                        rows={4}
                        className="font-mono text-xs resize-none"
                      />
                    </div>

                    {/* Status codes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                          Expected Status
                        </label>
                        <Input
                          type="number"
                          value={local.apiCall.expectedStatus || ''}
                          onChange={(e) =>
                            setLocal({
                              ...local,
                              apiCall: {
                                ...local.apiCall!,
                                expectedStatus: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            })
                          }
                          placeholder="200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                          Actual Status
                        </label>
                        <Input
                          type="number"
                          value={local.apiCall.actualStatus || ''}
                          onChange={(e) =>
                            setLocal({
                              ...local,
                              apiCall: {
                                ...local.apiCall!,
                                actualStatus: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            })
                          }
                          placeholder="500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Console Logs (optional)
                </label>
                <Textarea
                  value={local.consoleLog}
                  onChange={(e) =>
                    setLocal({ ...local, consoleLog: e.target.value })
                  }
                  placeholder="Error: Cannot read property 'id' of undefined..."
                  rows={3}
                  className="font-mono text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Code Snippet (optional)
                </label>
                <Textarea
                  value={local.codeSnippet}
                  onChange={(e) =>
                    setLocal({ ...local, codeSnippet: e.target.value })
                  }
                  placeholder="function create(user) { return {id: user.id} }"
                  rows={3}
                  className="font-mono text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
                  Notes (optional)
                </label>
                <Textarea
                  value={local.notes}
                  onChange={(e) => setLocal({ ...local, notes: e.target.value })}
                  placeholder="Additional context or troubleshooting info"
                  rows={2}
                  className="resize-none"
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
          <Button onClick={handleSave} disabled={isSaving}>
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
