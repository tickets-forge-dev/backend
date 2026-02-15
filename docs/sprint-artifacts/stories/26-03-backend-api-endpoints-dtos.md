# Story 26-03: Backend - API Endpoints & DTOs

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO
**Priority:** HIGH
**Effort:** 2 hours
**Assignee:** TBD

---

## Objective

Create API endpoints for adding and removing design references from tickets:
1. Create `AddDesignReferenceDto` with URL and title validation
2. Create `RemoveDesignReferenceDto` if needed
3. Add POST endpoint: `POST /tickets/:id/design-references`
4. Add DELETE endpoint: `DELETE /tickets/:id/design-references/:referenceId`
5. Integrate with use cases from Story 26-02
6. Proper error handling and response formatting

---

## Acceptance Criteria

- ✅ `AddDesignReferenceDto` created with @IsUrl(), @MaxLength() validation
- ✅ URL validation requires HTTPS protocol
- ✅ Title field optional with max 200 characters
- ✅ POST `/tickets/:id/design-references` endpoint created
- ✅ DELETE `/tickets/:id/design-references/:referenceId` endpoint created
- ✅ Endpoints extract workspaceId and userId from request
- ✅ Proper error responses: 404 (ticket not found), 400 (validation error), 500 (server error)
- ✅ Response includes full DesignReference object
- ✅ Request validation works (invalid URLs rejected with 400)
- ✅ TypeScript strict mode passes (no `any` casts)
- ✅ No linting errors

---

## Files Created

```
backend/src/tickets/presentation/dto/
  └── AddDesignReferenceDto.ts          (NEW - 40 lines)
```

---

## Files Modified

```
backend/src/tickets/presentation/controllers/tickets.controller.ts
  - Import AddDesignReferenceUseCase, RemoveDesignReferenceUseCase
  - Import AddDesignReferenceDto
  - Add POST /tickets/:id/design-references endpoint
  - Add DELETE /tickets/:id/design-references/:referenceId endpoint
  - Add proper error handling and response formatting

backend/src/tickets/tickets.module.ts
  - Already updated in Story 26-02 (no additional changes needed)
```

---

## Implementation Notes

### AddDesignReferenceDto

```typescript
import { IsUrl, IsOptional, MaxLength, IsString } from 'class-validator';

export class AddDesignReferenceDto {
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
```

### API Endpoints in TicketsController

```typescript
@Post(':id/design-references')
@HttpCode(201)
async addDesignReference(
  @Param('id') ticketId: string,
  @Body() dto: AddDesignReferenceDto,
  @Req() req: any // Extract userId from Firebase token
): Promise<{ designReference: DesignReference }> {
  const workspaceId = req.user.workspaceId; // From middleware/guard
  const userEmail = req.user.email;

  try {
    const result = await this.addDesignReferenceUseCase.execute({
      ticketId,
      workspaceId,
      userId: userEmail,
      url: dto.url,
      title: dto.title
    });

    return {
      designReference: result.designReference
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    if (error instanceof BadRequestException) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    this.logger.error(`Error adding design reference: ${error}`);
    throw new HttpException(
      'Failed to add design reference',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

@Delete(':id/design-references/:referenceId')
@HttpCode(200)
async removeDesignReference(
  @Param('id') ticketId: string,
  @Param('referenceId') referenceId: string,
  @Req() req: any
): Promise<{ success: boolean }> {
  const workspaceId = req.user.workspaceId;

  try {
    await this.removeDesignReferenceUseCase.execute({
      ticketId,
      workspaceId,
      referenceId
    });

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    this.logger.error(`Error removing design reference: ${error}`);
    throw new HttpException(
      'Failed to remove design reference',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
```

### Controller Constructor Update

```typescript
constructor(
  private readonly addDesignReferenceUseCase: AddDesignReferenceUseCase,
  private readonly removeDesignReferenceUseCase: RemoveDesignReferenceUseCase,
  // ... other dependencies
  private readonly logger: Logger
) {}
```

### Error Handling Details

**Validation Errors (400):**
- Invalid URL format
- Non-HTTPS protocol
- URL too long (>2048 chars)
- Title too long (>200 chars)

**Not Found (404):**
- Ticket with given ID not found in workspace
- Design reference with given ID not found

**Server Error (500):**
- Unexpected database error
- Unexpected application error

---

## Data Types

### AddDesignReferenceDto

```typescript
{
  url: "https://figma.com/file/abc123/Dashboard-Redesign",
  title?: "Dashboard Mockups v2"
}
```

### API Response Format

**POST /tickets/:id/design-references**
```typescript
{
  designReference: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    url: "https://figma.com/file/abc123/Dashboard-Redesign",
    platform: "figma",
    title: "Dashboard Mockups v2",
    metadata: null,
    addedAt: "2026-02-14T10:30:00Z",
    addedBy: "alice@company.com"
  }
}
```

**DELETE /tickets/:id/design-references/:referenceId**
```typescript
{
  success: true
}
```

**Error Response (400/404/500)**
```typescript
{
  statusCode: 400 | 404 | 500,
  message: "error message",
  error: "Bad Request" | "Not Found" | "Internal Server Error"
}
```

---

## Testing Strategy

### Unit Tests for DTOs (Validation)

1. **AddDesignReferenceDto Validation**
   - ✅ Accept valid HTTPS Figma URL
   - ✅ Accept valid HTTPS Loom URL
   - ✅ Reject HTTP URL (not HTTPS)
   - ✅ Reject non-URL string
   - ✅ Reject URL > 2048 characters
   - ✅ Accept optional title
   - ✅ Reject title > 200 characters
   - ✅ Validate() returns no errors for valid DTO

### Integration Tests for Endpoints

1. **POST /tickets/:id/design-references**
   - ✅ Add design reference with URL and title
   - ✅ Add design reference with URL only (title auto-generated)
   - ✅ Return 404 if ticket not found
   - ✅ Return 400 if URL invalid
   - ✅ Return 400 if URL not HTTPS
   - ✅ Return 201 on success
   - ✅ Response includes full DesignReference object

2. **DELETE /tickets/:id/design-references/:referenceId**
   - ✅ Remove existing reference successfully
   - ✅ Return 200 on success
   - ✅ Return 404 if ticket not found
   - ✅ Return 200 even if reference doesn't exist (idempotent)
   - ✅ Response body is { success: true }

3. **Request/Response Format**
   - ✅ Request body is JSON
   - ✅ Response content-type is application/json
   - ✅ Response includes proper HTTP status codes

---

## Integration Points

**Upstream (Depends On):**
- Story 26-02: AddDesignReferenceUseCase, RemoveDesignReferenceUseCase
- Story 26-01: DesignReference value object
- TicketRepository service
- NestJS validation pipe
- Request guard for user/workspace extraction

**Downstream (Feeds Into):**
- Story 26-06: Frontend service integration
- Story 26-08: Frontend detail page integration

---

## Dependencies

- NestJS `@Controller`, `@Post`, `@Delete` decorators
- `class-validator` package (@IsUrl, @IsOptional, @MaxLength, @IsString)
- `class-transformer` package (implicit via @Body())
- AddDesignReferenceUseCase and RemoveDesignReferenceUseCase from Story 26-02
- Logger service (NestJS)

**NPM Packages:**
- class-validator (already in project)
- class-transformer (already in project)

---

## Rollout Plan

1. **Hour 1:** Create AddDesignReferenceDto with validation
2. **Hour 1.5:** Add both API endpoints to TicketsController
3. **Hour 1.75:** Write unit tests for DTO validation
4. **Hour 2:** Write integration tests for endpoints
5. **Commit:** After all tests pass

---

## Known Risks

1. **User/Workspace Extraction:** Assumes middleware/guard provides userId and workspaceId
   - *Mitigation:* Coordinate with existing auth middleware setup

2. **URL Validation:** class-validator @IsUrl() might be strict
   - *Mitigation:* Test with actual Figma/Loom URLs during implementation

3. **Error Response Format:** May differ from existing error response format in controller
   - *Mitigation:* Check existing endpoints in TicketsController for consistent format

---

## Success Metrics

- ✅ Both endpoints created and tested
- ✅ URL validation working (HTTPS, max length)
- ✅ POST endpoint returns 201 with DesignReference object
- ✅ DELETE endpoint returns 200 with success flag
- ✅ Error handling returns proper HTTP status codes (404, 400)
- ✅ All tests pass (>85% coverage)
- ✅ Build passes, 0 TypeScript errors
- ✅ No linting errors

---

## Follow-Up Stories

- **26-04:** Backend - AECMapper Persistence Layer
- **26-06:** Frontend - Wizard Store & Service Integration (calls these endpoints)
- **26-08:** Frontend - Ticket Detail Integration (calls delete endpoint)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO
