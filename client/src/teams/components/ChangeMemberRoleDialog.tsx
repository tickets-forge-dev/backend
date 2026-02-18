'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useTeamStore } from '../stores/team.store';
import type { TeamMember } from '../services/team.service';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';

interface ChangeMemberRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  teamId: string;
}

/**
 * ChangeMemberRoleDialog Component
 *
 * Confirmation dialog for changing member role:
 * - Shows current → new role
 * - Role dropdown (Developer, PM, QA)
 * - Warning if removing admin access
 */
export function ChangeMemberRoleDialog({
  open,
  onOpenChange,
  member,
  teamId,
}: ChangeMemberRoleDialogProps) {
  const [newRole, setNewRole] = useState<'developer' | 'pm' | 'qa'>(
    member.role === 'admin' ? 'developer' : (member.role as 'developer' | 'pm' | 'qa')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changeMemberRole } = useTeamStore();
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await changeMemberRole(teamId, member.userId, { role: newRole });

      toast({
        title: 'Role Updated',
        description: `${member.displayName || member.email}'s role has been changed to ${newRole}`,
      });

      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change member role';
      toast({
        title: 'Update Failed',
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
          <DialogTitle>Change Member Role</DialogTitle>
          <DialogDescription>
            Update the role for {member.displayName || member.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Role */}
          <div>
            <p className="text-sm text-[var(--text-muted)]">Current Role</p>
            <p className="mt-1 text-sm font-medium capitalize text-[var(--text)]">
              {member.role}
            </p>
          </div>

          {/* New Role Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="new-role">New Role</Label>
            <Select
              value={newRole}
              onValueChange={(value) => setNewRole(value as 'developer' | 'pm' | 'qa')}
              disabled={isSubmitting}
            >
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="pm">Product Manager</SelectItem>
                <SelectItem value="qa">QA Engineer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[var(--text-muted)]">
              {newRole === 'developer' && 'Can create and execute tickets'}
              {newRole === 'pm' && 'Can manage product requirements and approve work'}
              {newRole === 'qa' && 'Can test and validate ticket implementation'}
            </p>
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
          <Button onClick={handleSubmit} disabled={isSubmitting || newRole === member.role}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
