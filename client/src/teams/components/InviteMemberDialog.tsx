'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useTeamStore } from '../stores/team.store';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

/**
 * InviteMemberDialog Component
 *
 * Dialog for inviting new members:
 * - Email input with validation
 * - Role dropdown (Developer, PM, QA)
 * - Cancel + Send Invite buttons
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  teamId,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'developer' | 'pm' | 'qa'>('developer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { inviteMember } = useTeamStore();
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Validate email
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await inviteMember(teamId, { email, role });

      toast({
        title: 'Invite sent!',
      });

      // Reset form and close
      setEmail('');
      setRole('developer');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite member';
      const isPending = message.toLowerCase().includes('pending invitation');
      toast({
        title: isPending ? 'Already invited' : 'Invitation Failed',
        description: isPending ? `${email} already has a pending invite.` : message,
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
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They will receive an email with instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Role Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as 'developer' | 'pm' | 'qa')}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="pm">Product Manager</SelectItem>
                <SelectItem value="qa">QA Engineer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[var(--text-muted)]">
              {role === 'developer' && 'Can create and execute tickets'}
              {role === 'pm' && 'Can manage product requirements and approve work'}
              {role === 'qa' && 'Can test and validate ticket implementation'}
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
