'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTeamStore } from '@/teams/stores/team.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

/**
 * Team Settings Page
 *
 * Allows team owners to edit team name and delete their team.
 * Non-owners see read-only view.
 */
export default function TeamSettingsPage() {
  const router = useRouter();
  const { currentTeam, teams, isLoading, updateTeam, deleteTeam, loadTeams } = useTeamStore();

  const [teamName, setTeamName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load team data on mount
  useEffect(() => {
    if (!currentTeam) {
      loadTeams();
    } else {
      setTeamName(currentTeam.name);
    }
  }, [currentTeam, loadTeams]);

  // Access control: only owners can edit/delete
  const isOwner = currentTeam?.isOwner ?? false;

  const handleSave = async () => {
    if (!currentTeam || !teamName.trim()) return;

    setIsSaving(true);
    try {
      await updateTeam(currentTeam.id, { name: teamName.trim() });
      toast.success('Project name updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTeam) return;

    setIsDeleting(true);
    try {
      await deleteTeam(currentTeam.id);
      toast.success('Project deleted successfully');

      // Navigate based on remaining teams
      if (teams.length > 1) {
        // Team store auto-switches to first available team
        router.push('/');
      } else {
        // No teams left - redirect to home with prompt to create new team
        router.push('/');
        toast.info('Create a new project to get started');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading && !currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  // No team selected
  if (!currentTeam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-[var(--text-secondary)] mb-4">No project selected</p>
        <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
      </div>
    );
  }

  // Non-owner view (read-only)
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Project Settings</h1>
        <div className="space-y-6 bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border)]">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input value={currentTeam.name} disabled className="bg-[var(--bg-tertiary)]" />
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            Only project owners can modify project settings.
          </p>
        </div>
      </div>
    );
  }

  // Owner view (full access)
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Project Settings</h1>

      {/* Project Name Section */}
      <div className="space-y-6 bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border)] mb-6">
        <div className="space-y-2">
          <Label htmlFor="teamName">Project Name</Label>
          <Input
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter project name"
            disabled={isSaving}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || !teamName.trim() || teamName === currentTeam.name}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 bg-[var(--bg-secondary)] p-6 rounded-lg border border-red-500/30">
        <div>
          <h2 className="text-lg font-medium text-red-500 mb-1">Danger Zone</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Deleting your project is permanent and cannot be undone.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{currentTeam.name}</strong> and cannot be
                undone. All workspaces, tickets, and project data will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
