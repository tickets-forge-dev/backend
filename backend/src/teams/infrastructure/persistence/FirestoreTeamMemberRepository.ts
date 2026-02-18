/**
 * FirestoreTeamMemberRepository
 *
 * Firestore implementation of TeamMemberRepository.
 * Stores team members at /teams/{teamId}/members/{userId}.
 *
 * Part of: Story 3.2 - TeamMember Repository
 * Layer: Infrastructure (Adapter)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { TeamMemberRepository } from '../../application/ports/TeamMemberRepository';
import { TeamMember } from '../../domain/TeamMember';
import { TeamMemberMapper, FirestoreTeamMemberDoc } from './TeamMemberMapper';

@Injectable()
export class FirestoreTeamMemberRepository extends TeamMemberRepository {
  private readonly logger = new Logger(FirestoreTeamMemberRepository.name);

  constructor(private readonly firestore: Firestore) {
    super();
  }

  /**
   * Helper to extract error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Save a new team member
   */
  async save(member: TeamMember): Promise<void> {
    try {
      const doc = TeamMemberMapper.toPersistence(member);
      const docRef = this.firestore
        .collection('teams')
        .doc(member.teamId)
        .collection('members')
        .doc(member.userId);

      await docRef.set(doc);

      this.logger.log(
        `Saved team member: ${member.userId} to team: ${member.teamId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save team member: ${member.userId} to team: ${member.teamId}`,
        error
      );
      throw new Error(`Failed to save team member: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Update an existing team member
   */
  async update(member: TeamMember): Promise<void> {
    try {
      const doc = TeamMemberMapper.toPersistence(member);
      const docRef = this.firestore
        .collection('teams')
        .doc(member.teamId)
        .collection('members')
        .doc(member.userId);

      await docRef.update(doc as any);

      this.logger.log(
        `Updated team member: ${member.userId} in team: ${member.teamId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update team member: ${member.userId} in team: ${member.teamId}`,
        error
      );
      throw new Error(`Failed to update team member: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Find all members of a team
   */
  async findByTeam(teamId: string): Promise<TeamMember[]> {
    try {
      const snapshot = await this.firestore
        .collection('teams')
        .doc(teamId)
        .collection('members')
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreTeamMemberDoc;
        return TeamMemberMapper.toDomain(data);
      });
    } catch (error) {
      this.logger.error(`Failed to find members for team: ${teamId}`, error);
      throw new Error(`Failed to find team members: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Find all teams a user is a member of
   */
  async findByUser(userId: string): Promise<TeamMember[]> {
    try {
      // Query all teams collections for this userId
      const teamsSnapshot = await this.firestore.collection('teams').get();

      if (teamsSnapshot.empty) {
        return [];
      }

      const members: TeamMember[] = [];

      // Check each team's members subcollection
      for (const teamDoc of teamsSnapshot.docs) {
        const memberDoc = await teamDoc.ref
          .collection('members')
          .doc(userId)
          .get();

        if (memberDoc.exists) {
          const data = memberDoc.data() as FirestoreTeamMemberDoc;
          members.push(TeamMemberMapper.toDomain(data));
        }
      }

      return members;
    } catch (error) {
      this.logger.error(`Failed to find teams for user: ${userId}`, error);
      throw new Error(`Failed to find user teams: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Find a specific team membership
   */
  async findByUserAndTeam(
    userId: string,
    teamId: string
  ): Promise<TeamMember | null> {
    try {
      const docRef = this.firestore
        .collection('teams')
        .doc(teamId)
        .collection('members')
        .doc(userId);

      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as FirestoreTeamMemberDoc;
      return TeamMemberMapper.toDomain(data);
    } catch (error) {
      this.logger.error(
        `Failed to find member: ${userId} in team: ${teamId}`,
        error
      );
      throw new Error(`Failed to find team member: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Delete a team member (hard delete)
   */
  async delete(teamId: string, userId: string): Promise<void> {
    try {
      const docRef = this.firestore
        .collection('teams')
        .doc(teamId)
        .collection('members')
        .doc(userId);

      await docRef.delete();

      this.logger.log(`Deleted member: ${userId} from team: ${teamId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete member: ${userId} from team: ${teamId}`,
        error
      );
      throw new Error(`Failed to delete team member: ${this.getErrorMessage(error)}`);
    }
  }
}
