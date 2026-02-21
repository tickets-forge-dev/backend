    # Epic 7 Design Notes — Ticket Re-Enrichment ("Re-Bake")

    _Captured: 2026-02-20 — Decision made during Epic 6 MCP Server planning_

    ---

    ## The Problem

    The ticket creation wizard (Epic 1/3) produces a **half-baked ticket**: the PM's best
    initial understanding. When a developer runs `forge review T-001`, Claude generates
    5–10 clarifying questions that surface missing context, implicit assumptions, and
    ambiguities.

    Storing the Q&A as a conversation thread is **not enough**. The developer's execution
    phase (`forge execute`) needs a **single, complete, unambiguous ticket spec** — not
    "ticket + attached thread they have to read and mentally merge."

    ---

    ## The Solution: Re-Enrichment Pipeline (Story 7-7)

    ### Core Insight

    The existing Stage 2 AI enrichment already knows how to take raw context → produce
    a structured ticket. Re-baking is the **same pipeline with richer input**.

    ```
    First enrichment (ticket creation wizard):
      INPUT:  PM description + codebase scan + reference materials
      OUTPUT: Structured ticket with acceptance criteria → status: READY

    Re-bake enrichment (after developer Q&A):
      INPUT:  Original ticket fields + developer questions + PM answers
      OUTPUT: UPDATED ticket — same ID, enriched ACs, zero ambiguity
              Edge cases now explicit ACs, technical details resolved
              → status stays WAITING_FOR_APPROVAL until PM approves
    ```

    ### AI Prompt for Re-Enrichment

    > *"You are enriching a software ticket. Given the original ticket specification and a
    > Q&A session between the developer and PM, produce a complete, execution-ready ticket.
    > Incorporate all clarifications as concrete acceptance criteria. Leave nothing implicit.
    > Every ambiguity the developer raised must become an explicit decision in the spec."*

    ---

    ## Full Flow (Epic 6 + Epic 7 combined)

    ```
    1. PM creates ticket in wizard → AI enriches → status: READY

    2. Dev: forge review T-001
       → CLI validates status, prints "invoke forge_review prompt"
       → Dev invokes forge_review prompt in their AI tool (Claude Code / Cursor / Windsurf)

    3. Tech-Spec Agent Session (duration and depth unknown — not "5 generic questions")
       → MCP loads tech-spec-reviewer persona (BMAD-style agent) + full ticket context
       → Agent conducts a full technical analysis session:
            - explores codebase via get_repository_context tool
            - identifies ambiguities, edge cases, architecture decisions
            - works interactively with the developer (open-ended, not fixed Q count)
       → Developer and agent collaborate until agent has enough to produce output
       → Agent outputs a STRUCTURED JSON that Forge understands:
            {
              findings, decisions, edgeCases,
              suggestedACs, technicalRequirements, outOfScope
            }
       → MCP tool (submit_review_session) POSTs this JSON to backend
       → status: QUESTIONS_GENERATED

    4. [Epic 7] Backend stores structured review session → PM notified

    5. [Epic 7] PM opens ticket in web UI
       → Sees technical analysis rendered (decisions, findings, edge cases)
       → PM clicks "Re-bake Ticket"
       → POST /api/tickets/:id/re-enrich (body: reviewSessionId)
       → AI re-runs enrichment with structured agent output as input context
       → Ticket acceptance criteria expand and sharpen based on agent findings
       → PM sees diff: "before / after re-bake"
       → PM optionally edits manually
       → PM clicks "Approve" → status: READY (fully approved)

    6. Dev: forge execute T-001
       → CLI validates status, auto-assigns ticket
       → Claude (MCP): get_ticket_context returns the RE-BAKED ticket
       → Claude has everything it needs — no guessing
       → Writes code → update_ticket_status → status: CREATED

    7. PM sees CREATED status in web → reviews output
    ```

    ---

    ## Agent Output Schema (defined in reviewer agent guide — story 6-9)

    The tech-spec-reviewer agent MUST produce this JSON at session end.
    This is what Forge's MCP tool captures and POSTs to the backend.

    ```json
    {
      "ticketId": "T-001",
      "agentVersion": "tech-spec-reviewer-v1",
      "findings": [
        "Auth token refresh not handled during active session",
        "No clear error path for network loss mid-operation"
      ],
      "decisions": [
        {
          "topic": "Auth library",
          "decision": "Firebase Auth SDK (existing)",
          "rationale": "Already imported in auth.service.ts — no new dependency"
        }
      ],
      "edgeCases": [
        "Token expiry during file upload → must resume, not fail",
        "Concurrent tab logout → propagate via BroadcastChannel"
      ],
      "suggestedACs": [
        "Token refresh triggers silently if expiry < 5 min away",
        "Offline state shows 'No connection' toast, not auth error"
      ],
      "technicalRequirements": [
        "Use firebase.auth().onIdTokenChanged() listener",
        "Grace period: 5 min sliding window before forced re-auth"
      ],
      "outOfScope": [
        "SSO / OAuth providers (future epic)",
        "Biometric re-auth on mobile"
      ]
    }
    ```

    This schema is platform-agnostic — works identically whether the session
    runs in Claude Code, Cursor, Windsurf, or any MCP-compatible tool.

    ---

    ## Backend APIs

    ### Submit Review Session (Story 7-4)

    ```
    POST /api/tickets/:id/review-sessions
    Authorization: Bearer <idToken>
    Body: { ...ReviewSessionSchema }   ← structured JSON from agent above

    → Validates schema, stores in Firestore: review_sessions/{id}
    → Updates ticket status: QUESTIONS_GENERATED
    → Notifies PM (email / in-app)
    ```

    ### Re-Enrich Ticket (Story 7-7)

    ```
    POST /api/tickets/:id/re-enrich
    Authorization: Bearer <idToken>
    Body: { "reviewSessionId": "rs_abc123" }

    Process:
      1. Fetch ticket by ID
      2. Fetch review session (structured agent output) by reviewSessionId
      3. Build enrichment prompt: original ticket fields + structured agent output
      4. Call AI enrichment service (same pipeline as wizard Stage 2)
      5. Update ticket fields in Firestore (acceptanceCriteria, description, etc.)
      6. Return enriched TicketDetail

    Response: Updated TicketDetail (same shape as GET /tickets/:id)
    ```

    **Reuses**: existing AI enrichment service — no new AI infrastructure needed.
    **New**: structured agent output (not free-text) as enrichment input — richer, more precise.

    ---

    ## Web UI Changes (Story 7-7 + 7-6)

    When ticket is in `WAITING_FOR_APPROVAL` status, PM sees:

    ```
    ┌─────────────────────────────────────────────────────┐
    │  T-001: Fix auth timeout          WAITING FOR PM   │
    ├─────────────────────────────────────────────────────┤
    │  Developer Review Session                           │
    │  ─────────────────────────────────────────────────  │
    │  Q: What auth library to use?                      │
    │  A: Firebase Auth, same as existing login          │
    │                                                     │
    │  Q: Should it handle offline mode?                 │
    │  A: No — throw a clear user-facing error           │
    │                                                     │
    │  Q: Token expiry — hard cutoff or grace period?    │
    │  A: 5 min grace period, then re-auth required      │
    │  ─────────────────────────────────────────────────  │
    │                                                     │
    │  [Generate Updated Ticket]   ← triggers re-bake    │
    │                                                     │
    │  ┌ Re-baked Ticket Preview ─────────────────────┐   │
    │  │ Acceptance Criteria (was 3, now 7):          │   │
    │  │ ✓ Auth timeout uses Firebase Auth SDK        │   │
    │  │ ✓ Offline: show "No connection" error toast  │   │
    │  │ ✓ 5-min grace period before re-auth prompt   │   │
    │  │ ... (4 more)                                 │   │
    │  └──────────────────────────────────────────────┘   │
    │                                                     │
    │                              [Approve →]            │
    └─────────────────────────────────────────────────────┘
    ```

    ---

    ## Status Transitions

    ```
    READY                    ← ticket created, AI-enriched
      ↓ (forge review)
    QUESTIONS_GENERATED      ← dev questions generated (new — story 7-1)
      ↓ (questions POSTed)
    WAITING_FOR_APPROVAL     ← PM notified (new — story 7-1)
      ↓ (PM answers + re-bakes + approves)
    READY                    ← fully approved, re-baked ticket
      ↓ (forge execute)
    CREATED                  ← dev completed execution (existing)
    ```

    ---

    ## Story Breakdown

    | Story | What |
    |-------|------|
    | **7-1** | Extend AECStatus enum: add `QUESTIONS_GENERATED`, `WAITING_FOR_APPROVAL` |
    | **7-3** | Conversation storage: Firestore `conversations/{id}` with Q&A pairs |
    | **7-4** | Conversation API: `POST /tickets/:id/conversations`, `GET /tickets/:id/conversations` |
    | **7-6** | Conversation viewer UI: PM sees Q&A in ticket detail panel |
    | **7-7** | **Re-enrich endpoint + UI**: `POST /tickets/:id/re-enrich`, "Generate Updated Ticket" button, diff preview |
    | **7-8** | Approve button (PM only): status → READY, closes the loop |

    ---

    ## Key Constraint

    The re-baked ticket **replaces** the original fields (acceptanceCriteria, description
    refinements) — it is NOT stored as a separate version. The ticket ID stays the same.
    Git-style diffs are shown in the UI for PM review before confirming, but only the
    final approved version is persisted.

    If PM clicks "Approve" without re-baking, that's fine too — Q&A context is still
    available via the conversation viewer, and the execute prompt can fetch it as
    supplementary context.
