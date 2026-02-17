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
import { Role, RoleHelper } from '../../domain/Role';
import { MemberStatus, MemberStatusHelper } from '../../domain/MemberStatus';

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
  invitedBy: string;
  invitedAt: Timestamp;
  joinedAt?: Timestamp;
  removedAt?: Timestamp;
}

export class TeamMemberMapper {
  /**
   * Convert domain entity to Firestore document
   */
  static toPersistence(member: TeamMember): FirestoreTeamMemberDoc {
    return {
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      email: member.email,
      displayName: member.displayName,
      role: RoleHelper.toString(member.role),
      status: MemberStatusHelper.toString(member.status),
      invitedBy: member.invitedBy,
      invitedAt: Timestamp.fromDate(member.invitedAt),
      joinedAt: member.joinedAt
        ? Timestamp.fromDate(member.joinedAt)
        : undefined,
      removedAt: member.removedAt
        ? Timestamp.fromDate(member.removedAt)
        : undefined,
    };
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
      invitedAt: doc.invitedAt.toDate(),
      joinedAt: doc.joinedAt?.toDate(),
      removedAt: doc.removedAt?.toDate(),
    });
  }
}
