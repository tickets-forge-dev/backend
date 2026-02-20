'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/core/components/ui/button';
import { useServices } from '@/services/index';
import { auth } from '@/lib/firebase';

type Role = 'admin' | 'developer' | 'pm' | 'qa';

const roleLabels: Record<Role, string> = {
  admin: '👑 Admin',
  developer: '💻 Developer',
  pm: '📋 Product Manager',
  qa: '🧪 QA Engineer',
};

const roleDescriptions: Record<Role, string> = {
  admin: 'Team owner with full permissions',
  developer: 'Build and execute tickets via CLI',
  pm: 'Create tickets and approve specs',
  qa: 'Test features and verify quality',
};

export function RoleSettings() {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [teamName, setTeamName] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current role
  useEffect(() => {
    loadCurrentRole();
  }, []);

  const loadCurrentRole = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/teams/me/member`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to load role');
      }

      const data = await response.json();
      console.log('Loaded member data:', data);
      setCurrentRole(data.role as Role);
      setSelectedRole(data.role as Role);
      setTeamName(data.teamName || '');
    } catch (err: any) {
      console.error('Failed to load role:', err);
      setError(err.message || 'Failed to load role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRole || selectedRole === currentRole) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/teams/me/member/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update role');
      }

      setCurrentRole(selectedRole);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update role:', err);
      setError(err.message || 'Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(currentRole);
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text)]" />
        Loading role...
      </div>
    );
  }

  if (!currentRole) {
    return (
      <div className="text-[var(--text-sm)] text-[var(--text-secondary)]">
        No role assigned
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Role Display */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
            Your Role
          </div>
          {!isEditing ? (
            <>
              <div className="text-[var(--text-base)] font-medium text-[var(--text)]">
                {roleLabels[currentRole]}
              </div>
              <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                {currentRole === 'admin'
                  ? `Admin of ${teamName} — Team owner with full permissions`
                  : roleDescriptions[currentRole]
                }
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              {/* Role selection buttons */}
              <div className="grid grid-cols-2 gap-2">
                {(['developer', 'pm', 'qa'] as Role[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    disabled={currentRole === 'admin'}
                    className={`
                      rounded-lg border-2 p-3 text-left transition-all
                      ${selectedRole === role
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]'
                      }
                      ${currentRole === 'admin' ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <div className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                      {roleLabels[role]}
                    </div>
                    <div className="mt-1 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                      {roleDescriptions[role]}
                    </div>
                  </button>
                ))}
              </div>

              {currentRole === 'admin' && (
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                  Admin role cannot be changed. Transfer ownership first.
                </p>
              )}
            </div>
          )}
        </div>

        {!isEditing && currentRole !== 'admin' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Change Role
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Save/Cancel buttons */}
      {isEditing && (
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedRole === currentRole || currentRole === 'admin'}
            size="sm"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
