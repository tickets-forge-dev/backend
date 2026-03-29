import { UsageQuota } from '../../domain/UsageQuota';

export interface UsageQuotaDocument {
  teamId: string;
  period: string;
  limit: number;
  used: number;
}

export class UsageQuotaMapper {
  static toDomain(doc: UsageQuotaDocument): UsageQuota {
    return UsageQuota.reconstitute({
      teamId: doc.teamId,
      period: doc.period,
      limit: doc.limit,
      used: doc.used,
    });
  }

  static toFirestore(quota: UsageQuota): UsageQuotaDocument {
    return {
      teamId: quota.teamId,
      period: quota.period,
      limit: quota.limit,
      used: quota.used,
    };
  }
}
