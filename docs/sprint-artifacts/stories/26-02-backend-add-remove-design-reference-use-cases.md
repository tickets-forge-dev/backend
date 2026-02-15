# Story 26-02: Backend - Add/Remove Design Reference Use Cases

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 2.5 hours
**Assignee:** TBD

---

## Objective

Create use cases for adding and removing design references to tickets:
1. Create `AddDesignReferenceUseCase` to add design links to existing tickets
2. Create `RemoveDesignReferenceUseCase` to remove design links from tickets
3. Implement proper error handling (domain exceptions → application exceptions)
4. Prepare for Phase 2 metadata enrichment (placeholder for Figma/Loom API calls)

---

## Acceptance Criteria

- ✅ `AddDesignReferenceUseCase` created with proper command/response
- ✅ `RemoveDesignReferenceUseCase` created with proper command/response
- ✅ Both use cases use TicketRepository to load/save AEC
- ✅ Workspace validation: verify ticket belongs to user's workspace
- ✅ Domain exceptions properly caught and converted to application exceptions
- ✅ Error messages are user-friendly and informative
- ✅ Add use case generates UUID for design reference ID
- ✅ Add use case captures addedAt timestamp and addedBy (user email)
- ✅ Remove use case idempotent (doesn't throw if reference not found, returns success)
- ✅ Both use cases have unit tests
- ✅ TypeScript strict mode passes (no `any` casts)
- ✅ No linting errors

---

## Files Created

```
backend/src/tickets/application/use-cases/
  ├── AddDesignReferenceUseCase.ts      (NEW - 120 lines)
  └── RemoveDesignReferenceUseCase.ts   (NEW - 80 lines)
```

---

## Files Modified

```
backend/src/tickets/tickets.module.ts
  - Add providers: AddDesignReferenceUseCase, RemoveDesignReferenceUseCase
  - Inject TicketRepository into both use cases

backend/src/tickets/application/commands/
  - Create AddDesignReferenceCommand interface (if using command pattern)
  - Create RemoveDesignReferenceCommand interface (if using command pattern)
```

---

## Implementation Notes

### AddDesignReferenceUseCase

```typescript
export interface AddDesignReferenceCommand {
  ticketId: string;
  workspaceId: string;
  userId: string;
  url: string;
  title?: string;  // Optional, auto-generated from URL if not provided
}

export interface AddDesignReferenceResponse {
  designReference: DesignReference;
  ticket: AEC;
}

@Injectable()
export class AddDesignReferenceUseCase {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly logger: Logger
  ) {}

  async execute(command: AddDesignReferenceCommand): Promise<AddDesignReferenceResponse> {
    // 1. Load ticket from repository
    const ticket = await this.ticketRepository.getByIdAndWorkspace(
      command.ticketId,
      command.workspaceId
    );

    if (!ticket) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Verify user ownership (optional, may be checked in controller)
    // 3. Create design reference with ID and metadata
    const designReference = this.createDesignReference(
      command.url,
      command.title,
      command.userId
    );

    // 4. Try to add to AEC domain model (enforces max 5 limit)
    try {
      ticket.addDesignReference(designReference);
    } catch (error) {
      if (error instanceof DomainException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    // 5. Persist changes
    await this.ticketRepository.save(ticket);

    // 6. Log successful addition
    this.logger.log(
      `Design reference added to ticket ${command.ticketId}: ${command.url}`
    );

    return {
      designReference,
      ticket
    };
  }

  private createDesignReference(
    url: string,
    title: string | undefined,
    userEmail: string
  ): DesignReference {
    return {
      id: v4(), // UUID
      url,
      platform: detectPlatform(url),
      title: title || this.generateTitleFromUrl(url),
      metadata: undefined, // Phase 2: will be filled by metadata service
      addedAt: new Date(),
      addedBy: userEmail
    };
  }

  private generateTitleFromUrl(url: string): string {
    // Extract meaningful title from URL
    // Figma: "file/abc123/Dashboard-Redesign" → "Dashboard-Redesign"
    // Loom: "share/xyz789" → Use platform + timestamp
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(p => p.length > 0);

      if (urlObj.hostname.includes('figma')) {
        const fileName = parts[parts.length - 1];
        return decodeURIComponent(fileName).replace(/-/g, ' ');
      }

      if (urlObj.hostname.includes('loom')) {
        return `Loom Video - ${new Date().toLocaleDateString()}`;
      }

      return `Design Reference - ${new Date().toLocaleDateString()}`;
    } catch {
      return `Design Reference - ${new Date().toLocaleDateString()}`;
    }
  }
}
```

### RemoveDesignReferenceUseCase

```typescript
export interface RemoveDesignReferenceCommand {
  ticketId: string;
  workspaceId: string;
  referenceId: string;
}

export interface RemoveDesignReferenceResponse {
  success: boolean;
  ticket: AEC;
}

@Injectable()
export class RemoveDesignReferenceUseCase {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly logger: Logger
  ) {}

  async execute(
    command: RemoveDesignReferenceCommand
  ): Promise<RemoveDesignReferenceResponse> {
    // 1. Load ticket from repository
    const ticket = await this.ticketRepository.getByIdAndWorkspace(
      command.ticketId,
      command.workspaceId
    );

    if (!ticket) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Try to remove from AEC domain model
    try {
      ticket.removeDesignReference(command.referenceId);
    } catch (error) {
      if (error instanceof DomainException) {
        // Non-blocking: if reference doesn't exist, just log and return success
        this.logger.warn(
          `Design reference ${command.referenceId} not found in ticket ${command.ticketId}`
        );
        return {
          success: true,
          ticket
        };
      }
      throw error;
    }

    // 3. Persist changes
    await this.ticketRepository.save(ticket);

    // 4. Log successful removal
    this.logger.log(
      `Design reference ${command.referenceId} removed from ticket ${command.ticketId}`
    );

    return {
      success: true,
      ticket
    };
  }
}
```

### Error Handling Strategy

```typescript
// In controller (Story 26-03):
try {
  const result = await this.addDesignReferenceUseCase.execute(command);
  return { designReference: result.designReference };
} catch (error) {
  if (error instanceof NotFoundException) {
    throw new HttpException(error.message, 404);
  }
  if (error instanceof BadRequestException) {
    throw new HttpException(error.message, 400);
  }
  // Unexpected errors
  this.logger.error(`Error adding design reference: ${error}`);
  throw new HttpException('Internal server error', 500);
}
```

---

## Data Types

### Command Interfaces

```typescript
interface AddDesignReferenceCommand {
  ticketId: string;              // UUID of ticket
  workspaceId: string;            // UUID of workspace
  userId: string;                 // Firebase UID or email
  url: string;                    // HTTPS URL (validated by DesignReference)
  title?: string;                 // Optional, auto-generated if omitted
}

interface RemoveDesignReferenceCommand {
  ticketId: string;              // UUID of ticket
  workspaceId: string;            // UUID of workspace
  referenceId: string;            // UUID of design reference
}
```

### Response Interfaces

```typescript
interface AddDesignReferenceResponse {
  designReference: DesignReference;
  ticket: AEC;  // Full updated ticket
}

interface RemoveDesignReferenceResponse {
  success: boolean;
  ticket: AEC;  // Full updated ticket
}
```

---

## Testing Strategy

### Unit Tests for AddDesignReferenceUseCase

1. **Happy Path**
   - ✅ Add design reference successfully
   - ✅ Title auto-generated from URL
   - ✅ designReference ID is UUID
   - ✅ addedAt timestamp is current date
   - ✅ addedBy is user email

2. **Error Cases**
   - ✅ Throw 404 if ticket not found
   - ✅ Throw 400 if adding 6th reference (max 5)
   - ✅ Throw 400 if URL is invalid
   - ✅ Throw 400 if URL is duplicate

3. **Platform Detection**
   - ✅ Figma URLs detected correctly
   - ✅ Loom URLs detected correctly
   - ✅ Miro URLs detected correctly
   - ✅ Unknown platforms set to 'other'

4. **Title Generation**
   - ✅ Figma: Extract file name from URL
   - ✅ Loom: Generate readable title with date
   - ✅ Unknown: Generate generic title

### Unit Tests for RemoveDesignReferenceUseCase

1. **Happy Path**
   - ✅ Remove design reference successfully
   - ✅ Return updated ticket

2. **Idempotency**
   - ✅ Removing non-existent reference returns success (not error)
   - ✅ No exception thrown, warning logged

3. **Error Cases**
   - ✅ Throw 404 if ticket not found

---

## Integration Points

**Upstream (Depends On):**
- Story 26-01: DesignReference value object (detectPlatform, isValidDesignUrl)
- TicketRepository (load/save AEC)
- Logger service

**Downstream (Feeds Into):**
- Story 26-03: API endpoints in TicketsController
- Story 26-06: Frontend service integration

---

## Dependencies

- NestJS `@Injectable()` decorator
- `TicketRepository` service (existing)
- `Logger` service (NestJS)
- UUID v4 for ID generation
- DesignReference value object from Story 26-01

**NPM Packages:**
- uuid (already in project)

---

## Rollout Plan

1. **Hour 1:** Create AddDesignReferenceUseCase structure and methods
2. **Hour 1.5:** Create RemoveDesignReferenceUseCase structure and methods
3. **Hour 2:** Write unit tests for both use cases
4. **Hour 2.5:** Run tests and debug, prepare for API integration
5. **Commit:** After all tests pass

---

## Known Risks

1. **UUID Generation:** Using v4() directly in use case instead of injecting factory
   - *Mitigation:* Could inject UuidFactory if needed for better testability

2. **Email Extraction:** Assuming userId is email address
   - *Mitigation:* May need to extract from Firebase token in Phase 1 controller code

3. **Title Auto-generation:** URL parsing might fail on edge cases
   - *Mitigation:* Wrap in try-catch, fall back to generic title

---

## Success Metrics

- ✅ Both use cases created and tested
- ✅ Add use case enforces max 5 limit (rejects 6th)
- ✅ Add use case auto-generates title and UUID
- ✅ Remove use case idempotent (no error on missing reference)
- ✅ All tests pass (>85% coverage)
- ✅ Build passes, 0 TypeScript errors
- ✅ No linting errors
- ✅ Ready for API endpoint integration (Story 26-03)

---

## Follow-Up Stories

- **26-03:** Backend - API Endpoints & DTOs
- **26-04:** Backend - AECMapper Persistence Layer
- **26-09 (Phase 2):** Enhanced AddDesignReferenceUseCase with Figma/Loom metadata

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
