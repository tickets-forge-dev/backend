# HTML Wireframe Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate interactive HTML wireframe previews from ASCII wireframes during ticket finalization, displayed in a sandboxed iframe in the Design tab.

**Architecture:** Fire-and-forget background task in `FinalizeSpecUseCase` (same pattern as existing Excalidraw generation). Uses `fastModel` (Haiku) to convert ASCII wireframes → self-contained HTML. Frontend renders HTML in a `sandbox=""` iframe in `DesignTab`. Falls back to ASCII wireframes when `wireframeHtml` is null.

**Tech Stack:** NestJS (backend), Vercel AI SDK (`generateText`), React/Next.js (frontend), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-23-html-wireframes-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts` | Add `wireframeHtml` to `TechSpec` interface and `generateHtmlWireframe` to port |
| Modify | `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` | Implement `generateHtmlWireframe` method |
| Modify | `backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts` | Add `generateHtmlWireframeInBackground` + wire into pipeline |
| Modify | `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts` | Add HTML wireframe generation after re-enrichment |
| Modify | `client/src/types/question-refinement.ts` | Add `wireframeHtml` to frontend `TechSpec` type |
| Modify | `client/src/tickets/components/detail/DesignTab.tsx` | Accept + pass `wireframeHtml` prop |
| Modify | `client/src/tickets/components/VisualExpectationsSection.tsx` | Render HTML wireframe iframe when available |

---

### Task 1: Add `wireframeHtml` to backend TechSpec interface

**Files:**
- Modify: `backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts:333-363` (TechSpec interface)
- Modify: `backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts:600-614` (TechSpecGenerator port)

- [ ] **Step 1: Add `wireframeHtml` field to TechSpec interface**

In `TechSpecGenerator.ts`, add after the `visualExpectations` field (line 354):

```typescript
  wireframeHtml?: string | null; // HTML wireframe preview (generated async from ASCII wireframes)
```

- [ ] **Step 2: Add `generateHtmlWireframe` method to TechSpecGenerator port**

In `TechSpecGenerator.ts`, add after the `generateExcalidrawWireframes` method (after line 613):

```typescript
  /**
   * Generates an HTML wireframe preview from ASCII wireframes.
   * Called as a deferred background task after the main spec is saved.
   *
   * @param title - Ticket title for context
   * @param asciiWireframes - Concatenated ASCII wireframe strings
   * @param solutionContext - Solution description for UI context
   * @returns Self-contained HTML string, or null on failure
   */
  generateHtmlWireframe(
    title: string,
    asciiWireframes: string,
    solutionContext: string,
    trackingContext?: { userId?: string; teamId?: string; ticketId?: string },
  ): Promise<string | null>;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts
git commit -m "feat: add wireframeHtml to TechSpec interface and port"
```

---

### Task 2: Implement `generateHtmlWireframe` in TechSpecGeneratorImpl

**Files:**
- Modify: `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts:2614` (after `generateExcalidrawWireframes`)

- [ ] **Step 1: Add `generateHtmlWireframe` method**

Add after the `generateExcalidrawWireframes` method (after line ~2614):

```typescript
  /**
   * Generates a self-contained HTML wireframe from ASCII wireframes.
   * Uses the fast model (Haiku) for low-cost, fast generation.
   * Returns raw HTML string — no JSON parsing.
   */
  async generateHtmlWireframe(
    title: string,
    asciiWireframes: string,
    solutionContext: string,
    trackingContext?: { userId?: string; teamId?: string; ticketId?: string },
  ): Promise<string | null> {
    const model = this.fastModel ?? this.llmModel;
    if (!model) {
      this.logger.warn('No LLM configured — skipping HTML wireframe generation');
      return null;
    }

    try {
      const systemPrompt = `You are a wireframe rendering agent. Convert ASCII wireframes into a single self-contained HTML document. Output ONLY the HTML — no markdown fences, no explanation, no preamble. Start with <!DOCTYPE html>.`;

      const userPrompt = `Convert these ASCII wireframes into an interactive HTML preview.

## Ticket: ${title}

## ASCII Wireframes
${asciiWireframes}

## Solution Context
${solutionContext}

## Requirements
- Self-contained HTML with all CSS in a <style> block — no external dependencies
- Dark theme: background #0f1117, cards #1a1d27, borders #2a2d3a, text #e0e0e0, headings #ffffff, accent #6366f1
- One section per screen/view from the wireframes
- Below each section, add an amber callout bar (background #78350f/#fef3c7 text) explaining behaviors and interactions
- Responsive fluid layout that looks good at any width
- No JavaScript — pure HTML/CSS only
- Use system font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Cards with subtle border-radius (8px) and the border color above
- Generous padding and spacing for readability
- Body must have overflow-y: auto to allow scrolling within an iframe`;

      const modelId = this.fastModel ? this.fastModelId : (this.configService.get<string>('ANTHROPIC_MODEL') || DEFAULT_MODEL);

      const { text, usage } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 8192,
        temperature: 0.3,
      });

      // Track token usage if context provided
      const ctx = trackingContext;
      if (ctx?.userId && usage) {
        const costUsd = this.telemetryService.computeLLMCost(
          modelId,
          usage.inputTokens ?? 0,
          usage.outputTokens ?? 0,
        );
        this.telemetryService.trackCost(ctx.userId, {
          service: 'anthropic',
          tokens_input: usage.inputTokens ?? 0,
          tokens_output: usage.outputTokens ?? 0,
          cost_usd: costUsd,
          model: modelId,
          operation: 'html_wireframe_generation',
          ticket_id: ctx.ticketId,
        });

        if (ctx.teamId) {
          const month = new Date().toISOString().slice(0, 7);
          const totalTokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
          this.usageBudgetRepository.incrementTokens(ctx.teamId, month, totalTokens).catch((err: any) => {
            this.logger.warn(`Failed to increment token usage: ${err.message}`);
          });
        }
      }

      // Basic validation — must look like HTML
      if (!text || (!text.includes('<html') && !text.includes('<!DOCTYPE'))) {
        this.logger.warn('HTML wireframe generation returned non-HTML content');
        return null;
      }

      // Strip markdown code fences if the LLM wrapped them
      let html = text.trim();
      if (html.startsWith('```')) {
        html = html.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      // Check for truncated output
      if (!html.includes('</html>')) {
        this.logger.warn('HTML wireframe appears truncated (missing </html>)');
        return null;
      }

      return html;
    } catch (error) {
      this.logger.warn(`HTML wireframe generation failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
```

- [ ] **Step 2: Verify `generateText` import exists**

Confirm line 18 already has: `import { generateText, LanguageModel } from 'ai';` — no change needed.

- [ ] **Step 3: Commit**

```bash
git add backend/src/tickets/application/services/TechSpecGeneratorImpl.ts
git commit -m "feat: implement generateHtmlWireframe with fast model"
```

---

### Task 3: Wire HTML wireframe generation into FinalizeSpecUseCase

**Files:**
- Modify: `backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts:163-235`

- [ ] **Step 1: Add `generateHtmlWireframeInBackground` method**

Add after the existing `generateWireframesInBackground` method (after line 235):

```typescript
  /**
   * Generate HTML wireframe preview in background and patch the AEC when done.
   * Fire-and-forget — does not block the spec finalization response.
   */
  private generateHtmlWireframeInBackground(
    aecId: string,
    techSpec: TechSpec,
    trackingContext?: { userId?: string; teamId?: string; ticketId?: string },
  ): void {
    console.log(`✨ [FinalizeSpecUseCase] Starting background HTML wireframe generation for AEC ${aecId}`);

    const asciiWireframes = (techSpec.visualExpectations?.expectations ?? [])
      .filter(e => e.wireframe)
      .map(e => `## ${e.screen} (${e.state})\n${e.wireframe}`)
      .join('\n\n');

    if (!asciiWireframes) {
      console.log(`✨ [FinalizeSpecUseCase] No ASCII wireframes found for AEC ${aecId}, skipping HTML generation`);
      return;
    }

    const solutionContext = typeof techSpec.solution === 'object' && techSpec.solution !== null
      ? JSON.stringify(techSpec.solution)
      : String(techSpec.solution ?? '');

    this.techSpecGenerator
      .generateHtmlWireframe(techSpec.title, asciiWireframes, solutionContext, trackingContext)
      .then(async (html) => {
        if (!html) {
          console.log(`✨ [FinalizeSpecUseCase] HTML wireframe generation returned null for AEC ${aecId}`);
          return;
        }

        // Re-load the AEC and patch the wireframeHtml
        const aec = await this.aecRepository.findById(aecId);
        if (!aec || !aec.techSpec) {
          console.warn(`✨ [FinalizeSpecUseCase] AEC ${aecId} not found or has no techSpec for HTML wireframe patch`);
          return;
        }

        aec.setTechSpec({
          ...aec.techSpec,
          wireframeHtml: html,
        });

        await this.aecRepository.save(aec);
        console.log(`✨ [FinalizeSpecUseCase] HTML wireframe saved for AEC ${aecId} (${html.length} chars)`);
      })
      .catch((error) => {
        console.error(
          `✨ [FinalizeSpecUseCase] Background HTML wireframe generation failed for AEC ${aecId}:`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }
```

- [ ] **Step 2: Wire into the execution pipeline**

After line 173 (below the disabled Excalidraw block), add:

```typescript
    // HTML wireframe generation (fire-and-forget)
    if (aec.includeWireframes && techSpec.visualExpectations?.expectations?.length) {
      this.generateHtmlWireframeInBackground(aec.id, techSpec, {
        userId: aec.createdBy,
        teamId: aec.teamId,
        ticketId: aec.id,
      });
    }
```

- [ ] **Step 3: Add TechSpec import if needed**

Check that `TechSpec` is imported from the domain. It should already be available via the `TechSpecGenerator` import at the top of the file.

- [ ] **Step 4: Commit**

```bash
git add backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts
git commit -m "feat: wire HTML wireframe generation into finalization pipeline"
```

---

### Task 4: Wire HTML wireframe generation into ReEnrichWithQAUseCase

**Files:**
- Modify: `backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts:95-101`

- [ ] **Step 1: Add background HTML wireframe generation after re-enrichment**

After line 99 (`await this.aecRepository.save(aec);`), before `return aec;`, add:

```typescript
    // Fire-and-forget HTML wireframe regeneration
    if (aec.includeWireframes && techSpec.visualExpectations?.expectations?.length) {
      const asciiWireframes = techSpec.visualExpectations.expectations
        .filter(e => e.wireframe)
        .map(e => `## ${e.screen} (${e.state})\n${e.wireframe}`)
        .join('\n\n');

      if (asciiWireframes) {
        const solutionContext = typeof techSpec.solution === 'object' && techSpec.solution !== null
          ? JSON.stringify(techSpec.solution)
          : String(techSpec.solution ?? '');

        this.techSpecGenerator
          .generateHtmlWireframe(techSpec.title, asciiWireframes, solutionContext, {
            userId: command.requestingUserId,
            teamId: command.teamId,
            ticketId: command.ticketId,
          })
          .then(async (html) => {
            if (!html) return;
            const freshAec = await this.aecRepository.findById(command.ticketId);
            if (!freshAec?.techSpec) return;
            freshAec.setTechSpec({ ...freshAec.techSpec, wireframeHtml: html });
            await this.aecRepository.save(freshAec);
            console.log(`[ReEnrichWithQAUseCase] HTML wireframe saved for ticket ${command.ticketId}`);
          })
          .catch((error) => {
            console.error(
              `[ReEnrichWithQAUseCase] HTML wireframe generation failed for ticket ${command.ticketId}:`,
              error instanceof Error ? error.message : String(error),
            );
          });
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/tickets/application/use-cases/ReEnrichWithQAUseCase.ts
git commit -m "feat: add HTML wireframe generation to re-enrichment flow"
```

---

### Task 5: Add `wireframeHtml` to frontend TechSpec type

**Files:**
- Modify: `client/src/types/question-refinement.ts:183-228`

- [ ] **Step 1: Add `wireframeHtml` to frontend TechSpec interface**

After the `visualExpectations` field (line 225), add:

```typescript
  wireframeHtml?: string | null; // HTML wireframe preview (rendered in sandboxed iframe)
```

- [ ] **Step 2: Commit**

```bash
git add client/src/types/question-refinement.ts
git commit -m "feat: add wireframeHtml to frontend TechSpec type"
```

---

### Task 6: Render HTML wireframe iframe in frontend

**Files:**
- Modify: `client/src/tickets/components/detail/DesignTab.tsx:16-26` (props), `269-278` (rendering)
- Modify: `client/src/tickets/components/VisualExpectationsSection.tsx:122-129` (props), `155-210` (rendering)
- Modify: `client/src/tickets/components/detail/TicketDetailLayout.tsx:873-883` (pass prop)

- [ ] **Step 1: Add `wireframeHtml` prop to DesignTab**

In `DesignTab.tsx`, add to the `DesignTabProps` interface (after line 21):

```typescript
  wireframeHtml?: string | null;
```

Add to the destructured props (after `visualExpectations,` on line ~34):

```typescript
  wireframeHtml,
```

- [ ] **Step 2: Pass `wireframeHtml` to VisualExpectationsSection**

In `DesignTab.tsx`, where `VisualExpectationsSection` is rendered (line ~270), add the prop:

```tsx
            <VisualExpectationsSection
              summary={visualExpectations!.summary}
              expectations={visualExpectations!.expectations}
              flowDiagram={visualExpectations!.flowDiagram}
              excalidrawData={visualExpectations!.excalidrawData}
              wireframeHtml={wireframeHtml}
              ticketId={ticketId}
              onSaveExcalidraw={handleSaveExcalidraw}
            />
```

- [ ] **Step 3: Add `wireframeHtml` prop to VisualExpectationsSection**

In `VisualExpectationsSection.tsx`, add to the `VisualExpectationsSectionProps` interface (after line 126):

```typescript
  wireframeHtml?: string | null;
```

Add to the destructured props (after `onSaveExcalidraw,`):

```typescript
  wireframeHtml,
```

- [ ] **Step 4: Render the HTML wireframe iframe**

In `VisualExpectationsSection.tsx`, replace the disabled Excalidraw comment block (lines 157-164) with the HTML wireframe iframe:

```tsx
      {/* HTML Wireframe Preview */}
      {wireframeHtml && (
        <div className="space-y-2">
          <p className="text-[var(--text-xs)] font-medium text-[var(--text-tertiary)] uppercase">
            Wireframe Preview
          </p>
          <div className="rounded-lg overflow-hidden border border-[var(--border-subtle)]">
            <iframe
              srcdoc={wireframeHtml}
              sandbox=""
              title="Wireframe Preview"
              className="w-full border-0"
              style={{ height: '600px' }}
            />
          </div>
        </div>
      )}
```

- [ ] **Step 5: Pass `wireframeHtml` from TicketDetailLayout to DesignTab**

In `TicketDetailLayout.tsx`, add the prop where `DesignTab` is rendered (after line 878):

```tsx
                wireframeHtml={ticket.techSpec?.wireframeHtml}
```

- [ ] **Step 6: Commit**

```bash
git add client/src/tickets/components/detail/DesignTab.tsx \
       client/src/tickets/components/VisualExpectationsSection.tsx \
       client/src/tickets/components/detail/TicketDetailLayout.tsx \
       client/src/types/question-refinement.ts
git commit -m "feat: render HTML wireframe in sandboxed iframe on Design tab"
```

---

### Task 7: Verify end-to-end and test

- [ ] **Step 1: Run backend type check**

```bash
cd backend && npx tsc --noEmit
```

Expected: No type errors related to wireframeHtml or generateHtmlWireframe.

- [ ] **Step 2: Run frontend type check**

```bash
cd client && npx tsc --noEmit
```

Expected: No type errors related to wireframeHtml.

- [ ] **Step 3: Manual test — create a ticket with wireframes enabled**

1. Create a new ticket with `includeWireframes: true` and a UI description
2. Let the spec finalize
3. Check server logs for `Starting background HTML wireframe generation`
4. After 2-4 seconds, check logs for `HTML wireframe saved`
5. Refresh the ticket detail → Design tab → should show iframe with styled HTML wireframe above the ASCII wireframe cards

- [ ] **Step 4: Manual test — verify fallback**

1. Open an older ticket that has no `wireframeHtml`
2. Design tab should show ASCII wireframes as before (no iframe, no errors)

- [ ] **Step 5: Final commit with all changes**

```bash
git add -A
git commit -m "feat: HTML wireframe generation — end-to-end implementation"
```
