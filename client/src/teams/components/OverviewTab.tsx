import { Crown, Users, Calendar } from 'lucide-react';
import type { Team } from '../services/team.service';
import { useTeamStore } from '../stores/team.store';

interface OverviewTabProps {
  team: Team;
}

/**
 * OverviewTab Component
 *
 * Displays team overview information:
 * - Team name, ID, owner badge
 * - Member count (active + pending)
 * - Created date
 */
export function OverviewTab({ team }: OverviewTabProps) {
  const { teamMembers } = useTeamStore();

  const activeMembers = teamMembers.filter((m) => m.status === 'active').length;
  const pendingInvites = teamMembers.filter((m) => m.status === 'invited').length;
  const createdDate = new Date(team.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Team Info Card */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 p-6">
        <div className="space-y-4">
          {/* Team Name + Owner Badge */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-[var(--text)]">{team.name}</h2>
            {team.isOwner && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                <Crown className="h-3 w-3" />
                Owner
              </span>
            )}
          </div>

          {/* Project ID */}
          <div>
            <p className="text-sm text-[var(--text-muted)]">Project ID</p>
            <p className="mt-1 font-mono text-sm text-[var(--text)]">{team.id}</p>
          </div>

          {/* Grid: Member Count + Created Date */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Member Count */}
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-soft)] p-4">
              <div className="rounded-full bg-[var(--primary)]/10 p-2">
                <Users className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Project Members</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
                  {activeMembers + pendingInvites}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {activeMembers} active, {pendingInvites} pending
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-soft)] p-4">
              <div className="rounded-full bg-[var(--primary)]/10 p-2">
                <Calendar className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Created</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{createdDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Slug */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 p-6">
        <div>
          <p className="text-sm font-medium text-[var(--text)]">Project Slug</p>
          <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">
            {team.slug}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Used in URLs and API requests to identify this project
          </p>
        </div>
      </div>
    </div>
  );
}
