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

