# Story 7.9: Mastra Enhancements - Human-in-the-Loop for Ticket Generation

**Epic:** Epic 7 - Code-Aware Validation & Pre-Implementation Analysis  
**Story ID:** 7.9  
**Created:** 2026-02-03  
**Status:** Backlog  
**Priority:** P2  
**Effort Estimate:** 5-8 hours

---

## Story

**As a** product manager creating tickets,  
**I want** the agent to ask me clarifying questions during ticket generation,  
**So that** I can provide additional context and get better, more complete tickets without back-and-forth iteration.

---

## Context

Currently, ticket generation is a one-shot process. The agent generates a draft based on the initial input, and if information is missing or unclear, the user must iterate manually. Mastra's Agent Approval and Human-in-the-Loop features enable conversational ticket creation where the agent can:

1. Pause execution when it needs clarification
2. Ask specific questions to the user
3. Resume with the user's answers
4. Generate a more complete ticket with all context

This aligns with Epic 7's goal of improving ticket quality through validation and analysis.

---

## Benefits

### User Experience
- **Conversational flow**: Natural question-and-answer interaction
- **Fewer iterations**: Get complete tickets in one session
- **Better context**: Agent gathers all needed information upfront
- **Transparency**: User sees what the agent is asking and why

### Technical
- **Leverages Mastra primitives**: Uses built-in agent approval features
- **Memory integration**: Maintains conversation context across turns
- **Tool suspension**: Agents can pause and resume tool execution
- **Event-driven**: Stream-based UI updates for real-time interaction

---

## Acceptance Criteria

### AC1: Agent Suspends for Missing Information
**Given** a user creates a ticket with incomplete information  
**When** the agent detects missing critical details (e.g., authentication method, target users)  
**Then** the agent suspends execution and emits a question to the user  
**And** the ticket generation does not complete until user responds

### AC2: User Provides Clarification
**Given** an agent has suspended with a question  
**When** the user provides an answer through the UI  
**Then** the agent resumes ticket generation with the new context  
**And** the final ticket includes information from both initial input and clarification

### AC3: Multi-Turn Conversations
**Given** an agent needs multiple pieces of information  
**When** generating a complex ticket  
**Then** the agent can ask multiple questions sequentially  
**And** maintains full conversation history  
**And** all answers are incorporated into the final ticket

### AC4: Automatic Resumption
**Given** the agent has suspended with a question  
**When** the user sends their next message in the same thread  
**Then** the agent automatically extracts the answer and resumes  
**And** no manual `resumeStream()` call is needed (conversational flow)

---

## Implementation Notes

### Architecture Layer: Infrastructure (Mastra Integration)

This feature integrates Mastra's agent approval primitives into our ticket generation flow.

### Key Mastra Features to Use

#### 1. Tool Suspension with `suspend()`
Tools can pause execution and return context:

```typescript
export const gatherRequirementsTool = createTool({
  id: "gather-requirements",
  description: "Collects detailed requirements for ticket creation",
  inputSchema: z.object({
    ticketType: z.string(),
  }),
  suspendSchema: z.object({
    question: z.string(),
    field: z.string(),
  }),
  resumeSchema: z.object({
    answer: z.string(),
  }),
  execute: async (inputData, context) => {
    const { resumeData, suspend } = context?.agent ?? {};

    // Check if we have the answer from previous suspension
    if (!resumeData?.answer) {
      // Need to ask user for clarification
      return suspend?.({
        question: "What authentication method do you want to use?",
        field: "authenticationMethod",
      });
    }

    // We have the answer, continue with ticket generation
    return {
      authenticationMethod: resumeData.answer,
      // ... other requirements
    };
  },
});
```

#### 2. Automatic Resumption
Enable conversational flow without manual resume calls:

```typescript
const agent = new Agent({
  id: "ticket-generator",
  name: "Ticket Generator",
  tools: { gatherRequirementsTool },
  memory: new Memory(),
  defaultOptions: {
    autoResumeSuspendedTools: true,  // Enable automatic resumption
  },
});
```

#### 3. Stream-Based UI Events
Listen for suspension events in the UI:

```typescript
const stream = await agent.stream("Create authentication ticket", {
  autoResumeSuspendedTools: true,
  memory: {
    thread: threadId,
    resource: userId,
  },
});

for await (const chunk of stream.fullStream) {
  if (chunk.type === "tool-call-suspended") {
    // Show question to user
    const { question, field } = chunk.payload.suspendPayload;
    showQuestionInUI(question, field);
  }
}
```

#### 4. Memory Integration
Conversation context persists across messages:

```typescript
// First message - agent asks question
const stream1 = await agent.stream("Create auth ticket", {
  memory: { thread: "conversation-123", resource: "user-123" },
});

// Second message - user provides answer
const stream2 = await agent.stream("Use OAuth with Google", {
  memory: { thread: "conversation-123", resource: "user-123" },
  // Agent automatically extracts answer and resumes
});
```

---

## Technical Design

### 1. Create Clarification Tools

**File:** `backend/src/tickets/infrastructure/mastra/tools/`

Create specialized tools that can suspend and ask questions:

```typescript
// gather-authentication-details.tool.ts
export const gatherAuthenticationDetails = createTool({
  id: "gather-authentication-details",
  description: "Collects authentication requirements for ticket",
  inputSchema: z.object({
    ticketType: z.string(),
  }),
  suspendSchema: z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
  }),
  resumeSchema: z.object({
    authMethod: z.string(),
    providers: z.array(z.string()).optional(),
  }),
  execute: async (inputData, context) => {
    const { resumeData, suspend } = context?.agent ?? {};

    if (!resumeData) {
      return suspend?.({
        question: "What authentication method should be used?",
        options: ["OAuth", "Email/Password", "Magic Link", "SSO"],
      });
    }

    // Follow-up question if OAuth was selected
    if (resumeData.authMethod === "OAuth" && !resumeData.providers) {
      return suspend?.({
        question: "Which OAuth providers?",
        options: ["Google", "GitHub", "Apple", "Microsoft"],
      });
    }

    return resumeData;
  },
});
```

### 2. Update MastraContentGenerator

**File:** `backend/src/shared/infrastructure/mastra/MastraContentGenerator.ts`

Integrate suspension-capable agent:

```typescript
export class MastraContentGenerator implements ILLMContentGenerator {
  private createConversationalAgent(modelName: string): Agent {
    const config = {
      id: 'conversational-ticket-generator',
      name: 'Conversational Ticket Generator',
      model: modelName,
      instructions: `You are a ticket generation assistant that asks clarifying questions when information is missing.`,
      tools: {
        gatherAuthenticationDetails,
        gatherUserRequirements,
        gatherTechnicalConstraints,
      },
      memory: new Memory({
        options: {
          lastMessages: 20,
        },
      }),
      defaultOptions: {
        autoResumeSuspendedTools: true,
      },
    };

    // Add provider-specific config (Anthropic API key, Ollama baseUrl)
    return new Agent(this.addProviderConfig(config));
  }
}
```

### 3. Update GenerationOrchestrator

**File:** `backend/src/tickets/application/services/GenerationOrchestrator.ts`

Add stream handling for suspended tools:

```typescript
async orchestrateWithQuestions(
  aec: AEC,
  threadId: string,
  resourceId: string,
): Promise<AsyncGenerator<OrchestrationEvent>> {
  const agent = this.llmGenerator.createConversationalAgent();

  const stream = await agent.stream(aec.rawInput, {
    memory: {
      thread: threadId,
      resource: resourceId,
    },
    autoResumeSuspendedTools: true,
  });

  for await (const chunk of stream.fullStream) {
    if (chunk.type === 'tool-call-suspended') {
      yield {
        type: 'question',
        payload: chunk.payload.suspendPayload,
      };
    }

    if (chunk.type === 'finish') {
      yield {
        type: 'complete',
        payload: chunk.payload,
      };
    }
  }
}
```

### 4. Frontend Integration

**File:** `client/src/features/tickets/components/ConversationalTicketCreator.tsx`

```typescript
export function ConversationalTicketCreator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<Question | null>(null);

  const handleSubmit = async (input: string) => {
    const response = await fetch('/api/tickets/create-stream', {
      method: 'POST',
      body: JSON.stringify({ 
        input,
        threadId,
        resourceId,
      }),
    });

    const reader = response.body?.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = parseChunk(value);

      if (chunk.type === 'tool-call-suspended') {
        // Agent is asking a question
        setPendingQuestion({
          text: chunk.payload.question,
          options: chunk.payload.options,
        });
      }

      if (chunk.type === 'finish') {
        // Ticket generation complete
        onTicketCreated(chunk.payload);
      }
    }
  };

  return (
    <div>
      <MessageList messages={messages} />
      
      {pendingQuestion && (
        <QuestionPrompt
          question={pendingQuestion}
          onAnswer={(answer) => {
            // User answers, agent auto-resumes
            handleSubmit(answer);
            setPendingQuestion(null);
          }}
        />
      )}

      {!pendingQuestion && (
        <InputField onSubmit={handleSubmit} />
      )}
    </div>
  );
}
```

---

## File Structure

```
backend/src/tickets/infrastructure/mastra/tools/
├── gather-authentication-details.tool.ts
├── gather-user-requirements.tool.ts
├── gather-technical-constraints.tool.ts
└── index.ts

client/src/features/tickets/components/
├── ConversationalTicketCreator.tsx
├── QuestionPrompt.tsx
└── MessageList.tsx
```

---

## Testing Strategy

### Unit Tests
- Tool suspension logic
- Resume data extraction
- Memory integration

### Integration Tests
- Full question-answer flow
- Multi-turn conversations
- Memory persistence across turns

### E2E Tests
- User creates ticket → agent asks question → user answers → ticket completes
- Multiple questions in sequence
- User can cancel mid-conversation

---

## Dependencies

- Story 7.8 must be complete (Mastra Agent integration)
- Memory storage configured (already in place via Story 7.2)
- Frontend WebSocket or SSE support for streaming

---

## Related Documentation

- [Mastra Agent Approval](https://mastra.ai/docs/agents/agent-approval)
- [Mastra Human-in-the-Loop](https://mastra.ai/docs/workflows/human-in-the-loop)
- [Mastra Agent Memory](https://mastra.ai/docs/agents/agent-memory)

---

## Future Enhancements

### Story 7.10: Mastra Guardrails (Processors)
Add safety and validation layers:
- Moderation processor (prevent inappropriate content)
- PII detector (redact sensitive information)
- Prompt injection prevention
- Content validation before ticket creation

### Story 7.11: Structured Output with Zod
Replace JSON parsing with Zod schemas:
- Type-safe ticket generation
- Automatic validation
- Better error messages

---

## Change Log

| Date       | Author | Change Description |
|------------|--------|--------------------|
| 2026-02-03 | Amelia | Initial story creation - Human-in-the-loop for ticket generation |
