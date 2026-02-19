/**
 * TeamMemberRepository Port
 *
 * Port interface for team member persistence.
 * Defines operations for storing and retrieving team members.
 *
 * Part of: Story 3.2 - TeamMember Repository
 * Layer: Application (Port Interface)
 */

import { TeamMember } from '../../domain/TeamMember';

export abstract class TeamMemberRepository {
  /**
   * Save a new team member
   */
  abstract save(member: TeamMember): Promise<void>;

  /**
   * Update an existing team member
   */
  abstract update(member: TeamMember): Promise<void>;

  /**
   * Find all members of a team
   * @returns Array of TeamMember (empty if no members)
   */
  abstract findByTeam(teamId: string): Promise<TeamMember[]>;

  /**
   * Find all teams a user is a member of
   * @returns Array of TeamMember (empty if no memberships)
   */
  abstract findByUser(userId: string): Promise<TeamMember[]>;

  /**
   * Find a team member by ID
   * @returns TeamMember or null if not found
   */
  abstract findById(memberId: string): Promise<TeamMember | null>;

  /**
   * Find a specific team membership
   * @returns TeamMember or null if not found
   */
  abstract findByUserAndTeam(
    userId: string,
    teamId: string
  ): Promise<TeamMember | null>;

  /**
   * Delete a team member
   * Note: This is a hard delete. For soft delete, use TeamMember.remove() and update()
   */
  abstract delete(teamId: string, userId: string): Promise<void>;
}
