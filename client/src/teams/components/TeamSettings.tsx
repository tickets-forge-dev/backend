'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTeamStore } from '@/teams/stores/team.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { AlertCircle, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';

/**
 * TeamSettings Component
 *
 * Displays team settings with edit/delete capabilities.
 * Only owners can edit team name or delete the team.
 */
export function TeamSettings() {
  const router = useRouter();
  const { currentTeam, teams, isLoading, error, loadCurrentTeam, updateTeam, deleteTeam } =
    useTeamStore();

  const [teamName, setTeamName] = useState('');
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load team details on mount
  useEffect(() => {
    if (!currentTeam) {
      loadCurrentTeam();
    }
  }, [currentTeam, loadCurrentTeam]);

  // Sync form state with current team
  useEffect(() => {
    if (currentTeam) {
      setTeamName(currentTeam.name);
      setAllowMemberInvites(currentTeam.settings.allowMemberInvites);
    }
  }, [currentTeam]);

  const handleSave = async () => {
    if (!currentTeam) return;

    setSaveError(null);
    setIsSaving(true);

    try {
      await updateTeam(currentTeam.id, {
        name: teamName.trim(),
        settings: {
          ...currentTeam.settings,
          allowMemberInvites,
        },
      });
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTeam) return;

    setIsDeleting(true);
    try {
      await deleteTeam(currentTeam.id);
      setShowDeleteDialog(false);

      // Navigate to first team or tickets page
      const remainingTeams = teams.filter((t) => t.id !== currentTeam.id);
      if (remainingTeams.length > 0) {
        router.push(`/teams/${remainingTeams[0].id}`);
      } else {
        router.push('/tickets');
      }
    } catch (err) {
      console.error('Failed to delete team:', err);
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (currentTeam) {
      setTeamName(currentTeam.name);
      setAllowMemberInvites(currentTeam.settings.allowMemberInvites);
    }
    setIsEditing(false);
    setSaveError(null);
  };

  // Loading state
  if (isLoading && !currentTeam) {
    return (
      <div className="text-[12px] text-[var(--text-tertiary)]">
        Loading project settings...
      </div>
    );
  }

  // Error state
  if (error && !currentTeam) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-red-500">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  // No team state
  if (!currentTeam) {
    return (
      <div className="text-[12px] text-[var(--text-tertiary)]">
        No project selected. Please select a project from the sidebar.
      </div>
    );
  }

  const isOwner = currentTeam.isOwner;
  const hasChanges =
    teamName.trim() !== currentTeam.name ||
    allowMemberInvites !== currentTeam.settings.allowMemberInvites;

  return (
    <div className="space-y-6">
      {/* Team Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-medium text-[var(--text)]">
              {currentTeam.name}
            </h3>
            <Badge variant={isOwner ? 'default' : 'secondary'} className="text-[10px]">
              {isOwner ? 'Owner' : 'Member'}
            </Badge>
          </div>
          <p className="text-[12px] text-[var(--text-tertiary)]">
            /{currentTeam.slug}
          </p>
        </div>
        {isOwner && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Project
          </Button>
        )}
      </div>

      {/* Edit Form (Owner only) */}
      {isOwner && isEditing && (
        <div className="space-y-4 rounded-lg border border-[var(--border-subtle)] p-4 bg-[var(--bg-hover)]/30">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name">Project Name</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter project name"
              minLength={3}
              maxLength={50}
            />
            <p className="text-[11px] text-[var(--text-tertiary)]">
              3-50 characters. Slug will be auto-generated.
            </p>
          </div>

          {/* Allow Member Invites */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-invites">Allow Member Invites</Label>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Let project members invite others
              </p>
            </div>
            <input
              type="checkbox"
              id="allow-invites"
              checked={allowMemberInvites}
              onChange={(e) => setAllowMemberInvites(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="flex items-center gap-2 text-[12px] text-red-500">
              <AlertCircle className="h-4 w-4" />
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || teamName.trim().length < 3}
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={handleCancel} variant="ghost" size="sm" disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Read-only view (Member) */}
      {!isOwner && (
        <div className="rounded-lg border border-[var(--border-subtle)] p-4 bg-[var(--bg-hover)]/30">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Only project owners can edit project settings.
          </p>
        </div>
      )}

      {/* Danger Zone (Owner only) */}
      {isOwner && (
        <div className="space-y-4 rounded-lg border border-red-200 dark:border-red-900/30 p-4 bg-red-50 dark:bg-red-950/20">
          <div>
            <h3 className="text-[12px] font-medium text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
            <p className="mt-1 text-[11px] text-red-600/70 dark:text-red-400/70">
              Irreversible actions that affect your entire project
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{currentTeam.name}</strong>? This action
              cannot be undone. All project members will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
