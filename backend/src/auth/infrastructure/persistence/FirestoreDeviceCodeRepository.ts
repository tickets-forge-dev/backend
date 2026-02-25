import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import * as crypto from 'crypto';

export type DeviceCodeStatus = 'pending' | 'authorized' | 'expired' | 'consumed';

export interface DeviceCodeRecord {
  deviceCode: string;
  userCode: string;
  customToken: string | null;
  status: DeviceCodeStatus;
  userId: string | null;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class FirestoreDeviceCodeRepository {
  private readonly COLLECTION = 'device_codes';
  private readonly TTL_SECONDS = 300; // 5 minutes

  constructor(private readonly firestore: Firestore) {}

  async create(): Promise<DeviceCodeRecord> {
    const deviceCode = crypto.randomBytes(16).toString('hex');
    const userCode = this.generateUserCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.TTL_SECONDS * 1000);

    const record: DeviceCodeRecord = {
      deviceCode,
      userCode,
      customToken: null,
      status: 'pending',
      userId: null,
      expiresAt,
      createdAt: now,
    };

    await this.firestore.collection(this.COLLECTION).doc(deviceCode).set({
      deviceCode,
      userCode,
      customToken: null,
      status: 'pending',
      userId: null,
      expiresAt,  // Firestore auto-converts Date → Timestamp
      createdAt: now,
    });

    return record;
  }

  async findByDeviceCode(deviceCode: string): Promise<DeviceCodeRecord | null> {
    const doc = await this.firestore
      .collection(this.COLLECTION)
      .doc(deviceCode)
      .get();

    if (!doc.exists) return null;

    return this.mapToRecord(doc.data()!);
  }

  async findByUserCode(userCode: string): Promise<DeviceCodeRecord | null> {
    const snapshot = await this.firestore
      .collection(this.COLLECTION)
      .where('userCode', '==', userCode.toUpperCase())
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return this.mapToRecord(snapshot.docs[0].data());
  }

  async authorize(deviceCode: string, userId: string, customToken: string): Promise<void> {
    await this.firestore.collection(this.COLLECTION).doc(deviceCode).update({
      status: 'authorized',
      userId,
      customToken,
    });
  }

  async markConsumed(deviceCode: string): Promise<void> {
    await this.firestore.collection(this.COLLECTION).doc(deviceCode).update({
      status: 'consumed',
      customToken: null, // clear token after use for security
    });
  }

  private generateUserCode(): string {
    // Exclude ambiguous chars (0/O, 1/I/L) for readability
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const part1 = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    const part2 = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    return `${part1}-${part2}`;
  }

  private mapToRecord(data: any): DeviceCodeRecord {
    return {
      deviceCode: data.deviceCode,
      userCode: data.userCode,
      customToken: data.customToken ?? null,
      status: data.status as DeviceCodeStatus,
      userId: data.userId ?? null,
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    };
  }
}
