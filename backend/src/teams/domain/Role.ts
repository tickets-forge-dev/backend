/**
 * Role Enum
 *
 * Defines team member roles with permission helpers.
 * - Admin: Full permissions (execute + approve)
 * - Developer: Can execute tickets (write code)
 * - PM: Can approve tickets (review specs)
 * - QA: View-only access
 *
 * Part of: Story 3.1 - TeamMember Domain Model
 * Layer: Domain (Value Object)
 */

export enum Role {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  PM = 'pm',
  QA = 'qa',
}

/**
 * Helper functions for role-based permissions
 */
export class RoleHelper {
  static isAdmin(role: Role): boolean {
    return role === Role.ADMIN;
  }

  static canExecuteTickets(role: Role): boolean {
    // Admin and Developer can execute tickets (write code)
    return role === Role.ADMIN || role === Role.DEVELOPER;
  }

  static canApproveTickets(role: Role): boolean {
    // Admin and PM can approve tickets (review specs)
    return role === Role.ADMIN || role === Role.PM;
  }

  static fromString(roleString: string): Role {
    const roleMap: Record<string, Role> = {
      admin: Role.ADMIN,
      developer: Role.DEVELOPER,
      pm: Role.PM,
      qa: Role.QA,
    };

    const role = roleMap[roleString.toLowerCase()];
    if (!role) {
      throw new Error(
        `Invalid role: ${roleString}. Must be one of: admin, developer, pm, qa`
      );
    }

    return role;
  }

  static toString(role: Role): string {
    return role;
  }

  static getAllRoles(): Role[] {
    return [Role.ADMIN, Role.DEVELOPER, Role.PM, Role.QA];
  }
}
