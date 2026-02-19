'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { useTeamStore } from '../stores/team.store';
import type { TeamMember } from '../services/team.service';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  teamId: string;
}

/**
 * RemoveMemberDialog Component
 *
 * Confirmation dialog for removing team member:
 * - Shows member name/email
 * - Warning about permanent action
 * - Cancel + Remove buttons
 */
export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  teamId,
}: RemoveMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { removeMember } = useTeamStore();
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await removeMember(teamId, member.userId);

      toast({
        title: 'Member Removed',
        description: `${member.displayName || member.email} has been removed from the team`,
      });

      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      toast({
        title: 'Removal Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Remove Team Member
          </DialogTitle>
          <DialogDescription>
            This action will remove {member.displayName || member.email} from your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Info */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Member</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {member.displayName || 'Pending'} ({member.email})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Role</p>
                <p className="mt-1 text-sm capitalize text-[var(--text-muted)]">{member.role}</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="text-sm text-[var(--text-muted)]">
            <p>This member will:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Lose access to all team resources</li>
              <li>No longer see team tickets or workspaces</li>
              <li>Be able to be re-invited in the future</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
