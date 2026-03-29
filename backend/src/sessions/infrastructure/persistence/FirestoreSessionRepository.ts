import { Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { SessionRepository } from '../../application/ports/SessionRepository.port';
import { Session } from '../../domain/Session';
import { SessionMapper, SessionDocument } from '../mappers/SessionMapper';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

@Injectable()
export class FirestoreSessionRepository implements SessionRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  async save(session: Session): Promise<void> {
    const firestore = this.getFirestore();
    const doc = SessionMapper.toFirestore(session);

    try {
      await firestore
        .collection('teams')
        .doc(session.teamId)
        .collection('sessions')
        .doc(session.id)
        .set(doc as FirebaseFirestore.DocumentData, { merge: true });
    } catch (error) {
      console.error(`[FirestoreSessionRepository] save error for ${session.id}:`, error);
      throw error;
    }
  }

  async findById(sessionId: string, teamId: string): Promise<Session | null> {
    const firestore = this.getFirestore();

    try {
      const snap = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('sessions')
        .doc(sessionId)
        .get();

      if (!snap.exists) return null;
      return SessionMapper.toDomain(snap.data() as SessionDocument);
    } catch (error) {
      console.error(`[FirestoreSessionRepository] findById error for ${sessionId}:`, error);
      return null;
    }
  }

  async findActiveByTicket(ticketId: string, teamId: string): Promise<Session | null> {
    const firestore = this.getFirestore();

    try {
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('sessions')
        .where('ticketId', '==', ticketId)
        .get();

      const activeStatuses = new Set(['provisioning', 'running']);
      const match = snapshot.docs
        .map(doc => SessionMapper.toDomain(doc.data() as SessionDocument))
        .find(session => activeStatuses.has(session.status));

      return match ?? null;
    } catch (error) {
      console.error(`[FirestoreSessionRepository] findActiveByTicket error:`, error);
      return null;
    }
  }

  async findActiveByUser(userId: string, teamId: string): Promise<Session[]> {
    const firestore = this.getFirestore();

    try {
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('sessions')
        .where('userId', '==', userId)
        .get();

      const activeStatuses = new Set(['provisioning', 'running']);
      return snapshot.docs
        .map(doc => SessionMapper.toDomain(doc.data() as SessionDocument))
        .filter(session => activeStatuses.has(session.status));
    } catch (error) {
      console.error(`[FirestoreSessionRepository] findActiveByUser error:`, error);
      return [];
    }
  }
}
