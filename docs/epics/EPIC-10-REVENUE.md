# Epic 10: Revenue Infrastructure (Stripe + Subscription Tiers)

**Status:** Backlog
**Priority:** P0 (Revenue unlock)
**Planned Start:** Phase 1 (after Epic 0)
**Dependencies:** None (MVP complete)

## Summary

Implement Stripe payment processing and subscription management to enable Forge to accept payments and enforce tier-based feature limits (Free: 3 tickets/mo, Pro: $12/mo for 30 tickets, Team: $59/mo for unlimited).

## Pricing & Tiers

**Confirmed pricing (from story 0-4):**
- **Free:** $0/month, 3 tickets/month
- **Pro:** $12/month, 30 tickets/month
- **Team:** $59/month, unlimited tickets/month

## Stripe Setup Notes

### Business & Payment Information

**Current Situation:**
- Developer location: Temporarily in Canada (Quebec), moving to Israel
- No existing US business
- TD Bank account in Canada
- No Quebec business registration

### Recommended Stripe Setup Strategy

**Phase 1 (Near-term - Canada):**
1. Register Stripe Canada account
   - Use current Canadian address (temporary)
   - TD Bank account for payouts
   - Business name: "Forge" (solopreneur)
   - Business purpose: "SaaS - AI ticket generation"
2. Timeline: 1-2 days for approval
3. Go live with real payments in Canada

**Phase 2 (Mid-term - Israel Migration):**
1. Register Israeli Ltd. company
   - Business registration (3-5 days)
   - Get Israeli Tax Authority number
   - Timeline: ~1 week
2. Open Israeli bank account
   - Once company exists (few days)
3. Register Stripe Israel account
   - Use Israeli company details
   - Israeli bank account for payouts
   - Timeline: 1-3 days for approval

**Phase 3 (Migration):**
1. Migrate customers from Stripe Canada → Stripe Israel
   - Update subscription records with new Stripe customer IDs
   - Notify customers of payment method change
   - Timeline: Coordinate with customer communication

### Tax Implications

- **While in Canada:** Revenue technically taxable in Israel (home country), not Quebec
- **After moving to Israel:** All revenue taxed by Israeli Tax Authority
- **Action:** Consult accountant about Canada-Israel tax treaty before migration

### Development Path (Before Live)

While Stripe account setup is pending:
1. Implement Stripe integration with **test API keys**
   - Works immediately, no production account needed
   - Full feature parity with live mode
2. Build subscription system:
   - Domain: Subscription entity (tier, status, renewal_date, stripe_customer_id)
   - Backend: NestJS guard for tier limits
   - Frontend: Checkout flow, customer portal
3. Test end-to-end with Stripe test card: `4242 4242 4242 4242`
4. When Stripe account ready: switch to live keys

## Stories

### 10-1: Subscription Domain Model
- Create Subscription entity in Firestore
- Fields: user_id, workspace_id, tier (free/pro/team), status (active/cancelled/expired), renewal_date, stripe_customer_id, stripe_subscription_id
- Domain constraints: Can only have one active subscription per workspace

### 10-2: Stripe Checkout Integration
- Integrate Stripe Checkout (hosted payment page)
- Create POST /subscriptions endpoint
- Webhook handler for payment_intent events
- Subscription creation on successful payment

### 10-3: Subscription Guard
- NestJS guard to check user tier before ticket generation
- Enforce limits: Free (3/mo), Pro (30/mo), Team (unlimited)
- Throw ForbiddenException if quota exceeded

### 10-4: Usage Metering
- Track tickets created per workspace per month
- Reset counters on billing cycle date
- Report usage to Stripe for metering-based pricing (if needed later)

### 10-5: Stripe Customer Portal
- Self-serve billing portal (upgrade/downgrade/cancel)
- Link in settings page
- Customers manage payment methods, view invoices

### 10-6: Pricing Page UI
- ✅ **DONE** (Story 0-4)
- Three tier cards with features, pricing, Subscribe buttons
- Responsive design, mobile-optimized

## Implementation Order

1. **10-1: Subscription Domain Model** — Foundation for all others
2. **10-2: Stripe Checkout** — Get payments flowing
3. **10-3: Subscription Guard** — Enforce tier limits
4. **10-4: Usage Metering** — Track usage per tier
5. **10-5: Customer Portal** — Self-serve management
6. **10-6: Pricing Page** — ✅ Already done

## Technical Decisions

- **Checkout Flow:** Stripe Checkout (hosted) instead of custom Stripe Elements
  - Simpler, PCI-compliant out of box
  - Handles 3D Secure, payment methods
- **Webhooks:** Use signed webhooks for subscription events
  - Idempotent handlers (safe to re-process)
  - Verify Stripe signature before processing
- **Metering:** Firebase timestamp-based (no complex billing logic yet)
  - Reset monthly on subscription renewal date
  - Upgrade/downgrade: prorate based on usage

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Stripe account rejection (temp residency) | Explain SaaS nature, have Canadian address ready |
| Payment processing delays in migration | Maintain both Stripe accounts during transition |
| Customer churn on payment method change | Clear communication, minimal friction during migration |
| Tax compliance complexity | Hire accountant familiar with Canada-Israel business |

## Future Enhancements (Post-MVP)

- Annual billing discount (e.g., 20% off if paid yearly)
- Usage-based pricing (overage charges)
- Team seat pricing (per-user billing)
- Free trial (e.g., 14 days of Pro features)
- Enterprise tier (custom pricing, SLA)
