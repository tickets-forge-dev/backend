import { Injectable } from '@nestjs/common';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { UsageBudgetRepository } from '../../application/ports/UsageBudgetRepository';
import { UsageBudget } from '../../domain/usage/UsageBudget';
import { FirebaseService } from '../firebase/firebase.config';

const DEFAULT_TOKEN_LIMIT = 2_000_000;
const DEFAULT_DAILY_TICKET_LIMIT = 20;

@Injectable()
export class FirestoreUsageBudgetRepository implements UsageBudgetRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  private docRef(teamId: string, month: string) {
    return this.getFirestore()
      .collection('teams')
      .doc(teamId)
      .collection('usage')
      .doc(month);
  }

  async getOrCreate(teamId: string, month: string): Promise<UsageBudget> {
    const ref = this.docRef(teamId, month);
    const snap = await ref.get();

    if (snap.exists) {
      return snap.data() as UsageBudget;
    }

    const today = new Date().toISOString().slice(0, 10);
    const budget: UsageBudget = {
      teamId,
      month,
      tokensUsed: 0,
      tokenLimit: DEFAULT_TOKEN_LIMIT,
      ticketsCreatedToday: 0,
      dailyTicketLimit: DEFAULT_DAILY_TICKET_LIMIT,
      lastResetDate: today,
    };

    await ref.set(budget);
    return budget;
  }

  async incrementTokens(teamId: string, month: string, tokens: number): Promise<UsageBudget> {
    const ref = this.docRef(teamId, month);

    // Ensure doc exists
    await this.getOrCreate(teamId, month);

    await ref.update({
      tokensUsed: FieldValue.increment(tokens),
    });

    const snap = await ref.get();
    return snap.data() as UsageBudget;
  }

  async incrementDailyTickets(teamId: string, date: string): Promise<UsageBudget> {
    const month = date.slice(0, 7); // "2026-03-13" → "2026-03"
    const ref = this.docRef(teamId, month);

    // Ensure doc exists
    const budget = await this.getOrCreate(teamId, month);

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
    return snap.data() as UsageBudget;
  }
}
