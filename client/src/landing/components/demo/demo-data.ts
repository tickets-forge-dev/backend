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
