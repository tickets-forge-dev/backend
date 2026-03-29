import { Injectable, Inject } from '@nestjs/common';
import { USAGE_QUOTA_REPOSITORY } from '../ports';
import type { UsageQuotaRepository } from '../ports/UsageQuotaRepository.port';

export interface GetQuotaCommand {
  teamId: string;
}

export interface QuotaResponse {
  remaining: number;
  limit: number;
  used: number;
  period: string;
  plan: string;
}

@Injectable()
export class GetQuotaUseCase {
  constructor(
    @Inject(USAGE_QUOTA_REPOSITORY) private readonly quotaRepository: UsageQuotaRepository,
  ) {}

  async execute(command: GetQuotaCommand): Promise<QuotaResponse> {
    const period = new Date().toISOString().slice(0, 7);
    const quota = await this.quotaRepository.getOrCreate(command.teamId, period);

    // Determine plan name from limit
    let plan = 'free';
    if (quota.limit >= 100) plan = 'scale';
    else if (quota.limit >= 50) plan = 'team';
    else if (quota.limit >= 20) plan = 'pro';

    return {
      remaining: quota.remaining,
      limit: quota.limit,
      used: quota.used,
      period: quota.period,
      plan,
    };
  }
}
