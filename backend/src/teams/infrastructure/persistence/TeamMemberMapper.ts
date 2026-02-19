/**
 * TeamMemberMapper
 *
 * Maps between TeamMember domain entity and Firestore documents.
 * Handles type conversions (Date ↔ Timestamp, enum ↔ string).
 *
 * Part of: Story 3.2 - TeamMember Repository
 * Layer: Infrastructure (Mapper)
 */

import { Timestamp } from 'firebase-admin/firestore';
import { TeamMember } from '../../domain/TeamMember';
import { RoleHelper } from '../../domain/Role';
import { MemberStatusHelper } from '../../domain/MemberStatus';

/**
 * Firestore document structure
 */
export interface FirestoreTeamMemberDoc {
  id: string;
  userId: string;
  teamId: string;
  email: string;
  displayName?: string;
  role: string;
  status: string;
  invitedBy?: string; // Optional for active members (team owners)
  invitedAt?: Timestamp; // Optional for active members (team owners)
  joinedAt?: Timestamp;
  removedAt?: Timestamp;
}

export class TeamMemberMapper {
  /**
   * Convert domain entity to Firestore document
   * Excludes undefined values (Firestore doesn't allow undefined)
   */
  static toPersistence(member: TeamMember): FirestoreTeamMemberDoc {
    const doc: any = {
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      email: member.email,
      role: RoleHelper.toString(member.role),
      status: MemberStatusHelper.toString(member.status),
    };

    // Only include optional fields if they're defined
    if (member.displayName !== undefined) {
      doc.displayName = member.displayName;
    }
    if (member.invitedBy !== undefined) {
      doc.invitedBy = member.invitedBy;
    }
    if (member.invitedAt !== undefined) {
      doc.invitedAt = Timestamp.fromDate(member.invitedAt);
    }
    if (member.joinedAt !== undefined) {
      doc.joinedAt = Timestamp.fromDate(member.joinedAt);
    }
    if (member.removedAt !== undefined) {
      doc.removedAt = Timestamp.fromDate(member.removedAt);
    }

    return doc;
  }

  /**
   * Convert Firestore document to domain entity
   */
  static toDomain(doc: FirestoreTeamMemberDoc): TeamMember {
    return TeamMember.reconstitute({
      id: doc.id,
      userId: doc.userId,
      teamId: doc.teamId,
      email: doc.email,
      displayName: doc.displayName,
      role: RoleHelper.fromString(doc.role),
      status: MemberStatusHelper.fromString(doc.status),
      invitedBy: doc.invitedBy,
      invitedAt: doc.invitedAt?.toDate(),
      joinedAt: doc.joinedAt?.toDate(),
      removedAt: doc.removedAt?.toDate(),
    });
  }
}
