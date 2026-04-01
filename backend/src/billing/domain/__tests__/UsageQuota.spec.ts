import { UsageQuota } from '../UsageQuota';

describe('UsageQuota', () => {
  describe('createDefault', () => {
    it('should create a free tier quota with 2 developments', () => {
      const quota = UsageQuota.createDefault('team-1', '2026-03');
      expect(quota.limit).toBe(2);
      expect(quota.used).toBe(0);
      expect(quota.remaining).toBe(2);
      expect(quota.period).toBe('2026-03');
      expect(quota.teamId).toBe('team-1');
    });
  });

  describe('createForPlan', () => {
    it('free: 2 developments', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'free').limit).toBe(2);
    });
    it('pro: 20 developments', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'pro').limit).toBe(20);
    });
    it('team: 50 developments', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'team').limit).toBe(50);
    });
    it('scale: 100 developments (fair use)', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'scale').limit).toBe(100);
    });
  });

  describe('canStartSession', () => {
    it('should return true when quota is available', () => {
      const quota = UsageQuota.createForPlan('team-1', '2026-03', 'pro');
      expect(quota.canStartSession()).toBe(true);
    });

    it('should return false when quota is exhausted', () => {
      const quota = UsageQuota.createDefault('team-1', '2026-03');
      quota.deduct();
      quota.deduct();
      expect(quota.canStartSession()).toBe(false);
    });
  });

  describe('deduct', () => {
    it('should decrement remaining count', () => {
      const quota = UsageQuota.createForPlan('team-1', '2026-03', 'pro');
      expect(quota.remaining).toBe(20);
      quota.deduct();
      expect(quota.remaining).toBe(19);
      expect(quota.used).toBe(1);
    });

    it('should throw when no quota remaining', () => {
      const quota = UsageQuota.createDefault('team-1', '2026-03');
      quota.deduct();
      quota.deduct();
      expect(() => quota.deduct()).toThrow('No development quota remaining');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from plain object', () => {
      const quota = UsageQuota.createForPlan('team-1', '2026-03', 'pro');
      quota.deduct();
      quota.deduct();
      quota.deduct();
      const plain = quota.toPlainObject();
      const restored = UsageQuota.reconstitute(plain as any);
      expect(restored.teamId).toBe('team-1');
      expect(restored.period).toBe('2026-03');
      expect(restored.limit).toBe(20);
      expect(restored.used).toBe(3);
      expect(restored.remaining).toBe(17);
    });
  });

  describe('remaining', () => {
    it('should never return negative', () => {
      const quota = UsageQuota.reconstitute({
        teamId: 'team-1', period: '2026-03', limit: 2, used: 5,
      });
      expect(quota.remaining).toBe(0);
    });
  });
});
