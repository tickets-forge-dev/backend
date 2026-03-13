import { UsageBudget } from '../../domain/usage/UsageBudget';

export const USAGE_BUDGET_REPOSITORY = Symbol('UsageBudgetRepository');

export interface UsageBudgetRepository {
  getOrCreate(teamId: string, month: string): Promise<UsageBudget>;
  incrementTokens(teamId: string, month: string, tokens: number): Promise<UsageBudget>;
  incrementDailyTickets(teamId: string, date: string): Promise<UsageBudget>;
}
