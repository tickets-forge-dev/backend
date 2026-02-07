# Epic 21: Repository Analysis Caching Optimization

**Status:** Planned (post-Task #2)
**Priority:** High (Easy ROI)
**Effort:** 4 days
**Impact:** 50-90% speed improvement for returning users

---

## Problem

Currently, every repository analysis (fingerprinting + deep analysis) runs full Pass 1 → Pass 2 → Pass 3 pipeline:
- **First analysis:** 5-10 seconds
- **Re-analyzing same repo:** Still 5-10 seconds (no caching)

Users analyzing the same repos multiple times waste time repeating identical work.

---

## Solution: Hybrid Fingerprint Caching

Combine in-memory cache (hot) + Firestore cache (persistent) for maximum performance with zero infrastructure changes.

### Architecture

```
Request for repo analysis
  ↓
Check memory cache (instant, <1ms)
  ├─ HIT → Return cached fingerprint (FAST PATH)
  └─ MISS → Check Firestore cache (50-100ms)
     ├─ HIT → Return + restore to memory (WARM PATH)
     └─ MISS → Run full Pass 1-3 analysis (COLD PATH)
  ↓
Store result in both caches
  ├─ Memory: 1 hour TTL
  └─ Firestore: 24 hours TTL
```

### Performance Impact

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| First analysis (new repo) | 5-10s | 5-10s | None |
| Hot cache (in last hour) | 5-10s | **<500ms** | ⚡ 10-20x faster |
| Warm cache (Firestore) | 5-10s | **3-4s** | ⚡ 2-3x faster |
| Cache hit rate (typical) | 0% | ~60% | ✅ Faster for most users |

---

## Implementation Plan

### Story 21-1: Create HybridFingerprintCache Service

**Files:**
- `backend/src/tickets/application/services/HybridFingerprintCache.ts` (NEW)
- `backend/src/tickets/application/ports/FingerprintCachePort.ts` (NEW)

**Code:**
```typescript
@Injectable()
export class HybridFingerprintCache {
  private memoryCache = new Map<string, { data: any; expiresAt: number }>();
  private readonly MEMORY_TTL = 60 * 60 * 1000; // 1 hour
  private readonly FIRESTORE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private firestore: FirebaseAdmin) {}

  // Get from memory first, fall back to Firestore
  async get(repoId: string): Promise<any | null> {
    // Try memory (fast path)
    const memEntry = this.memoryCache.get(repoId);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.data;
    }

    // Try Firestore (warm path)
    const fsDoc = await this.firestore
      .firestore()
      .collection('fingerprints')
      .doc(repoId)
      .get();

    if (fsDoc.exists) {
      const data = fsDoc.data();
      if (data.expiresAt.toDate() > new Date()) {
        // Restore to memory
        this.memoryCache.set(repoId, {
          data: data.fingerprint,
          expiresAt: Date.now() + this.MEMORY_TTL,
        });
        return data.fingerprint;
      }
      // Expired, delete it
      await fsDoc.ref.delete();
    }

    return null;
  }

  // Write to both caches
  async set(repoId: string, fingerprint: any): Promise<void> {
    // Memory cache
    this.memoryCache.set(repoId, {
      data: fingerprint,
      expiresAt: Date.now() + this.MEMORY_TTL,
    });

    // Firestore cache (persistent)
    await this.firestore
      .firestore()
      .collection('fingerprints')
      .doc(repoId)
      .set({
        fingerprint,
        expiresAt: new Date(Date.now() + this.FIRESTORE_TTL),
        cachedAt: new Date(),
      });
  }

  // Clean up expired memory entries
  @Cron('0 */30 * * * *') // Every 30 minutes
  cleanExpiredMemory() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}
```

**Effort:** 1 day
**Tests:** Unit tests for get/set/expiration logic

---

### Story 21-2: Integrate Cache into DeepAnalysisService

**Files:**
- `backend/src/tickets/application/services/DeepAnalysisServiceImpl.ts` (MODIFY)
- `backend/src/tickets/tickets.module.ts` (MODIFY)

**Changes:**
1. Inject `HybridFingerprintCache` into `DeepAnalysisServiceImpl`
2. Check cache before Pass 1 fingerprinting
3. Store result after Pass 1 completes
4. Add cache metrics (hit/miss rate)

```typescript
// In DeepAnalysisServiceImpl.analyze()
const cacheKey = `${owner}/${repo}#${branch}`;

// Check cache first
const cached = await this.cache.get(cacheKey);
if (cached) {
  console.log(`📦 Cache HIT: ${cacheKey}`);
  return cached;
}

// Run analysis if not cached
const result = await this.performAnalysis(...);

// Store in cache
await this.cache.set(cacheKey, result);

return result;
```

**Effort:** 1 day
**Tests:** Integration tests with cache scenarios

---

### Story 21-3: Setup Firestore TTL Policy

**Files:**
- `docs/FIRESTORE-TTL-POLICY.md` (NEW)

**Steps:**
1. Create Firestore TTL policy on `fingerprints` collection
2. Set TTL field: `expiresAt` (24 hours)
3. Document in deployment guides

**Note:** Firestore TTL automatically deletes expired docs (no manual cleanup needed)

**Effort:** 0.5 day
**Tests:** Manual verification in Firestore console

---

### Story 21-4: Performance Testing & Validation

**Tests:**
1. Cache hit scenarios (same repo within 1 hour)
2. Cache miss scenarios (new repo)
3. Memory cache expiration (1 hour boundary)
4. Firestore cache expiration (24 hour boundary)
5. Multi-instance behavior (Render scaling)
6. Metrics: hit/miss rates, latency improvements

**Effort:** 1.5 days
**Acceptance Criteria:**
- ✅ Hot cache (memory): <500ms response
- ✅ Warm cache (Firestore): 3-4s response
- ✅ Cache hit rate: ~60% (typical usage)
- ✅ No stale data served (expiration working)
- ✅ Metrics logged (hit/miss/latency)

---

## No Infrastructure Changes Needed

✅ **Uses existing Firestore** (no Redis)
✅ **Works on Render** (no deployment changes)
✅ **No cost increase** (Firestore read/write is minimal)
✅ **Works with scaling** (multiple Render instances)

---

## Firestore Costs (Minimal)

For ~1000 repos cached:
- Reads: 1-2 per day per unique user = ~100/day = **$0.06/month**
- Writes: Same as above = **$0.06/month**
- Storage: ~1MB per 1000 repos = **$0.20/month**

**Total: ~$0.32/month** (vs Redis: $20+/month)

---

## Integration with Task #2

**Task #2** (Question Refinement UX) + **Epic 21** (Caching) together:
- Task #2: Better UX for answering questions
- Epic 21: Faster analysis for returning repos
- Combined: 50% faster overall experience ⚡

---

## Success Metrics

- [ ] Cache hit rate: ≥60% for active users
- [ ] Memory usage: <50MB per instance
- [ ] Response time (hot): <500ms
- [ ] Response time (warm): 3-4s
- [ ] No stale data served
- [ ] Firestore TTL working correctly

---

## Rollback Plan

If caching causes issues:
1. Disable cache via config flag
2. Clear memory and Firestore caches
3. Redeploy without cache integration
4. Takes <30 minutes, zero data loss

---

## Next Steps

When ready to implement:
1. Create 4 stories from this epic
2. Assign to next sprint
3. Start with Story 21-1 (service layer)
4. End with Story 21-4 (validation)
5. Expected completion: 4 days

**Link:** See `docs/TICKET-QUALITY-ROADMAP.md` for overall sprint planning
