# PostHog Analytics Implementation

Forge uses **PostHog** for comprehensive product analytics and agent telemetry tracking.

## Setup

### 1. Create PostHog Account

1. Visit [posthog.com](https://posthog.com)
2. Sign up for a free account
3. Create a new project
4. Copy your **API Key** (starts with `phc_`)

### 2. Environment Configuration

Add to your `.env.local` (frontend) and `.env` (backend):

```env
# Backend
POSTHOG_API_KEY=phc_your_api_key_here
POSTHOG_HOST=https://us.posthog.com

# Frontend
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com
```

### 3. Initialize in App

**Frontend (app/layout.tsx):**
```typescript
import { PostHogProvider } from '@/components/PostHogProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
```

**Backend (app.module.ts):**
```typescript
import { PostHogModule } from '@/shared/infrastructure/posthog/posthog.module';

@Module({
  imports: [
    PostHogModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage

### Frontend Event Tracking

```typescript
import { track, identify } from '@/lib/posthog';

// Track a custom event
track('ticket_created', {
  type: 'feature',
  priority: 'high',
  repository: 'owner/repo'
});

// Identify user
identify({
  email: 'user@example.com',
  workspace_id: 'ws_123'
});
```

### Backend Event Tracking

```typescript
import { TelemetryService } from '@/shared/infrastructure/posthog/telemetry.service';

@Injectable()
export class CreateTicketUseCase {
  constructor(private telemetry: TelemetryService) {}

  async execute(userId: string, params: CreateTicketParams) {
    // Track event
    this.telemetry.trackTicketCreationStarted(
      userId,
      params.workspaceId,
      'create_new'
    );

    // Your business logic...

    this.telemetry.trackTicketFinalized(
      userId,
      ticketId,
      totalDuration,
      totalCost
    );
  }
}
```

## Tracked Events

### Ticket Creation Flow
- `ticket_creation_started` - User initiates ticket creation
- `repository_selected` - User selects repository
- `deep_analysis_started` - Repository analysis begins
- `deep_analysis_completed` - Analysis finished with metrics
- `questions_shown` - Clarification questions generated
- `question_answered` - User answers question
- `ticket_spec_generated` - Tech spec created
- `ticket_finalized` - Ticket ready for use

### Agent Execution
- `agent_execution_started` - Mastra agent starts
- `agent_execution_completed` - Agent finishes with metrics
  - `duration_ms`: Execution time
  - `tokens_input`: Input tokens used
  - `tokens_output`: Output tokens used
  - `cost_usd`: Cost of execution
  - `status`: 'success' | 'failed' | 'timeout'

### Integration Events
- `jira_issue_searched` - User searches for Jira issue
- `jira_issue_imported` - Issue imported from Jira
- `linear_issue_searched` - User searches for Linear issue
- `linear_issue_imported` - Issue imported from Linear
- `integration_connected` - Integration configured

### Cost Tracking
- `cost_tracked` - LLM token usage and cost
  - `service`: 'openai' | 'anthropic' | 'jira' | 'linear'
  - `tokens_input`: Input tokens
  - `tokens_output`: Output tokens
  - `cost_usd`: Dollar cost

## Dashboard Setup

### Key Metrics to Track

**1. Ticket Creation Funnel**
```
ticket_creation_started
→ repository_selected
→ deep_analysis_completed
→ questions_shown
→ ticket_finalized

Metric: Conversion rate at each step
```

**2. Analysis Performance**
```
Event: deep_analysis_completed
Properties: duration_ms, files_analyzed, cost_usd

Metric: Avg analysis time, cost per analysis
```

**3. Agent Efficiency**
```
Event: agent_execution_completed
Properties: duration_ms, tokens_input, tokens_output, cost_usd, agent_name

Metric: Avg execution time, cost per agent, token efficiency
```

**4. Integration Usage**
```
Events: jira_issue_imported, linear_issue_imported
Metric: Import volume by platform, success rate
```

**5. Cost Analysis**
```
Event: cost_tracked
Group by: service, operation
Metric: Total cost, cost per ticket, cost trends
```

## Recommended Dashboards

### Executive Dashboard
- Total tickets created (trend)
- Active users (trend)
- Total cost (trend)
- Integration adoption rate
- Average ticket generation time

### Operations Dashboard
- Agent execution performance
- Cost breakdown by service
- Error rate by agent
- Token usage efficiency
- API rate limits

### Product Analytics Dashboard
- Feature adoption (creation mode: new vs import)
- Drop-off points in creation flow
- User journey segments
- Integration platform preference

## Retention & Privacy

**Data Retention:**
- Free tier: 5,000 events retained
- Paid tier: Based on plan (30+ days typical)

**Privacy:**
- No PII collected unless explicitly set
- All events have user consent
- Can be disabled with feature flag

## Cost Estimation

**Free Tier:**
- Up to 1M events/month
- 5,000 events stored
- Basic analytics

**Paid Tier:**
- ~$0.00005 per event
- Unlimited event storage
- Advanced analytics & replay

For Forge MVP (100 users, 10 tickets/day):
- ~30K events/month → **Free tier sufficient**

## Troubleshooting

### Events Not Showing Up
1. Check `POSTHOG_API_KEY` is set correctly
2. Verify `POSTHOG_HOST` matches your region
3. Check browser console for errors
4. Events batch in 10-second intervals

### High Costs
1. Audit which events are tracked
2. Reduce sampling for high-volume events
3. Filter out bot traffic
4. Review retention settings

### Privacy Concerns
1. Use [PostHog's data management features](https://posthog.com/docs/data-management)
2. Set up data deletion policies
3. Anonymize sensitive fields

## References

- [PostHog Docs](https://posthog.com/docs)
- [PostHog JS SDK](https://posthog.com/docs/integrate/client/js)
- [PostHog Node SDK](https://posthog.com/docs/integrate/server/node)
- [Event Taxonomy](https://posthog.com/docs/data-management/events)
