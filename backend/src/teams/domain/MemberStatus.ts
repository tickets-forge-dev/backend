/**
 * MemberStatus Enum
 *
 * Defines team member lifecycle states.
 * - Invited: Invite sent, not yet accepted
 * - Active: Member has accepted invite and joined team
 * - Removed: Member has been removed from team
 *
 * Part of: Story 3.1 - TeamMember Domain Model
 * Layer: Domain (Value Object)
 */

export enum MemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  REMOVED = 'removed',
}

/**
 * Helper functions for status checks
 */
export class MemberStatusHelper {
  static isActive(status: MemberStatus): boolean {
    return status === MemberStatus.ACTIVE;
  }

  static isPending(status: MemberStatus): boolean {
    return status === MemberStatus.INVITED;
  }

  static isRemoved(status: MemberStatus): boolean {
    return status === MemberStatus.REMOVED;
  }

  static fromString(statusString: string): MemberStatus {
    const statusMap: Record<string, MemberStatus> = {
      invited: MemberStatus.INVITED,
      active: MemberStatus.ACTIVE,
      removed: MemberStatus.REMOVED,
    };

    const status = statusMap[statusString.toLowerCase()];
    if (!status) {
      throw new Error(
        `Invalid member status: ${statusString}. Must be one of: invited, active, removed`
      );
    }

    return status;
  }

  static toString(status: MemberStatus): string {
    return status;
  }
}
