import { UsageQuota } from '../../domain/UsageQuota';

export interface UsageQuotaRepository {
  getOrCreate(teamId: string, period: string): Promise<UsageQuota>;
  save(quota: UsageQuota): Promise<void>;
}

export const USAGE_QUOTA_REPOSITORY = Symbol('UsageQuotaRepository');
