# 📚 Executable Tickets — Documentation Index

Welcome! This folder contains all documentation for the Executable Tickets system.

**Last Updated:** 2026-02-06 (After documentation cleanup)
**Current Phase:** Planning epic execution
**Latest Commit:** `adb1a5b` (Deep LLM-powered repository analysis)

---

## 🎯 Start Here

**New to this project?**
1. Read **[prd.md](./prd.md)** — Product overview (5 min)
2. Read **[STATUS.md](./STATUS.md)** — What's done, what's in progress (10 min)
3. Read **[ROADMAP.md](./ROADMAP.md)** — How to execute next steps (10 min)

**Picking up work?**
1. Check **[STATUS.md](./STATUS.md)** for what's in progress
2. Review **[epics.md](./epics.md)** for story details
3. Read **[CLAUDE.md](./CLAUDE.md)** for development rules
4. Check **[architecture.md](./architecture.md)** for technical details

---

## 📖 Core Documentation

### 🎯 **[STATUS.md](./STATUS.md)** — Current Completion Status
Detailed breakdown of epic completion levels:
- ✅ Completed epics (1, 1.5)
- 🟡 In-progress epics (2, 3, 4, 6, 9)
- ⚪ Planned epics (5, 7, 8)
- Dependencies and blockers
- Metrics (43 total stories, ~35% complete)

**Use this to:** Understand what's done and what needs work

---

### 🗺️ **[ROADMAP.md](./ROADMAP.md)** — Execution Paths
Four paths to complete remaining epics:
- **PATH A:** Production Quality First (6-7 weeks) — Recommended
- **PATH B:** Feature-Complete Fast (7-8 weeks)
- **PATH C:** Balanced (6-8 weeks)
- **PATH D:** MVP + Extended (3-4 weeks + more)

Each path includes:
- Phase breakdown with stories
- Deliverables per phase
- Timeline estimates
- Risk assessment

**Use this to:** Plan which epics to do and in what order

---

### 📋 **[prd.md](./prd.md)** — Product Requirements Document
High-level product definition:
- Product vision and goals
- User personas
- Functional requirements (FR1-FR10)
- Acceptance criteria
- Non-functional requirements

**Use this to:** Understand what the product does and why

---

### 📚 **[epics.md](./epics.md)** — Epic & Story Definitions
Complete epic breakdown:
- **Epic 1:** Foundation (infrastructure, design system)
- **Epic 1.5:** OAuth Authentication
- **Epic 2:** Ticket Creation & AEC Engine
- **Epic 3:** Clarification & Validation
- **Epic 4:** Code Intelligence & Estimation
- **Epic 5:** Export & Integrations
- **Epic 6:** Quick Document Generation
- **Epic 7:** Code-Aware Validation (Mastra-based)
- **Epic 8:** Observability & Distributed Tracing
- **Epic 9:** BMAD Tech-Spec Integration

Each epic includes:
- Goal and value proposition
- 2-7 user stories with acceptance criteria
- Technical notes and technology stack
- Prerequisites and dependencies

**Use this to:** Pick a story and understand all details

---

### 🏛️ **[architecture.md](./architecture.md)** — Technical Architecture
System design and patterns:
- Clean Architecture layers (presentation → application → domain ← infrastructure)
- Technology stack (Next.js, NestJS, Firebase, Mastra)
- Key design decisions and patterns
- Data flow and API contracts
- Domain models (AEC, TechSpec, Questions, etc.)
- Infrastructure setup

**Use this to:** Understand how to implement new features

---

### 🎨 **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** — UI Governance & Components
Design rules and component library:
- Design tokens (colors, spacing, typography)
- Component library (atoms, molecules, organisms)
- Protected components (sidebar, navigation)
- Linear-inspired minimalism principles
- Accessibility standards (WCAG 2.1 AA)
- Dark mode implementation

**Use this to:** Build UI following established patterns

---

### 📝 **[CLAUDE.md](./CLAUDE.md)** — Development Rules
Non-negotiable engineering rules:
- Architecture boundaries (Clean Architecture)
- Design patterns (Ports & Adapters, Repository, Mappers)
- Code quality rules
- AI output requirements
- Naming conventions
- Testing expectations

**Use this to:** Follow project standards before coding

---

## 📚 Reference Documentation

### **[schemas/](./schemas/)**
Technical specifications and data formats:
- `AEC_XML_FORMAT_SUMMARY.md` — AEC XML structure overview
- `aec-xml-specification.md` — Complete AEC XML schema
- `README.md` — Schema documentation index

**Use this to:** Understand AEC (Annotated Execution Context) format

---

### **[architecture/](./architecture/)**
Architectural Decision Records (ADRs):
- `ADR-007-mastra-workspace-validation.md` — Why we use Mastra for validation

**Use this to:** Understand why certain technical choices were made

---

### **[ui-specs/](./ui-specs/)**
UI specifications and wireframes:
- `safety-zones-ui-spec.md` — Safety zones feature specification

**Use this to:** Reference UI designs before building

---

### **[implementation-guides/](./implementation-guides/)**
Guides for specific implementation tasks:
- `mastra-workspace-integration.md` — How to integrate with Mastra workspace

**Use this to:** Follow step-by-step guides for complex features

---

### **[WIREFRAMES_9-7_QUESTION_REFINEMENT.md](./WIREFRAMES_9-7_QUESTION_REFINEMENT.md)**
Visual wireframes for question refinement UI:
- Question display layouts
- Answer input patterns
- Round progression UI
- Multi-stage wizard design

**Use this to:** See what the question UI should look like

---

## 📦 Reference Knowledge

### **[mastra-framework-knowledge.md](./mastra-framework-knowledge.md)**
Knowledge base for Mastra framework:
- Mastra workflows
- Workspace setup
- Agent skills
- Tracing and observability

**Use this to:** Learn Mastra APIs and patterns

---

## 📁 Archived Documentation

**Old iteration docs archived in `/docs-archive/`:**
- Story implementation guides (outdated)
- Testing guides (use current test files instead)
- Setup guides (use current backend/client READMEs)
- Planning documents (superseded by STATUS.md)
- Implementation progress trackers (obsolete)

**Access archived docs if needed:**
```bash
ls -la docs-archive/
```

---

## 🚀 Quick Reference

### **Project Structure**
```
forge/
├── backend/           # NestJS backend
├── client/            # Next.js frontend
├── packages/          # Shared types/configs
└── docs/             # This folder
    ├── README.md (you are here)
    ├── STATUS.md (epic completion)
    ├── ROADMAP.md (execution paths)
    ├── prd.md (product requirements)
    ├── epics.md (story definitions)
    ├── architecture.md (technical design)
    ├── DESIGN-SYSTEM.md (UI governance)
    ├── CLAUDE.md (development rules)
    ├── schemas/ (data formats)
    ├── architecture/ (ADRs)
    ├── ui-specs/ (wireframes)
    ├── implementation-guides/ (howtos)
    └── docs-archive/ (old iteration docs)
```

### **Latest Commit**
```
adb1a5b feat(epic-9): Implement deep LLM-powered repository analysis with real-time SSE streaming
```

Changes:
- Deep-analysis service (3-phase LLM pipeline)
- Real-time progress via SSE
- Question round infrastructure
- 4-stage wizard UI
- Governance documentation (CLAUDE.md files)

### **Tech Stack**
- **Frontend:** Next.js 14, TypeScript, Zustand, shadcn/ui
- **Backend:** NestJS, TypeScript, Firebase, Mastra
- **Database:** Firestore
- **Auth:** Firebase Auth (OAuth)
- **LLM:** Anthropic Claude (+ Ollama for local dev)
- **Observability:** Mastra tracing (planned)

### **Development**
```bash
# Backend
cd backend && npm run dev      # localhost:3000

# Frontend
cd client && npm run dev       # localhost:3001

# TypeScript check
npm run type-check

# Tests
npm test
```

---

## ❓ FAQs

**Q: Where do I find what to work on?**
A: Check [STATUS.md](./STATUS.md) → [ROADMAP.md](./ROADMAP.md) → [epics.md](./epics.md)

**Q: What are the development rules?**
A: Read [CLAUDE.md](./CLAUDE.md) — it's non-negotiable

**Q: How do I understand the current architecture?**
A: Read [architecture.md](./architecture.md)

**Q: What's an AEC?**
A: Annotated Execution Context — the central domain model. Read [schemas/aec-xml-specification.md](./schemas/aec-xml-specification.md)

**Q: What should I build next?**
A: Pick a path in [ROADMAP.md](./ROADMAP.md), then a story in [epics.md](./epics.md)

**Q: Where are the old iteration docs?**
A: Archived in `/docs-archive/` — they were cleaned up to reduce noise

---

## 📊 Documentation Stats

- **Core Docs:** 9 files (PRD, Epics, Architecture, etc.)
- **Reference Docs:** 12 files (Schemas, wireframes, guides)
- **Archived Docs:** 50+ files (old iteration docs)
- **Total Tokens:** ~100K (focused, high-signal)

---

## 🎯 Next Steps

1. **Choose execution path** from [ROADMAP.md](./ROADMAP.md)
2. **Pick first epic** from [epics.md](./epics.md)
3. **Read development rules** in [CLAUDE.md](./CLAUDE.md)
4. **Start building!** 🚀

---

**Last Updated:** 2026-02-06
**Maintainer:** Project team
**Questions?** Check the relevant doc above!

