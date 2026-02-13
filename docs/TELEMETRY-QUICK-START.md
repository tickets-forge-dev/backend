# PostHog Telemetry - Quick Start Guide

## 🎯 What You Can Now Track

### Client Events (User Browser)
- ✅ Ticket creation flow and stage progression
- ✅ Design link additions (Figma, Loom, etc.)
- ✅ Question answering patterns
- ✅ Ticket detail viewing and section engagement
- ✅ Integration connect/disconnect clicks
- ✅ Page load and component render times
- ✅ Client errors with full stack traces
- ✅ Feature usage and settings changes

### Backend Events (Server)
- ✅ Ticket operations and workflow completions
- ✅ **LLM API calls with token usage and cost** 🔥
- ✅ Deep analysis performance and results
- ✅ Spec generation quality and latency
- ✅ Question generation and answering
- ✅ Design link metadata fetching
- ✅ PRD breakdown and bulk enrichment
- ✅ API errors and performance
- ✅ Integration OAuth flows

---

## 🚀 How to Access Your Data

### Step 1: Open PostHog Dashboard
1. Go to https://posthog.com
2. Sign in with your account
3. Select your Forge project

### Step 2: View Events
**Navigate to:** Left sidebar → **Events**

You'll see all captured events with:
- Event name
- User (distinct_id)
- Timestamp
- All properties (source, ticket_id, cost_usd, etc.)

---

## 🔥 LLM Cost Tracking (Most Important!)

### View All Claude API Calls
**In Events tab, filter:**
```
source = backend AND event = llm_api_call
```

**You'll see:**
- How many Claude API calls were made
- Total tokens consumed (input + output)
- Total cost in USD
- Average cost per call
- Which feature (deep_analysis, spec_generation, etc.) costs most

### Check Total LLM Spend
**In Events tab, filter:**
```
source = backend AND event = llm_api_call
```

**Click "Insights" → "Sum" → select "cost_usd"**

Result: Total amount spent on LLM calls

### Cost Breakdown by Feature
**In Events tab:**
1. Filter: `source = backend AND event = llm_api_call`
2. Click "Breakdown" → select `purpose`
3. Shows: cost per feature (deep_analysis, spec_generation, etc.)

---

## 📊 Separate Client vs Backend

### View Only User Actions (Client)
**Filter:**
```
source = client
```

Shows all user interactions in the web app.

### View Only Server Operations (Backend)
**Filter:**
```
source = backend
```

Shows all backend processing, API calls, LLM usage, etc.

---

## 📈 Key Metrics to Monitor

### Daily Dashboard

**Create a new dashboard with these insights:**

1. **LLM Cost (Last 24h)**
   - Filter: `source = backend AND event = llm_api_call`
   - Metric: Sum of `cost_usd`
   - Update frequency: Real-time
   - Alert if > $100/day

2. **Active Users (Last 24h)**
   - Filter: all events
   - Metric: Unique users
   - Shows: How many users created tickets

3. **Error Rate**
   - Filter: `event like 'error'`
   - Metric: Count
   - Alert if > 10 errors/hour

4. **Average Spec Generation Cost**
   - Filter: `source = backend AND event = llm_api_call AND purpose = spec_generation`
   - Metric: Average `cost_usd`
   - Shows: Cost per spec

---

## 🎯 Common Questions Answered by Telemetry

### "How much did deep analysis cost today?"
**Filter:**
```
source = backend AND event = llm_api_call AND purpose = deep_analysis AND timestamp > today
```
**Aggregate:** Sum(cost_usd)

### "Which users create the most tickets?"
**In Events tab:**
1. Filter: `event = ticket_finalized`
2. Breakdown by: User (distinct_id)
3. Sort by: Count (descending)

### "Are users using design links?"
**Filter:**
```
source = client AND event = design_link_added_client
```
Count how many were added vs total tickets finalized.

### "What's our API error rate?"
**Filter:**
```
source = backend AND event = api_error
```
Compare to:
```
source = backend AND event = api_success
```
Calculate: errors / (errors + success)

### "Are users completing the wizard?"
**Create a funnel:**
1. `ticket_creation_started`
2. `wizard_stage_completed` (stage = stage1)
3. `wizard_stage_completed` (stage = stage2)
4. `wizard_stage_completed` (stage = stage3)
5. `ticket_finalized`

Shows where users drop off.

---

## ⚡ Real-Time Monitoring

### Set Up Alerts

**Click "Alerts" in top menu**

#### Alert 1: High LLM Cost
- Event: `llm_api_call`
- Metric: Sum of `cost_usd`
- Condition: > $50 per hour
- Action: Email/Slack notification

#### Alert 2: API Errors Spike
- Event: `api_error`
- Metric: Count
- Condition: > 20 per hour
- Action: Slack notification

#### Alert 3: LLM API Failure
- Event: `llm_api_error`
- Metric: Count
- Condition: > 5 per hour
- Action: Email notification (Claude API issue)

---

## 📊 Dashboard Examples

### Cost Analysis Dashboard

**4 panels:**

1. **LLM Cost Over Time**
   - Filter: `source = backend AND event = llm_api_call`
   - Chart type: Time series
   - Metric: Sum(cost_usd)
   - Breakdown: hourly
   - Shows spending trend

2. **Cost by Purpose**
   - Same filter
   - Chart type: Bar chart
   - Breakdown: `purpose` field
   - Shows: deep_analysis vs spec_generation vs question_generation costs

3. **Cost by Model**
   - Same filter
   - Breakdown: `model` field
   - Shows which Claude model version costs most

4. **Tokens by Purpose**
   - Same filter
   - Chart type: Table
   - Columns: purpose, count, sum(input_tokens), sum(output_tokens), sum(cost_usd)
   - Shows detailed token breakdown

### User Engagement Dashboard

**4 panels:**

1. **Ticket Creation Funnel**
   - Shows conversion from start to finish
   - Identifies drop-off stages

2. **Feature Adoption**
   - Design links added per day
   - Integration connections per day
   - Shows adoption trends

3. **Average Ticket Duration**
   - Time from creation_started to finalized
   - Shows if users are spending more time

4. **Question Answering Rate**
   - Questions generated vs answered
   - Shows user engagement with question refinement

---

## 🔍 Debugging with Telemetry

### User Had an Error?
**Find their events:**
1. Click "Persons" in left menu
2. Search for their email
3. View their event timeline
4. See exactly what they did and what failed

### Ticket Generation Took Too Long?
**Filter:**
```
source = backend AND event = ticket_finalized AND ticket_id = 'FOR-123'
```
Shows the duration and quality score for that specific ticket.

### API Getting Slow?
**Filter:**
```
source = backend AND event = api_success
```
1. Breakdown by: `endpoint`
2. Metric: Average `duration_ms`
3. Sort by: duration descending
4. See which endpoints are slow

---

## 📲 Slack Integration (Optional)

You can connect PostHog to Slack to receive alerts:

1. **In PostHog:** Settings → Integrations → Slack
2. **Connect your Slack workspace**
3. **Create alerts** that post to #alerts channel
4. Get notified when errors spike or costs are high

---

## 📊 Weekly Report Ideas

**Every Monday, run these queries:**

```
1. Total LLM spend (last 7 days)
   Filter: source = backend AND event = llm_api_call AND timestamp > 7 days ago
   Aggregate: Sum(cost_usd)

2. Total tickets created (last 7 days)
   Filter: event = ticket_finalized AND timestamp > 7 days ago
   Aggregate: Count

3. Cost per ticket
   = LLM spend / tickets created
   Example: $10.50 spent / 5 tickets = $2.10 per ticket

4. Error rate (last 7 days)
   Filter: event like 'error'
   Compare to: all events
   Error rate = errors / total events

5. New users (last 7 days)
   Filter: timestamp > 7 days ago
   Aggregate: Unique users
```

---

## 🎓 Learn More

- **Full Documentation:** See `docs/TELEMETRY.md` for complete reference
- **PostHog Docs:** https://posthog.com/docs
- **Event Explorer Guide:** https://posthog.com/docs/product-analytics/event-explorer

---

## ✅ You Now Have:

✅ **Client-side analytics** - See what users are doing in the web app
✅ **Backend monitoring** - Track server-side operations and errors
✅ **LLM cost tracking** - Know exactly how much you're spending on Claude API calls
✅ **Performance monitoring** - Identify slow pages and API endpoints
✅ **Error tracking** - Catch and debug issues in real-time
✅ **User engagement** - Understand feature adoption and user behavior
✅ **Feature-specific costs** - Know what each feature costs (deep analysis vs spec generation)

**Your system is now fully observable!** 🎉

