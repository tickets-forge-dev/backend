'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { useTeamStore } from '@/teams/stores/team.store';
import { AlertCircle, Plus } from 'lucide-react';

interface CreateTeamDialogProps {
  /**
   * Render prop for custom trigger button.
   * If not provided, uses default "Create Team" button with Plus icon.
   */
  trigger?: React.ReactNode;
  /**
   * Callback after successful team creation.
   */
  onSuccess?: () => void;
}

/**
 * CreateTeamDialog Component
 *
 * Modal dialog for creating a new team.
 * Auto-switches to the newly created team on success.
 */
export function CreateTeamDialog({ trigger, onSuccess }: CreateTeamDialogProps) {
  const { createTeam } = useTeamStore();

  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (teamName.trim().length < 3) {
      setError('Team name must be at least 3 characters');
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      await createTeam(teamName.trim(), allowMemberInvites);

      // Success: reset and close
      setTeamName('');
      setAllowMemberInvites(true);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form on close
        setTeamName('');
        setAllowMemberInvites(true);
        setError(null);
      }
    }
  };

  const canCreate = teamName.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team to collaborate with others. You&apos;ll be the owner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="create-team-name">Team Name</Label>
            <Input
              id="create-team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Acme Engineering"
              minLength={3}
              maxLength={50}
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreate) {
                  handleCreate();
                }
              }}
            />
            <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
              3-50 characters. A URL-friendly slug will be auto-generated.
            </p>
          </div>

          {/* Allow Member Invites */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="create-allow-invites"
              checked={allowMemberInvites}
              onChange={(e) => setAllowMemberInvites(e.target.checked)}
              disabled={isCreating}
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            />
            <div className="space-y-0.5">
              <Label htmlFor="create-allow-invites">Allow members to invite others</Label>
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                When enabled, any team member can invite new members. Otherwise, only you (the
                owner) can invite.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950/20 p-3 text-[var(--text-sm)] text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate || isCreating}>
            {isCreating ? 'Creating...' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
