import { Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { UsageQuotaRepository } from '../../application/ports/UsageQuotaRepository.port';
import { UsageQuota } from '../../domain/UsageQuota';
import { UsageQuotaMapper, UsageQuotaDocument } from '../mappers/UsageQuotaMapper';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

@Injectable()
export class FirestoreUsageQuotaRepository implements UsageQuotaRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  async getOrCreate(teamId: string, period: string): Promise<UsageQuota> {
    const firestore = this.getFirestore();

    try {
      // Use 'session-quota' subcollection to avoid collision with existing
      // token-based usage documents at teams/{teamId}/usage/{period}
      const snap = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('session-quota')
        .doc(period)
        .get();

      if (snap.exists) {
        const rawData = snap.data();
        // Verify this is our session quota format (has 'limit' field)
        if (rawData && typeof rawData.limit === 'number') {
          return UsageQuotaMapper.toDomain(rawData as UsageQuotaDocument);
        }
      }

      const quota = UsageQuota.createDefault(teamId, period);
      await this.save(quota);
      return quota;
    } catch (error) {
      console.error(`[FirestoreUsageQuotaRepository] getOrCreate error:`, error);
      return UsageQuota.createDefault(teamId, period);
    }
  }

  async save(quota: UsageQuota): Promise<void> {
    const firestore = this.getFirestore();
    const doc = UsageQuotaMapper.toFirestore(quota);

    try {
      await firestore
        .collection('teams')
        .doc(quota.teamId)
        .collection('session-quota')
        .doc(quota.period)
        .set(doc as FirebaseFirestore.DocumentData, { merge: true });
    } catch (error) {
      console.error(`[FirestoreUsageQuotaRepository] save error:`, error);
      throw error;
    }
  }
}
