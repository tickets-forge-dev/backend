import { Injectable } from '@nestjs/common';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { UserUsageBudgetRepository } from '../../application/ports/UserUsageBudgetRepository';
import { UserUsageBudget } from '../../domain/usage/UserUsageBudget';
import { FirebaseService } from '../firebase/firebase.config';

const DEFAULT_TOKEN_LIMIT = 500_000;
const DEFAULT_DAILY_TICKET_LIMIT = 20;

@Injectable()
export class FirestoreUserUsageBudgetRepository implements UserUsageBudgetRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  private docRef(userId: string, month: string) {
    return this.getFirestore()
      .collection('users')
      .doc(userId)
      .collection('usage')
      .doc(month);
  }

  async getOrCreate(userId: string, month: string): Promise<UserUsageBudget> {
    const ref = this.docRef(userId, month);
    const snap = await ref.get();

    if (snap.exists) {
      return snap.data() as UserUsageBudget;
    }

    const today = new Date().toISOString().slice(0, 10);
    const budget: UserUsageBudget = {
      userId,
      month,
      tokensUsed: 0,
      tokenLimit: DEFAULT_TOKEN_LIMIT,
      ticketsCreatedToday: 0,
      dailyTicketLimit: DEFAULT_DAILY_TICKET_LIMIT,
      lastResetDate: today,
      subscriptionTier: 'free',
    };

    await ref.set(budget);
    return budget;
  }

  async incrementTokens(userId: string, month: string, tokens: number): Promise<UserUsageBudget> {
    const ref = this.docRef(userId, month);

    // Ensure doc exists
    await this.getOrCreate(userId, month);

    await ref.update({
      tokensUsed: FieldValue.increment(tokens),
    });

    const snap = await ref.get();
    return snap.data() as UserUsageBudget;
  }

  async incrementDailyTickets(userId: string, date: string): Promise<UserUsageBudget> {
    const month = date.slice(0, 7); // "2026-03-27" → "2026-03"
    const ref = this.docRef(userId, month);

    // Ensure doc exists
    const budget = await this.getOrCreate(userId, month);

    // Reset counter if lastResetDate !== today
    if (budget.lastResetDate !== date) {
      await ref.update({
        ticketsCreatedToday: 1,
        lastResetDate: date,
      });
    } else {
      await ref.update({
        ticketsCreatedToday: FieldValue.increment(1),
      });
    }

    const snap = await ref.get();
    return snap.data() as UserUsageBudget;
  }
}
