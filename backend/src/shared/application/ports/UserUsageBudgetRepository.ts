import { UserUsageBudget } from '../../domain/usage/UserUsageBudget';

export const USER_USAGE_BUDGET_REPOSITORY = Symbol('UserUsageBudgetRepository');

export interface UserUsageBudgetRepository {
  getOrCreate(userId: string, month: string): Promise<UserUsageBudget>;
  incrementTokens(userId: string, month: string, tokens: number): Promise<UserUsageBudget>;
  incrementDailyTickets(userId: string, date: string): Promise<UserUsageBudget>;
}
