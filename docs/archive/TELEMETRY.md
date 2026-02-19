# PostHog Telemetry & Analytics Guide

This guide explains how to use PostHog to monitor Forge's client and backend operations, including comprehensive LLM telemetry for cost and performance tracking.

## Table of Contents

1. [Setup](#setup)
2. [Event Categories](#event-categories)
3. [Client vs Backend Separation](#client-vs-backend-separation)
4. [LLM Telemetry](#llm-telemetry)
5. [Key Dashboards](#key-dashboards)
6. [Filtering & Insights](#filtering--insights)
7. [Cost Analysis](#cost-analysis)

---

## Setup

### Environment Variables

**Backend (.env):**
```
POSTHOG_API_KEY=phc_xxx...         # PostHog project API key
POSTHOG_HOST=https://us.posthog.com # (Optional) Custom PostHog instance
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx...         # PostHog project API key
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com # (Optional) Custom instance
```

### Verification

1. Go to PostHog dashboard: https://posthog.com
2. Events should appear within 10-30 seconds
3. Check **Data Management → Event Definitions** to see all events
4. Check **Persons** to see identified users

---

## Event Categories

### Client-Side Events

All client events include `source: 'client'` and `timestamp`.

#### Ticket Creation Flow
- `ticket_creation_started` - User starts creating a new ticket
- `wizard_stage_completed` - User completes a stage (Stage 1 Input, Stage 2 Context, Stage 3 Draft, etc.)
- `wizard_abandoned` - User abandons the wizard (includes stage and completion %)

#### Design Links (Phase 2)
- `design_link_added_client` - User adds a Figma/Loom link (includes platform)
- `design_link_removed_client` - User removes a design link
- `design_preview_viewed` - User views a design preview (includes platform, has_metadata)

#### Question Answering
- `question_answered_client` - User answers a question (includes question_index, answer_time_ms)
- `all_questions_skipped` - User skips all remaining questions

#### Ticket Detail
- `ticket_detail_viewed` - User views ticket details (includes has_spec)
- `spec_section_expanded` - User expands a spec section
- `spec_section_collapsed` - User collapses a spec section

#### Integration Operations
- `integration_connect_clicked` - User clicks connect button (includes integration name)
- `integration_disconnect_clicked` - User clicks disconnect button

#### Error & Performance
- `client_error` - JavaScript error occurred (includes error message, component, stack trace)
- `api_call_error` - API call failed (includes endpoint, status_code, error_message)
- `page_load_time` - Page load performance
- `component_render_time` - Component render performance
- `api_latency` - API call latency

#### Engagement
- `feature_used` - User engaged with a feature
- `settings_changed` - User changed a setting

### Backend Events

All backend events include `source: 'backend'` and `timestamp`.

#### Ticket Operations
- `ticket_creation_started` - Backend received ticket creation request
- `ticket_finalized` - Ticket spec finalized (includes quality_score, total_cost_usd)

#### Deep Analysis
- `deep_analysis_started` - Deep analysis phase started
- `deep_analysis_completed` - Deep analysis phase completed (includes duration, metrics)
- `deep_analysis_failed` - Deep analysis failed

#### LLM Operations (🔥 Most Important)
- `llm_api_call` - Claude API call made
  - Properties: model, input_tokens, output_tokens, cost_usd, duration_ms, purpose
  - Purpose: deep_analysis, spec_generation, question_generation, answer_refinement
- `llm_api_error` - Claude API call failed
  - Properties: model, error, duration_ms, purpose

#### Question & Spec Generation
- `questions_shown` - Questions generated and shown to user
- `question_answered` - Backend recorded question answer
- `ticket_spec_generated` - Tech spec generated (includes quality_score, duration_ms)

#### Design Links (Phase 2)
- `design_link_added` - Design link added to ticket
- `design_link_removed` - Design link removed from ticket
- `design_metadata_fetched` - Figma/Loom metadata fetched (includes platform, success, duration_ms)

#### PRD Breakdown
- `prd_breakdown_started` - PRD analysis started
- `prd_breakdown_completed` - PRD breakdown complete (includes ticket_count, duration_ms)

#### Bulk Enrichment
- `bulk_enrichment_started` - Bulk enrichment started (includes ticket_count)
- `bulk_enrichment_completed` - Bulk enrichment complete (includes success_count, failure_count, success_rate, duration_ms)

#### Integrations
- `integration_connected` - Integration (Jira/Linear) connected
- `oauth_figma_started` - Figma OAuth flow started
- `oauth_figma_success` - Figma OAuth succeeded
- `oauth_figma_failed` - Figma OAuth failed
- `oauth_loom_started` - Loom OAuth flow started (currently disabled)
- `oauth_loom_success` - Loom OAuth succeeded
- `oauth_loom_failed` - Loom OAuth failed
- `jira_issue_imported` - Jira issue imported
- `linear_issue_imported` - Linear issue imported

#### Export Operations
- `export_started` - Export started (includes format: markdown/json/xml)
- `export_completed` - Export completed

#### API Health
- `api_error` - API error occurred (includes endpoint, status_code, error)
- `api_success` - API call succeeded (includes endpoint, status_code)

#### Cost Tracking
- `cost_tracked` - Aggregated cost data

---

## Client vs Backend Separation

All events automatically include a `source` field for easy filtering:

```
source: 'client'   # User-initiated events (web app)
source: 'backend'  # Server-side operations (API, LLM)
```

### Separate Client and Backend Events

**In PostHog Events tab, filter by source:**

1. **Client events only:**
   ```
   source = client
   ```

2. **Backend events only:**
   ```
   source = backend
   ```

3. **LLM events (backend):**
   ```
   source = backend AND event = llm_api_call
   ```

### Example Dashboard Setup

Create a new dashboard with 4 charts:

1. **Client Events Funnel**
   - Filter: `source = client`
   - Breakdown by: event name
   - Shows user engagement flows

2. **Backend Events Timeline**
   - Filter: `source = backend`
   - Show: event timeline with duration
   - Shows server-side performance

3. **LLM Cost Analysis**
   - Filter: `source = backend AND event = llm_api_call`
   - Breakdown by: purpose (deep_analysis, spec_generation, etc.)
   - Show: sum(cost_usd), count, avg(duration_ms)

4. **Error Tracking**
   - Filter: `(source = client AND event = client_error) OR (source = backend AND event = llm_api_error)`
   - Shows all errors across stack

---

## LLM Telemetry

Track every Claude API call with full transparency into token usage, costs, and performance.

### Event: `llm_api_call`

**Captured for every Claude API call:**

```javascript
{
  source: 'backend',
  ticket_id: 'FOR-123',
  model: 'claude-3-5-sonnet-20241022',
  input_tokens: 8500,
  output_tokens: 2300,
  total_tokens: 10800,
  cost_usd: 0.0324,  // Calculated from token usage
  duration_ms: 2450,
  purpose: 'spec_generation',  // deep_analysis, spec_generation, question_generation, etc.
  timestamp: '2026-02-13T10:30:45.123Z'
}
```

### Token Pricing Reference

**Claude 3.5 Sonnet:**
- Input: $3 / 1M tokens = $0.000003 per token
- Output: $15 / 1M tokens = $0.000015 per token

**Calculated Cost Example:**
```
Input:  8,500 tokens × $0.000003 = $0.0255
Output: 2,300 tokens × $0.000015 = $0.0345
Total Cost: $0.0600 per call
```

### LLM Insights Queries

**Total LLM spend (last 30 days):**
```
Filter: source = backend AND event = llm_api_call AND timestamp > 30 days ago
Aggregate: sum(cost_usd)
Result: $XXX.XX
```

**Average cost per spec generation:**
```
Filter: source = backend AND event = llm_api_call AND purpose = spec_generation
Aggregate: avg(cost_usd)
Result: $X.XX per spec
```

**Tokens per purpose:**
```
Filter: source = backend AND event = llm_api_call
Breakdown: purpose
Aggregate: sum(input_tokens), sum(output_tokens)
```

**Slowest LLM calls:**
```
Filter: source = backend AND event = llm_api_call
Sort: duration_ms DESC
Shows: model, duration_ms, output_tokens (output length = duration)
```

**Model distribution:**
```
Filter: source = backend AND event = llm_api_call
Breakdown: model
Count: # of calls per model
```

---

## Key Dashboards

### 1. Overview Dashboard

**4-panel dashboard showing system health:**

1. **Event volume (24h)**
   - Total events per hour
   - Filter: all events
   - Type: Time series

2. **Unique users (24h)**
   - Active users per hour
   - Type: Time series

3. **Top events**
   - Top 10 events by count
   - Type: Table

4. **Error rate**
   - Events with event = 'client_error' OR 'api_error' OR 'llm_api_error'
   - Type: Trend

### 2. Ticket Creation Funnel

**Conversion tracking from start to finish:**

- Step 1: `ticket_creation_started`
- Step 2: `wizard_stage_completed` AND stage = 'stage1'
- Step 3: `wizard_stage_completed` AND stage = 'stage2'
- Step 4: `wizard_stage_completed` AND stage = 'stage3'
- Step 5: `ticket_finalized`

Shows drop-off at each stage (where users abandon).

### 3. LLM Cost Analysis

**Track all Claude API spending:**

```
Filter: source = backend AND event = llm_api_call
Breakdown: purpose
Metrics:
  - Total cost (sum(cost_usd))
  - Call count
  - Avg cost per call
  - Avg tokens (input + output)
  - Avg latency (duration_ms)
```

**By model:**
```
Breakdown: model
Shows which models cost most and why
```

### 4. Performance Dashboard

**Latency & throughput tracking:**

1. **API latency distribution**
   - Filter: source = backend AND event = api_success
   - Show: histogram of duration_ms by endpoint

2. **Deep analysis duration**
   - Filter: event = deep_analysis_completed
   - Breakdown by: repository (to spot slow repos)

3. **Page load times**
   - Filter: source = client AND event = page_load_time
   - Breakdown by: page name

4. **Component render times**
   - Filter: source = client AND event = component_render_time
   - Breakdown by: component

### 5. Error Dashboard

**All errors in one place:**

1. **Client errors**
   - Filter: source = client AND event = client_error
   - Breakdown by: component, error_message
   - Shows which features are breaking

2. **API errors**
   - Filter: source = backend AND event = api_error
   - Breakdown by: endpoint, status_code
   - 4xx = client error, 5xx = server error

3. **LLM errors**
   - Filter: source = backend AND event = llm_api_error
   - Shows Claude API failures
   - Breakdown by: purpose (which operations are failing)

4. **Error trends**
   - Time series of all errors
   - Spot when issues started

---

## Filtering & Insights

### Common Filters

**Ticket creation success rate:**
```
Filter: event = ticket_finalized
vs
Filter: event = ticket_creation_started
Ratio = Success rate
```

**Design link adoption (Phase 2):**
```
Filter: event = design_link_added_client
Count = # of design links added
(Compare to total tickets created)
```

**Question answering behavior:**
```
Filter: event = question_answered_client
vs
Filter: event = all_questions_skipped
Shows user engagement with questions
```

**Integration adoption:**
```
Filter: event = integration_connected
Breakdown: integration
Shows which integrations users connect most
```

### User Cohorts

Create cohorts to track specific user behaviors:

**Power users (high engagement):**
```
Users where: event count > 50 AND source = client AND (event = feature_used OR ticket_created)
```

**LLM heavy users (high costs):**
```
Users where: sum(cost_usd) > $100 in last 30 days
```

**Design link users:**
```
Users where: event = design_link_added_client AND count > 0
```

---

## Cost Analysis

### Monthly Cost Tracking

**Track total costs across system:**

```sql
SELECT
  DATE_TRUNC(timestamp, MONTH) as month,
  COUNT(*) as llm_calls,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_call,
  MAX(cost_usd) as highest_cost_call
FROM events
WHERE event = 'llm_api_call'
GROUP BY month
ORDER BY month DESC
```

### Cost by Feature

```
Filter: source = backend AND event = llm_api_call
Breakdown: purpose
Metrics:
  deep_analysis: $X (most expensive - full codebase reading)
  spec_generation: $X (spec generation)
  question_generation: $X (cheapest - shorter prompts)
  answer_refinement: $X
```

### Cost Optimization Opportunities

1. **Deep analysis is expensive** - Limit codebase size or use fingerprinting
2. **Spec generation costs vary** - Track by model and optimize prompts
3. **Question generation is cheap** - Can be called more frequently
4. **Error rate impact** - Track retries (doubled cost)

---

## Alerts & Monitoring

### Set Up Alerts in PostHog

1. **High error rate**
   - Event: `client_error` OR `api_error` OR `llm_api_error`
   - Threshold: > 5 errors per hour
   - Action: Slack notification

2. **High cost spike**
   - Event: `llm_api_call`
   - Metric: sum(cost_usd)
   - Threshold: > $100 per hour
   - Action: Alert on unusual spike

3. **API latency degradation**
   - Event: `api_latency`
   - Metric: p95(latency_ms)
   - Threshold: > 5000ms
   - Action: Alert on slowdown

4. **Feature deprecation tracking**
   - Event: `feature_used` AND feature = 'old_feature'
   - Threshold: > 0 uses
   - Action: Alert if deprecated feature still used

---

## Example Queries

### "How much did we spend on deep analysis?"

```
Filter: event = llm_api_call AND purpose = deep_analysis
Aggregate: sum(cost_usd)
Result: $XXX.XX spent on deep analysis
```

### "What's our median spec generation cost?"

```
Filter: event = llm_api_call AND purpose = spec_generation
Aggregate: median(cost_usd)
Result: $X.XX median cost
```

### "Which users generated the most design links?"

```
Filter: event = design_link_added_client
Breakdown: user
Sort: count DESC
Result: Top 10 users by design links created
```

### "Design link adoption rate (Phase 2):"

```
Total design links added: COUNT(event = design_link_added_client)
Total tickets created: COUNT(event = ticket_finalized)
Adoption rate: (design links / tickets) * 100
```

### "Question answering completion rate"

```
Questions shown: COUNT(event = questions_shown)
Questions answered: COUNT(event = question_answered_client)
Completion rate: (answered / shown) * 100
```

---

## Tips & Best Practices

1. **Use timestamps** - All events include ISO 8601 timestamp for precise filtering
2. **Group by source** - Always separate client vs backend to understand where issues occur
3. **Monitor LLM costs** - Check daily cost reports to catch unexpected spikes
4. **Track error rates** - Watch `api_error` and `client_error` trends
5. **User cohorts** - Create cohorts for power users and track their behavior
6. **Dashboard sharing** - Share dashboards with team to keep everyone informed
7. **Retention tracking** - Monitor user retention using `distinct_id` and date ranges

---

## Need Help?

- **PostHog Docs:** https://posthog.com/docs
- **Event Explorer:** https://posthog.com/docs/product-analytics/event-explorer
- **Dashboards:** https://posthog.com/docs/product-analytics/dashboards
- **Queries:** https://posthog.com/docs/product-analytics/sql

