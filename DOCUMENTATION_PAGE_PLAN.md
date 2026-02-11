# Documentation & Knowledge Base Page - Implementation Plan

## Overview
Create a comprehensive documentation hub that teaches users how to use Forge effectively, explains the product vision, and builds confidence around security.

---

## Page Structure

### 1. Main Navigation & Layout
- **Route:** `/docs` or `/help`
- **Sidebar Navigation:** Collapsible table of contents with sections
- **Search:** Full-text search across all docs
- **Dark Mode:** Full support
- **Mobile:** Responsive design (collapsed sidebar on mobile)

### 2. Main Sections

#### Section A: Getting Started (5 pages)
1. **What is Forge?**
   - Product vision: AI-powered ticket generator
   - Solve the problem of "How do I explain this to engineers?"
   - Real-world use cases

2. **Why Forge vs Claude Workspace?**
   - Claude Workspace: Great for general chat, not structured
   - Claude Web UI: No version control, no organization
   - **Forge advantages:**
     - Structured ticket format (Problem, Solution, AC, etc.)
     - Repository context (scans actual code)
     - Multi-phase generation (questions → answers → finalization)
     - Workspace/team management
     - Attachment organization
     - Reproducible outputs

3. **Why Forge vs Using Claude Directly?**
   - No code context (have to paste everything)
   - No structured output format
   - No revision history
   - Can't reuse artifacts
   - Forge brings: Context automation, structured outputs, persistence

4. **Installation & Setup**
   - GitHub integration
   - Linear/Jira integration
   - Initial configuration

5. **First Ticket - Step by Step**
   - Walk through entire flow
   - Screenshots of each step
   - Tips and best practices

---

#### Section B: Core Workflows (6 pages)

1. **Ticket Creation from Scratch**
   - Stage 1: Type + Title + Materials
   - Stage 2: Code analysis & tech stack detection
   - Stage 3: Ask clarification questions
   - Stage 4: Review & finalize
   - **Tips:** What makes a good title? Good reference materials?

2. **Importing from Jira**
   - Why import?
   - Step-by-step guide
   - Field mapping (type, priority, etc.)
   - When to import vs create new

3. **Importing from Linear**
   - Similar to Jira but different platform
   - Differences in field names
   - Best practices

4. **PRD Breakdown**
   - Upload PRD document
   - System extracts requirements
   - Bulk create tickets from PRD
   - Selective ticket creation (checkbox workflow)

5. **Bulk Enrichment**
   - When to use bulk enrichment
   - Adding multiple tickets at once
   - Answering questions for batch
   - Handling failures gracefully

6. **Ticket Detail & Editing**
   - Viewing generated specs
   - Editing sections
   - Adding reproduction steps (for bugs)
   - Exporting/downloading

---

#### Section C: Understanding the Phases (5 pages)

1. **Phase 1: Context Gathering**
   - What happens: Repository fingerprinting
   - Why it matters: Understanding tech stack
   - What user sees: Tech stack detection
   - Time: 1-2 seconds

2. **Phase 2: Deep Analysis**
   - What happens: LLM reads relevant files from repo
   - Why it matters: Understanding context, patterns, dependencies
   - What user sees: Progress updates
   - Time: 5-10 seconds
   - **Security note:** Only reads, never modifies

3. **Phase 3: Clarification Questions**
   - What happens: System generates 3-5 clarification questions
   - Why it matters: Fill knowledge gaps
   - How user responds: Modal Q&A interface
   - Time: Variable (user-driven)

4. **Phase 4: Specification Generation**
   - What happens: Final spec created with all details
   - What's included: Problem, Solution, AC, API changes, file changes, tests
   - Quality scoring: How we measure spec quality
   - Time: 2-3 seconds

5. **Phase 5: Optional - Finalization**
   - Editing sections
   - Adding more details
   - Publishing to workspace

---

#### Section D: Features Deep Dive (7 pages)

1. **Reproduction Steps (For Bugs)**
   - Why they matter
   - Adding manually
   - Parsing from cURL commands
   - API call formatting
   - Testing reproduction steps

2. **Acceptance Criteria**
   - BDD format (Given/When/Then)
   - Why structured criteria matter
   - Examples and best practices

3. **API Changes Detection**
   - What we detect
   - Endpoints, routes, DTOs
   - Why it matters for implementation

4. **File Changes by Layer**
   - Backend, Frontend, Shared, Infra, Docs
   - Why layering matters
   - When to focus on each layer

5. **Test Plan Generation**
   - Unit tests
   - Integration tests
   - Edge case coverage
   - Best practices for testing

6. **Quality Scoring**
   - What we measure (completeness, clarity, structure)
   - How to improve score
   - Why quality matters

7. **Technology Stack Detection**
   - Languages, frameworks, package managers
   - Why we detect it
   - Using stack info for better tickets

---

#### Section E: Security & Privacy (4 pages)

1. **How We Scan Code (Without Copying)**
   - **Key Message:** "Your code never leaves your GitHub account"
   - Process:
     1. You connect GitHub via OAuth
     2. GitHub API token stays on our server (encrypted)
     3. We call GitHub API to list files
     4. We fetch ONLY relevant files (not entire repo)
     5. LLM analyzes in memory (never stored)
     6. Analysis results stored (code snippets NOT stored)
     7. No copying, no cloning, no storage
   
2. **What Data We Store**
   - Ticket metadata (title, type, priority)
   - Generated specs (Problem, Solution, etc.)
   - File paths and function names (not full code)
   - Attachments (user uploaded)
   - What we DON'T store: Full source code, secrets, credentials

3. **Data Privacy & GDPR**
   - Data retention policy
   - Right to deletion
   - Export your data
   - No third-party sharing

4. **Security Best Practices**
   - Don't include secrets in tickets
   - Use environment variables section
   - Separate sensitive info from specs
   - GitHub token security (regenerate periodically)

---

#### Section F: FAQ & Troubleshooting (4 pages)

1. **General FAQ**
   - Can I use Forge offline? No
   - Can I edit after generation? Yes
   - Can I download tickets? Yes
   - Do you train on my code? No
   - Can I delete my workspace? Yes

2. **Troubleshooting**
   - "Ticket generation failed" → reasons and fixes
   - "GitHub connection lost" → how to reconnect
   - "Questions seem irrelevant" → why and how to improve
   - "Spec is missing details" → how to add more context

3. **Common Patterns**
   - How to title tickets effectively
   - Best practices for reference materials
   - How to structure complex features
   - Multi-repo feature approach

4. **Limitations & Roadmap**
   - Current limitations
   - Planned features
   - Feature requests
   - Beta features

---

## Component Structure

```
/docs
├── page.tsx                           # Main docs page
├── layout.tsx                         # Docs layout with sidebar
├── components/
│   ├── DocsNav.tsx                   # Sidebar navigation
│   ├── DocsSidebar.tsx               # Sidebar container
│   ├── DocsSearch.tsx                # Search box
│   ├── TableOfContents.tsx           # Floating TOC (right side)
│   ├── DocSection.tsx                # Individual section wrapper
│   └── CodeBlock.tsx                 # Code example renderer
├── content/
│   ├── getting-started/
│   │   ├── what-is-forge.mdx
│   │   ├── forge-vs-claude.mdx
│   │   ├── setup.mdx
│   │   └── first-ticket.mdx
│   ├── workflows/
│   ├── phases/
│   ├── features/
│   ├── security/
│   └── faq/
└── lib/
    ├── docs-nav.ts                   # Navigation structure
    └── search.ts                      # Search implementation
```

---

## Content Strategy

### Tone & Style
- **Friendly, not technical** - "teach me like I'm new"
- **Reassuring on security** - "your code is safe"
- **Actionable** - links to features, examples
- **Visual** - screenshots, diagrams, videos (future)

### For Each Section
1. **Intro:** Why this matters
2. **How it works:** Visual explanation
3. **Step-by-step:** With screenshots
4. **Tips:** Best practices
5. **Next steps:** Related topics

### Visuals to Create
- Flowchart: Ticket creation phases
- Diagram: How code scanning works
- Screenshots: Each UI step
- Comparison table: Forge vs alternatives
- Security architecture diagram

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create docs page layout & sidebar
- [ ] Implement search (basic)
- [ ] Create content structure (MDX files)
- [ ] Implement dark mode support

### Phase 2: Getting Started Content (Week 2)
- [ ] "What is Forge" page
- [ ] "Forge vs Claude" comparison
- [ ] First ticket walkthrough
- [ ] Setup guide

### Phase 3: Workflows Content (Week 2-3)
- [ ] All workflow pages
- [ ] Screenshots for each step
- [ ] Interactive examples (if possible)

### Phase 4: Technical Content (Week 3-4)
- [ ] Phases explanation
- [ ] Features deep dive
- [ ] Security & privacy

### Phase 5: Polish & SEO (Week 4)
- [ ] FAQ section
- [ ] Troubleshooting
- [ ] Improve search
- [ ] Add metadata for SEO
- [ ] Add table of contents for each page

### Phase 6: Enhancements (Future)
- [ ] Video tutorials
- [ ] Interactive demos
- [ ] Community contributions
- [ ] Analytics (which pages are most viewed)

---

## Navigation Integration

### Add to Sidebar
```
Sidebar Menu:
├── Tickets
├── Pricing
├── Settings
└── 📚 Documentation  ← NEW
```

### Add to User Menu
```
User Dropdown:
├── Settings
├── Show Onboarding
├── 📚 Documentation  ← NEW
└── Sign out
```

### Add to Homepage/Onboarding
- Link to docs in onboarding flow
- "Learn more" links throughout app

---

## Success Metrics

- **Engagement:** Users visiting docs
- **Retention:** Users finding answers in docs instead of asking support
- **Quality:** Reduced support tickets for "how do I..."
- **Confidence:** Users report higher confidence in using Forge

---

## Migration Plan

If we migrate from existing docs (if any):
1. Consolidate scattered help content
2. Restructure for logical flow
3. Update screenshots/examples
4. Add missing sections

---

## Tools & Tech Stack

- **Content Format:** MDX (Markdown + JSX components)
- **Search:** Simple text search or Algolia (if needed)
- **Syntax Highlighting:** `react-syntax-highlighter` or Shiki
- **TOC Generation:** Automatic from headings
- **Styling:** Tailwind + existing design system

---

## Success Criteria

✅ Users can find answers to common questions
✅ New users understand Forge's value
✅ Users feel confident their code is secure
✅ Reduced support load for "how to use" questions
✅ Higher engagement metrics
✅ Positive user feedback

