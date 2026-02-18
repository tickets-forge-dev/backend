/**
 * TeamMember Domain Entity
 *
 * Represents a team member with role and status.
 * Immutable entity with factory methods for state transitions.
 *
 * Lifecycle:
 * 1. createInvite() → Status: INVITED
 * 2. activate() → Status: ACTIVE (member accepts invite)
 * 3. remove() → Status: REMOVED (admin removes member)
 *
 * Part of: Story 3.1 - TeamMember Domain Model
 * Layer: Domain (Aggregate Root)
 */

import { Role, RoleHelper } from './Role';
import { MemberStatus, MemberStatusHelper } from './MemberStatus';

export interface TeamMemberProps {
  id: string;
  userId: string;
  teamId: string;
  email: string;
  displayName?: string;
  role: Role;
  status: MemberStatus;
  invitedBy?: string; // Optional - not set for active members (team owners)
  invitedAt?: Date; // Optional - not set for active members (team owners)
  joinedAt?: Date;
  removedAt?: Date;
}

export class TeamMember {
  private constructor(private readonly props: TeamMemberProps) {
    this.validate();
  }

  // ============================================================================
  // Factory Methods (State Creation)
  // ============================================================================

  /**
   * Create a new team member invite
   * Initial state: INVITED
   */
  static createInvite(
    userId: string,
    teamId: string,
    email: string,
    role: Role,
    invitedBy: string
  ): TeamMember {
    if (!userId || !userId.trim()) {
      throw new Error('User ID is required');
    }
    if (!teamId || !teamId.trim()) {
      throw new Error('Team ID is required');
    }
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    if (!invitedBy || !invitedBy.trim()) {
      throw new Error('InvitedBy user ID is required');
    }

    // Cannot invite as Admin (admins are created via team ownership)
    if (role === Role.ADMIN) {
      throw new Error('Cannot invite members with Admin role. Admins are team owners.');
    }

    return new TeamMember({
      id: `${teamId}_${userId}`, // Composite key
      userId,
      teamId,
      email: email.toLowerCase().trim(),
      role,
      status: MemberStatus.INVITED,
      invitedBy,
      invitedAt: new Date(),
    });
  }

  /**
   * Create an active team member (for team owners)
   * Initial state: ACTIVE
   */
  static createActive(
    userId: string,
    teamId: string,
    email: string,
    role: Role,
    displayName: string
  ): TeamMember {
    if (!userId || !userId.trim()) {
      throw new Error('User ID is required');
    }
    if (!teamId || !teamId.trim()) {
      throw new Error('Team ID is required');
    }
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    if (!displayName || !displayName.trim()) {
      throw new Error('Display name is required');
    }

    return new TeamMember({
      id: `${teamId}_${userId}`, // Composite key
      userId,
      teamId,
      email: email.toLowerCase().trim(),
      role,
      displayName: displayName.trim(),
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
    });
  }

  /**
   * Activate member (accept invite)
   * Transition: INVITED → ACTIVE
   */
  activate(displayName: string, userId?: string): TeamMember {
    if (this.props.status !== MemberStatus.INVITED) {
      throw new Error('Can only activate invited members');
    }

    if (!displayName || !displayName.trim()) {
      throw new Error('Display name is required for activation');
    }

    // When accepting an invite, update the temporary userId to the real Firebase UID
    const actualUserId = userId && userId.trim() ? userId.trim() : this.props.userId;

    return new TeamMember({
      ...this.props,
      userId: actualUserId,
      displayName: displayName.trim(),
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
    });
  }

  /**
   * Remove member from team
   * Transition: ACTIVE → REMOVED
   */
  remove(): TeamMember {
    if (this.props.status === MemberStatus.REMOVED) {
      throw new Error('Member is already removed');
    }

    if (this.props.role === Role.ADMIN) {
      throw new Error('Cannot remove admin members. Transfer ownership first.');
    }

    return new TeamMember({
      ...this.props,
      status: MemberStatus.REMOVED,
      removedAt: new Date(),
    });
  }

  /**
   * Change member role
   * Only active members can have role changed
   */
  changeRole(newRole: Role): TeamMember {
    if (this.props.status !== MemberStatus.ACTIVE) {
      throw new Error('Can only change role for active members');
    }

    if (this.props.role === Role.ADMIN) {
      throw new Error('Cannot change role of admin. Transfer ownership first.');
    }

    if (newRole === Role.ADMIN) {
      throw new Error('Cannot promote member to admin. Use team ownership transfer.');
    }

    if (this.props.role === newRole) {
      return this; // No change
    }

    return new TeamMember({
      ...this.props,
      role: newRole,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: TeamMemberProps): TeamMember {
    return new TeamMember(props);
  }

  // ============================================================================
  // Query Methods (Permissions)
  // ============================================================================

  isActive(): boolean {
    return MemberStatusHelper.isActive(this.props.status);
  }

  hasRole(role: Role): boolean {
    return this.props.role === role;
  }

  canExecuteTickets(): boolean {
    return this.isActive() && RoleHelper.canExecuteTickets(this.props.role);
  }

  canApproveTickets(): boolean {
    return this.isActive() && RoleHelper.canApproveTickets(this.props.role);
  }

  isAdmin(): boolean {
    return this.props.role === Role.ADMIN;
  }

  isPending(): boolean {
    return this.props.status === MemberStatus.INVITED;
  }

  isRemoved(): boolean {
    return this.props.status === MemberStatus.REMOVED;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get teamId(): string {
    return this.props.teamId;
  }

  get email(): string {
    return this.props.email;
  }

  get displayName(): string | undefined {
    return this.props.displayName;
  }

  get role(): Role {
    return this.props.role;
  }

  get status(): MemberStatus {
    return this.props.status;
  }

  get invitedBy(): string | undefined {
    return this.props.invitedBy;
  }

  get invitedAt(): Date | undefined {
    return this.props.invitedAt;
  }

  get joinedAt(): Date | undefined {
    return this.props.joinedAt;
  }

  get removedAt(): Date | undefined {
    return this.props.removedAt;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toObject(): TeamMemberProps {
    return {
      id: this.props.id,
      userId: this.props.userId,
      teamId: this.props.teamId,
      email: this.props.email,
      displayName: this.props.displayName,
      role: this.props.role,
      status: this.props.status,
      invitedBy: this.props.invitedBy,
      invitedAt: this.props.invitedAt,
      joinedAt: this.props.joinedAt,
      removedAt: this.props.removedAt,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private validate(): void {
    if (!this.props.id) {
      throw new Error('TeamMember ID is required');
    }
    if (!this.props.userId) {
      throw new Error('User ID is required');
    }
    if (!this.props.teamId) {
      throw new Error('Team ID is required');
    }
    if (!this.props.email) {
      throw new Error('Email is required');
    }
    if (!TeamMember.isValidEmail(this.props.email)) {
      throw new Error('Invalid email format');
    }
    if (!this.props.role) {
      throw new Error('Role is required');
    }
    if (!this.props.status) {
      throw new Error('Status is required');
    }
    if (!this.props.invitedBy) {
      throw new Error('InvitedBy is required');
    }
    if (!this.props.invitedAt) {
      throw new Error('InvitedAt is required');
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
