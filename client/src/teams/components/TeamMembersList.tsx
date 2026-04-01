'use client';

import { useState } from 'react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Crown, Edit, Trash2, Loader2 } from 'lucide-react';
import type { TeamMember } from '../services/team.service';
import { ChangeMemberRoleDialog } from './ChangeMemberRoleDialog';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { getAuth } from 'firebase/auth';

interface TeamMembersListProps {
  members: TeamMember[];
  teamId: string;
  isOwner: boolean;
  isLoading: boolean;
}

/**
 * TeamMembersList Component
 *
 * Renders members table with:
 * - Avatar/Name column
 * - Email column
 * - Role badge (color-coded)
 * - Status badge (active/invited)
 * - Actions (edit role, remove) - owner only
 */
export function TeamMembersList({
  members,
  teamId,
  isOwner,
  isLoading,
}: TeamMembersListProps) {
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const currentUserId = getAuth().currentUser?.uid;

  const handleChangeRole = (member: TeamMember) => {
    setSelectedMember(member);
    setChangeRoleDialogOpen(true);
  };

  const handleRemove = (member: TeamMember) => {
    setSelectedMember(member);
    setRemoveDialogOpen(true);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/10 text-amber-500 border-transparent';
      case 'developer':
        return 'bg-violet-500/10 text-violet-500 border-transparent';
      case 'pm':
        return 'bg-blue-500/10 text-blue-500 border-transparent';
      case 'qa':
        return 'bg-emerald-500/10 text-emerald-500 border-transparent';
      default:
        return 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-transparent';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-500 border-transparent';
      case 'invited':
        return 'bg-amber-500/10 text-amber-500 border-transparent';
      case 'removed':
        return 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border-transparent';
      default:
        return 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border-transparent';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 p-8 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">No members to display</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)]">
        <table className="w-full">
          <thead className="bg-[var(--bg-hover)]/40">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">
                Status
              </th>
              {isOwner && (
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isAdmin = member.role === 'admin';
              const canEdit = isOwner && !isAdmin && !isCurrentUser;

              return (
                <tr
                  key={member.id}
                  className={
                    isAdmin
                      ? 'bg-amber-50/30 dark:bg-amber-950/20'
                      : 'bg-transparent'
                  }
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isAdmin && <Crown className="h-4 w-4 text-amber-600" />}
                      <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                        {member.displayName || 'Pending'}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-[var(--text-tertiary)]">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-[var(--text-tertiary)]">{member.email}</span>
                  </td>

                  {/* Role Badge */}
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`capitalize ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </Badge>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`capitalize ${getStatusBadgeClass(member.status)}`}>
                      {member.status}
                    </Badge>
                  </td>

                  {/* Actions */}
                  {isOwner && (
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangeRole(member)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(member)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs text-[var(--text-tertiary)]">—</span>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      {selectedMember && (
        <>
          <ChangeMemberRoleDialog
            open={changeRoleDialogOpen}
            onOpenChange={setChangeRoleDialogOpen}
            member={selectedMember}
            teamId={teamId}
          />
          <RemoveMemberDialog
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            member={selectedMember}
            teamId={teamId}
          />
        </>
      )}
    </>
  );
}
