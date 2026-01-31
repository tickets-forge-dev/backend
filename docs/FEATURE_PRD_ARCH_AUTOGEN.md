# Feature: Auto-Generate PRD & Architecture (Epic 6)

**Status:** Planned for v1 (after Epic 2)
**Type:** Quick Generate (not Deep/Party Mode)
**Approach:** Single Architecture Agent with Mastra Workflows
**Timeline:** After Epic 2-5 complete

---

## Vision

**Problem:** Users creating their first ticket have no PRD/Architecture context, resulting in generic AECs with low accuracy.

**Solution:** Auto-generate concise PRD and Architecture documents on-demand using a single specialized agent with human-in-the-loop for critical decisions only.

**User Experience:**
- Fast (<10 minutes total)
- Concise output (3-5 pages combined, not 50 pages)
- Chip-based questions (no chat interface)
- High assumptions (agent makes smart defaults)
- Only asks when critical

---

## Architecture

### Single Agent: DocumentationAgent

**Type:** Mastra Workflow (not multi-agent party mode)

**Input:**
```typescript
{
  projectName: string,           // From workspace or first ticket
  description: string,           // User-provided project description
  existingRepo?: {               // If GitHub connected
    url: string,
    detectedTechStack: {...},
    structure: string[]
  }
}
```

**Output:**
```typescript
{
  prd: {
    path: "workspace/{id}/prd.md",
    content: string,             // Concise PRD (2-3 pages)
    sections: [...]
  },
  architecture: {
    path: "workspace/{id}/architecture.md",
    content: string,             // Key decisions (1-2 pages)
    decisions: [...]
  }
}
```

---

## Mastra Workflow Implementation

### Sequential Workflow with Suspend/Resume

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// Step 1: Analyze repository (if connected)
const analyzeRepoStep = createStep({
  id: "analyze-repo",
  inputSchema: z.object({
    repoUrl: z.string().optional(),
    projectName: z.string(),
    description: z.string()
  }),
  outputSchema: z.object({
    detectedTechStack: z.object({
      frontend: z.string(),
      backend: z.string(),
      database: z.string(),
      auth: z.string()
    }),
    repoStructure: z.array(z.string())
  }),
  execute: async ({ inputData }) => {
    if (!inputData.repoUrl) {
      // No repo connected - return defaults
      return {
        detectedTechStack: {
          frontend: "Unknown",
          backend: "Unknown",
          database: "Unknown",
          auth: "Unknown"
        },
        repoStructure: []
      };
    }

    // Index repo and detect tech stack
    // (Simplified - full implementation in Epic 4)
    const files = await scanRepo(inputData.repoUrl);
    const techStack = detectTechStack(files);

    return {
      detectedTechStack: techStack,
      repoStructure: files
    };
  }
});

// Step 2: Generate PRD with optional human input
const generatePRDStep = createStep({
  id: "generate-prd",
  inputSchema: z.object({
    projectName: z.string(),
    description: z.string(),
    detectedTechStack: z.object({...})
  }),
  outputSchema: z.object({
    prd: z.string(),              // Markdown content
    confidence: z.number()         // 0-1
  }),
  resumeSchema: z.object({
    primaryUser: z.enum(["pm", "developer", "qa"]).optional(),
    authMethod: z.enum(["firebase", "custom", "oauth"]).optional()
  }),
  suspendSchema: z.object({
    questions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string()
      }))
    }))
  }),
  execute: async ({ inputData, resumeData, suspend, llmGenerator }) => {
    const { projectName, description, detectedTechStack } = inputData;
    const answers = resumeData ?? {};

    // High confidence check - can we proceed without questions?
    const confidence = calculateConfidence(description, detectedTechStack);

    if (confidence < 0.7 && !answers.primaryUser) {
      // Low confidence - suspend for chip questions
      return await suspend({
        questions: [
          {
            id: "primaryUser",
            text: "Who is the primary user of this product?",
            options: [
              { label: "Product Manager", value: "pm" },
              { label: "Developer", value: "developer" },
              { label: "QA Engineer", value: "qa" }
            ]
          },
          {
            id: "authMethod",
            text: "Which authentication method?",
            options: [
              { label: "Firebase Auth", value: "firebase" },
              { label: "Custom JWT", value: "custom" },
              { label: "OAuth 2.0", value: "oauth" }
            ]
          }
        ]
      });
    }

    // Generate PRD using Mastra LLM
    const prd = await llmGenerator.generate({
      model: "main",  // Sonnet for quality
      prompt: `Generate a CONCISE Product Requirements Document (2-3 pages MAX):

Project: ${projectName}
Description: ${description}
Tech Stack: ${JSON.stringify(detectedTechStack)}
${answers.primaryUser ? `Primary User: ${answers.primaryUser}` : ''}
${answers.authMethod ? `Auth Method: ${answers.authMethod}` : ''}

Template:
# PRD: ${projectName}

## Vision
[1-2 paragraphs]

## Users
- Primary: ${answers.primaryUser || 'TBD'}
- Secondary: [...]

## Goals (Top 3 Only)
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

## Features (MVP Only - Max 5)
1. [Feature 1]
2. [Feature 2]
...

## NFRs (Key Only)
- Performance: [measurable target]
- Security: [key requirement]

Keep it SHORT and ACTIONABLE. No fluff.`,
      schema: z.object({
        prdContent: z.string()
      })
    });

    return {
      prd: prd.prdContent,
      confidence
    };
  }
});

// Step 3: Generate Architecture
const generateArchitectureStep = createStep({
  id: "generate-architecture",
  inputSchema: z.object({
    projectName: z.string(),
    prd: z.string(),
    detectedTechStack: z.object({...}),
    repoStructure: z.array(z.string())
  }),
  outputSchema: z.object({
    architecture: z.string()
  }),
  resumeSchema: z.object({
    stateManagement: z.enum(["zustand", "redux", "context"]).optional()
  }),
  suspendSchema: z.object({
    questions: z.array(z.object({...}))
  }),
  execute: async ({ inputData, resumeData, suspend, llmGenerator }) => {
    const { projectName, prd, detectedTechStack, repoStructure } = inputData;
    const answers = resumeData ?? {};

    // Check if critical tech choices are ambiguous
    const needsInput = !detectedTechStack.frontend.includes("React") &&
                       !answers.stateManagement;

    if (needsInput) {
      return await suspend({
        questions: [{
          id: "stateManagement",
          text: "Which state management library?",
          options: [
            { label: "Zustand (Recommended)", value: "zustand" },
            { label: "Redux Toolkit", value: "redux" },
            { label: "React Context", value: "context" }
          ]
        }]
      });
    }

    // Generate Architecture
    const arch = await llmGenerator.generate({
      model: "main",
      prompt: `Generate CONCISE Architecture document (1-2 pages):

Project: ${projectName}
PRD Context: ${prd}
Detected Tech Stack: ${JSON.stringify(detectedTechStack)}
Repo Structure: ${repoStructure.slice(0, 20).join(', ')}
${answers.stateManagement ? `State Management: ${answers.stateManagement}` : ''}

Template:
# Architecture: ${projectName}

## Tech Stack
- Frontend: ${detectedTechStack.frontend}
- Backend: ${detectedTechStack.backend}
- Database: ${detectedTechStack.database}

## Key Decisions (Top 5-7 Only)
1. [Decision 1 with rationale]
...

## Folder Structure
[Tree - main folders only]

## Patterns
- [Pattern 1]
- [Pattern 2]

Keep it CONCISE. Focus on key decisions only.`,
      schema: z.object({
        architectureContent: z.string()
      })
    });

    return {
      architecture: arch.architectureContent
    };
  }
});

// Step 4: Save documents
const saveDocumentsStep = createStep({
  id: "save-documents",
  inputSchema: z.object({
    projectName: z.string(),
    prd: z.string(),
    architecture: z.string()
  }),
  outputSchema: z.object({
    prdPath: z.string(),
    architecturePath: z.string()
  }),
  execute: async ({ inputData, workspaceId, firestore }) => {
    const { projectName, prd, architecture } = inputData;

    // Save to Firestore
    await firestore.collection('workspaces')
      .doc(workspaceId)
      .collection('documents')
      .doc('prd')
      .set({ content: prd, createdAt: new Date() });

    await firestore.collection('workspaces')
      .doc(workspaceId)
      .collection('documents')
      .doc('architecture')
      .set({ content: architecture, createdAt: new Date() });

    return {
      prdPath: `workspaces/${workspaceId}/documents/prd`,
      architecturePath: `workspaces/${workspaceId}/documents/architecture`
    };
  }
});

// Complete workflow
export const generateDocsWorkflow = createWorkflow({
  id: "generate-prd-architecture",
  inputSchema: z.object({
    projectName: z.string(),
    description: z.string(),
    repoUrl: z.string().optional()
  }),
  outputSchema: z.object({
    prdPath: z.string(),
    architecturePath: z.string()
  })
})
  .then(analyzeRepoStep)
  .then(generatePRDStep)       // May suspend for chip questions
  .then(generateArchitectureStep)  // May suspend for chip questions
  .then(saveDocumentsStep)
  .commit();
```

---

## Frontend Integration (Human-in-the-Loop)

### UI Flow

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';

export function GenerateDocsWizard() {
  const [workflowStatus, setWorkflowStatus] = useState<'running' | 'suspended' | 'success' | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [runId, setRunId] = useState<string | null>(null);

  const startGeneration = async () => {
    // Call backend endpoint that starts the Mastra workflow
    const response = await fetch('/api/documents/generate', {
      method: 'POST',
      body: JSON.stringify({
        projectName: 'Executable Tickets',
        description: 'Transform product intent into execution-ready tickets'
      })
    });

    const result = await response.json();

    if (result.status === 'suspended') {
      // Workflow paused for human input
      setWorkflowStatus('suspended');
      setRunId(result.runId);
      setCurrentStep(result.suspended[0]);

      // Extract questions from suspend payload
      const step = result.steps[result.suspended[0]];
      setQuestions(step.suspendPayload.questions);
    } else if (result.status === 'success') {
      // Done!
      setWorkflowStatus('success');
    }
  };

  const answerQuestion = async (questionId: string, answer: string) => {
    // Resume workflow with user's answer
    const response = await fetch('/api/documents/resume', {
      method: 'POST',
      body: JSON.stringify({
        runId,
        step: currentStep,
        resumeData: { [questionId]: answer }
      })
    });

    const result = await response.json();

    if (result.status === 'suspended') {
      // More questions
      setCurrentStep(result.suspended[0]);
      const step = result.steps[result.suspended[0]];
      setQuestions(step.suspendPayload.questions);
    } else {
      // Complete
      setWorkflowStatus('success');
    }
  };

  return (
    <div>
      {workflowStatus === null && (
        <Button onClick={startGeneration}>
          Generate Project Context
        </Button>
      )}

      {workflowStatus === 'suspended' && questions.map(q => (
        <div key={q.id} className="space-y-3">
          <p className="text-[var(--text-base)]">{q.text}</p>
          <div className="flex gap-2">
            {q.options.map(opt => (
              <Badge
                key={opt.value}
                className="cursor-pointer"
                onClick={() => answerQuestion(q.id, opt.value)}
              >
                {opt.label}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      {workflowStatus === 'success' && (
        <p>✅ PRD and Architecture generated!</p>
      )}
    </div>
  );
}
```

---

## Backend Implementation

### Mastra Workflow Registration

```typescript
// backend/src/shared/infrastructure/mastra/workflows/generate-docs.workflow.ts

import { createWorkflow, createStep } from "@mastra/core/workflows";
import { Mastra } from "@mastra/core";

// ... steps defined above ...

export const mastra = new Mastra({
  workflows: {
    generateDocsWorkflow
  },
  // ... other config
});
```

### NestJS Controller Integration

```typescript
// backend/src/documents/presentation/controllers/documents.controller.ts

@Controller('documents')
export class DocumentsController {
  constructor(private readonly mastra: Mastra) {}

  @Post('generate')
  async generateDocuments(@Body() dto: GenerateDocsDto) {
    const workflow = this.mastra.getWorkflow('generateDocsWorkflow');
    const run = await workflow.createRun();

    const result = await run.start({
      inputData: {
        projectName: dto.projectName,
        description: dto.description,
        repoUrl: dto.repoUrl
      }
    });

    return {
      status: result.status,
      runId: run.id,
      suspended: result.suspended,
      steps: result.steps,
      result: result.status === 'success' ? result.result : undefined
    };
  }

  @Post('resume')
  async resumeGeneration(@Body() dto: ResumeDocsDto) {
    const workflow = this.mastra.getWorkflow('generateDocsWorkflow');
    const run = await workflow.createRun({ runId: dto.runId });

    const result = await run.resume({
      step: dto.step,
      resumeData: dto.resumeData
    });

    return {
      status: result.status,
      suspended: result.suspended,
      steps: result.steps,
      result: result.status === 'success' ? result.result : undefined
    };
  }
}
```

---

## Key Mastra Patterns Used

### 1. Sequential Chaining (`.then()`)
```typescript
workflow
  .then(analyzeRepoStep)           // Step 1
  .then(generatePRDStep)           // Step 2 (may suspend)
  .then(generateArchitectureStep)  // Step 3 (may suspend)
  .then(saveDocumentsStep)         // Step 4
  .commit();
```

### 2. Suspend/Resume for Human Input
```typescript
// In step execute function:
if (needsUserInput && !resumeData) {
  return await suspend({
    questions: [{ id, text, options }]
  });
}

// User answers → Resume with answers
await run.resume({
  step: "generate-prd",
  resumeData: { primaryUser: "pm", authMethod: "firebase" }
});
```

### 3. Workflow State (Shared Across Steps)
```typescript
stateSchema: z.object({
  generatedSections: z.array(z.string()),
  confidence: z.number()
}),

execute: async ({ state, setState }) => {
  await setState({
    generatedSections: [...state.generatedSections, "vision"],
    confidence: 0.85
  });
}
```

### 4. High Assumptions Pattern
```typescript
// Only suspend if confidence < threshold
const confidence = calculateConfidence(input);

if (confidence >= 0.7) {
  // High confidence - proceed without questions
  return await generateWithDefaults(input);
} else {
  // Low confidence - suspend for 1-2 critical questions
  return await suspend({ questions: criticalQuestionsOnly });
}
```

---

## Document Output Format

### Concise PRD Template (2-3 pages)

```markdown
# PRD: {{projectName}}

## Vision
{{1-2 paragraphs maximum}}

## Users
- Primary: {{primaryUser}}
- Secondary: {{secondaryUsers}}

## Goals (Top 3 Only)
1. {{goal1}}
2. {{goal2}}
3. {{goal3}}

## Features (MVP Only - Max 5)
1. {{feature1}}
2. {{feature2}}
...

## Non-Functional Requirements
- Performance: {{performanceTarget}}
- Security: {{securityRequirement}}
- Reliability: {{reliabilityTarget}}

## Out of Scope (v1)
- {{outOfScope1}}
- {{outOfScope2}}
```

**Target Length:** 500-1000 words (not 5000+)

### Concise Architecture Template (1-2 pages)

```markdown
# Architecture: {{projectName}}

## Tech Stack
- Frontend: {{frontend}}
- Backend: {{backend}}
- Database: {{database}}
- Auth: {{auth}}

## Key Decisions (5-7 Only)
1. **{{decision1}}** - {{rationale}}
2. **{{decision2}}** - {{rationale}}
...

## Folder Structure
{{tree - main folders only}}

## Patterns
- {{pattern1}}
- {{pattern2}}

## NFR Targets
- Performance: {{target}}
- Security: {{requirement}}
```

**Target Length:** 300-600 words

**Total Combined:** 800-1600 words (vs BMad's 5000-10000 words)

---

## Integration with AEC Generation

### Before (Epic 2 Current State)
```
User creates ticket
  ↓
No PRD/Architecture context
  ↓
AEC generates with minimal context (generic ACs, broad assumptions)
  ↓
Clarity: 60%
```

### After (Epic 6 Implemented)
```
User creates FIRST ticket
  ↓
System detects: No PRD/Architecture
  ↓
Trigger: "Generate project context?" [Yes] [No] [Upload]
  ↓ Yes
  ↓
DocumentationAgent workflow starts
  ↓
Analyzes repo (if connected)
  ↓
Generates PRD (suspends if confidence <70%)
  ↓
User answers 1-2 chip questions
  ↓
Resumes, generates Architecture (suspends if needed)
  ↓
Saves both documents to workspace
  ↓
AEC generates using PRD/Architecture context
  ↓
Clarity: 90%+
```

---

## Epic 6 Stories (Planned)

### Story 6.1: Repository Analysis Service
**Purpose:** Detect tech stack from package.json, folder structure
**Effort:** Small
**Output:** Tech stack detection, folder structure analysis

### Story 6.2: PRD Generation Workflow
**Purpose:** Mastra workflow that generates concise PRD with optional chip questions
**Effort:** Medium
**Output:** 2-3 page PRD saved to workspace

### Story 6.3: Architecture Generation Workflow
**Purpose:** Mastra workflow that generates architecture decisions
**Effort:** Medium
**Output:** 1-2 page Architecture saved to workspace

### Story 6.4: Document Management UI
**Purpose:** View/edit generated PRD and Architecture
**Effort:** Small
**Output:** Document viewer with inline editing

### Story 6.5: Settings - Configure Document Generation
**Purpose:** Toggle auto-generate on/off, set preferences
**Effort:** Small
**Output:** Settings page for doc generation preferences

**Total:** 5 stories (similar scope to Epic 2)

---

## Mastra Implementation Reference

### Key Methods

**From Mastra Docs:**

**Suspend Pattern:**
```typescript
return await suspend({
  reason: "Need user input",
  questions: [...]  // Custom payload
});
```

**Resume Pattern:**
```typescript
await run.resume({
  step: "step-id",
  resumeData: { answer: "value" }
});
```

**State Management:**
```typescript
stateSchema: z.object({
  generatedSections: z.array(z.string())
}),
execute: async ({ state, setState }) => {
  await setState({
    generatedSections: [...state.generatedSections, "new"]
  });
}
```

**Sequential Chaining:**
```typescript
workflow
  .then(step1)
  .then(step2)  // Receives step1 output
  .then(step3)  // Receives step2 output
  .commit();
```

---

## Success Criteria

**For Epic 6 to be considered successful:**

1. **Speed:** PRD + Architecture generated in <10 minutes
2. **Quality:** 80%+ accuracy (vs BMad's 95%)
3. **Conciseness:** Combined output <2000 words
4. **Minimal Questions:** <5 chip questions total
5. **Adoption:** 60%+ of users use auto-generate vs upload

---

## Deferred Until

- **After Epic 2** complete (Stories 2.1-2.4 done)
- **Before or parallel to Epic 3** (validation engine)
- **Enables:** Much better AEC quality for all future tickets

---

**Status:** 📝 Planned
**Priority:** High (unlocks solo PM market)
**Implementation Approach:** Mastra workflows with suspend/resume (not party mode)
**Output:** Concise documents (fast, actionable)

---

_This feature will be Epic 6 after Epic 2-5 complete per user decision (Option B)_
_Reference: Mastra workflow docs, suspend/resume, human-in-the-loop_

---

## Enhancement: Mastra Search & Indexing (v1.0)

**Added:** 2026-01-31
**Purpose:** Use workspace indexing to improve PRD/Architecture generation quality

### How It Improves Generation

**Problem:** Generating PRD/Architecture without context produces generic outputs.

**Solution:** Index and search existing project artifacts before generation.

### What to Index

**1. Existing Codebase**
```typescript
const workspace = new Workspace({
  filesystem: new LocalFilesystem({ basePath: './repo' }),
  bm25: true,  // Keyword search for code
  autoIndexPaths: ['/src', '/docs']  // Index source and docs
});

await workspace.init();  // Auto-indexes all files
```

**2. Previous Tickets/AECs**
```typescript
// Index all completed AECs for pattern detection
for (const aec of completedAECs) {
  await workspace.index(
    `aec-${aec.id}`,
    `${aec.title}\n${aec.description}\n${aec.acceptanceCriteria.join('\n')}`,
    { metadata: { type: aec.type, readinessScore: aec.readinessScore } }
  );
}
```

**3. Existing Documentation**
```typescript
// If user has README, CONTRIBUTING, etc.
await workspace.index('/README.md', readmeContent);
await workspace.index('/docs/ARCHITECTURE.md', existingArchContent);
```

### Enhanced Workflow

**Updated generatePRDStep with RAG:**

```typescript
const generatePRDStep = createStep({
  execute: async ({ inputData, resumeData, suspend, workspace }) => {
    const { projectName, description } = inputData;

    // SEARCH existing context before generating
    const similarTickets = await workspace.search(description, {
      topK: 5,
      mode: 'hybrid'  // BM25 + vector for best results
    });

    const codePatterns = await workspace.search('authentication patterns', {
      topK: 3,
      mode: 'bm25'  // Keyword search for code
    });

    // Build context-aware prompt
    const prompt = `Generate PRD using these patterns:

Project: ${projectName}
Description: ${description}

Similar tickets found:
${similarTickets.map(r => `- ${r.content.substring(0, 200)}`).join('\n')}

Code patterns detected:
${codePatterns.map(r => `- ${r.id}: ${r.content.substring(0, 100)}`).join('\n')}

Generate PRD that follows these existing patterns...`;

    // Generate with context
    const prd = await llmGenerator.generate({ prompt });

    return { prdContent: prd.text };
  }
});
```

### Benefits

**Before (No Indexing):**
```
User: "Add user auth"
Agent: Generates generic PRD
Output: "Users can authenticate" (vague)
```

**After (With Indexing):**
```
User: "Add user auth"
Agent searches workspace:
  - Finds: "We use Firebase Auth in AuthService.ts"
  - Finds: Previous ticket used JWT pattern
  - Finds: README mentions "OAuth deferred to v2"
Agent generates context-aware PRD:
Output: "Users authenticate via Firebase Auth (email/password), following AuthService pattern. OAuth deferred per README."
```

**Quality Improvement:** 60% → 85%+ accuracy

### Implementation in Epic 6

**Story 6.0: Workspace Indexing Setup (New - Before 6.1)**

**Tasks:**
1. Install Mastra workspace dependencies
   ```bash
   npm install @mastra/core
   # Vector store (choose one):
   # npm install @mastra/pinecone  # OR
   # npm install @mastra/qdrant    # OR
   # npm install @mastra/postgres  # (uses existing DB)
   ```

2. Configure workspace in Mastra instance
   ```typescript
   const workspace = new Workspace({
     filesystem: new LocalFilesystem({ basePath: './workspace' }),
     bm25: true,                    // Keyword search
     vectorStore: pineconeVector,   // Semantic search
     embedder: async (text) => {
       // Use Ollama for free embeddings in dev
       const model = ollama('nomic-embed-text');  // 137M param embedding model
       const { embedding } = await embed({ model, value: text });
       return embedding;
     },
     autoIndexPaths: ['/docs']      // Auto-index docs folder
   });
   ```

3. Create indexing service
   ```typescript
   @Injectable()
   export class WorkspaceIndexingService {
     constructor(private workspace: Workspace) {}

     async indexRepository(repoPath: string) {
       // Index source files
       await this.workspace.index('/src', sourceContent);
       // Index docs
       await this.workspace.index('/docs', docsContent);
       // Index README
       await this.workspace.index('/README.md', readmeContent);
     }

     async indexAEC(aec: AEC) {
       await this.workspace.index(
         `aec-${aec.id}`,
         this.serializeAEC(aec),
         { metadata: { type: aec.type, score: aec.readinessScore } }
       );
     }

     async search(query: string, options = {}) {
       return await this.workspace.search(query, {
         topK: 5,
         mode: 'hybrid',  // Best of both worlds
         ...options
       });
     }
   }
   ```

4. Index on AEC creation
   ```typescript
   // In CreateTicketUseCase, after save:
   await this.indexingService.indexAEC(aec);
   ```

**Deliverable:** Workspace indexing infrastructure ready ✅

**Enables:** RAG-powered PRD/Architecture generation

---

## Search Modes for Different Use Cases

| Use Case | Mode | Why |
|---|---|---|
| Find similar tickets | `hybrid` | Semantic similarity + keyword match |
| Find code patterns | `bm25` | Exact code/function names |
| Find architecture decisions | `vector` | Conceptual understanding |
| General context | `hybrid` | Best coverage |

### Cost Considerations

**BM25 (Keyword Search):**
- Cost: $0 (local computation)
- Speed: Very fast
- Quality: Good for exact matches

**Vector Search (Semantic):**
- Cost with Ollama: $0 (local embeddings with nomic-embed-text)
- Cost with OpenAI: ~$0.0001 per 1000 tokens
- Speed: Slower (embedding computation)
- Quality: Better for conceptual queries

**Recommendation for v1:**
- Use **hybrid mode** with Ollama embeddings (free, good quality)
- Fallback to BM25-only if user doesn't want to run embeddings locally

---

## Updated Epic 6 Stories

**New Story 6.0:** Workspace Indexing Setup
- Configure Mastra workspace
- Set up BM25 + vector search
- Create indexing service
- Auto-index on AEC creation

**Updated Story 6.4:** PRD Generation uses workspace.search()
**Updated Story 6.5:** Architecture Generation uses workspace.search()

**Total Stories:** 6 (was 5, added indexing setup)

---

_Mastra Search & Indexing will significantly improve PRD/Architecture generation quality through RAG_
