# FORGE TECHNICAL MANUAL
## Complete System Architecture & Feature Breakdown

**Purpose:** Answer ANY technical question a CTO/engineer asks in 30 seconds

---

## PART 1: SYSTEM OVERVIEW

### Architecture (High Level)

```
Frontend (Next.js)
    ↓ (HTTPS)
Backend (NestJS)
    ↓ (GraphQL/REST)
Domain Layer (Business Logic)
    ↓
Application Layer (Use Cases)
    ↓
Infrastructure Layer
    ├── GitHub API
    ├── Claude API (LLM)
    ├── Firestore (Database)
    └── Firebase Storage (Files)
```

### Tech Stack

**Frontend:**
- Next.js 14+ (React, server components)
- Zustand (state management)
- TailwindCSS (styling)
- TypeScript (type safety)

**Backend:**
- NestJS (framework)
- TypeScript (type safety)
- Firebase Admin SDK (database + auth)
- Stripe (payments)
- Anthropic Claude API (LLM)

**Database:**
- Firestore (NoSQL)
- Real-time subscriptions for live updates
- Collections: workspaces, users, tickets (AEC), techspecs

**External APIs:**
- GitHub API (OAuth + repo access)
- Stripe API (payments + subscriptions)
- Anthropic Claude API (spec generation)
- Linear API (export integration, coming soon)
- Jira API (export integration, coming soon)

---

## PART 2: CORE FEATURE: REPOSITORY ANALYSIS

### How Forge Reads Your Code

**Q: "How does Forge understand my codebase without modifying it?"**

**A:** Three-phase fingerprinting + selective reading

**Phase 1: Lightweight Fingerprinting (1-2 seconds)**
- Downloads GitHub tree (directory structure only, no file contents)
- Detects tech stack from filenames: `package.json` → Node.js, `requirements.txt` → Python, etc.
- Identifies entry points: `main.ts`, `index.js`, `server.py`
- Identifies config files: `tsconfig.json`, `.eslintrc`, `CLAUDE.md`
- No file reading, no API calls to LLM
- **Result:** Tech stack + file structure visible to user immediately

**Phase 2: Smart File Selection (2-3 seconds)**
- Calls Claude API: "Given this tree structure and these files, which 10-15 files are most relevant for a feature about [user description]?"
- Claude suggests files based on patterns
- Forge fetches only suggested files from GitHub (GET requests, read-only)
- Skips: node_modules, .git, build artifacts, test fixtures
- **Result:** Relevant source code without reading the entire repo

**Phase 3: Full Analysis (3-5 seconds)**
- Passes selected files + user description to Claude
- Claude analyzes: architecture, patterns, dependencies, existing APIs
- Extracts: tech stack, affected layers, API endpoints, test patterns
- **Result:** Complete context for spec generation

**Performance:**
- Small repos (<50MB): 5-10 seconds total
- Large repos (500MB+): 8-15 seconds total
- Fingerprinting alone allows first feedback in 1-2 seconds

**Security:**
- GitHub OAuth: read-only `public_repo` scope (we can't modify)
- Rate limiting: 60 requests/hour per user (GitHub standard)
- No code is stored; temporary files deleted after analysis
- HTTPS only; encrypted in transit

---

### What Forge Can & Cannot Detect

**Can Detect:**
- ✅ Technology stack (languages, frameworks, databases)
- ✅ API endpoints (Express routes, NestJS controllers, Django views)
- ✅ Database schema (from migrations, models, or SQL files)
- ✅ Component structure (React, Vue, Angular folders/patterns)
- ✅ File dependencies (imports, requires, module patterns)
- ✅ Testing patterns (Jest, Pytest, Mocha file structure)
- ✅ Configuration rules (ESLint, TypeScript strict mode, CI constraints)

**Cannot Detect:**
- ❌ Runtime behavior (what the code actually does when executed)
- ❌ External API integrations (Stripe, Twilio, etc.) unless referenced in code
- ❌ Business logic nuances (why something is built a certain way)
- ❌ Team conventions not enforced in code (code review processes)
- ❌ Performance bottlenecks or optimization opportunities

**Solution:** Clarification questions fill these gaps

---

## PART 3: CORE FEATURE: SPECIFICATION GENERATION

### How Forge Generates a Complete Spec

**Input:**
- GitHub repo (analyzed, files selected)
- User description: "Add dark mode toggle to settings"
- Optional: Images, mockups, existing context

**Process:**

**Step 1: Build Context Prompt**
```
You are an expert senior engineer at this company.
Here's the tech stack: React + Node.js + PostgreSQL
Here's the code: [relevant files]
Here's the feature request: "Add dark mode toggle to settings"
Here's our coding guidelines: [from CLAUDE.md]
Here's our testing patterns: [from test files]

Generate a complete technical specification that...
```

**Step 2: LLM Generation (Claude 3.5 Sonnet)**
- Claude generates complete spec in one API call
- Spec includes:
  - Problem statement (why this feature matters)
  - Solution (architectural approach)
  - Acceptance criteria (Given/When/Then format)
  - Backend changes (files, APIs, database)
  - Frontend changes (components, hooks, API integration)
  - Test plan (unit, integration, edge cases)
  - Quality score (0-100 based on completeness)

**Step 3: Quality Scoring**
- Breakdown:
  - Problem clarity: 0-20 points (is the why clear?)
  - Solution completeness: 0-25 points (does it cover all layers?)
  - Acceptance criteria: 0-15 points (are they Given/When/Then format?)
  - File changes accuracy: 0-10 points (are they specific and correct?)
  - Test plan: 0-10 points (unit + integration + edge cases?)
  - API changes: 0-5 points (endpoints documented?)
  - Layer categorization: 0-5 points (organized by architecture?)
  - Ambiguity score: 0-10 points (any remaining vagueness?)

**Step 4: Return to User**
- Show spec with quality score
- If score < 90, mark as "Questions Available"
- Prompt: "Answer clarification questions to improve spec"

**API Cost:**
- Average input: 15K tokens (code + context)
- Average output: 3K tokens (spec)
- Cost: ~$0.03-0.05 per spec (at Claude 3.5 Sonnet rates)
- Margin at $19/month with 30 tickets: Excellent

---

## PART 4: CORE FEATURE: CLARIFICATION QUESTIONS

### How Questions Improve Specs

**Trigger:**
- Spec generated with score < 90
- Or: User manually asks for questions

**Question Generation (LLM Call 2):**
```
Based on this code and this feature request and the generated spec:
What 5 most important clarifications would help make this spec better?

Format:
1. [Question 1]
2. [Question 2]
...

For each question, provide 3-5 answer options (if yes/no, or if multiple choice).
```

**Claude returns:**
- Up to 5 questions (max, typically 2-3)
- Multiple choice or text input format
- Context-aware ("Should avatars be..." vs generic)

**Answer Processing (LLM Call 3):**
```
Here's the original spec.
Here's the feature request.
Here are the clarification answers: [user answers]

Regenerate the spec with these clarifications incorporated.
```

**Claude regenerates:**
- Updated spec with higher specificity
- New quality score (usually 92-98)
- Specific section updates based on answers

**Total Cost:**
- 3 LLM calls per ticket with questions
- Input: 15K + 5K + 20K = 40K tokens
- Output: 3K + 1K + 3K = 7K tokens
- Cost: ~$0.08-0.12 per ticket with questions

**Performance:**
- Question generation: 2-3 seconds
- User answers: instant
- Spec regeneration: 3-5 seconds
- Total: ~10-15 seconds extra per ticket

---

## PART 5: CORE FEATURE: EXPORTS

### Export to Linear

**Current Status:** In development (API endpoints exist, UI pending)

**How it works:**
1. User connects Linear account via OAuth
2. Forge stores `linear_api_key` securely in Firestore
3. User clicks "Export to Ticket"
4. Forge calls Linear API: `POST /graphql`
5. Creates Linear issue with:
   - Title: Feature description
   - Description: Full spec (markdown formatted)
   - Acceptance criteria: Mapped to Linear's custom field
   - Assignee: User selected
   - Priority: Set in Forge before export
   - Labels: `from-forge`, tech-stack labels

**Payload Example:**
```graphql
mutation CreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    issue {
      id
      identifier
      title
      url
    }
  }
}
```

**Linear Fields Mapped:**
- Forge "Problem Statement" → Linear "Description"
- Forge "Acceptance Criteria" → Linear "Description" (appended)
- Forge "Test Plan" → Linear Comments (threaded)
- Forge "File Changes" → Linear "Scope" custom field (if available)

**Sync (Future):**
- Track `linear_issue_id` in Forge
- If spec updated in Forge → update Linear issue
- If issue moved in Linear → reflect in Forge

**Cost:** Free (Linear doesn't charge for API usage for subscribed users)

---

### Export to Jira

**Current Status:** In development (API endpoints exist, UI pending)

**How it works:**
1. User connects Jira Cloud account via OAuth
2. Forge stores `jira_api_token` securely
3. User selects Jira project + issue type (Story/Task)
4. Forge calls Jira REST API: `POST /rest/api/3/issues`
5. Creates issue with:
   - Summary: Feature description
   - Description: Full spec (JIRA markdown format)
   - Issue Type: Story or Task (user selects)
   - Project: User selects
   - Custom fields: Story points, Sprint, etc.

**Payload Example:**
```json
{
  "fields": {
    "project": { "key": "ABC" },
    "issuetype": { "name": "Story" },
    "summary": "Add dark mode toggle",
    "description": "...",
    "customfield_10000": "acceptance criteria..."
  }
}
```

**Jira Fields Mapped:**
- Forge spec → Jira Description
- Acceptance criteria → Jira subtasks (one subtask per criterion)
- Test plan → Jira linked issues (Blocked By)
- File changes → Jira custom field (if org has one)

**Subtask Creation:**
- For each criterion (Given/When/Then), create subtask
- Subtask title: "Verify: [criterion]"
- Subtask assignee: QA engineer

**Cost:** Free (included in Jira Cloud subscription)

---

## PART 6: CORE FEATURE: MULTI-LAYER FILE CHANGES

### How Forge Organizes Changes by Architecture

**Question: "How does Forge know which files to change and how to organize them?"**

**A:** Pattern recognition + explicit categorization

**Detection Process:**

1. **File Classification (LLM):**
   ```
   Analyze these files and categorize each one:
   - Backend: NestJS controllers, services, repositories
   - Frontend: React components, hooks, pages
   - Shared: TypeScript interfaces, shared utilities
   - Infrastructure: Docker, CI/CD, config
   - Docs: README, API docs, architecture docs
   ```

2. **Claude Returns:**
   ```
   backend/src/tickets/controllers/tickets.controller.ts → Backend
   client/src/components/DarkModeToggle.tsx → Frontend
   packages/shared-types/index.ts → Shared
   docker-compose.yml → Infrastructure
   docs/ARCHITECTURE.md → Docs
   ```

3. **Organize by Layer:**
   ```
   Backend Changes:
   - Create new endpoint: POST /api/theme/set-preference
   - Update User model with theme field
   - Add migration: add_theme_to_users_table.sql

   Frontend Changes:
   - Create DarkModeToggle.tsx component
   - Update SettingsPage to import DarkModeToggle
   - Add useTheme hook

   Shared Changes:
   - Add ThemePreference type to shared-types

   Infrastructure Changes:
   - Update Docker image for new env var THEME_API_URL

   Docs Changes:
   - Update API.md with new /theme endpoint
   ```

**Files Organized By:**
1. Layer (Backend/Frontend/Shared/Infra/Docs)
2. Type (Create/Update/Delete)
3. Path (frontend → components → specific file)
4. Specificity (line numbers if possible)

**Accuracy:**
- ~95% correct for small to medium repos
- ~85% correct for large/complex repos
- Users can manually edit if wrong

---

## PART 7: QUALITY SCORE SYSTEM

### How the Quality Score is Calculated

**Scale:** 0-100 points

**Scoring Breakdown:**

| Category | Points | Criteria |
|----------|--------|----------|
| **Problem Statement** | 0-20 | Is the "why" clear and compelling? |
| **Solution** | 0-25 | Does it cover architecture, trade-offs, layers? |
| **Acceptance Criteria** | 0-15 | Are they specific, Given/When/Then format, not vague? |
| **File Changes** | 0-10 | Specific files, line numbers, exact changes? |
| **Test Plan** | 0-10 | Unit, integration, and edge cases included? |
| **API Documentation** | 0-5 | Endpoints, payloads, responses documented? |
| **Layer Organization** | 0-5 | Backend/frontend/shared properly categorized? |
| **Ambiguity Penalty** | -10 to 0 | Any remaining vagueness or contradictions? |

**Examples:**

**Score: 65/100 (Needs Work)**
- Problem: clear (+15)
- Solution: missing backend details (+12)
- Criteria: vague on edge cases (+8)
- Files: generic ("Update user model") (+3)
- Tests: missing integration tests (+5)
- APIs: not mentioned (+0)
- Layers: mixed up (+2)
- Ambiguity: "how to handle errors?" (-2)

**Score: 92/100 (Strong)**
- Problem: clear and compelling (+20)
- Solution: complete, all layers (+24)
- Criteria: specific, Given/When/Then (+14)
- Files: exact paths, specific changes (+10)
- Tests: unit + integration + edge cases (+10)
- APIs: endpoints, payloads, responses (+5)
- Layers: properly organized (+5)
- Ambiguity: none (+0)

**Improving Score:**
- Answer clarification questions (+3-5 points typical)
- Edit sections manually (+2-5 points per edit)
- Re-analyze repo with better description (+1-3 points)

---

## PART 8: DATA MODELS & STRUCTURE

### Core Entities

**User:**
```
{
  id: string (Firebase UID)
  email: string
  name: string
  workspace_id: string (belongs to workspace)
  github_token: string (encrypted)
  linear_api_key: string (encrypted, optional)
  jira_api_token: string (encrypted, optional)
  created_at: timestamp
  updated_at: timestamp
}
```

**Workspace:**
```
{
  id: string (UUID)
  name: string
  owner_id: string (User who created it)
  subscription_tier: 'free' | 'pro' | 'team' | 'enterprise'
  subscription_status: 'active' | 'expired' | 'cancelled'
  stripe_customer_id: string (optional)
  members: User[] (for team tier)
  created_at: timestamp
}
```

**AEC (Analyzing Engineering Context):**
```
{
  id: string (UUID)
  workspace_id: string
  title: string
  description: string
  status: 'draft' | 'complete'

  // Repo Context
  repository_owner: string (GitHub owner)
  repository_name: string (GitHub repo)
  repository_branch: string (default: main)

  // Analysis
  analyzed_at: timestamp
  analysis_status: 'pending' | 'analyzing' | 'complete'
  repository_fingerprint: {
    tech_stack: string[]
    entry_points: string[]
    config_files: string[]
    detected_framework: string
  }

  // Clarification Questions
  clarification_questions: Question[]
  question_answers: Record<string, string>
  questions_answered_at: timestamp

  created_at: timestamp
  updated_at: timestamp
}

Question = {
  id: string
  question: string
  question_type: 'multiple_choice' | 'text' | 'checkbox'
  options: string[] (if multiple_choice)
}
```

**TechSpec:**
```
{
  id: string (UUID)
  aec_id: string (belongs to AEC)
  workspace_id: string

  // Content
  problem_statement: string (markdown)
  solution: string (markdown)
  acceptance_criteria: string[] (Given/When/Then)

  // Changes
  backend_changes: LayeredFileChange[]
  frontend_changes: LayeredFileChange[]
  shared_changes: LayeredFileChange[]
  infrastructure_changes: LayeredFileChange[]
  docs_changes: LayeredFileChange[]

  // API & Tests
  api_endpoints: ApiEndpoint[]
  test_plan: TestPlan

  // Metadata
  quality_score: number (0-100)
  technology_stack: string[] (React, Node.js, PostgreSQL)

  created_at: timestamp
  updated_at: timestamp
  finalized_at: timestamp
}

LayeredFileChange = {
  file_path: string
  change_type: 'create' | 'update' | 'delete'
  description: string (what changes)
  affected_lines: number[] (optional)
  code_snippet: string (optional)
}

ApiEndpoint = {
  method: string (GET, POST, PUT, DELETE)
  route: string (/api/users/:id)
  description: string
  request_body: string (JSON schema or example)
  response: string (JSON schema or example)
  authentication: string (JWT, API Key, none)
}

TestPlan = {
  unit_tests: TestCase[]
  integration_tests: TestCase[]
  edge_cases: TestCase[]
}

TestCase = {
  name: string
  description: string
  preconditions: string
  steps: string[]
  expected_result: string
}
```

---

## PART 9: API ENDPOINTS (Backend)

### Key Endpoints

**Authentication:**
```
POST /auth/github
- Input: GitHub OAuth code
- Output: JWT token, user data
- Purpose: Login with GitHub

POST /auth/logout
- Input: JWT token
- Output: Success
- Purpose: Logout
```

**Repository Analysis:**
```
POST /tickets/analyze-repo
- Input: { owner, repo, description, images? }
- Output: { aec_id, fingerprint, status }
- Purpose: Start analysis

GET /tickets/:id/analysis-status
- Output: { status, progress, fingerprint, files_analyzed }
- Purpose: Poll for analysis completion
```

**Specification Generation:**
```
POST /tickets/:id/generate-spec
- Input: { aec_id }
- Output: { spec_id, quality_score, questions_available }
- Purpose: Generate initial spec (after analysis)

GET /tickets/:id/spec
- Output: TechSpec object (full)
- Purpose: Retrieve generated spec

POST /tickets/:id/questions
- Input: { aec_id }
- Output: { questions: Question[] }
- Purpose: Get clarification questions

POST /tickets/:id/answer-questions
- Input: { answers: Record<string, string> }
- Output: { spec_id, new_quality_score }
- Purpose: Submit answers, regenerate spec
```

**Spec Refinement:**
```
PUT /tickets/:id/spec/:section
- Input: { section, updated_content }
- Output: { spec_id, updated_quality_score }
- Purpose: Manually edit a section

DELETE /tickets/:id/spec/:section
- Output: { success }
- Purpose: Remove a section

POST /tickets/:id/add-api-endpoint
- Input: { method, route, description, request, response }
- Output: { spec_id, updated_apis }
- Purpose: Add API endpoint manually
```

**Exports:**
```
POST /tickets/:id/export/linear
- Input: { linear_workspace_id, project_id, issue_type }
- Output: { linear_issue_id, linear_issue_url }
- Purpose: Export to Linear

POST /tickets/:id/export/jira
- Input: { jira_instance_url, project_key, issue_type }
- Output: { jira_issue_id, jira_issue_url }
- Purpose: Export to Jira

GET /tickets/:id/export/markdown
- Output: markdown file (downloadable)
- Purpose: Download as Markdown
```

**Subscription:**
```
POST /subscriptions/checkout
- Input: { workspace_id, tier }
- Output: { stripe_checkout_url }
- Purpose: Start subscription

GET /workspaces/:id/subscription
- Output: { tier, status, renewal_date, usage }
- Purpose: Check subscription status

POST /subscriptions/cancel
- Input: { workspace_id }
- Output: { success, cancellation_date }
- Purpose: Cancel subscription
```

---

## PART 10: COMMON TECHNICAL QUESTIONS & ANSWERS

### Q&A Reference (30-Second Answers)

**Q: "How do you handle private repos?"**
> A: GitHub OAuth scopes are read-only `public_repo` scope. Users can authorize private repo access, but we only read—never modify. All code is processed in-memory, never stored. After analysis, files are deleted.

**Q: "What's the latency from repo to spec?"**
> A: Total: 8-15 seconds for most repos. Fingerprint (1-2s) + file selection (2-3s) + spec generation (3-5s) + formatting (1-2s) = ~10 seconds average.

**Q: "Can you handle monorepos?"**
> A: Partially. Fingerprinting works on the whole repo. Spec generation focuses on selected files. Multi-repo support (selecting multiple repos) is in roadmap (Epic 23).

**Q: "What LLM do you use?"**
> A: Claude 3.5 Sonnet (Anthropic). We chose it for code understanding, reasoning quality, and cost efficiency. Falls back to Claude 3 Haiku for cost-sensitive operations if needed.

**Q: "How do you prevent prompt injection attacks?"**
> A: User input is escaped before passing to LLM. Code is read-only from GitHub (not user input). All LLM prompts are templated, not concatenated. Output is validated against schema before display.

**Q: "What's your SLA for uptime?"**
> A: Free tier: best effort. Pro: 99.5%. Team: 99.9%. Enterprise: custom (with SLA).

**Q: "How do you calculate pricing?"**
> A: Cost: ~$0.03-0.15 per spec (LLM + infra). Free: 5/month. Pro: $19/month unlimited (~30 specs = positive margin). Team: $49/month per seat (better unit economics at scale).

**Q: "Can you handle non-English code?"**
> A: Yes, Claude handles any language in code. Spec output is always in English. Variable names, comments in any language work fine.

**Q: "What's your data retention policy?"**
> A: Specs stored in Firestore indefinitely (until user deletes). GitHub code never stored (temporary, in-memory). Conversation logs deleted after 30 days. Backups encrypted.

**Q: "Do you store my GitHub token?"**
> A: Yes, encrypted at rest using Firebase encryption. Decrypted only when accessing your repos. Never logged, never shared. Deleted if you disconnect GitHub.

**Q: "Can I use this with GitHub Enterprise?"**
> A: Not yet. Requires GitHub Enterprise OAuth configuration. Enterprise customers can request custom integration.

**Q: "What happens if GitHub is down?"**
> A: Analysis fails gracefully. Users see "GitHub unavailable, try again in 5 minutes." Cached results used if available. No data loss.

**Q: "Do you train on our code?"**
> A: No. Code is analyzed in-memory, never stored in our LLM's training data. Anthropic doesn't train on customer code. You can opt-out of usage analytics if you want.

**Q: "Can you export to [Asana/Monday/Notion]?"**
> A: Not yet. Roadmap: Linear + Jira first (Q1 2024). Others based on demand. Manual Markdown export works for any tool.

**Q: "How do you handle API rate limits?"**
> A: GitHub: 60 requests/hour standard, 5000/hour authenticated. We queue requests, retry with backoff. For heavy users, request higher rate limit via GitHub.

**Q: "What's the maximum repo size you can analyze?"**
> A: No hard limit, but performance degrades >1GB. Fingerprinting fast (100MB-1GB = 2-3s). File selection via LLM works well up to 500MB analyzed. Largest we've tested: 2GB (slow but works).

**Q: "Can Forge detect security vulnerabilities?"**
> A: Not explicitly. But it detects patterns (missing input validation, hardcoded secrets in code, unsafe dependencies in package.json). Security is side effect of code analysis, not primary feature.

**Q: "How do you handle merge conflicts in specs?"**
> A: Specs are append-only. Manual edits don't conflict with LLM regenerations (stored separately). If user edits AND regenerates, user edits take precedence (not auto-merged). Roadmap: proper version control for specs.

**Q: "Can I run this on-premise?"**
> A: Enterprise tier can request self-hosted deployment. Requires your own Anthropic API key, Firebase setup. Timeline: 2-3 weeks implementation + $10K setup + $2K/month ops.

**Q: "What's your scalability limit?"**
> A: Current: ~1000 concurrent users (Firebase Firestore quota). Scaling: move to PostgreSQL, separate API servers. Expected to handle 100K+ users with infrastructure upgrades.

**Q: "How do you prevent duplicate analyses?"**
> A: Track (repo_owner, repo_name, branch) as unique key. Cache analysis results for 24 hours. Re-use if same repo analyzed again.

**Q: "Can you parallelize questions?"**
> A: No. Questions are sequential (one question at a time modal). Rationale: improves spec quality iteratively. Future: batch mode for impatient users.

**Q: "What happens if my subscription expires?"**
> A: Free tier limits enforced immediately (can't create new tickets). Existing specs still readable. Re-subscribe to unlock. No data deleted for 30 days after cancellation.

---

## PART 11: PERFORMANCE BENCHMARKS

### Real-World Numbers

**Repository Analysis:**
- Small repo (React app, <50 files): 5-8 seconds
- Medium repo (Full-stack, 200 files): 8-12 seconds
- Large repo (Monorepo, 1000+ files): 12-20 seconds
- Very large repo (2000+ files, 500MB+): 20-30 seconds (slow but works)

**Spec Generation:**
- Simple feature (UI-only): 2-3 seconds
- Medium feature (API + UI): 4-5 seconds
- Complex feature (cross-repo changes): 5-8 seconds

**Question Answering:**
- User answering questions: 30-60 seconds (manual)
- Spec regeneration: 3-5 seconds

**Export:**
- To Linear: 2-3 seconds
- To Jira: 3-5 seconds (jira slower API)

**Database Query:**
- Get spec: <100ms (Firestore cache)
- Get all specs for workspace: <500ms (paginated)
- Get analysis status: <100ms

**LLM Token Usage (per spec):**
- Input tokens: 15K-20K (code + context)
- Output tokens: 3K-5K (spec)
- Cost: $0.03-0.08 per spec

---

## PART 12: KNOWN LIMITATIONS & EDGE CASES

### What Forge Doesn't Handle Well

**1. Dynamic Code Patterns**
- Can't detect runtime behavior (only static analysis)
- Might miss APIs defined dynamically (`express.use(routes)`)
- **Workaround:** Manual API editor, answer questions

**2. Very Large Codebases**
- >2GB repos: fingerprinting slow, file selection less accurate
- **Workaround:** Scope analysis to specific package, user can narrow context

**3. Undocumented APIs**
- If API endpoints don't follow standard patterns, might be missed
- **Workaround:** Manual API endpoint editor, clarification questions

**4. Complex TypeScript Generics**
- Generic types might not be properly categorized
- **Workaround:** Simplify types in generated spec, user can edit

**5. Non-Standard File Structures**
- Monorepos with custom structures might confuse file categorization
- **Workaround:** Multi-repo support (roadmap) will handle this better

**6. Closed-Source Dependencies**
- Can't analyze node_modules or pip packages
- Only analyzes YOUR code
- **Workaround:** Ask in feature description if using external lib

**7. Rapid API Changes**
- If API changes in GitHub, Forge doesn't know until re-analyze
- Specs become stale after 24+ hours
- **Workaround:** Re-analyze to refresh, or manual edit

**8. Non-English Codebases**
- Comments/variable names in other languages: okay
- Generated spec: always English
- **Potential issue:** Some nuance lost in translation

---

## PART 13: SECURITY & COMPLIANCE

### Data Security

**At Rest:**
- Firestore encryption (Google-managed keys)
- GitHub tokens encrypted with AES-256
- Stripe integration: PCI compliant (we don't store card data)

**In Transit:**
- HTTPS only (TLS 1.3)
- GitHub API: OAuth token, never exposed
- Anthropic API: over HTTPS, no token logged

**Access Control:**
- User can only see their own workspace + specs
- Admin can see team members' specs
- No cross-workspace data leakage (Firestore rules enforce)

**Privacy:**
- We don't train on your code (Anthropic contract)
- No usage analytics sent externally
- Opt-out of analytics available

### Compliance

**GDPR:**
- Users can export their data (spec + metadata JSON)
- Users can delete their account + all data (30-day retention for logs)

**SOC 2 (Roadmap):**
- Audit trail planned for Enterprise tier
- Access logs, spec change history, export history

---

## PART 14: DEBUGGING & TROUBLESHOOTING

### Common Issues & Solutions

**Issue: "Analysis taking forever"**
- Repo >500MB? Fingerprint might be slow. Wait up to 30s.
- GitHub rate limited? Retry in 60 seconds.
- **Solution:** Try with narrower description (fewer files analyzed)

**Issue: "Spec is low quality (score 45)"**
- Problem: Feature description too vague
- Solution: Add more context, upload mockup, answer questions

**Issue: "Wrong files detected"**
- GitHub tree is stale? (unlikely, <1 min old)
- File structure non-standard? LLM might misunderstand
- **Solution:** Manually edit file changes, describe structure in feature request

**Issue: "Export to Linear failed"**
- Linear token expired? Reconnect Linear account
- Workspace doesn't exist? Check Linear workspace ID
- Project closed? Try different project
- **Solution:** Disconnect + reconnect Linear, try again

**Issue: "Stripe payment rejected"**
- Card declined? Check with bank
- Billing address mismatch? Update payment method
- **Solution:** Retry with different card or contact support

**Issue: "Spec regenerated and lost my edits"**
- Edits are stored separately, not overwritten
- Check if you see both "LLM spec" and "user edits"
- **Solution:** Merge manually (click "Use edited version")

---

## PART 15: ROADMAP & FUTURE FEATURES

### Near-term (Q1 2024)
- Multi-repo support (select multiple repos, unified spec)
- Export sync (update spec in Forge → update Linear/Jira issue)
- Code guardrails detection (CLAUDE.md, ESLint config respect)

### Medium-term (Q2-Q3 2024)
- Codebase Explorer (PM Q&A grounded in code)
- GitHub Marketplace listing
- Jira Server support (not just Cloud)
- Asana, Monday.com export

### Long-term (2025)
- Self-hosted deployment option
- Slack integration (generate specs from Slack)
- GitHub issues → Forge spec (reverse direction)
- Architecture documentation auto-generation

---

## PART 16: QUICK ANSWER CHEAT SHEET

Print this out. Reference when someone asks a technical question.

| Question | 30-Second Answer |
|----------|------------------|
| How fast? | 8-15 seconds repo to spec |
| How much does it cost? | ~$0.05 per spec, margin great at $19/mo |
| LLM? | Claude 3.5 Sonnet |
| Data stored? | Specs in Firestore, code never stored |
| Security? | HTTPS, OAuth, encrypted tokens, no training on your code |
| Monorepos? | Works, but multi-repo support better |
| Rate limits? | GitHub standard (60/hour), queued if needed |
| Private repos? | Yes, read-only |
| SLA? | Free: best effort, Pro: 99.5%, Team: 99.9% |
| Uptime? | 99.9% average, incidents logged |
| On-premise? | Enterprise only, 2-3 weeks setup |
| Can you export to X? | Linear/Jira yes, others via Markdown |
| Accuracy? | ~95% for small repos, ~85% for large |
| Training data? | No, we don't train on your code |
| Competitors? | None directly (closest: Copilot, but that's different) |

---

## END OF MANUAL

You're ready. A developer asks a technical question? Open this doc, search it, answer in 30 seconds.
