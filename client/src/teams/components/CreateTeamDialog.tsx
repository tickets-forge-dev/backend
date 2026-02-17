/**
 * Create Team Dialog Component
 *
 * Modal dialog for creating a new team with name validation.
 * - Form with single input: team name (3-50 chars)
 * - Client-side validation with error messages
 * - Calls teamStore.createTeam() on submit
 * - Auto-switches to new team on success
 * - Shows success/error toast notifications
 *
 * Part of: Story 1.10 - Create Team Dialog
 * Layer: Presentation (UI Component)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/core/components/ui/dialog';
import { useTeamStore } from '@/teams/stores/team.store';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTeamDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTeamDialog({ trigger, open, onOpenChange, onSuccess }: CreateTeamDialogProps) {
  const { createTeam } = useTeamStore();
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Use controlled open state if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : isDialogOpen;
  const setDialogOpen = onOpenChange || setIsDialogOpen;

  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Team name is required';
    }
    if (trimmed.length < 3) {
      return 'Team name must be at least 3 characters';
    }
    if (trimmed.length > 50) {
      return 'Team name must be less than 50 characters';
    }
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTeamName(value);
    // Clear validation error on input change
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleNameBlur = () => {
    // Validate on blur
    const error = validateName(teamName);
    setValidationError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submit
    const error = validateName(teamName);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsCreating(true);
    setValidationError(null);

    try {
      await createTeam(teamName.trim());

      // Success!
      toast.success('Team created! You are the Admin.');

      // Reset form and close dialog
      setTeamName('');
      setDialogOpen(false);

      // Call onSuccess callback if provided
      onSuccess?.();
    } catch (error) {
      // Error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to create team';
      toast.error(errorMessage);
      setValidationError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    // Reset form when dialog closes
    if (!open) {
      setTeamName('');
      setValidationError(null);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Create a new team to collaborate with others. You will be the team admin.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="teamName" className="text-[var(--text-sm)] font-medium text-[var(--text)]">
                Team Name
              </label>
              <Input
                id="teamName"
                placeholder="e.g., Engineering Team"
                value={teamName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                disabled={isCreating}
                className={validationError ? 'border-red-500' : ''}
                autoFocus
              />
              {validationError && (
                <p className="text-[var(--text-xs)] text-red-500 mt-1">{validationError}</p>
              )}
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                Must be 3-50 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !!validationError || !teamName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
