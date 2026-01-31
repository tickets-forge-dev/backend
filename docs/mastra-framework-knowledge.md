# Mastra Framework Knowledge Base
**For Executable Tickets Architecture**
**Date:** 2026-01-30
**Source:** Comprehensive documentation review

---

## 1. Framework Overview

**Identity:** TypeScript-focused framework for AI application development from prototype to production

**Core Philosophy:** Everything needed to go from early prototypes to production-ready applications with seamless integration into React, Next.js, and Node.

**Key Differentiator:** Combines agent autonomy with workflow determinism in a unified framework

---

## 2. Core Architectural Components

### 2.1 Mastra Class (Central Orchestrator)

**Purpose:** Single coordinator managing agents, workflows, storage, logging, and observability

**Initialization Pattern:**
```typescript
import { Mastra } from "@mastra/core";

export const mastra = new Mastra({
  agents: { /* registered agents */ },
  workflows: { /* registered workflows */ },
  storage: new LibSQLStore(/* config */),
  logger: new PinoLogger(/* config */),
  // Optional: vector stores, memory, observability
});
```

**Lifecycle:** Instantiate once at application startup (singleton pattern)

**Access Pattern:** Use `mastra.getAgent()` and `mastra.getWorkflow()` rather than direct imports for access to configuration, telemetry, and registered resources

---

### 2.2 Agents

**Definition:** Autonomous entities using LLMs and tools to solve open-ended tasks

**Agent Configuration:**
```typescript
import { Agent } from "@mastra/core/agent";

const agent = new Agent({
  id: "agent-id",
  name: "Agent Name",
  instructions: "System prompt or behavior definition",
  model: "openai/gpt-4", // 40+ providers supported
  tools: [tool1, tool2],
  providerOptions: { /* caching, reasoning */ },
  maxSteps: 1, // Default 1, increase for multi-step reasoning
});
```

**Response Modes:**
- **Generate:** Full response before returning (internal use/debugging)
- **Stream:** Token-by-token delivery for real-time UI updates

**Advanced Features:**
- **Structured Output:** Return type-safe data using Zod or JSON Schema via `response.object`
- **Image Analysis:** Process images by passing objects with `type: 'image'`
- **RequestContext:** Access request-specific values for conditional behavior
- **Multi-Step Control:** `maxSteps` limits sequential LLM calls

**Best Use Cases:**
- Open-ended tasks requiring reasoning
- Tool selection and orchestration
- Dynamic decision-making
- Context-aware responses

---

### 2.3 Workflows

**Definition:** Graph-based orchestration for deterministic, multi-step processes

**Workflow Structure:**
```typescript
import { createWorkflow, createStep } from "@mastra/core";

const step1 = createStep({
  id: "step-1",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ input }) => {
    // Business logic
    return { result: "processed" };
  },
});

const workflow = createWorkflow({
  name: "my-workflow",
  inputSchema: z.object({ data: z.string() }),
  outputSchema: z.object({ final: z.string() }),
})
  .then(step1)
  .then(step2)
  .branch({
    when: (state) => state.condition,
    then: conditionalStep,
  })
  .parallel([parallelStep1, parallelStep2])
  .commit();
```

**Control Flow Methods:**
- `.then()` - Sequential execution
- `.branch()` - Conditional execution
- `.parallel()` - Concurrent execution

**Execution Modes:**
1. **Start mode:** `run.start()` blocks until completion, returns final result
2. **Stream mode:** `run.stream()` emits events via `fullStream` for progress monitoring

**State Management:**
- Share values across steps via `stateSchema`
- No need to thread through every schema
- Persistent state for pause/resume

**Best Use Cases:**
- Deterministic sequences
- Well-defined task breakdown
- Token efficiency priorities
- Explicit control flow for debugging

---

### 2.4 Agent Network (vNext)

**Definition:** Smart orchestration layer that lets AI decide how to use agents, workflows, and tools

**Key Innovation:** LLM dynamically determines which primitives to execute and in what order

**Operating Modes:**

**Mode 1 (Intelligent Routing):**
- Converts natural language to appropriate primitive with correct parameters
- Example: "tell me about Paris" → identifies relevant workflow + supplies arguments

**Mode 2 (Multi-Step Orchestration):**
- Creates dynamic plans for complex tasks
- Memory-aware coordination
- AI determines invocation sequence

**When to Use Agent Network:**
- Execution paths uncertain or complex
- Context-based routing decisions needed
- Unstructured natural language inputs
- Dynamic agent collaboration required

**When NOT to Use Agent Network:**
- Predictable, deterministic sequences → use Workflows
- Token efficiency critical → use Workflows
- Explicit control aids debugging → use Workflows

---

## 3. Production Features

### 3.1 Memory & Context Management

**Layered Memory Systems:**
- Message history
- Retrieval across diverse data sources
- Working memory
- Semantic recall

**Enables:** Coherent agent behavior across multi-turn interactions

---

### 3.2 Human-in-the-Loop

**Capabilities:**
- Suspend agent or workflow
- Await user input or approval
- Resume with persistent state
- Indefinite pause support

---

### 3.3 Observability & Iteration

**Built-in Features:**
- Scorers for evaluating response quality
- Observability tools for monitoring
- Step-by-step I/O inspection (Studio)
- Distributed tracing

**Callbacks:**
- `onStepFinish()` - per-step monitoring
- `onFinish()` - completion metadata

---

### 3.4 Storage & Persistence

**Supported Stores:**
- LibSQLStore (recommended)
- Custom MastraCompositeStore implementations

**Use Cases:**
- Workflow state persistence
- Pause/resume support
- Run history tracking

---

### 3.5 Logging

**Implementation:** PinoLogger for structured logging

**Best Practice:** Correlate workflow runs with domain entity IDs (e.g., AEC IDs)

---

## 4. Mastra for Executable Tickets: Specific Patterns

### 4.1 Architecture Integration

**NestJS + Mastra Pattern:**
```typescript
// mastra.service.ts (NestJS Singleton)
@Injectable()
export class MastraService {
  private mastra: Mastra;

  constructor() {
    this.mastra = new Mastra({
      agents: {
        intentExtraction: intentExtractionAgent,
        typeDetection: typeDetectionAgent,
        drafting: draftingAgent,
        validation: validationAgent,
        questionGeneration: questionGenerationAgent,
        estimation: estimationAgent,
      },
      workflows: {
        generateTicket: generateTicketWorkflow,
        exportToJira: exportToJiraWorkflow,
        exportToLinear: exportToLinearWorkflow,
      },
      storage: new LibSQLStore(/* config */),
      logger: new PinoLogger(/* config */),
    });
  }

  getWorkflow(name: string) {
    return this.mastra.getWorkflow(name);
  }

  getAgent(id: string) {
    return this.mastra.getAgent(id);
  }
}
```

**Use Case Integration:**
```typescript
// CreateTicketUseCase (Application Layer)
@Injectable()
export class CreateTicketUseCase {
  constructor(
    private mastraService: MastraService,
    private aecRepository: AECRepository,
  ) {}

  async execute(input: CreateTicketInput): Promise<AEC> {
    // Create draft AEC in domain
    const aec = AEC.createDraft(input.title, input.description);
    await this.aecRepository.save(aec);

    // Run Mastra workflow
    const workflow = this.mastraService.getWorkflow("generateTicket");
    const run = await workflow.stream({
      aecId: aec.id,
      title: input.title,
      description: input.description
    });

    // Stream progress updates to Firestore
    for await (const event of run.fullStream) {
      await this.updateAECProgress(aec.id, event);
    }

    return aec;
  }
}
```

---

### 4.2 8-Step Generation Workflow

**Implementation Strategy:**
```typescript
const generateTicketWorkflow = createWorkflow({
  name: "generateTicket",
  inputSchema: z.object({
    aecId: z.string(),
    title: z.string(),
    description: z.string().optional(),
  }),
  outputSchema: z.object({
    aecId: z.string(),
    status: z.enum(["validated", "failed"]),
  }),
})
  // Step 1: Intent Extraction
  .then(createStep({
    id: "intent-extraction",
    execute: async ({ title, description }) => {
      const agent = mastra.getAgent("intentExtraction");
      const result = await agent.generate({
        messages: [{ role: "user", content: `${title}\n${description}` }],
      });
      return { intent: result.text };
    },
  }))

  // Step 2: Type Detection
  .then(createStep({
    id: "type-detection",
    execute: async ({ intent }) => {
      const agent = mastra.getAgent("typeDetection");
      const result = await agent.generate({
        messages: [{ role: "user", content: intent }],
        response: {
          schema: z.object({
            type: z.enum(["feature", "bug", "task"]),
          }),
        },
      });
      return { ticketType: result.object.type };
    },
  }))

  // Step 3: Repo Index Query
  .then(createStep({
    id: "repo-index-query",
    execute: async ({ intent, aecId }) => {
      // Call RepoIndexer service (domain service wrapped as tool)
      const modules = await repoIndexer.findModulesByIntent(intent);
      return { repoPaths: modules.map(m => m.path) };
    },
  }))

  // Step 4: API Snapshot Resolution (conditional)
  .branch({
    when: (state) => state.hasApiSpec,
    then: createStep({
      id: "api-snapshot-resolution",
      execute: async ({ repoPaths }) => {
        const spec = await apiSpecResolver.resolveSpec(repoPaths);
        return { apiSnapshot: spec };
      },
    }),
  })

  // Step 5: Ticket Drafting
  .then(createStep({
    id: "ticket-drafting",
    execute: async ({ intent, ticketType, repoPaths, apiSnapshot }) => {
      const agent = mastra.getAgent("drafting");
      const result = await agent.generate({
        messages: [{
          role: "user",
          content: `Draft AEC for: ${intent}\nType: ${ticketType}\nModules: ${repoPaths.join(", ")}`,
        }],
        response: {
          schema: AECDraftSchema, // Zod schema matching domain
        },
      });
      return { draft: result.object };
    },
  }))

  // Step 6: Validation
  .then(createStep({
    id: "validation",
    execute: async ({ draft, aecId }) => {
      // Call ValidationEngine (domain service)
      const validationResults = await validationEngine.validate(draft);
      return {
        validationResults,
        readinessScore: validationResults.overallScore,
      };
    },
  }))

  // Step 7: Question Prep (conditional on low readiness)
  .branch({
    when: (state) => state.readinessScore < 75,
    then: createStep({
      id: "question-prep",
      execute: async ({ validationResults }) => {
        const agent = mastra.getAgent("questionGeneration");
        const result = await agent.generate({
          messages: [{
            role: "user",
            content: `Generate max 3 questions from issues: ${JSON.stringify(validationResults.issues)}`,
          }],
          response: {
            schema: z.object({
              questions: z.array(QuestionSchema).max(3),
            }),
          },
        });
        return { questions: result.object.questions };
      },
    }),
  })

  // Step 8: Estimation
  .then(createStep({
    id: "estimation",
    execute: async ({ repoPaths, apiSnapshot, ticketType }) => {
      // Call EstimationEngine (domain service)
      const estimate = await estimationEngine.calculate({
        modulesCount: repoPaths.length,
        hasApiChanges: !!apiSnapshot,
        ticketType,
      });
      return { estimate };
    },
  }))

  .commit();
```

**Key Implementation Notes:**
- Each step calls domain services (ValidationEngine, EstimationEngine, etc.)
- Steps emit events → update Firestore → Frontend listens for real-time progress
- Use `onStepFinish()` callbacks to update AEC `generationState` field
- Structured outputs ensure type safety between workflow and domain

---

### 4.3 Agent Specialization Strategy

**Agent Roster:**

1. **Intent Extraction Agent**
   - Tool: LLM with structured output
   - Output: Parsed user intent (Zod schema)

2. **Type Detection Agent**
   - Tool: Classifier
   - Output: `feature | bug | task`

3. **Drafting Agent**
   - Tool: AEC schema generator
   - Output: Complete AEC draft matching domain entity

4. **Validation Agent**
   - Tool: ValidationEngine service wrapper
   - Output: Validation results + readiness score

5. **Question Generation Agent**
   - Tool: QuestionGenerator service (LLM-powered)
   - Output: Max 3 questions with chip options

6. **Estimation Agent**
   - Tool: EstimationEngine service wrapper
   - Output: Effort range + confidence + drivers

**Tool Pattern:**
- Wrap domain services as Mastra tools
- Maintain Clean Architecture boundaries
- Tools = infrastructure adapters calling application services

---

### 4.4 Real-Time Progress Updates

**Pattern:**
```typescript
// In workflow execution (use case layer)
const run = await workflow.stream(input);

for await (const event of run.fullStream) {
  // Map Mastra event to AEC GenerationState
  const stepUpdate = mapEventToGenerationState(event);

  // Update AEC via repository
  await aecRepository.updateGenerationState(aecId, stepUpdate);

  // Firestore update triggers frontend listener
}
```

**Frontend Listener:**
```typescript
// In React component
useEffect(() => {
  const unsubscribe = firestore
    .collection('workspaces/{workspaceId}/aecs')
    .doc(aecId)
    .onSnapshot((snapshot) => {
      const aec = snapshot.data();
      setGenerationState(aec.generationState);
    });

  return unsubscribe;
}, [aecId]);
```

---

### 4.5 Error Handling & Retry

**Workflow-Level Error Handling:**
```typescript
.then(createStep({
  id: "repo-index-query",
  execute: async ({ intent }) => {
    try {
      const modules = await repoIndexer.findModulesByIntent(intent);
      return { repoPaths: modules.map(m => m.path), error: null };
    } catch (error) {
      return {
        repoPaths: [],
        error: {
          step: "repo-index-query",
          message: error.message,
          retryable: true,
        }
      };
    }
  },
}))
```

**Use Case Retry Logic:**
```typescript
// Expose retry capability via use case
async retryStep(aecId: string, stepId: string): Promise<void> {
  const aec = await this.aecRepository.findById(aecId);
  const workflow = this.mastraService.getWorkflow("generateTicket");

  // Restart workflow from failed step
  await workflow.restart({
    runId: aec.generationState.runId,
    fromStep: stepId,
  });
}
```

---

### 4.6 Testing Strategy

**Unit Tests:**
- Test individual steps in isolation
- Mock domain services (ValidationEngine, etc.)
- Verify Zod schema validation

**Integration Tests:**
- Test complete workflow execution
- Use test Mastra instance with mock agents
- Verify state transitions

**Studio Testing:**
- Visual workflow execution analysis
- Step-by-step I/O inspection
- Runtime parameter testing

---

## 5. Key Architectural Decisions

### Decision 1: Workflows for 8-Step Generation
**Rationale:**
- Deterministic sequence required for trust/transparency
- Need to show progress in UI (requires streaming events)
- Token efficient (cheaper, faster than agent network)
- Debuggable (explicit control flow)

**Alternative Rejected:** Agent Network (too opaque for user-facing trust requirements)

---

### Decision 2: Agents as Step Executors
**Rationale:**
- Each step requires LLM reasoning (intent extraction, drafting, question generation)
- Structured outputs ensure type safety
- Tools wrap domain services (Clean Architecture preserved)

---

### Decision 3: Domain Services as Mastra Tools
**Rationale:**
- Maintains Clean Architecture boundaries
- Domain layer remains framework-agnostic
- Tools = infrastructure adapters

**Pattern:**
```typescript
// Domain service (application layer)
@Injectable()
export class ValidationEngine {
  validate(draft: AECDraft): ValidationResults { /* ... */ }
}

// Mastra tool (infrastructure layer)
const validationTool = createTool({
  id: "validation-tool",
  description: "Validates AEC draft",
  inputSchema: AECDraftSchema,
  outputSchema: ValidationResultsSchema,
  execute: async (draft) => {
    return validationEngine.validate(draft);
  },
});
```

---

### Decision 4: Agent Network for Question Generation
**Rationale:**
- Validation issues vary dynamically
- AI should decide which 3 questions to ask (intelligent routing)
- Questions need context-aware prioritization

**Implementation:**
```typescript
// Use Agent Network for dynamic question selection
const questions = await mastra.network({
  input: "Generate 3 questions from validation issues",
  context: {
    validationResults,
    ticketType,
    repoPaths,
  },
  primitives: [questionGenerationAgent],
  maxQuestions: 3,
});
```

---

### Decision 5: Mastra Singleton in NestJS
**Rationale:**
- Single orchestrator instance per application
- Shared configuration (agents, workflows, storage, logger)
- Injected via DI into use cases

**Lifecycle:**
- Initialize at app startup (`onModuleInit`)
- Register all agents and workflows
- Configure storage, logging, observability

---

## 6. Performance Considerations

### 6.1 Token Optimization
- Use workflows (not agent network) for deterministic tasks
- Structured outputs reduce token waste
- Prompt caching for repeated agent instructions

### 6.2 Parallel Execution
- Use `.parallel()` for independent steps
- Example: Run validation + estimation concurrently after drafting

### 6.3 Streaming for UX
- Always use `workflow.stream()` for user-facing operations
- Emit progress events to Firestore
- Frontend listens for real-time updates

---

## 7. Observability & Monitoring

### 7.1 Logging Strategy
```typescript
const logger = new PinoLogger({
  level: "info",
  // Correlate logs with AEC IDs
  formatters: {
    log: (obj) => ({
      ...obj,
      aecId: obj.aecId,
      workflowRun: obj.runId,
    }),
  },
});
```

### 7.2 Telemetry
- Track workflow execution times
- Monitor agent token usage
- Alert on validation failures
- Measure step retry rates

### 7.3 Studio Integration
- Use Mastra Studio for visual debugging
- Inspect step I/O in real-time
- Test workflows with mock data

---

## 8. Security Considerations

### 8.1 API Key Management
- Store LLM provider keys in environment variables
- Use Firebase KMS for OAuth tokens (GitHub, Jira, Linear)
- Never log sensitive data in Mastra logger

### 8.2 Input Validation
- Zod schemas enforce input validation at every step
- Domain validation rules in AEC entity
- Prevent injection attacks via structured outputs

### 8.3 Workspace Isolation
- Pass `workspaceId` in workflow input
- Filter Firestore queries by workspace
- Ensure agents can't access other workspaces

---

## 9. Future Enhancements

### 9.1 Advanced Memory
- Use vector stores (Pinecone, PgVector) for semantic search
- Store historical ticket data for better estimation
- Implement RAG for question generation

### 9.2 Human-in-the-Loop
- Pause workflows for PM approval before export
- Resume from approval with persistent state
- Implement approval workflows for high-risk changes

### 9.3 Multi-Tenancy
- Dedicated Mastra instances per workspace
- Isolated storage per tenant
- Custom model configurations per org

---

## 10. Common Pitfalls & Solutions

### Pitfall 1: Direct Agent Imports
**Problem:** Bypasses Mastra configuration and telemetry
**Solution:** Always use `mastra.getAgent(id)` and `mastra.getWorkflow(name)`

### Pitfall 2: Unstructured Agent Outputs
**Problem:** Type safety lost, hard to integrate with domain
**Solution:** Always use `response.schema` with Zod

### Pitfall 3: Workflow State Bloat
**Problem:** Passing large objects through every step
**Solution:** Use `stateSchema` for shared values, only pass IDs between steps

### Pitfall 4: Missing Error Handling
**Problem:** Workflow fails without user-friendly error
**Solution:** Wrap execute functions in try/catch, return error objects

### Pitfall 5: Agent Network Overuse
**Problem:** Unpredictable, expensive, hard to debug
**Solution:** Use workflows for deterministic tasks, agent network only for dynamic routing

---

## 11. References

**Official Documentation:**
- [Mastra Docs](https://mastra.ai/docs)
- [Using Agents](https://mastra.ai/docs/agents/overview)
- [Workflows Overview](https://mastra.ai/docs/workflows/overview)
- [Mastra Class Reference](https://mastra.ai/reference/core/mastra-class)
- [Agent Network (vNext)](https://mastra.ai/blog/vnext-agent-network)
- [GitHub Repository](https://github.com/mastra-ai/mastra)

**Key Blog Posts:**
- [Announcing Mastra's Improved Agent Orchestration](https://mastra.ai/blog/announcing-mastra-improved-agent-orchestration-ai-sdk-v5-support)

---

**Document Status:** Reference document for architecture decisions
**Next Step:** Use this knowledge to inform architectural patterns, integration points, and implementation guidelines in the architecture.md document
