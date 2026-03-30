export type PlanTier = 'free' | 'pro' | 'team' | 'scale';

const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 99, // TODO: revert to 2 after testing
  pro: 20,
  team: 50,
  scale: 100,
};

export class UsageQuota {
  private constructor(
    private readonly _teamId: string,
    private readonly _period: string,
    private readonly _limit: number,
    private _used: number,
  ) {}

  static createDefault(teamId: string, period: string): UsageQuota {
    return new UsageQuota(teamId, period, PLAN_LIMITS.free, 0);
  }

  static createForPlan(teamId: string, period: string, plan: PlanTier): UsageQuota {
    return new UsageQuota(teamId, period, PLAN_LIMITS[plan], 0);
  }

  static reconstitute(props: {
    teamId: string;
    period: string;
    limit: number;
    used: number;
  }): UsageQuota {
    return new UsageQuota(props.teamId, props.period, props.limit, props.used);
  }

  canStartSession(): boolean {
    return this._used < this._limit;
  }

  deduct(): void {
    if (!this.canStartSession()) {
      throw new Error('No development quota remaining');
    }
    this._used += 1;
  }

  get teamId(): string { return this._teamId; }
  get period(): string { return this._period; }
  get limit(): number { return this._limit; }
  get used(): number { return this._used; }
  get remaining(): number { return Math.max(0, this._limit - this._used); }

  toPlainObject(): Record<string, unknown> {
    return {
      teamId: this._teamId,
      period: this._period,
      limit: this._limit,
      used: this._used,
    };
  }
}
