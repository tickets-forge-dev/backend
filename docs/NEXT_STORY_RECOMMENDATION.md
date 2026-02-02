# Next Story Recommendation - Post Story 4.2

**Date:** 2026-02-02  
**Current Status:** Story 4.2 (Code Indexing) ✅ COMPLETED  
**Decision Point:** Epic 2 vs Epic 4 continuation

---

## Strategic Context

We've just completed the **code indexing infrastructure** (Story 4.2). Now we need to decide:
- **Option A**: Continue Epic 4 → Story 4.3 (OpenAPI Spec Sync)
- **Option B**: Return to Epic 2 → Story 2.5 (AEC XML Serialization)

---

## Epic Status Overview

### Epic 2: Ticket Creation & AEC Engine
- ✅ 2.1: Ticket Creation UI
- ✅ 2.2: Generation Progress UI  
- ✅ 2.3: AEC Domain Model
- ✅ 2.4: Ticket Detail View
- 📝 **2.5: AEC XML Serialization** (drafted, not started)

**Status:** 4/5 stories done (80%)

### Epic 4: Code Intelligence & Estimation
- ✅ 4.0: Branch Selection
- ✅ 4.1: GitHub App Integration
- ✅ 4.2: Code Indexing
- 🔲 **4.3: OpenAPI Spec Sync**
- 🔲 4.4: Drift Detection
- 🔲 4.5: Effort Estimation
- 🔲 4.6: Safety Rails

**Status:** 3/7 stories done (43%)

---

## Analysis

### Option A: Continue Epic 4 → Story 4.3 (OpenAPI Spec Sync)

**Pros:**
- ✅ **Momentum**: Already deep in GitHub/indexing mindset
- ✅ **Infrastructure ready**: Indexing system just built, easy to extend
- ✅ **Complete feature**: OpenAPI sync completes the "code intelligence" trio (repo + API + drift)
- ✅ **Natural flow**: 4.1 (GitHub) → 4.2 (Code) → 4.3 (API) is logical sequence
- ✅ **Value unlock**: API awareness is critical for backend ticket generation

**Cons:**
- ⚠️ Epic 2 still has 1 story left (not "done")
- ⚠️ XML serialization may be needed for export features

**Effort:** Medium (similar to 4.2, ~1-2 days)

---

### Option B: Return to Epic 2 → Story 2.5 (AEC XML Serialization)

**Pros:**
- ✅ **Epic completion**: Closes out Epic 2 entirely (100%)
- ✅ **Foundation complete**: AEC format finalized before building more features
- ✅ **Export readiness**: Required for Jira/Linear export (Epic 5)

**Cons:**
- ⚠️ **Context switch**: Moving from infrastructure → data format
- ⚠️ **Dependency wait**: Epic 5 (Export) not started yet, so XML isn't immediately needed
- ⚠️ **Less momentum**: XML serialization is lower energy after building APIs

**Effort:** Small (~1 day, mostly schema definition)

---

## Recommendation: **Option A - Continue Epic 4 → Story 4.3**

### Why?

1. **GitHub world momentum**: We're already in the GitHub/code intelligence zone. Keep the flow.

2. **Value delivery**: OpenAPI spec sync is **critical** for:
   - Backend ticket generation (API-aware tickets)
   - Drift detection (Story 4.4 depends on it)
   - Real production value (not just infrastructure)

3. **Natural sequence**: 
   - 4.1 = Connect to GitHub ✅
   - 4.2 = Index code ✅
   - 4.3 = Index APIs ← **Next logical step**
   - 4.4 = Detect drift (uses 4.2 + 4.3)

4. **Epic 2 can wait**: 
   - Story 2.5 (XML) is a "format definition" story
   - Not blocking any other work
   - Better to do right before Epic 5 (Export) starts

5. **Risk mitigation**: 
   - If we pause Epic 4 now, we lose context
   - Coming back to OpenAPI specs later = relearning GitHub APIs

---

## Alternative: Story 2.5 → Story 4.3 (Hybrid)

If you want to close Epic 2 first:
1. **Quick win**: Story 2.5 (1 day) → Epic 2 done ✅
2. **Resume Epic 4**: Story 4.3 (2 days) → Code intelligence complete

**Total:** Same time, but Epic 2 gets ceremonial "completion"

---

## Final Recommendation

### **PRIMARY: Story 4.3 (OpenAPI Spec Sync)**

**Reasoning:** 
- Momentum in GitHub/indexing domain
- Natural technical progression
- Higher production value
- Epic 2 completion not urgent

**Next Steps:**
1. Draft Story 4.3 context
2. Review OpenAPI parser options
3. Design spec storage schema
4. Build OpenAPI detection/parsing
5. Test with real repos

---

## Timeline Projection

**If Story 4.3 next:**
- Story 4.3: 2 days
- Story 4.4 (Drift): 2 days  
- Story 4.5 (Estimation): 3 days
- **Epic 4 complete:** ~1 week

**If Story 2.5 next:**
- Story 2.5: 1 day
- Epic 2 complete ✅
- Story 4.3: 2 days
- Story 4.4: 2 days
- Story 4.5: 3 days
- **Both epics complete:** ~1.5 weeks

---

## Decision Matrix

| Criteria | Story 4.3 | Story 2.5 |
|----------|-----------|-----------|
| Context continuity | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Production value | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Unblocks other work | ⭐⭐⭐⭐ | ⭐⭐ |
| Epic completion | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Team morale | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Winner: Story 4.3** (20 stars vs 15 stars)

---

## Your Call, BMad! 🎯

**My strong recommendation: Story 4.3 (OpenAPI Spec Sync)**

But if you prefer to close Epic 2 first for clean slate → Story 2.5 is a quick 1-day win.

What's your preference?
