import { Session } from '../../domain/Session';

export interface SessionRepository {
  save(session: Session): Promise<void>;
  findById(sessionId: string, teamId: string): Promise<Session | null>;
  findActiveByTicket(ticketId: string, teamId: string): Promise<Session | null>;
  findActiveByUser(userId: string, teamId: string): Promise<Session[]>;
}

export const SESSION_REPOSITORY = Symbol('SessionRepository');
