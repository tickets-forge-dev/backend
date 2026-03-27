export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface UserUsageBudget {
  userId: string;
  month: string; // "2026-03"
  tokensUsed: number;
  tokenLimit: number; // default 500_000
  ticketsCreatedToday: number;
  dailyTicketLimit: number; // default 20
  lastResetDate: string; // "2026-03-27"
  subscriptionTier: SubscriptionTier;
}
