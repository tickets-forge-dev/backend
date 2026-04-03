# Interactive Hero Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static hero screenshot with a fully interactive, self-contained demo of the Forge app inside a browser chrome frame, showcasing the complete lifecycle: ticket list → ticket detail → develop → delivered → preview, plus decision logs.

**Architecture:** Self-contained component tree under `client/src/landing/components/demo/` with zero dependencies on the real app stores or services. Uses the same Tailwind classes and CSS design tokens for visual parity. State machine drives screen transitions with Framer Motion animations.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide React icons

---

### Task 1: Mock Data & State Machine

**Files:**
- Create: `client/src/landing/components/demo/demo-data.ts`
- Create: `client/src/landing/components/demo/demo-state.ts`

- [ ] **Step 1: Create the state machine types**

```typescript
// demo-state.ts
export type DemoScreen =
  | 'ticket-list'
  | 'ticket-detail'
  | 'develop-session'
  | 'delivered'
  | 'preview'
  | 'decision-logs'
  | 'decision-log-detail';

export type DemoAction =
  | { type: 'OPEN_TICKET' }
  | { type: 'GO_BACK' }
  | { type: 'START_DEVELOP' }
  | { type: 'DEVELOP_COMPLETE' }
  | { type: 'VIEW_PREVIEW' }
  | { type: 'OPEN_DECISION_LOGS' }
  | { type: 'OPEN_DECISION_LOG'; recordIndex: number }
  | { type: 'OPEN_TICKETS' }
  | { type: 'RESET' };

export interface DemoState {
  screen: DemoScreen;
  previousScreen: DemoScreen | null;
  selectedRecordIndex: number;
  hasInteracted: boolean;
  developComplete: boolean;
}

export const initialDemoState: DemoState = {
  screen: 'ticket-list',
  previousScreen: null,
  selectedRecordIndex: 0,
  hasInteracted: false,
  developComplete: false,
};

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'OPEN_TICKET':
      return { ...state, screen: 'ticket-detail', previousScreen: state.screen, hasInteracted: true };
    case 'GO_BACK': {
      const backMap: Record<DemoScreen, DemoScreen> = {
        'ticket-detail': 'ticket-list',
        'develop-session': 'ticket-detail',
        'delivered': 'ticket-detail',
        'preview': 'delivered',
        'decision-log-detail': 'decision-logs',
        'decision-logs': 'ticket-list',
        'ticket-list': 'ticket-list',
      };
      return { ...state, screen: backMap[state.screen], previousScreen: state.screen };
    }
    case 'START_DEVELOP':
      return { ...state, screen: 'develop-session', previousScreen: 'ticket-detail' };
    case 'DEVELOP_COMPLETE':
      return { ...state, screen: 'delivered', previousScreen: 'develop-session', developComplete: true };
    case 'VIEW_PREVIEW':
      return { ...state, screen: 'preview', previousScreen: 'delivered' };
    case 'OPEN_DECISION_LOGS':
      return { ...state, screen: 'decision-logs', previousScreen: state.screen };
    case 'OPEN_DECISION_LOG':
      return { ...state, screen: 'decision-log-detail', previousScreen: 'decision-logs', selectedRecordIndex: action.recordIndex };
    case 'OPEN_TICKETS':
      return { ...state, screen: 'ticket-list', previousScreen: state.screen };
    case 'RESET':
      return initialDemoState;
    default:
      return state;
  }
}

// Direction for slide transitions
export function getSlideDirection(from: DemoScreen | null, to: DemoScreen): 'left' | 'right' {
  const order: DemoScreen[] = ['ticket-list', 'decision-logs', 'decision-log-detail', 'ticket-detail', 'develop-session', 'delivered', 'preview'];
  const fromIdx = from ? order.indexOf(from) : -1;
  const toIdx = order.indexOf(to);
  return toIdx >= fromIdx ? 'left' : 'right';
}
```

- [ ] **Step 2: Create the mock data**

```typescript
// demo-data.ts

export interface DemoTag {
  id: string;
  name: string;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink';
}

export interface DemoTicket {
  id: string;
  slug: string;
  title: string;
  type: 'feature' | 'bug' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'defined' | 'refined' | 'approved' | 'executing' | 'delivered';
  tagIds: string[];
  assignee: string | null;
  updatedAt: string;
}

export interface DemoFolder {
  id: string;
  name: string;
  expanded: boolean;
  ticketIds: string[];
}

export interface DemoAcceptanceCriteria {
  given: string;
  when: string;
  then: string;
}

export interface DemoSolutionStep {
  title: string;
  description: string;
  file?: string;
}

export interface DemoTechSpec {
  problemStatement: {
    narrative: string;
    whyItMatters: string;
    assumptions: string[];
  };
  acceptanceCriteria: DemoAcceptanceCriteria[];
  inScope: string[];
  outOfScope: string[];
  solution: DemoSolutionStep[];
  apiEndpoints: {
    method: string;
    route: string;
    description: string;
  }[];
  dependencies: string[];
  testPlan: string;
}

export interface DemoSessionEvent {
  id: string;
  type: 'provisioning' | 'tool_use' | 'message' | 'summary';
  tool?: 'bash' | 'file_create' | 'file_edit' | 'read';
  label: string;
  content?: string;
  diff?: { additions: number; deletions: number };
  isCreate?: boolean;
  delayMs: number;
}

export interface DemoFileChange {
  path: string;
  additions: number;
  deletions: number;
}

export interface DemoDecisionLogRecord {
  ticketTitle: string;
  developer: string;
  submittedAt: string;
  submittedLabel: string;
  status: 'accepted' | 'changes_requested';
  filesChanged: DemoFileChange[];
  executionSummary: string;
  acceptanceCriteria: string[];
  decisions: { title: string; description: string }[];
  risks: { title: string; description: string }[];
  divergences: { area: string; intended: string; actual: string; justification: string }[];
  reviewNote: string | null;
}

// ── Tags ──
export const DEMO_TAGS: DemoTag[] = [
  { id: 'sprint1', name: 'sprint 1', color: 'green' },
  { id: 'security', name: 'security', color: 'red' },
  { id: 'backend', name: 'backend', color: 'blue' },
  { id: 'bug', name: 'bug', color: 'red' },
  { id: 'compliance', name: 'compliance', color: 'purple' },
];

// ── Tickets ──
export const DEMO_TICKETS: Record<string, DemoTicket> = {
  't1': { id: 't1', slug: 'FOR-127', title: 'Rate limit API responses to 100 req/min', type: 'feature', priority: 'low', status: 'approved', tagIds: ['sprint1'], assignee: 'Alex Kim', updatedAt: '2h ago' },
  't2': { id: 't2', slug: 'FOR-128', title: 'Add webhook events for ticket status changes', type: 'feature', priority: 'low', status: 'defined', tagIds: ['sprint1'], assignee: null, updatedAt: '5h ago' },
  't3': { id: 't3', slug: 'FOR-129', title: 'Fix session expiry not redirecting to login', type: 'bug', priority: 'low', status: 'defined', tagIds: [], assignee: null, updatedAt: '1d ago' },
  't4': { id: 't4', slug: 'FOR-130', title: 'Add SSO login with Google OAuth', type: 'feature', priority: 'low', status: 'defined', tagIds: [], assignee: null, updatedAt: '2d ago' },
  't5': { id: 't5', slug: 'FOR-131', title: 'Implement JWT refresh token rotation', type: 'feature', priority: 'high', status: 'approved', tagIds: ['sprint1', 'security'], assignee: 'Sarah Chen', updatedAt: '3h ago' },
  't6': { id: 't6', slug: 'FOR-132', title: 'Add role-based access control to endpoints', type: 'task', priority: 'medium', status: 'refined', tagIds: ['backend'], assignee: 'Alex Kim', updatedAt: '1d ago' },
  't7': { id: 't7', slug: 'FOR-133', title: 'Fix password reset email not sending', type: 'bug', priority: 'urgent', status: 'executing', tagIds: ['bug', 'sprint1'], assignee: 'Sarah Chen', updatedAt: '30m ago' },
  't8': { id: 't8', slug: 'FOR-134', title: 'Add user activity audit log', type: 'feature', priority: 'low', status: 'draft', tagIds: ['compliance'], assignee: null, updatedAt: '3d ago' },
};

// ── Folders ──
export const DEMO_FOLDERS: DemoFolder[] = [
  { id: 'f1', name: 'API & Integrations', expanded: true, ticketIds: ['t1', 't2', 't3', 't4'] },
  { id: 'f2', name: 'Auth & Users', expanded: true, ticketIds: ['t5', 't6', 't7', 't8'] },
  { id: 'f3', name: 'Before Recording', expanded: false, ticketIds: [] },
  { id: 'f4', name: 'Dashboard', expanded: false, ticketIds: ['x1'] },
  { id: 'f5', name: 'Onboarding', expanded: false, ticketIds: ['x2', 'x3'] },
  { id: 'f6', name: 'Profile', expanded: false, ticketIds: ['x4', 'x5'] },
  { id: 'f7', name: 'Tags', expanded: false, ticketIds: ['x6', 'x7'] },
];

// ── Detail ticket spec ──
export const DEMO_TICKET_SPEC: DemoTechSpec = {
  problemStatement: {
    narrative: 'The API currently has no rate limiting in place, allowing any client to make unlimited requests. This has led to several incidents where a single misconfigured client consumed excessive resources, degrading performance for all users.',
    whyItMatters: 'Without rate limiting, the API is vulnerable to abuse (intentional or accidental), leading to degraded service quality, increased infrastructure costs, and potential downtime during traffic spikes.',
    assumptions: [
      'Rate limits should be per-IP address initially, with per-API-key limiting added later',
      'The 100 req/min limit applies to all authenticated API endpoints',
      'Rate limit headers should follow the IETF draft standard (X-RateLimit-*)',
    ],
  },
  acceptanceCriteria: [
    { given: 'a client making API requests', when: 'they send fewer than 100 requests per minute', then: 'all requests succeed with 200 status and include X-RateLimit-Remaining header' },
    { given: 'a client making API requests', when: 'they exceed 100 requests per minute', then: 'subsequent requests return 429 Too Many Requests with Retry-After header' },
    { given: 'a rate-limited client', when: 'the rate limit window resets after 60 seconds', then: 'requests succeed again normally' },
    { given: 'any API response', when: 'the response is sent', then: 'it includes X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers' },
  ],
  inScope: [
    'Per-IP sliding window rate limiting',
    'Standard rate limit response headers',
    '429 status code with Retry-After header',
    'Rate limiter middleware for Express',
  ],
  outOfScope: [
    'Per-API-key rate limiting (Phase 2)',
    'Rate limit dashboard or analytics',
    'Dynamic rate limit configuration',
    'WebSocket connection rate limiting',
  ],
  solution: [
    { title: 'Create rate limiter middleware', description: 'Implement a sliding window rate limiter using express-rate-limit with in-memory store', file: 'src/middleware/rate-limiter.ts' },
    { title: 'Add rate limit headers', description: 'Configure standard X-RateLimit-* headers on all API responses', file: 'src/middleware/rate-limiter.ts' },
    { title: 'Register middleware on API routes', description: 'Apply the rate limiter to all /api/v1/* routes before route handlers', file: 'src/routes/api.ts' },
    { title: 'Add 429 error handler', description: 'Return a structured JSON error response when rate limit is exceeded', file: 'src/middleware/rate-limiter.ts' },
    { title: 'Write integration tests', description: 'Verify rate limiting behavior, header presence, and limit reset', file: 'tests/middleware/rate-limiter.test.ts' },
  ],
  apiEndpoints: [
    { method: 'GET', route: '/api/v1/*', description: 'All API endpoints — rate limited to 100 req/min per IP' },
  ],
  dependencies: ['express-rate-limit@^7.0.0'],
  testPlan: 'Unit tests for rate limiter logic. Integration tests verifying: (1) requests under limit succeed, (2) requests over limit return 429, (3) headers are present on all responses, (4) limit resets after window expires.',
};

// ── Develop session events (scripted animation) ──
export const DEMO_SESSION_EVENTS: DemoSessionEvent[] = [
  { id: 'e1', type: 'provisioning', label: 'Setting up environment...', delayMs: 0 },
  { id: 'e2', type: 'message', label: 'Analyzing ticket spec and acceptance criteria...', delayMs: 1500 },
  { id: 'e3', type: 'tool_use', tool: 'read', label: 'src/routes/api.ts', delayMs: 2000 },
  { id: 'e4', type: 'tool_use', tool: 'bash', label: 'mkdir -p src/middleware', delayMs: 3000 },
  { id: 'e5', type: 'tool_use', tool: 'file_create', label: 'src/middleware/rate-limiter.ts', isCreate: true, diff: { additions: 42, deletions: 0 }, content: `import rateLimit from 'express-rate-limit';\n\nexport const apiRateLimiter = rateLimit({\n  windowMs: 60 * 1000,\n  max: 100,\n  standardHeaders: true,\n  legacyHeaders: false,\n  handler: (req, res) => {\n    res.status(429).json({\n      error: 'Rate limit exceeded',\n      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),\n    });\n  },\n});`, delayMs: 3500 },
  { id: 'e6', type: 'tool_use', tool: 'file_edit', label: 'src/routes/api.ts', diff: { additions: 3, deletions: 0 }, content: `+ import { apiRateLimiter } from '../middleware/rate-limiter';\n  \n  const router = express.Router();\n+ router.use(apiRateLimiter);\n`, delayMs: 5500 },
  { id: 'e7', type: 'tool_use', tool: 'file_create', label: 'tests/middleware/rate-limiter.test.ts', isCreate: true, diff: { additions: 38, deletions: 0 }, delayMs: 6500 },
  { id: 'e8', type: 'tool_use', tool: 'bash', label: 'npm test -- --grep "rate limiter"', content: '  ✓ allows requests under limit (12ms)\n  ✓ returns 429 when limit exceeded (8ms)\n  ✓ includes rate limit headers (5ms)\n  ✓ resets after window expires (1004ms)\n\n  4 passing (1.03s)', delayMs: 7500 },
  { id: 'e9', type: 'tool_use', tool: 'bash', label: 'gh pr create --title "feat: rate limit API to 100 req/min"', content: 'Creating pull request for feat/rate-limit → main\n\nhttps://github.com/acme/api/pull/142', delayMs: 9000 },
  { id: 'e10', type: 'summary', label: 'Development complete', delayMs: 10000 },
];

export const DEMO_SESSION_SUMMARY = {
  filesChanged: 3,
  additions: 83,
  deletions: 0,
  branch: 'feat/rate-limit',
  prNumber: 142,
  prUrl: 'https://github.com/acme/api/pull/142',
  durationSeconds: 45,
  repoFullName: 'acme/api',
};

// ── Change record for delivered state ──
export const DEMO_CHANGE_RECORD = {
  executionSummary: 'Implemented sliding window rate limiter at 100 req/min using express-rate-limit. Added X-RateLimit-* headers to all API responses. Configured per-IP tracking with in-memory store. All 4 acceptance criteria verified with integration tests.',
  decisions: [
    { title: 'Sliding window algorithm', description: 'Chose sliding window over fixed window to prevent burst traffic at window boundaries' },
    { title: 'In-memory store', description: 'Used in-memory store for initial implementation; Redis store can be added for distributed deployments later' },
  ],
  risks: [
    { title: 'Memory usage under high traffic', description: 'In-memory store may consume significant memory with many unique IPs — monitor and migrate to Redis if needed' },
  ],
  filesChanged: [
    { path: 'src/middleware/rate-limiter.ts', additions: 42, deletions: 0 },
    { path: 'src/routes/api.ts', additions: 3, deletions: 0 },
    { path: 'tests/middleware/rate-limiter.test.ts', additions: 38, deletions: 0 },
  ] as DemoFileChange[],
  acceptanceCriteria: [
    'Requests under 100/min succeed with X-RateLimit-Remaining header',
    'Requests over 100/min return 429 with Retry-After header',
    'Rate limit resets after 60-second window',
    'All responses include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers',
  ],
  divergences: [] as { area: string; intended: string; actual: string; justification: string }[],
  status: 'awaiting_review' as const,
  reviewNote: null as string | null,
};

// ── Decision logs (records page) ──
export const DEMO_DECISION_LOGS: DemoDecisionLogRecord[] = [
  {
    ticketTitle: 'Add pagination to user list API',
    developer: 'Sarah Chen',
    submittedAt: '2 days ago',
    submittedLabel: 'Apr 1, 2026',
    status: 'accepted',
    filesChanged: [
      { path: 'src/controllers/users.ts', additions: 45, deletions: 12 },
      { path: 'src/services/user.service.ts', additions: 32, deletions: 8 },
      { path: 'src/dto/pagination.dto.ts', additions: 18, deletions: 0 },
      { path: 'src/utils/query-builder.ts', additions: 28, deletions: 10 },
      { path: 'tests/controllers/users.test.ts', additions: 19, deletions: 8 },
    ],
    executionSummary: 'Added cursor-based pagination to the user list endpoint. Replaced offset pagination with cursor-based approach for better performance with large datasets. Added PaginationDto for consistent query parameter handling across all list endpoints.',
    acceptanceCriteria: [
      'GET /users returns paginated results with cursor',
      'Response includes next_cursor and has_more fields',
      'Default page size is 25, max is 100',
    ],
    decisions: [
      { title: 'Cursor-based over offset', description: 'Cursor pagination avoids the skip+limit performance cliff on large tables' },
      { title: 'Shared PaginationDto', description: 'Created a reusable DTO so other list endpoints can adopt the same pattern' },
    ],
    risks: [],
    divergences: [],
    reviewNote: null,
  },
  {
    ticketTitle: 'Fix CORS headers on staging',
    developer: 'Alex Kim',
    submittedAt: '5 days ago',
    submittedLabel: 'Mar 29, 2026',
    status: 'accepted',
    filesChanged: [
      { path: 'src/config/cors.ts', additions: 15, deletions: 5 },
      { path: 'src/app.ts', additions: 9, deletions: 3 },
    ],
    executionSummary: 'Fixed CORS misconfiguration on staging that blocked requests from the preview deployment domain. Updated the allowed origins list to include wildcard staging subdomains and added proper preflight handling.',
    acceptanceCriteria: [
      'Staging frontend can make API requests without CORS errors',
      'Production CORS policy remains unchanged',
    ],
    decisions: [
      { title: 'Environment-based CORS config', description: 'Moved CORS origins to environment variables so each deployment can configure independently' },
    ],
    risks: [],
    divergences: [],
    reviewNote: null,
  },
  {
    ticketTitle: 'Migrate auth tokens to Redis',
    developer: 'Sarah Chen',
    submittedAt: '1 week ago',
    submittedLabel: 'Mar 27, 2026',
    status: 'changes_requested',
    filesChanged: [
      { path: 'src/auth/token.service.ts', additions: 89, deletions: 34 },
      { path: 'src/auth/session.store.ts', additions: 62, deletions: 0 },
      { path: 'src/config/redis.ts', additions: 28, deletions: 0 },
      { path: 'src/auth/auth.module.ts', additions: 12, deletions: 4 },
      { path: 'tests/auth/token.service.test.ts', additions: 56, deletions: 22 },
      { path: 'tests/auth/session.store.test.ts', additions: 38, deletions: 0 },
      { path: 'docker-compose.yml', additions: 15, deletions: 0 },
      { path: 'src/auth/token.types.ts', additions: 10, deletions: 6 },
    ],
    executionSummary: 'Migrated session token storage from in-memory Map to Redis. Created a dedicated SessionStore class with TTL-based expiry. Added Redis configuration and health check. Updated docker-compose for local development.',
    acceptanceCriteria: [
      'Tokens are stored in Redis with TTL matching session expiry',
      'Existing sessions are invalidated on deploy (clean migration)',
      'Redis connection failure falls back gracefully',
    ],
    decisions: [
      { title: 'Dedicated SessionStore class', description: 'Encapsulated Redis operations behind a clean interface for testability' },
      { title: 'No migration of existing tokens', description: 'All in-memory tokens are invalidated on deploy — users re-authenticate once' },
    ],
    risks: [
      { title: 'Redis single point of failure', description: 'If Redis goes down, all active sessions are lost. Sentinel or cluster setup recommended for production.' },
    ],
    divergences: [
      { area: 'Fallback behavior', intended: 'Graceful degradation to in-memory on Redis failure', actual: 'Returns 503 on Redis connection failure', justification: 'In-memory fallback would create split-brain state where some requests see tokens and others don\'t. Failing fast is safer and more predictable.' },
    ],
    reviewNote: 'The fallback behavior divergence needs discussion — the 503 approach may be too aggressive for our SLA. Consider a read-through cache with short TTL as a compromise.',
  },
];

// ── Preview terminal content ──
export const DEMO_PREVIEW_LINES = [
  { type: 'command' as const, text: '$ curl -i https://api.example.com/v1/users' },
  { type: 'output' as const, text: '' },
  { type: 'header' as const, text: 'HTTP/1.1 200 OK' },
  { type: 'header' as const, text: 'X-RateLimit-Limit: 100' },
  { type: 'header' as const, text: 'X-RateLimit-Remaining: 98' },
  { type: 'header' as const, text: 'X-RateLimit-Reset: 1712150400' },
  { type: 'output' as const, text: '' },
  { type: 'json' as const, text: '{"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}' },
  { type: 'output' as const, text: '' },
  { type: 'comment' as const, text: '# After 101 requests...' },
  { type: 'output' as const, text: '' },
  { type: 'command' as const, text: '$ curl -i https://api.example.com/v1/users' },
  { type: 'output' as const, text: '' },
  { type: 'error-header' as const, text: 'HTTP/1.1 429 Too Many Requests' },
  { type: 'header' as const, text: 'Retry-After: 60' },
  { type: 'output' as const, text: '' },
  { type: 'error-json' as const, text: '{"error": "Rate limit exceeded. Try again in 60 seconds."}' },
];
```

- [ ] **Step 3: Commit**

```bash
git add client/src/landing/components/demo/demo-data.ts client/src/landing/components/demo/demo-state.ts
git commit -m "feat(demo): add mock data and state machine for interactive hero demo"
```

---

### Task 2: Browser Chrome Frame

**Files:**
- Create: `client/src/landing/components/demo/DemoBrowserChrome.tsx`

- [ ] **Step 1: Create the browser chrome wrapper**

This component wraps any demo content in a fake browser window with traffic light dots, a URL bar, and rounded border.

```tsx
// DemoBrowserChrome.tsx
'use client';

import { type ReactNode } from 'react';
import type { DemoScreen } from './demo-state';

const SCREEN_URLS: Record<DemoScreen, string> = {
  'ticket-list': 'app.forge-ai.dev/tickets',
  'ticket-detail': 'app.forge-ai.dev/tickets/FOR-127',
  'develop-session': 'app.forge-ai.dev/tickets/FOR-127',
  'delivered': 'app.forge-ai.dev/tickets/FOR-127',
  'preview': 'app.forge-ai.dev/tickets/FOR-127',
  'decision-logs': 'app.forge-ai.dev/records',
  'decision-log-detail': 'app.forge-ai.dev/records',
};

interface Props {
  screen: DemoScreen;
  children: ReactNode;
}

export function DemoBrowserChrome({ screen, children }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        {/* URL bar */}
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-[var(--bg)] text-[11px] text-[var(--text-tertiary)] font-mono min-w-[240px] text-center">
            {SCREEN_URLS[screen]}
          </div>
        </div>
        {/* Spacer to balance traffic lights */}
        <div className="w-[52px]" />
      </div>
      {/* Content */}
      <div className="relative overflow-hidden" style={{ height: '520px' }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/DemoBrowserChrome.tsx
git commit -m "feat(demo): add browser chrome frame component"
```

---

### Task 3: Demo Sidebar

**Files:**
- Create: `client/src/landing/components/demo/DemoSidebar.tsx`

- [ ] **Step 1: Create the collapsed sidebar**

```tsx
// DemoSidebar.tsx
'use client';

import { LayoutGrid, ClipboardList, Settings, Search, MessageCircle } from 'lucide-react';
import type { DemoScreen } from './demo-state';

interface Props {
  screen: DemoScreen;
  onOpenTickets: () => void;
  onOpenDecisionLogs: () => void;
}

const NAV_ITEMS = [
  { id: 'tickets', icon: LayoutGrid, label: 'Tickets', screens: ['ticket-list', 'ticket-detail', 'develop-session', 'delivered', 'preview'] as DemoScreen[] },
  { id: 'records', icon: ClipboardList, label: 'Decision Logs', screens: ['decision-logs', 'decision-log-detail'] as DemoScreen[] },
] as const;

const STATIC_ITEMS = [
  { icon: Settings, label: 'Settings' },
  { icon: Search, label: 'Search' },
  { icon: MessageCircle, label: 'Feedback' },
] as const;

export function DemoSidebar({ screen, onOpenTickets, onOpenDecisionLogs }: Props) {
  return (
    <div className="w-16 h-full bg-[var(--bg)] flex flex-col border-r border-[var(--border-subtle)] flex-shrink-0">
      {/* Avatar */}
      <div className="px-2.5 py-3 flex justify-center">
        <div className="w-7 h-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[11px] font-medium text-[var(--text-tertiary)]">
          A
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.screens.includes(screen);
            const onClick = item.id === 'tickets' ? onOpenTickets : onOpenDecisionLogs;
            return (
              <li key={item.id}>
                <button
                  onClick={onClick}
                  className={`w-full flex items-center justify-center rounded-md px-2.5 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-hover)] text-[var(--text)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        <div className="my-3 mx-2 h-px bg-[var(--border-subtle)]" />

        {/* Static (non-clickable) items */}
        <ul className="space-y-1">
          {STATIC_ITEMS.map((item) => (
            <li key={item.label}>
              <div
                className="w-full flex items-center justify-center rounded-md px-2.5 py-1.5 text-[var(--text-tertiary)]/40 cursor-default"
                title={item.label}
              >
                <item.icon className="h-3.5 w-3.5" />
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/DemoSidebar.tsx
git commit -m "feat(demo): add collapsed sidebar component"
```

---

### Task 4: Ticket List Screen

**Files:**
- Create: `client/src/landing/components/demo/DemoTicketList.tsx`

- [ ] **Step 1: Create the ticket list component**

This replicates the real ticket list with folders, ticket rows, status dots, priority labels, and tag pills. All rows are clickable and dispatch `OPEN_TICKET`.

```tsx
// DemoTicketList.tsx
'use client';

import { ChevronDown, FolderOpen, Plus, Circle, Bug, Zap, CheckSquare } from 'lucide-react';
import { DEMO_FOLDERS, DEMO_TICKETS, DEMO_TAGS } from './demo-data';
import type { DemoTicket } from './demo-data';

interface Props {
  onOpenTicket: () => void;
  hasInteracted: boolean;
}

const STATUS_DOTS: Record<string, string> = {
  draft: 'bg-[var(--text-tertiary)]/50',
  defined: 'bg-purple-500',
  refined: 'bg-amber-500',
  approved: 'bg-emerald-500',
  executing: 'bg-blue-500',
  delivered: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  defined: 'Define',
  refined: 'Refined',
  approved: 'Ready',
  executing: 'In Progress',
  delivered: 'Delivered',
};

const TAG_COLORS: Record<string, string> = {
  red: 'bg-red-500/15 text-red-500',
  orange: 'bg-orange-500/15 text-orange-500',
  yellow: 'bg-yellow-500/15 text-yellow-500',
  green: 'bg-green-500/15 text-green-500',
  teal: 'bg-teal-500/15 text-teal-500',
  blue: 'bg-blue-500/15 text-blue-500',
  purple: 'bg-purple-500/15 text-purple-500',
  pink: 'bg-pink-500/15 text-pink-500',
};

function TypeIcon({ type }: { type: DemoTicket['type'] }) {
  switch (type) {
    case 'bug': return <Bug className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
    case 'task': return <CheckSquare className="h-3.5 w-3.5 text-[var(--text-tertiary)] flex-shrink-0" />;
    default: return <Circle className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />;
  }
}

export function DemoTicketList({ onOpenTicket, hasInteracted }: Props) {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_60px] items-center px-4 py-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider select-none border-b border-[var(--border-subtle)]">
        <span className="pl-6">Title</span>
        <span>Status</span>
        <span>Priority</span>
      </div>

      {/* Folders */}
      {DEMO_FOLDERS.map((folder) => {
        const tickets = folder.ticketIds
          .map((id) => DEMO_TICKETS[id])
          .filter(Boolean);
        const ticketCount = folder.ticketIds.length;

        return (
          <div key={folder.id}>
            {/* Folder header */}
            <div className="flex items-center gap-2 px-2 py-2 hover:bg-[var(--bg-hover)] transition-all border-b border-[var(--border-subtle)] cursor-default">
              <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${!folder.expanded ? '-rotate-90' : ''}`} />
              <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              <h3 className="text-sm font-medium text-[var(--text-secondary)] truncate flex-1">{folder.name}</h3>
              <span className="text-xs font-medium text-[var(--text-tertiary)] flex-shrink-0 tabular-nums">{ticketCount}</span>
            </div>

            {/* Ticket rows */}
            {folder.expanded && tickets.map((ticket, idx) => {
              const tags = ticket.tagIds.map((id) => DEMO_TAGS.find((t) => t.id === id)).filter(Boolean);
              const showPulse = !hasInteracted && folder.id === 'f1' && idx === 0;

              return (
                <div
                  key={ticket.id}
                  onClick={onOpenTicket}
                  className="group grid grid-cols-[1fr_80px_60px] items-center px-4 py-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  {/* Title cell */}
                  <div className={`flex items-center gap-2 py-2.5 min-w-0 pr-3 ${showPulse ? 'relative' : ''}`}>
                    {showPulse && (
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    <TypeIcon type={ticket.type} />
                    <span className="text-[13px] truncate group-hover:text-[var(--text)] transition-colors font-normal text-[var(--text-secondary)]">
                      {ticket.title}
                    </span>
                    {ticket.status === 'draft' && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-hover)]">
                        Draft
                      </span>
                    )}
                    {tags.map((tag) => tag && (
                      <span key={tag.id} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${TAG_COLORS[tag.color]}`}>
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 py-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOTS[ticket.status]}`} />
                    <span className="text-[11px] text-[var(--text-tertiary)] truncate">{STATUS_LABELS[ticket.status]}</span>
                  </div>

                  {/* Priority */}
                  <div className="py-2.5">
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {ticket.priority === 'urgent' ? 'Urgent' : ticket.priority === 'high' ? 'High' : ticket.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* New ticket row */}
            {folder.expanded && (
              <div className="flex items-center gap-2 pl-10 pr-4 py-2 text-xs text-[var(--text-tertiary)]/40 cursor-default">
                <Plus className="h-3 w-3" />
                <span>New ticket</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/DemoTicketList.tsx
git commit -m "feat(demo): add ticket list screen with folders, tags, and status indicators"
```

---

### Task 5: Ticket Detail Screen

**Files:**
- Create: `client/src/landing/components/demo/DemoTicketDetail.tsx`

- [ ] **Step 1: Create the ticket detail component**

This replicates the ticket detail page with header, metadata, overview card, and tabbed content (Spec, Design, Technical). Includes the "Develop" button with pulsing hint.

```tsx
// DemoTicketDetail.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft, Zap, FileText, Palette, Code2, ChevronDown, Hash, Circle } from 'lucide-react';
import { DEMO_TICKETS, DEMO_TAGS, DEMO_TICKET_SPEC } from './demo-data';

interface Props {
  onBack: () => void;
  onStartDevelop: () => void;
  hasInteracted: boolean;
  developComplete: boolean;
}

const LIFECYCLE_STEPS = ['Draft', 'Defined', 'Refined', 'Approved', 'Executing', 'Delivered'];
const CURRENT_STEP_IDX = 3; // Approved

type Tab = 'spec' | 'design' | 'technical';

export function DemoTicketDetail({ onBack, onStartDevelop, hasInteracted, developComplete }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('spec');
  const ticket = DEMO_TICKETS['t1'];
  const tags = ticket.tagIds.map((id) => DEMO_TAGS.find((t) => t.id === id)).filter(Boolean);
  const spec = DEMO_TICKET_SPEC;

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: 'spec', label: 'Spec', icon: FileText },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'technical', label: 'Technical', icon: Code2 },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          {/* Develop button */}
          <button
            onClick={onStartDevelop}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              developComplete
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--bg-active)]'
            }`}
          >
            {!hasInteracted && !developComplete && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            )}
            <Zap className={`w-3.5 h-3.5 ${developComplete ? '' : 'text-emerald-500'}`} />
            {developComplete ? 'View Development' : 'Develop'}
          </button>
        </div>

        {/* Title */}
        <h1 className="text-[15px] font-medium text-[var(--text-secondary)] leading-snug">
          {ticket.title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]">
            <Hash className="h-3 w-3" />
            {ticket.slug}
          </span>
          <span className="text-[var(--text-tertiary)]/30">·</span>
          {tags.map((tag) => tag && (
            <span key={tag.id} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
              tag.color === 'green' ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-500'
            }`}>
              {tag.name}
            </span>
          ))}
          <span className="text-[var(--text-tertiary)]/30">·</span>
          <span className="text-[10px] text-[var(--text-tertiary)]">Created by Alex Kim</span>
        </div>

        {/* Overview card */}
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Assignee */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-medium text-violet-400">
                AK
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Alex Kim</span>
            </div>
            {/* Progress dots + Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {LIFECYCLE_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-colors ${i <= CURRENT_STEP_IDX ? 'w-4 bg-blue-500' : 'w-1.5 bg-[var(--text-tertiary)]/20'}`} />
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border-subtle)]">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-[var(--text)] border-[var(--text)]'
                    : 'text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="pb-6">
          {activeTab === 'spec' && (
            <div className="divide-y divide-[var(--border-subtle)] [&>*]:py-3 [&>*:first-child]:pt-0">
              {/* Problem Statement */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Problem Statement
                </h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  {spec.problemStatement.narrative}
                </p>
                <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase mb-1">Why it matters</p>
                  <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">{spec.problemStatement.whyItMatters}</p>
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Acceptance Criteria <span className="text-[var(--text-tertiary)] font-normal">({spec.acceptanceCriteria.length})</span>
                </h3>
                <ul className="space-y-2">
                  {spec.acceptanceCriteria.map((ac, idx) => (
                    <li key={idx} className="bg-[var(--bg-subtle)] rounded-lg px-4 py-3 space-y-1 text-[13px] text-[var(--text-secondary)]">
                      <p><span className="font-semibold text-[var(--text)] mr-1">Given</span>{ac.given}</p>
                      <p><span className="font-semibold text-[var(--text)] mr-1">When</span>{ac.when}</p>
                      <p><span className="font-semibold text-[var(--text)] mr-1">Then</span>{ac.then}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scope */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                    <h4 className="text-[10px] font-medium text-[var(--text)] uppercase">In Scope</h4>
                    <ul className="space-y-1 text-[12px] text-[var(--text-secondary)]">
                      {spec.inScope.map((item, i) => (
                        <li key={i}><span className="text-[var(--text-tertiary)] mr-2">-</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                    <h4 className="text-[10px] font-medium text-[var(--text)] uppercase">Out of Scope</h4>
                    <ul className="space-y-1 text-[12px] text-[var(--text-secondary)]">
                      {spec.outOfScope.map((item, i) => (
                        <li key={i}><span className="text-[var(--text-tertiary)] mr-2">-</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Solution Steps */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Solution
                </h3>
                <ol className="space-y-3">
                  {spec.solution.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-[13px]">
                      <span className="text-[var(--text-tertiary)] font-mono text-[11px] mt-0.5 flex-shrink-0">{idx + 1}.</span>
                      <div>
                        <p className="font-medium text-[var(--text)]">{step.title}</p>
                        <p className="text-[var(--text-secondary)] text-[12px] mt-0.5">{step.description}</p>
                        {step.file && (
                          <code className="text-[11px] text-violet-400 font-mono mt-0.5 inline-block">{step.file}</code>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Palette className="h-8 w-8 text-[var(--text-tertiary)]/30 mb-3" />
              <p className="text-[13px] text-[var(--text-secondary)]">Design References</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">No design references attached</p>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="divide-y divide-[var(--border-subtle)] [&>*]:py-3 [&>*:first-child]:pt-0">
              {/* API Endpoints */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  API Endpoints
                </h3>
                {spec.apiEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
                    <span className="font-mono font-medium text-emerald-400">{ep.method}</span>
                    <span className="font-mono text-[var(--text-secondary)]">{ep.route}</span>
                    <span className="text-[var(--text-tertiary)] ml-2">— {ep.description}</span>
                  </div>
                ))}
              </div>
              {/* Dependencies */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Dependencies
                </h3>
                <ul className="space-y-1">
                  {spec.dependencies.map((dep, i) => (
                    <li key={i} className="text-[12px] font-mono text-violet-400">{dep}</li>
                  ))}
                </ul>
              </div>
              {/* Test Plan */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Test Plan
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{spec.testPlan}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/DemoTicketDetail.tsx
git commit -m "feat(demo): add ticket detail screen with spec tabs and develop button"
```

---

### Task 6: Develop Session Animation

**Files:**
- Create: `client/src/landing/components/demo/DemoDevelopSession.tsx`

- [ ] **Step 1: Create the develop session component**

This shows the animated terminal replay — events stream in sequentially using `setInterval`, matching the real session monitor's visual style.

```tsx
// DemoDevelopSession.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Terminal, FilePlus, FileText, Search, Check, Sparkles, X } from 'lucide-react';
import { DEMO_SESSION_EVENTS, DEMO_SESSION_SUMMARY } from './demo-data';
import type { DemoSessionEvent } from './demo-data';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

function ToolIcon({ tool }: { tool?: DemoSessionEvent['tool'] }) {
  switch (tool) {
    case 'bash': return <Terminal className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    case 'file_create': return <FilePlus className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    case 'file_edit': return <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    case 'read': return <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
    default: return <Sparkles className="w-3.5 h-3.5 text-violet-500" />;
  }
}

export function DemoDevelopSession({ onComplete, onClose }: Props) {
  const [visibleEvents, setVisibleEvents] = useState<DemoSessionEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const eventTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Schedule events
    DEMO_SESSION_EVENTS.forEach((event) => {
      const timer = setTimeout(() => {
        setVisibleEvents((prev) => [...prev, event]);
        // Auto-scroll
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        });
        if (event.type === 'summary') {
          setIsComplete(true);
          if (timerRef.current) clearInterval(timerRef.current);
          setElapsed(DEMO_SESSION_SUMMARY.durationSeconds);
        }
      }, event.delayMs);
      eventTimersRef.current.push(timer);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      eventTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="absolute inset-y-0 right-0 w-[340px] bg-[var(--bg)] border-l border-[var(--border-subtle)] flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--text)]">Cloud Develop</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">Rate limit API responses to 100 req/min</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--bg-hover)]">
          <X className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[12px] font-medium text-emerald-500">Complete</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span className="text-[12px] font-medium text-blue-400">Working...</span>
            </>
          )}
        </div>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)] tabular-nums">{formatTime(elapsed)}</span>
      </div>

      {/* Events stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2">
        {visibleEvents.map((event) => {
          if (event.type === 'provisioning') {
            return (
              <div key={event.id} className="flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>{event.label}</span>
              </div>
            );
          }

          if (event.type === 'message') {
            return (
              <div key={event.id} className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{event.label}</p>
              </div>
            );
          }

          if (event.type === 'tool_use') {
            return (
              <div key={event.id} className="ml-4">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] bg-[var(--bg-hover)]/50">
                  <ToolIcon tool={event.tool} />
                  <span className="text-[var(--text-secondary)] truncate flex-1 font-mono">{event.label}</span>
                  {event.isCreate && (
                    <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">new</span>
                  )}
                  {event.diff && (
                    <span className="flex gap-1 text-[10px]">
                      <span className="text-emerald-500">+{event.diff.additions}</span>
                      {event.diff.deletions > 0 && <span className="text-red-500">-{event.diff.deletions}</span>}
                    </span>
                  )}
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                {event.content && (
                  <div className="ml-5 mt-1 rounded-md border border-[var(--border-subtle)] overflow-hidden">
                    <pre className="text-[10px] font-mono p-2 overflow-x-auto text-[var(--text-tertiary)] leading-relaxed whitespace-pre-wrap">
                      {event.content.split('\n').map((line, i) => (
                        <div key={i} className={
                          line.startsWith('+') ? 'text-emerald-400 bg-emerald-500/5' :
                          line.startsWith('-') ? 'text-red-400 bg-red-500/5' :
                          line.startsWith('  ✓') ? 'text-emerald-400' :
                          line.includes('passing') ? 'text-emerald-400' :
                          line.includes('github.com') ? 'text-blue-400' : ''
                        }>
                          {line}
                        </div>
                      ))}
                    </pre>
                  </div>
                )}
              </div>
            );
          }

          if (event.type === 'summary') {
            const s = DEMO_SESSION_SUMMARY;
            return (
              <div key={event.id} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 space-y-2 mt-3">
                <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-500">
                  <Check className="w-3.5 h-3.5" />
                  <span>Development complete</span>
                  <span className="text-emerald-500/50">·</span>
                  <span>{formatTime(s.durationSeconds)}</span>
                </div>
                <div className="flex gap-4 text-[11px]">
                  <div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Files</div>
                    <div className="text-[var(--text)] font-medium">{s.filesChanged}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Changes</div>
                    <div className="font-medium">
                      <span className="text-emerald-500">+{s.additions}</span>
                      {s.deletions > 0 && <span className="text-red-500 ml-1">-{s.deletions}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onComplete}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors text-[12px] font-medium text-emerald-400 mt-1"
                >
                  View Change Record →
                </button>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/DemoDevelopSession.tsx
git commit -m "feat(demo): add animated develop session with streaming tool events"
```

---

### Task 7: Delivered Screen (Change Record)

**Files:**
- Create: `client/src/landing/components/demo/DemoDelivered.tsx`

- [ ] **Step 1: Create the delivered/change record component**

Shows the ticket in delivered state with the Change Record — summary, decisions, file changes, and "View Preview" button.

```tsx
// DemoDelivered.tsx
'use client';

import { ArrowLeft, CheckCircle2, Play, GitPullRequest, GitBranch, FileCode2 } from 'lucide-react';
import { DEMO_CHANGE_RECORD, DEMO_SESSION_SUMMARY } from './demo-data';

interface Props {
  onBack: () => void;
  onViewPreview: () => void;
}

export function DemoDelivered({ onBack, onViewPreview }: Props) {
  const cr = DEMO_CHANGE_RECORD;
  const summary = DEMO_SESSION_SUMMARY;
  const totalAdded = cr.filesChanged.reduce((s, f) => s + f.additions, 0);
  const totalRemoved = cr.filesChanged.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
            Delivered
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[15px] font-medium text-[var(--text-secondary)]">Rate limit API responses to 100 req/min</h1>

        {/* Tab indicator */}
        <div className="border-b border-[var(--border-subtle)]">
          <div className="flex">
            <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[var(--text)] border-b-2 border-[var(--text)]">
              <GitPullRequest className="h-3.5 w-3.5" />
              Runs
            </button>
          </div>
        </div>

        {/* Change Record */}
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          {/* Quick stats */}
          <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-5 text-[10px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <FileCode2 className="w-3 h-3" />
              <span className="text-[var(--text-secondary)] font-medium">{cr.filesChanged.length}</span>
              <span>files</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-emerald-500/70">+{totalAdded}</span>
              {totalRemoved > 0 && <span className="font-medium text-red-500/70">-{totalRemoved}</span>}
            </div>
          </div>

          <div className="px-4 py-3 space-y-4">
            {/* Summary */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">Summary</div>
              <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{cr.executionSummary}</div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Acceptance Criteria ({cr.acceptanceCriteria.length})
              </div>
              <div className="space-y-1">
                {cr.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50 shrink-0 mt-px" />
                    <span className="text-[var(--text-secondary)]">{ac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decisions */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
              <div className="space-y-2">
                {cr.decisions.map((d, i) => (
                  <div key={i} className="flex gap-2 text-[12px]">
                    <span className="shrink-0">💡</span>
                    <div>
                      <span className="font-medium text-[var(--text)]">{d.title}</span>
                      <span className="text-[var(--text-tertiary)]"> — {d.description}</span>
                    </div>
                  </div>
                ))}
                {cr.risks.map((r, i) => (
                  <div key={i} className="flex gap-2 text-[12px]">
                    <span className="shrink-0">⚠️</span>
                    <div>
                      <span className="font-medium text-[var(--text)]">{r.title}</span>
                      <span className="text-[var(--text-tertiary)]"> — {r.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File changes */}
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Files changed ({cr.filesChanged.length})
              </div>
              <div className="space-y-0.5 font-mono text-[11px]">
                {cr.filesChanged.map((f, i) => (
                  <div key={i} className="flex justify-between text-[var(--text-tertiary)]">
                    <span className="truncate">{f.path}</span>
                    <span className="shrink-0 ml-2">
                      <span className="text-emerald-500">+{f.additions}</span>
                      {f.deletions > 0 && <span className="text-red-500 ml-1">-{f.deletions}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub links + Preview */}
            <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-1.5 text-violet-400">
                <GitPullRequest className="w-3 h-3" />
                PR #{summary.prNumber}
              </span>
              <span className="inline-flex items-center gap-1.5 text-purple-400 font-mono">
                <GitBranch className="w-3 h-3" />
                {summary.branch}
              </span>
              <button
                onClick={onViewPreview}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors ml-auto text-[11px] font-medium"
              >
                <Play className="w-3 h-3" fill="currentColor" />
                View Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/DemoDelivered.tsx
git commit -m "feat(demo): add delivered screen with change record display"
```

---

### Task 8: Preview Terminal

**Files:**
- Create: `client/src/landing/components/demo/DemoPreview.tsx`

- [ ] **Step 1: Create the preview component**

Illustrated terminal showing curl commands and rate limiter responses.

```tsx
// DemoPreview.tsx
'use client';

import { ArrowLeft, Terminal } from 'lucide-react';
import { DEMO_PREVIEW_LINES } from './demo-data';

interface Props {
  onBack: () => void;
}

const LINE_STYLES: Record<string, string> = {
  command: 'text-[var(--text)] font-semibold',
  output: '',
  header: 'text-blue-400',
  json: 'text-emerald-400',
  comment: 'text-[var(--text-tertiary)] italic',
  'error-header': 'text-red-400 font-semibold',
  'error-json': 'text-red-400',
};

export function DemoPreview({ onBack }: Props) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Change Record</span>
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <Terminal className="h-3.5 w-3.5" />
          <span>Preview</span>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 bg-[#0d1117] rounded-lg m-3 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed">
        {DEMO_PREVIEW_LINES.map((line, i) => (
          <div key={i} className={LINE_STYLES[line.type] || 'text-[var(--text-tertiary)]'}>
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/DemoPreview.tsx
git commit -m "feat(demo): add preview terminal with curl output illustration"
```

---

### Task 9: Decision Logs Screen

**Files:**
- Create: `client/src/landing/components/demo/DemoDecisionLogs.tsx`
- Create: `client/src/landing/components/demo/DemoDecisionLogDetail.tsx`

- [ ] **Step 1: Create the decision logs list**

```tsx
// DemoDecisionLogs.tsx
'use client';

import { FileCode2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEMO_DECISION_LOGS } from './demo-data';

interface Props {
  onOpenRecord: (index: number) => void;
}

export function DemoDecisionLogs({ onOpenRecord }: Props) {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-sm font-semibold text-[var(--text)]">Decision Logs</h1>
          <p className="text-[10px] text-[var(--text-tertiary)]">Click a log to view details</p>
        </div>

        {/* Records list */}
        <div className="space-y-1">
          {DEMO_DECISION_LOGS.map((record, idx) => {
            const totalAdded = record.filesChanged.reduce((s, f) => s + f.additions, 0);
            const totalRemoved = record.filesChanged.reduce((s, f) => s + f.deletions, 0);

            return (
              <div
                key={idx}
                onClick={() => onOpenRecord(idx)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                {/* Status dot */}
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  record.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors truncate">
                    {record.ticketTitle}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                    <span>{record.developer}</span>
                    <span className="opacity-30">·</span>
                    <span>{record.submittedAt}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-[var(--text-tertiary)]">
                  <div className="flex items-center gap-1">
                    <FileCode2 className="w-3 h-3" />
                    <span>{record.filesChanged.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500/70">+{totalAdded}</span>
                    <span className="text-red-500/70">-{totalRemoved}</span>
                  </div>
                  {record.status === 'accepted' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/50" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500/50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the decision log detail**

```tsx
// DemoDecisionLogDetail.tsx
'use client';

import { ArrowLeft, CheckCircle2, FileCode2, ExternalLink } from 'lucide-react';
import { DEMO_DECISION_LOGS } from './demo-data';

interface Props {
  recordIndex: number;
  onBack: () => void;
}

export function DemoDecisionLogDetail({ recordIndex, onBack }: Props) {
  const record = DEMO_DECISION_LOGS[recordIndex];
  if (!record) return null;

  const totalAdded = record.filesChanged.reduce((s, f) => s + f.additions, 0);
  const totalRemoved = record.filesChanged.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 py-3 space-y-3">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Decision Logs</span>
        </button>

        {/* Header card */}
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-[9px] uppercase tracking-wider font-medium ${record.status === 'accepted' ? 'text-emerald-500/60' : 'text-amber-500/60'}`}>
                {record.status === 'accepted' ? 'Accepted' : 'Changes Requested'}
              </span>
            </div>
            <div className="text-[13px] font-medium text-[var(--text)]">{record.ticketTitle}</div>
            <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-2">
              <span>{record.submittedLabel}</span>
              <span className="opacity-30">·</span>
              <span>{record.developer}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center gap-5 text-[10px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <FileCode2 className="w-3 h-3" />
              <span className="text-[var(--text-secondary)] font-medium">{record.filesChanged.length}</span>
              <span>files</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-emerald-500/70">+{totalAdded}</span>
              {totalRemoved > 0 && <span className="font-medium text-red-500/70">-{totalRemoved}</span>}
            </div>
          </div>

          <div className="px-4 py-3 space-y-4">
            {/* Summary */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">Summary</div>
              <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{record.executionSummary}</div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Acceptance Criteria ({record.acceptanceCriteria.length})
              </div>
              <div className="space-y-1">
                {record.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-green-500/50 shrink-0 mt-px" />
                    <span className="text-[var(--text-secondary)]">{ac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review note */}
            {record.reviewNote && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-red-500/70 font-medium mb-0.5">Review Note</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{record.reviewNote}</div>
              </div>
            )}

            {/* Divergences */}
            {record.divergences.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                  Divergences ({record.divergences.length})
                </div>
                <div className="space-y-2">
                  {record.divergences.map((d, i) => (
                    <div key={i} className="bg-amber-500/5 border border-amber-500/10 rounded-md px-3 py-2 text-[11px] space-y-1">
                      <div className="font-medium text-amber-400">{d.area}</div>
                      <div className="text-[var(--text-tertiary)]"><span className="text-[var(--text-secondary)]">Intended:</span> {d.intended}</div>
                      <div className="text-[var(--text-tertiary)]"><span className="text-[var(--text-secondary)]">Actual:</span> {d.actual}</div>
                      <div className="text-[var(--text-tertiary)]"><span className="text-[var(--text-secondary)]">Justification:</span> {d.justification}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {(record.decisions.length > 0 || record.risks.length > 0) && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">Events</div>
                <div className="space-y-1.5">
                  {record.decisions.map((d, i) => (
                    <div key={`d${i}`} className="flex gap-2 text-[11px]">
                      <span className="shrink-0">💡</span>
                      <div><span className="font-medium text-[var(--text)]">{d.title}</span> <span className="text-[var(--text-tertiary)]">— {d.description}</span></div>
                    </div>
                  ))}
                  {record.risks.map((r, i) => (
                    <div key={`r${i}`} className="flex gap-2 text-[11px]">
                      <span className="shrink-0">⚠️</span>
                      <div><span className="font-medium text-[var(--text)]">{r.title}</span> <span className="text-[var(--text-tertiary)]">— {r.description}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files changed */}
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1.5">
                Files changed ({record.filesChanged.length})
              </div>
              <div className="space-y-0.5 font-mono text-[10px]">
                {record.filesChanged.map((f, i) => (
                  <div key={i} className="flex justify-between text-[var(--text-tertiary)]">
                    <span className="truncate">{f.path}</span>
                    <span className="shrink-0 ml-2">
                      <span className="text-emerald-500">+{f.additions}</span>
                      {f.deletions > 0 && <span className="text-red-500 ml-1">-{f.deletions}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/landing/components/demo/DemoDecisionLogs.tsx client/src/landing/components/demo/DemoDecisionLogDetail.tsx
git commit -m "feat(demo): add decision logs list and detail screens"
```

---

### Task 10: Root InteractiveDemo Component

**Files:**
- Create: `client/src/landing/components/demo/InteractiveDemo.tsx`

- [ ] **Step 1: Create the root component that wires everything together**

```tsx
// InteractiveDemo.tsx
'use client';

import { useReducer, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DemoBrowserChrome } from './DemoBrowserChrome';
import { DemoSidebar } from './DemoSidebar';
import { DemoTicketList } from './DemoTicketList';
import { DemoTicketDetail } from './DemoTicketDetail';
import { DemoDevelopSession } from './DemoDevelopSession';
import { DemoDelivered } from './DemoDelivered';
import { DemoPreview } from './DemoPreview';
import { DemoDecisionLogs } from './DemoDecisionLogs';
import { DemoDecisionLogDetail } from './DemoDecisionLogDetail';
import { demoReducer, initialDemoState, getSlideDirection } from './demo-state';

export function InteractiveDemo() {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const direction = getSlideDirection(state.previousScreen, state.screen);

  const slideVariants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const renderScreen = useCallback(() => {
    switch (state.screen) {
      case 'ticket-list':
        return (
          <DemoTicketList
            onOpenTicket={() => dispatch({ type: 'OPEN_TICKET' })}
            hasInteracted={state.hasInteracted}
          />
        );
      case 'ticket-detail':
        return (
          <DemoTicketDetail
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onStartDevelop={() => dispatch({ type: 'START_DEVELOP' })}
            hasInteracted={state.hasInteracted}
            developComplete={state.developComplete}
          />
        );
      case 'develop-session':
        return (
          <DemoTicketDetail
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onStartDevelop={() => {}}
            hasInteracted={true}
            developComplete={false}
          />
        );
      case 'delivered':
        return (
          <DemoDelivered
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onViewPreview={() => dispatch({ type: 'VIEW_PREVIEW' })}
          />
        );
      case 'preview':
        return (
          <DemoPreview onBack={() => dispatch({ type: 'GO_BACK' })} />
        );
      case 'decision-logs':
        return (
          <DemoDecisionLogs
            onOpenRecord={(index) => dispatch({ type: 'OPEN_DECISION_LOG', recordIndex: index })}
          />
        );
      case 'decision-log-detail':
        return (
          <DemoDecisionLogDetail
            recordIndex={state.selectedRecordIndex}
            onBack={() => dispatch({ type: 'GO_BACK' })}
          />
        );
      default:
        return null;
    }
  }, [state]);

  return (
    <DemoBrowserChrome screen={state.screen}>
      <div className="flex h-full">
        {/* Sidebar */}
        <DemoSidebar
          screen={state.screen}
          onOpenTickets={() => dispatch({ type: 'OPEN_TICKETS' })}
          onOpenDecisionLogs={() => dispatch({ type: 'OPEN_DECISION_LOGS' })}
        />

        {/* Main content area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={state.screen}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>

          {/* Develop session blade overlay */}
          {state.screen === 'develop-session' && (
            <DemoDevelopSession
              onComplete={() => dispatch({ type: 'DEVELOP_COMPLETE' })}
              onClose={() => dispatch({ type: 'GO_BACK' })}
            />
          )}
        </div>
      </div>
    </DemoBrowserChrome>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/landing/components/demo/InteractiveDemo.tsx
git commit -m "feat(demo): add root InteractiveDemo component with state machine and transitions"
```

---

### Task 11: Integrate into HeroSection

**Files:**
- Modify: `client/src/landing/components/HeroSection.tsx`

- [ ] **Step 1: Replace the static screenshot with InteractiveDemo**

Replace the `<Image>` screenshot block in HeroSection with the InteractiveDemo component. Keep the hero text, subtitle, and CTA above. Remove the parallax scroll effects on the screenshot container since the interactive demo should stay stable.

In `HeroSection.tsx`, replace the entire `{/* Hero Screenshot */}` section (the `<motion.div>` containing the `<Image>`) with:

```tsx
import { InteractiveDemo } from './demo/InteractiveDemo';

// Replace the Hero Screenshot section with:
{/* Interactive Demo */}
<div className="relative w-full max-w-[1180px] mt-8 sm:mt-10 px-4 sm:px-8">
  <motion.div
    variants={scaleUp}
    initial="hidden"
    animate="visible"
    transition={{ ...heroTransition, delay: 0.5 }}
  >
    <InteractiveDemo />
  </motion.div>
</div>
```

Remove the unused `Image` import, the `screenshotY` transform, the ambient glow div, and the bottom glow overlay since the interactive demo doesn't need them.

Also remove the `rotateX` transform since the interactive demo shouldn't tilt on scroll.

Clean up unused imports: `Image`, `useScroll`, `useTransform`, `useRef`, and the `sectionRef`.

- [ ] **Step 2: Verify the page compiles**

```bash
cd /home/forge/Documents/forge/backend && npx --prefix client next build --no-lint 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/landing/components/HeroSection.tsx
git commit -m "feat(demo): integrate interactive demo into hero section, replacing static screenshot"
```

---

### Task 12: Visual Polish & Testing

**Files:**
- Modify: Various demo components as needed

- [ ] **Step 1: Run the dev server and test the full flow**

```bash
cd /home/forge/Documents/forge/backend && npx --prefix client next dev &
```

Verify in browser:
1. Landing page loads with browser chrome frame in hero
2. Ticket list shows folders and tickets with correct styling
3. Clicking any ticket navigates to detail with slide animation
4. Tabs work (Spec, Design, Technical)
5. Clicking "Develop" shows the blade with streaming animation
6. After animation completes, "View Change Record" works
7. Change record shows decisions, files, acceptance criteria
8. "View Preview" opens the terminal illustration
9. Sidebar "Decision Logs" navigates to records list
10. Clicking a record shows detail
11. Back navigation works from all screens

- [ ] **Step 2: Fix any visual issues found during testing**

Adjust heights, padding, font sizes, or overflow behavior as needed to fit within the 520px browser chrome frame.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix(demo): visual polish and overflow fixes for interactive hero demo"
```
