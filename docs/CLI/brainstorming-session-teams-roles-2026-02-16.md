# Brainstorming Session Results

**Session Date:** 2026-02-16
**Facilitator:** AI Brainstorming Facilitator Claude
**Participant:** BMad

## Session Start

**Brainstorming Approach Selected:** AI-Recommended Techniques

**Journey Design:**
This session addresses team & role architecture for the Forge platform - specifically solving the PM/Developer collaboration challenge where PMs lack Git access but need to use the platform.

**Technique Sequence:**
1. **Role Playing** (Collaborative, 15 min) - Explore perspectives of PM, Developer, QA, Solo Founder, Enterprise Admin
2. **First Principles Thinking** (Creative/Deep, 12 min) - Rebuild permission model from fundamental truths
3. **Assumption Reversal** (Deep, 12 min) - Challenge core assumptions about team structures
4. **Six Thinking Hats** (Structured, 15 min) - Systematic evaluation of solution concepts

**Total Estimated Duration:** 50-65 minutes

**Session Status:** IN PROGRESS ✅

---

## Executive Summary

**Topic:** Team & Role Architecture for Forge - Enabling PM/Developer Collaboration

**Session Goals:**
- Define user role system (PM, Developer, QA, Admin, etc.)
- Design team/workspace management model
- Determine secure team invitation mechanics
- Establish role-based permissions (who creates teams, connects integrations, invokes agents)
- Balance ease-of-use with security

**Problem Context:**
- Forge is PM-friendly but requires Git access (GitHub OAuth)
- PMs typically don't have Git credentials
- Current single-user model blocks team collaboration
- Need PM + Developer workflows without forcing everyone to have Git access

**Techniques Used:** Role Playing, First Principles Thinking, Assumption Reversal, Six Thinking Hats

**Total Ideas Generated:** _To be calculated at session end_

### Key Themes Identified:

_To be filled during convergent phase_

## Technique Sessions

### 🎭 TECHNIQUE #1: ROLE PLAYING (COMPLETE)

**Started:** 2026-02-16
**Completed:** 2026-02-16
**Duration:** ~25 minutes

**Roles Explored:**
- Product Manager (PM) - non-technical user perspective
- Developer - technical user perspective

---

#### **KEY INSIGHTS FROM PM PERSPECTIVE:**

**Problem Identified:**
- GitHub OAuth blocks PMs who don't have Git access
- Repository selection confuses non-technical users
- Current single-repo limitation prevents full-stack analysis

**PM's Ideal Experience:**
1. **Fast onboarding** - No GitHub blocker to get started
2. **Workspace abstraction** - Think in products (Forge), not repos (forge-client, forge-backend)
3. **Optional code analysis** - Can create tickets without repos, but best experience WITH repos
4. **Zero technical knowledge needed** - Don't need to understand architecture (client vs backend)

**Core Value Proposition (PM View):**
> "I want technical accuracy WITHOUT technical skills. The system analyzes real code and generates questions I can answer in plain language, resulting in reality-grounded specs."

---

#### **KEY INSIGHTS FROM DEVELOPER PERSPECTIVE:**

**Developer Setup Responsibilities:**
- Connect GitHub account (OAuth)
- Create workspace ("Forge")
- Attach up to 3 repositories to workspace
- Result: PM can select workspace and system scans all repos automatically

**Developer Concerns Addressed:**
- Who sees the code? → **No one** (API wiring only, no code UI)
- Security/permissions? → **Role-based access control**
- Setup time? → **2-10 minutes acceptable**

---

#### **MAJOR ARCHITECTURAL DECISIONS:**

**1. Team-Based Multi-Tenancy Architecture**

**Current State → New State:**
- ❌ Single user config → ✅ Team-based config
- ❌ No collaboration → ✅ Multi-user teams
- ❌ No isolation → ✅ Full team isolation

**Team Model:**
- **Team = unit of isolation** (settings, repos, workspaces, tickets)
- **Auto-created on first signup** (user becomes Admin)
- **Multiple teams per user** (consultant/freelancer use case)
- **Team Switcher UI** (Slack/Linear model)

---

**2. Multi-Repository Support**

**Workspace Architecture:**
- Workspace can contain **up to 3 repositories**
- System **scans ALL repos automatically** (no mediator/selector needed)
- Workspace belongs to a **Team** (not individual users)
- PM selects workspace → backend scans all repos in parallel

**Why 3 Repos?**
- Typical full-stack app: client + backend + shared
- Bounded scope (prevents performance issues)
- Leverage existing efficient scanning tech

---

**3. Corrected Onboarding Flow**

**Step 1: Role Selection (FIRST)**
- PM / Product Manager
- Developer / Engineer
- QA / Tester
- Other

**Step 2: Conditional GitHub Connection**
- **IF Developer role:** → Show GitHub OAuth (required for value)
- **IF PM/QA role:** → Ask "Do you have GitHub access?"
  - YES → Connect now
  - NO → "No problem! Options:
    1. Create tickets without code analysis
    2. Invite developer later to connect GitHub"

**Step 3: Team Auto-Creation**
- **First-time user:** Auto-create team (becomes Admin)
- **Invited user:** Join existing team (role-based permissions)

**Default Team Name:** User's name + "Team" (e.g., "Sarah's Team")
- Backend: Unique ID or slug for routing
- Display: Can duplicate (many "Sarah's Team" allowed)

---

**4. Permission Matrix (Role-Based Access Control)**

| Permission | Admin (Own Team) | PM (Invited) | Developer (Invited) | QA (Invited) |
|------------|------------------|--------------|---------------------|--------------|
| Create tickets | ✅ | ✅ | ✅ | ✅ |
| Select workspaces | ✅ | ✅ | ✅ | ✅ |
| Create workspaces | ✅ | Limited | ✅ | ❌ |
| Connect GitHub | ✅ | ❌ | ✅ | ❌ |
| Connect Jira/Linear | ✅ | ❌ | ✅ | ❌ |
| Invite users | ✅ | Limited | ✅ | ❌ |
| Manage team settings | ✅ | ❌ | Limited | ❌ |
| Delete team | ✅ | ❌ | ❌ | ❌ |

**Key Rules:**
- **First user in team = Admin** (permanent, full permissions)
- **Your own team = always Admin** (even if invited elsewhere)
- **Invited teams = role-based permissions** (PM/Dev/QA)

---

**5. Multi-Team User Experience**

**Scenario:** Sarah has 2 teams:
```
┌─────────────────────────────┐
│ Sarah's Team ▼              │  ← Team Switcher (top nav)
├─────────────────────────────┤
│ • Sarah's Team         👑   │  ← Admin (full permissions)
│ • Acme Corp            📝   │  ← PM (limited permissions)
└─────────────────────────────┘
```

**When switching teams:**
- All UI updates to show selected team's context
- Tickets, workspaces, repos all team-scoped
- Permissions change based on role in that team

---

**6. Team Invitation Flow**

**Invitation Mechanism:** Email invite
- Admin/Developer sends invite link via email
- Recipient clicks → Signs up (if new) → Joins team
- Role assigned during invitation (PM, Developer, QA)
- Invited user inherits role permissions

**Original Team Preservation:**
- When invited to Team B, your Team A still exists
- You switch between teams via dropdown
- Admin status in your own team is permanent

---

#### **IDENTIFIED SUBTASKS:**

1. ✅ **Enable multi-repo per ticket** (currently limited to 1 repo)
2. ✅ **Team CRUD operations** (create, rename, delete, settings)
3. ✅ **Workspace CRUD operations** (create, rename, attach repos, select during ticket creation)
4. ✅ **Role-based permission system** (Admin, PM, Developer, QA)
5. ✅ **Team invitation system** (email invites, role assignment)
6. ✅ **Team switcher UI** (dropdown navigation, context switching)
7. ✅ **Permission matrix UI** (settings page showing role permissions)

---

#### **DESIGN PRINCIPLES ESTABLISHED:**

1. **Non-blocking onboarding:** Never require GitHub for signup (tier 1: works without repos, tier 2: optimal with repos)
2. **Separation of concerns:** Technical users do wiring (repos, integrations), non-technical users do product work (tickets, specs)
3. **Team isolation:** Full data isolation between teams (security, privacy, multi-tenant friendly)
4. **Role clarity:** Clear permission boundaries (Admin > Developer > PM/QA)
5. **Workspace abstraction:** PMs think in products, not repositories (hide technical complexity)

---

## Idea Categorization

### 🚀 IMMEDIATE OPPORTUNITIES (MVP - Ship First)

**Core Architecture:**
1. ✅ **Team-based multi-tenancy** (basic version)
   - Auto-create team on first signup (user provides team name)
   - First user = Admin (permanent)
   - Team switcher UI on web (dropdown)

2. ✅ **Web Interface (Universal Planning Layer)**
   - PMs: Create tickets from materials (docs, wireframes)
   - Developers: Can also create tickets, plan work, review
   - Any role can use web for planning/management

3. ✅ **CLI Interface (Developer Execution Layer)**
   - Developers only (not PMs/QA)
   - Keyboard-driven workflow (↑/↓ navigation)
   - Fast ticket viewing, claiming, execution

**Authentication & Team Management:**
4. ✅ **OAuth device flow authentication** (`forge login`)
   - Browser-based auth (Google/GitHub)
   - Auto-approve if already signed in on web
   - Secure, familiar pattern (like GitHub CLI)

5. ✅ **Email invitation system** (web-based)
   - Admin/Developer can invite team members
   - Invited users join existing team with role
   - No CLI involvement (web-only feature)

6. ✅ **Enhanced onboarding flow:**
   - Step 1: Sign up (OAuth)
   - Step 2: Name your team (NEW!)
   - Step 3: Select role (PM, Developer, QA)
   - Step 4: Optional GitHub connection (role-based)

**Workflow & Status System:**
7. ✅ **Neutral ticket status system** (shared web + CLI)
   - Status visible in both interfaces
   - Updates sync across web ↔ CLI

8. ✅ **Collaborative spec completion workflow**
   - PM creates partial ticket → "Review for Dev"
   - Dev completes with code context → "PM Review"
   - PM approves → "Ready to Dev"
   - Dev executes → "In Progress" → "Done"

9. ✅ **Core status flow:**
   - Draft
   - Review for Developer
   - PM Review
   - Ready to Dev
   - In Progress
   - Done

**MCP & Task Pack Integration:**
10. ✅ **MCP integration for spec completion**
    - Custom Forge agent (not generic MCP)
    - Connected to team, has repo access

11. ✅ **Task pack workflow (XML-defined, BMad method)**
    - Fetch ticket → Add to context
    - Analyze gaps (what PM couldn't provide)
    - Scan codebase → Find related files
    - Generate technical additions
    - Confirm with dev → Update status

**Permissions & Roles:**
12. ✅ **Role-based access control**
    - Admin: Full permissions (own team)
    - Developer: Web + CLI access, can connect repos
    - PM: Web only, create tickets, review work
    - QA: Web only, create bugs, view tickets

13. ✅ **Permission matrix** (see complete table in document)
    - Clear rules for who can do what
    - Own team = always Admin

**CLI Core Features:**
14. ✅ `forge login` (OAuth device flow)
15. ✅ `forge tickets` (list view, ↑/↓ navigation)
16. ✅ `forge take #id` (claim + trigger task pack agent)
17. ✅ `forge execute #id` (open in IDE: VSCode/Cursor/Claude)
18. ✅ **Ticket filtering**
    - `--assigned-to-me`
    - `--status <status>`
    - `--creator <name>`

**Workspace & Repos:**
19. ✅ **Workspace abstraction** (PMs think products, not repos)
20. ✅ **Single-repo workspace** (MVP - defer multi-repo)
    - Connect one repo per workspace initially
    - Focus on dev-side repo access
    - Expand to 3 repos later

**Strategic Positioning:**
21. ✅ **Standalone platform** (not Jira-dependent)
22. ✅ **Optional Jira/Linear export** (nice-to-have, can break)

**Go-to-Market:**
23. ✅ **Target audiences:**
    - Jira refugees (frustrated with complexity)
    - Non-technical PMs (fear being replaced by technical PMs)
24. ✅ **Emotional positioning:**
    - "Escape Jira hell. Fast, simple ticket management for AI-native teams."
    - "Stay relevant in the AI age. Create technical specs without learning to code."

---

### 🔮 FUTURE INNOVATIONS (V2/V3 - Post-MVP)

**Advanced Workspace:**
1. ⏸️ **Multi-repo workspace support** (up to 3 repos, scan all)
   - Deferred from MVP to focus on single-repo first
   - Parallel scanning of client + backend + shared
   - Workspace-level repo management

**Enhanced Collaboration:**
2. 🔜 **Real-time status sync** (if complex, move to V2)
   - WebSocket updates (web ↔ CLI instant sync)
   - Live progress indicators
   - Presence detection (who's viewing/editing)

3. 🔜 **Advanced ticket filtering/search**
   - Full-text search across tickets
   - Complex filters (AND/OR logic)
   - Saved filter views

4. 🔜 **Ticket comments & discussions**
   - Threaded conversations
   - @mentions
   - Rich text formatting

**Integration & Export:**
5. 🔜 **Bidirectional Jira/Linear sync**
   - Import tickets from Jira/Linear
   - Export completed specs
   - Status sync (two-way)

6. 🔜 **Slack/Discord notifications**
   - Real-time updates in team chat
   - Configurable notification rules

**Advanced Permissions:**
7. 🔜 **Custom roles** (beyond Admin/Dev/PM/QA)
   - User-defined permission sets
   - Role templates

8. 🔜 **Team hierarchies** (sub-teams, departments)
   - Nested team structure
   - Inherited permissions

**Analytics & Insights:**
9. 🔜 **Team velocity metrics**
   - Tickets completed per week
   - Average time in each status
   - Bottleneck identification

10. 🔜 **Developer productivity insights**
    - CLI usage patterns
    - Most productive hours
    - Context switch analysis

**CLI Enhancements:**
11. 🔜 **Advanced CLI commands**
    - `forge watch` (monitor ticket updates)
    - `forge stats` (personal productivity)
    - `forge branch #id` (auto-create Git branch from ticket)

---

### 🌙 MOONSHOTS (Long-term Vision - 1-2 Years)

**AI-Powered Intelligence:**
1. 🌙 **Predictive task complexity estimation**
   - AI analyzes ticket → Estimates hours/story points
   - Learns from team's historical data
   - Confidence intervals

2. 🌙 **Automated sprint planning**
   - AI suggests optimal ticket assignment
   - Load balancing across team
   - Skill matching (right dev for right ticket)

3. 🌙 **Intelligent spec generation from user recordings**
   - Upload Loom video → AI extracts requirements
   - Screen recording → Auto-generate wireframes + specs
   - Voice notes → Structured tickets

**Developer Experience:**
4. 🌙 **Automated code review integration**
   - Ticket → PR linkage (bidirectional)
   - AI reviews PR against acceptance criteria
   - Auto-update ticket status on PR merge

5. 🌙 **Smart conflict detection**
   - Multiple devs working on same files → Alert
   - Suggest coordination before merge conflicts

6. 🌙 **AI pair programming assistant**
   - Integrated into IDE via MCP
   - Ticket context + codebase → Pair programming mode
   - Real-time suggestions based on acceptance criteria

**Platform Expansion:**
7. 🌙 **Mobile app (iOS/Android)**
   - PM-friendly mobile ticket creation
   - Quick reviews on-the-go
   - Push notifications

8. 🌙 **Full Jira replacement features**
   - Roadmaps, epics, sprints
   - Burndown charts, velocity tracking
   - Agile ceremonies support

**Ecosystem:**
9. 🌙 **Forge Marketplace**
   - Custom task pack templates (community-contributed)
   - Third-party integrations
   - Premium agents/workflows

10. 🌙 **Forge API for custom integrations**
    - REST API for ticket CRUD
    - Webhooks for real-time events
    - SDKs (TypeScript, Python, Go)

---

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: **Build Forge CLI + MCP Task Pack Integration**

**Rationale:**
This is the CORE differentiator that makes Forge unique. No other platform has a developer-first CLI with AI-powered spec completion. This validates the entire hybrid web+CLI strategy and proves the collaborative workflow concept.

**Next Steps:**
1. **Week 1-2:** Design CLI architecture
   - Command structure (`forge login`, `forge tickets`, `forge take`, `forge execute`)
   - OAuth device flow implementation
   - Terminal UI/UX design (↑/↓ navigation, Enter to select)

2. **Week 3-4:** Build MCP integration
   - Create custom Forge MCP agent
   - XML task pack definition (BMad method)
   - Ticket context fetching + codebase scanning

3. **Week 5-6:** Implement core CLI commands
   - `forge login` (browser auth flow)
   - `forge tickets` (list view with navigation)
   - `forge take #id` (trigger task pack workflow)

4. **Week 7-8:** IDE integration
   - `forge execute #id` command
   - VSCode extension (open ticket context)
   - Cursor/Claude integration hooks

**Resources Needed:**
- 1 backend developer (CLI + MCP server)
- 1 frontend developer (OAuth flow, ticket API)
- Access to BMad task pack templates (XML definitions)
- MCP SDK documentation
- Testing: 3-5 beta developers (internal team)

**Timeline:** 8 weeks (MVP CLI ready)

---

#### #2 Priority: **Team Management + Role-Based Permissions**

**Rationale:**
Without teams, there's no collaboration. This is foundational infrastructure that every other feature depends on. Must be rock-solid before launch.

**Next Steps:**
1. **Week 1-2:** Database schema design
   - Teams table (id, name, created_by, created_at)
   - Team members table (team_id, user_id, role, invited_by, joined_at)
   - Permissions table (role, resource, action, allowed)

2. **Week 3-4:** Backend API implementation
   - Team CRUD operations
   - Invitation system (email invites with tokens)
   - Role-based access control middleware

3. **Week 5-6:** Web UI implementation
   - Onboarding flow (ask team name, role selection)
   - Team switcher dropdown (top nav)
   - Invite team members modal
   - Settings page (team management, permissions matrix)

4. **Week 7-8:** Testing + polish
   - Multi-team scenarios (user in 3+ teams)
   - Permission edge cases
   - Invitation flow (email delivery, token expiration)

**Resources Needed:**
- 1 backend developer (API + auth)
- 1 frontend developer (UI components)
- 1 designer (team switcher UX, settings page)
- Email service (SendGrid/Postmark)

**Timeline:** 8 weeks (complete team infrastructure)

---

#### #3 Priority: **Collaborative Spec Completion Workflow (Web + CLI Handoff)**

**Rationale:**
This is where the magic happens - PM creates partial ticket, Dev completes with code context, PM approves. This workflow validates the entire product thesis: "Non-technical PMs can create technical specs."

**Next Steps:**
1. **Week 1-2:** Define status state machine
   - Status transitions (who can move tickets between states)
   - Validation rules (can't skip states)
   - Database schema (ticket_status, status_history)

2. **Week 3-4:** Web UI status management
   - PM: Mark ticket "Review for Developer"
   - PM: Review dev additions, approve → "Ready to Dev"
   - Status badges, visual indicators

3. **Week 5-6:** CLI status integration
   - Dev: View tickets filtered by status
   - Dev: Complete spec → "PM Review"
   - Status update API calls

4. **Week 7-8:** Real-time sync + notifications
   - WebSocket updates (status changes reflect instantly)
   - Email notifications (PM when dev completes, Dev when PM approves)
   - In-app notifications (web + CLI)

**Resources Needed:**
- 1 backend developer (status API, WebSockets)
- 1 frontend developer (status UI, real-time updates)
- Integration: MCP agent must update ticket status after completion

**Timeline:** 8 weeks (complete workflow implementation)

---

### Overall Implementation Plan

**Phase 1: Foundation (Weeks 1-8)**
- Team management (#2)
- Basic web UI (ticket creation, viewing)
- Authentication infrastructure

**Phase 2: CLI + MCP (Weeks 9-16)**
- Forge CLI implementation (#1)
- MCP task pack integration
- Developer workflow validation

**Phase 3: Workflow Integration (Weeks 17-24)**
- Collaborative spec completion (#3)
- Status system + handoffs
- Real-time sync

**Phase 4: Polish + Beta (Weeks 25-32)**
- Bug fixes, edge cases
- Performance optimization
- Beta testing with 10-20 early adopters

**Target Launch:** 32 weeks (~8 months) from start

---

## Reflection and Follow-up

### What Worked Well

**Role Playing Technique:**
By stepping into PM and Developer perspectives, we uncovered the CORE insight that changed everything: PMs don't need Git access, and Developers want CLI. This led to the hybrid web+CLI architecture that defines the entire product.

**Strategic Pivot Discovery:**
We discovered that Forge should be the "whale" (standalone platform) not a "remora" (Jira enhancement). This positioning unlocks a much larger market and creates a defensible moat.

**Collaborative Design Process:**
The back-and-forth questioning helped refine vague ideas into specific, actionable features. For example: "team management" became a complete architecture with auto-creation, role-based permissions, and team switcher UI.

### Areas for Further Exploration

1. **Real-time collaboration** - What happens when 2 devs claim the same ticket simultaneously?
2. **Offline mode** - Should CLI work offline? Sync when online?
3. **Versioning** - How do we handle ticket spec changes after dev starts work?
4. **Conflict resolution** - What if PM and Dev disagree on spec interpretation?
5. **Performance at scale** - How does MCP task pack handle large repos (1M+ files)?

### Recommended Follow-up Techniques

**For MVP Implementation Planning:**
- **SCAMPER Method** - Systematically improve each MVP feature (Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse)
- **Six Thinking Hats** - Evaluate MVP scope from 6 perspectives (facts, emotions, benefits, risks, creativity, process)

**For Go-to-Market Strategy:**
- **Five Whys** - Drill down on "Why do PMs fear being replaced?" to refine messaging
- **First Principles Thinking** - Challenge assumptions about pricing, customer acquisition

**For Technical Architecture:**
- **Assumption Reversal** - "What if CLI was web-based?" "What if PMs did use Git?"
- **Provocation Technique** - "PMs should write code" → Extract useful ideas

### Questions That Emerged

1. **CLI Distribution:** How do developers install Forge CLI?
   - npm global package? (`npm install -g @forge/cli`)
   - Homebrew? (`brew install forge`)
   - Standalone binary?

2. **MCP Agent Hosting:** Where does the custom Forge agent run?
   - Cloud-hosted (Forge servers)?
   - Local (dev's machine)?
   - Hybrid (cloud for analysis, local for execution)?

3. **Pricing Model:** How do we monetize?
   - Per-seat ($10-20/user/month)?
   - Per-team ($50-100/team/month)?
   - Freemium (free for small teams, paid for scale)?

4. **Open Source:** Should Forge CLI be open source?
   - Pros: Community adoption, trust, contributions
   - Cons: Competitive moat, monetization challenges

5. **Security & Privacy:** How do we handle sensitive code?
   - Where is code stored during MCP analysis?
   - How long is context retained?
   - Can teams opt-out of cloud analysis?

### Next Session Planning

**Suggested Topics:**
1. **Technical Architecture Deep Dive** - Database schema, API design, MCP integration details
2. **Go-to-Market Strategy** - Pricing, customer acquisition, partnerships
3. **Brand & Messaging** - Product name, tagline, website copy
4. **Competitive Analysis** - Feature comparison vs Jira, Linear, GitHub Issues

**Recommended Timeframe:** 1-2 weeks (after digesting this session's insights)

**Preparation Needed:**
- Review this document thoroughly
- Prototype CLI commands (mockups or basic implementation)
- Research MCP SDK (understand capabilities/limitations)
- Interview 5-10 PMs and Developers (validate assumptions)

---

**Session Summary:**
- **Total Ideas Generated:** 30+ architectural decisions, workflows, and features
- **Duration:** ~90 minutes
- **Techniques Used:** Role Playing (PM + Developer perspectives)
- **Key Breakthrough:** Hybrid web+CLI architecture with MCP task pack workflow
- **Strategic Shift:** From Jira enhancement to standalone platform ("whale" positioning)
- **Next Steps:** Implement Top 3 priorities over 24 weeks

---

_Session facilitated using the BMAD CIS brainstorming framework_

