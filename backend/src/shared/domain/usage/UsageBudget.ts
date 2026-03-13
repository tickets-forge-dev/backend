export interface UsageBudget {
  teamId: string;
  month: string; // "2026-03"
  tokensUsed: number;
  tokenLimit: number; // default 500_000
  ticketsCreatedToday: number;
  dailyTicketLimit: number; // default 20
  lastResetDate: string; // "2026-03-13"
}
