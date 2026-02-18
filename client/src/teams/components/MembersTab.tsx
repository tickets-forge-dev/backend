'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Plus } from 'lucide-react';
import { TeamMembersList } from './TeamMembersList';
import { InviteMemberDialog } from './InviteMemberDialog';
import { useTeamStore } from '../stores/team.store';

interface MembersTabProps {
  teamId: string;
}

/**
 * MembersTab Component
 *
 * Main members management tab with:
 * - Active members table
 * - Pending invites section
 * - Invite member button (admin only)
 */
export function MembersTab({ teamId }: MembersTabProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { currentTeam, teamMembers, isLoadingMembers } = useTeamStore();

  const activeMembers = teamMembers.filter((m) => m.status === 'active');
  const pendingInvites = teamMembers.filter((m) => m.status === 'invited');
  const isOwner = currentTeam?.isOwner || false;

  return (
    <div className="space-y-6">
      {/* Header + Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Team Members</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage team members and their roles
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={() => setInviteDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Active Members Table */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-[var(--text)]">
          Active Members ({activeMembers.length})
        </h4>
        <TeamMembersList
          members={activeMembers}
          teamId={teamId}
          isOwner={isOwner}
          isLoading={isLoadingMembers}
        />
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-[var(--text)]">
            Pending Invites ({pendingInvites.length})
          </h4>
          <TeamMembersList
            members={pendingInvites}
            teamId={teamId}
            isOwner={isOwner}
            isLoading={isLoadingMembers}
          />
        </div>
      )}

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={teamId}
      />
    </div>
  );
}
