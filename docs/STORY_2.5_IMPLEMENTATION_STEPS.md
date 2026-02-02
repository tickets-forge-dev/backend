# Story 2.5: AEC XML Serialization - Implementation Steps

**Date Started:** 2026-02-02  
**Priority:** P2  
**Estimated Effort:** 22-32 hours  
**Status:** Ready to Start

---

## Implementation Phases

### Phase 1: Setup & Dependencies (1-2 hours)
### Phase 2: XML Serialization (toXML) (6-8 hours)
### Phase 3: XML Deserialization (fromXML) (4-6 hours)
### Phase 4: Backend API Endpoint (2-3 hours)
### Phase 5: Export Integration (4-6 hours)
### Phase 6: Frontend Download Button (2-3 hours)
### Phase 7: Testing (6-8 hours)
### Phase 8: Documentation (1-2 hours)

---

## Phase 1: Setup & Dependencies ⏱️ 1-2 hours

### Step 1.1: Install XML Library
**File:** `backend/package.json`

```bash
cd backend
npm install fast-xml-parser
npm install --save-dev @types/fast-xml-parser
```

**Why fast-xml-parser?**
- Fast and lightweight
- TypeScript support
- Handles complex types well
- Good CDATA support

**Alternative:** `xml2js` (if you prefer, but fast-xml-parser is recommended)

### Step 1.2: Create XML Service (Infrastructure)
**File:** `backend/src/shared/infrastructure/xml/XmlService.ts`

```typescript
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export class XmlService {
  private builder: XMLBuilder;
  private parser: XMLParser;

  constructor() {
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      cdataPropName: '__cdata',
    });

    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      cdataPropName: '__cdata',
    });
  }

  toXML(obj: any): string {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + this.builder.build(obj);
  }

  fromXML(xml: string): any {
    return this.parser.parse(xml);
  }
}
```

### Step 1.3: Create XSD Validator Service (Optional for v1)
**File:** `backend/src/shared/infrastructure/xml/XsdValidatorService.ts`

```typescript
// Optional: Add XSD validation with libxmljs2
// For v1, we can skip this and add in v2
// Focus on structural validation in toXML/fromXML logic
```

---

## Phase 2: XML Serialization (toXML) ⏱️ 6-8 hours

### Step 2.1: Create XML Mapper Helper
**File:** `backend/src/tickets/infrastructure/xml/AECXmlMapper.ts`

This will handle the complex mapping logic between AEC domain entity and XML structure.

```typescript
import { AEC } from '../../../domain/aec/AEC';
import { XmlService } from '../../../../shared/infrastructure/xml/XmlService';

export class AECXmlMapper {
  constructor(private xmlService: XmlService) {}

  toXmlObject(aec: AEC): any {
    return {
      aec: {
        '@_id': aec.id,
        '@_version': '1.0',
        '@_xmlns': 'https://executable-tickets.com/schema/aec/v1',
        metadata: this.buildMetadata(aec),
        intent: this.buildIntent(aec),
        requirements: this.buildRequirements(aec),
        implementation: this.buildImplementation(aec),
        validation: this.buildValidation(aec),
        snapshots: this.buildSnapshots(aec),
        tracking: this.buildTracking(aec),
        ...(aec.externalIssue && { export: this.buildExport(aec) }),
      },
    };
  }

  private buildMetadata(aec: AEC): any {
    return {
      id: aec.id,
      workspaceId: aec.workspaceId,
      status: aec.status,
      readinessScore: aec.readinessScore,
      createdAt: aec.createdAt.toISOString(),
      updatedAt: aec.updatedAt.toISOString(),
      driftDetectedAt: aec.driftDetectedAt?.toISOString() || 'null',
    };
  }

  private buildIntent(aec: AEC): any {
    // TODO: Implement - map title, description, type, user story
  }

  private buildRequirements(aec: AEC): any {
    // TODO: Implement - map acceptance criteria and assumptions
  }

  private buildImplementation(aec: AEC): any {
    // TODO: Implement - map tasks, interfaces, artifacts, repoPaths
  }

  private buildValidation(aec: AEC): any {
    // TODO: Implement - map validation results, constraints, questions
  }

  private buildSnapshots(aec: AEC): any {
    // TODO: Implement - map repository context, code/API snapshots
  }

  private buildTracking(aec: AEC): any {
    // TODO: Implement - map generation state and estimate
  }

  private buildExport(aec: AEC): any {
    // TODO: Implement - map external issue and appendices
  }
}
```

**Tasks:**
- [ ] Implement `buildMetadata()` ✓ (provided above)
- [ ] Implement `buildIntent()` - map title, description, type
- [ ] Implement `buildRequirements()` - map acceptanceCriteria[], assumptions[]
- [ ] Implement `buildImplementation()` - map repoPaths[] (tasks/interfaces from future stories)
- [ ] Implement `buildValidation()` - map validationResults[], questions[]
- [ ] Implement `buildSnapshots()` - map repositoryContext, codeSnapshot, apiSnapshot
- [ ] Implement `buildTracking()` - map generationState, estimate
- [ ] Implement `buildExport()` - map externalIssue (only if present)
- [ ] Handle CDATA for long text fields (description, appendices)
- [ ] Handle null/undefined values properly

### Step 2.2: Add toXML() Method to AEC Entity
**File:** `backend/src/tickets/domain/aec/AEC.ts`

Add at the end of the AEC class:

```typescript
// XML Serialization (Story 2.5)
toXML(): string {
  // Import at top: import { AECXmlMapper } from '../../../infrastructure/xml/AECXmlMapper';
  // Import at top: import { XmlService } from '../../../../shared/infrastructure/xml/XmlService';
  
  const xmlService = new XmlService();
  const mapper = new AECXmlMapper(xmlService);
  const xmlObject = mapper.toXmlObject(this);
  return xmlService.toXML(xmlObject);
}
```

**Note:** This creates dependencies on infrastructure from domain. Consider dependency injection pattern if it bothers you, but for simplicity, this works.

---

## Phase 3: XML Deserialization (fromXML) ⏱️ 4-6 hours

### Step 3.1: Implement fromXmlObject in Mapper
**File:** `backend/src/tickets/infrastructure/xml/AECXmlMapper.ts`

Add method to parse XML object back to AEC:

```typescript
fromXmlObject(xmlObj: any): AEC {
  const aecNode = xmlObj.aec;
  
  // Extract metadata
  const metadata = aecNode.metadata;
  
  // Extract all other sections
  const intent = aecNode.intent;
  const requirements = aecNode.requirements;
  // ... etc
  
  // Reconstitute AEC using AEC.reconstitute()
  return AEC.reconstitute(
    metadata.id,
    metadata.workspaceId,
    metadata.status as AECStatus,
    intent.title,
    intent.description === 'null' ? null : intent.description,
    intent.type as TicketType | null,
    metadata.readinessScore,
    this.parseGenerationState(aecNode.tracking.generationState),
    this.parseAcceptanceCriteria(requirements.acceptanceCriteria),
    this.parseAssumptions(requirements.assumptions),
    this.parseRepoPaths(aecNode.implementation.repoPaths),
    this.parseCodeSnapshot(aecNode.snapshots.codeSnapshot),
    this.parseApiSnapshot(aecNode.snapshots.apiSnapshot),
    this.parseQuestions(aecNode.validation.questions),
    this.parseEstimate(aecNode.tracking.estimate),
    this.parseValidationResults(aecNode.validation.results),
    this.parseExternalIssue(aecNode.export?.externalIssue),
    metadata.driftDetectedAt === 'null' ? null : new Date(metadata.driftDetectedAt),
    this.parseRepositoryContext(aecNode.snapshots.repositoryContext),
    new Date(metadata.createdAt),
    new Date(metadata.updatedAt),
  );
}

private parseAcceptanceCriteria(acNode: any): string[] {
  // TODO: Implement
}

// ... more parse methods
```

**Tasks:**
- [ ] Implement `parseAcceptanceCriteria()`
- [ ] Implement `parseAssumptions()`
- [ ] Implement `parseRepoPaths()`
- [ ] Implement `parseGenerationState()`
- [ ] Implement `parseCodeSnapshot()`
- [ ] Implement `parseApiSnapshot()`
- [ ] Implement `parseRepositoryContext()`
- [ ] Implement `parseQuestions()`
- [ ] Implement `parseEstimate()`
- [ ] Implement `parseValidationResults()`
- [ ] Implement `parseExternalIssue()`
- [ ] Handle missing optional fields gracefully
- [ ] Validate required fields exist

### Step 3.2: Add fromXML() Static Method to AEC Entity
**File:** `backend/src/tickets/domain/aec/AEC.ts`

Add static method:

```typescript
// XML Deserialization (Story 2.5)
static fromXML(xml: string): AEC {
  const xmlService = new XmlService();
  const mapper = new AECXmlMapper(xmlService);
  const xmlObject = xmlService.fromXML(xml);
  return mapper.fromXmlObject(xmlObject);
}
```

---

## Phase 4: Backend API Endpoint ⏱️ 2-3 hours

### Step 4.1: Create GetAECXmlUseCase
**File:** `backend/src/tickets/application/use-cases/GetAECXmlUseCase.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IAECRepository } from '../ports/IAECRepository';

@Injectable()
export class GetAECXmlUseCase {
  constructor(private aecRepository: IAECRepository) {}

  async execute(aecId: string, workspaceId: string): Promise<string> {
    // Get AEC from repository
    const aec = await this.aecRepository.findById(aecId);
    
    if (!aec) {
      throw new Error('AEC not found');
    }
    
    // Verify workspace ownership
    if (aec.workspaceId !== workspaceId) {
      throw new Error('Access denied');
    }
    
    // Generate and return XML
    return aec.toXML();
  }
}
```

### Step 4.2: Add Controller Endpoint
**File:** `backend/src/tickets/presentation/controllers/tickets.controller.ts`

Add new endpoint:

```typescript
@Get(':id/xml')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
async getAECXml(
  @Param('id') id: string,
  @WorkspaceId() workspaceId: string,
  @Res() res: Response,
) {
  const xml = await this.getAECXmlUseCase.execute(id, workspaceId);
  
  // Set headers for XML download
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', `attachment; filename="AEC-${id}.xml"`);
  res.send(xml);
}
```

### Step 4.3: Register Use Case in Module
**File:** `backend/src/tickets/tickets.module.ts`

Add to providers array:

```typescript
providers: [
  // ... existing providers
  GetAECXmlUseCase,
],
```

---

## Phase 5: Export Integration ⏱️ 4-6 hours

### Step 5.1: Update ExportToJiraUseCase
**File:** `backend/src/tickets/application/use-cases/ExportToJiraUseCase.ts`

```typescript
async execute(aecId: string, workspaceId: string, projectKey: string): Promise<ExternalIssue> {
  // ... existing code to create Jira issue ...
  
  // Generate AEC XML
  const aec = await this.aecRepository.findById(aecId);
  const aecXml = aec.toXML();
  
  // Attach XML to Jira issue
  await this.jiraClient.addAttachment(jiraIssue.id, {
    filename: `AEC-${aecId}.xml`,
    contentType: 'application/xml',
    content: Buffer.from(aecXml, 'utf-8'),
  });
  
  // ... rest of existing code ...
}
```

### Step 5.2: Update ExportToLinearUseCase
**File:** `backend/src/tickets/application/use-cases/ExportToLinearUseCase.ts`

Similar to Jira - add XML attachment after issue creation.

**Note:** Check if these use cases exist yet. If not, this can be done when Epic 5 (Export) is implemented.

---

## Phase 6: Frontend Download Button ⏱️ 2-3 hours

### Step 6.1: Add Download Method to Ticket Service
**File:** `client/src/services/ticket.service.ts`

```typescript
async downloadAECXml(aecId: string): Promise<void> {
  const response = await fetch(`/api/tickets/${aecId}/xml`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${await this.getAuthToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to download AEC XML');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AEC-${aecId}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
```

### Step 6.2: Add Download Button to Ticket Detail
**File:** `client/src/tickets/components/TicketDetail.tsx`

Add button near Export button:

```tsx
import { Download } from 'lucide-react';

// In component JSX, near the Export button:
<Button
  variant="ghost"
  size="sm"
  onClick={() => ticketService.downloadAECXml(aec.id)}
  className="gap-2"
>
  <Download className="h-4 w-4" />
  Download XML
</Button>
```

---

## Phase 7: Testing ⏱️ 6-8 hours

### Step 7.1: Unit Tests for toXML()
**File:** `backend/src/tickets/domain/aec/AEC.xml.spec.ts`

```typescript
import { AEC } from './AEC';
import { XMLParser } from 'fast-xml-parser';

describe('AEC XML Serialization', () => {
  let aec: AEC;
  let parser: XMLParser;

  beforeEach(() => {
    // Create sample AEC
    aec = AEC.createDraft('ws_123', 'Test Ticket');
    parser = new XMLParser({ ignoreAttributes: false });
  });

  describe('toXML()', () => {
    it('should generate valid XML', () => {
      const xml = aec.toXML();
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<aec');
      
      // Should be parseable
      const parsed = parser.parse(xml);
      expect(parsed.aec).toBeDefined();
    });

    it('should include all required sections', () => {
      const xml = aec.toXML();
      
      expect(xml).toContain('<metadata>');
      expect(xml).toContain('<intent>');
      expect(xml).toContain('<requirements>');
      expect(xml).toContain('<implementation>');
      expect(xml).toContain('<validation>');
      expect(xml).toContain('<snapshots>');
      expect(xml).toContain('<tracking>');
    });

    it('should include metadata fields', () => {
      const xml = aec.toXML();
      
      expect(xml).toContain(`<id>${aec.id}</id>`);
      expect(xml).toContain(`<workspaceId>ws_123</workspaceId>`);
      expect(xml).toContain(`<status>draft</status>`);
    });

    it('should handle null values correctly', () => {
      const xml = aec.toXML();
      
      expect(xml).toContain('<description>null</description>');
      expect(xml).toContain('<driftDetectedAt>null</driftDetectedAt>');
    });

    it('should include namespace and version', () => {
      const xml = aec.toXML();
      
      expect(xml).toContain('xmlns="https://executable-tickets.com/schema/aec/v1"');
      expect(xml).toContain('version="1.0"');
    });
  });
});
```

**More test cases needed:**
- [ ] Test with full AEC (all fields populated)
- [ ] Test with acceptance criteria
- [ ] Test with validation results
- [ ] Test with estimates
- [ ] Test with repository context
- [ ] Test with external issue (export section)
- [ ] Test CDATA escaping for long text
- [ ] Test special characters in XML

### Step 7.2: Unit Tests for fromXML()
**File:** Same file, add describe block:

```typescript
describe('fromXML()', () => {
  it('should parse XML back to AEC', () => {
    const xml = aec.toXML();
    const parsed = AEC.fromXML(xml);
    
    expect(parsed.id).toBe(aec.id);
    expect(parsed.workspaceId).toBe(aec.workspaceId);
    expect(parsed.title).toBe(aec.title);
    expect(parsed.status).toBe(aec.status);
  });

  it('should handle round-trip conversion', () => {
    // Add some data to AEC
    aec.updateContent(
      'feature',
      ['AC-1: User can login'],
      ['Firebase Auth configured'],
      ['backend/src/auth'],
    );
    
    const xml = aec.toXML();
    const parsed = AEC.fromXML(xml);
    
    expect(parsed.type).toBe('feature');
    expect(parsed.acceptanceCriteria).toEqual(['AC-1: User can login']);
    expect(parsed.assumptions).toEqual(['Firebase Auth configured']);
    expect(parsed.repoPaths).toEqual(['backend/src/auth']);
  });

  it('should throw error for invalid XML', () => {
    const invalidXml = '<invalid>xml</invalid>';
    
    expect(() => AEC.fromXML(invalidXml)).toThrow();
  });

  it('should throw error for missing required fields', () => {
    const incompleteXml = `
      <?xml version="1.0"?>
      <aec id="test" version="1.0">
        <metadata>
          <id>test</id>
        </metadata>
      </aec>
    `;
    
    expect(() => AEC.fromXML(incompleteXml)).toThrow();
  });
});
```

### Step 7.3: Integration Tests for API Endpoint
**File:** `backend/src/tickets/presentation/controllers/tickets.controller.spec.ts`

```typescript
describe('GET /tickets/:id/xml', () => {
  it('should return XML with correct headers', async () => {
    const response = await request(app.getHttpServer())
      .get(`/tickets/${aecId}/xml`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-disposition']).toContain('.xml');
    
    expect(response.text).toContain('<?xml version="1.0"');
    expect(response.text).toContain('<aec');
  });

  it('should return 404 for non-existent AEC', async () => {
    await request(app.getHttpServer())
      .get('/tickets/non-existent/xml')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('should return 403 for wrong workspace', async () => {
    // Create AEC in workspace A
    // Try to access from workspace B
    await request(app.getHttpServer())
      .get(`/tickets/${aecIdWorkspaceA}/xml`)
      .set('Authorization', `Bearer ${authTokenWorkspaceB}`)
      .expect(403);
  });
});
```

### Step 7.4: Frontend Tests (Optional)
**File:** `client/src/tickets/components/TicketDetail.test.tsx`

Test download button exists and triggers download.

---

## Phase 8: Documentation ⏱️ 1-2 hours

### Step 8.1: Update API Documentation
Add to OpenAPI/Swagger docs (if using @nestjs/swagger):

```typescript
@ApiOperation({ summary: 'Download AEC as XML' })
@ApiResponse({ status: 200, description: 'XML file download' })
@ApiResponse({ status: 404, description: 'AEC not found' })
@Get(':id/xml')
// ... endpoint
```

### Step 8.2: Update README or Developer Docs
Add section on XML export usage.

---

## Testing Checklist

Before marking Story 2.5 complete:

- [ ] All unit tests pass (toXML)
- [ ] All unit tests pass (fromXML)
- [ ] Round-trip conversion works (AEC → XML → AEC)
- [ ] Integration tests pass (API endpoint)
- [ ] Download button appears in UI
- [ ] Download works in browser
- [ ] XML validates against XSD (optional for v1)
- [ ] Manual test: Create AEC, download XML, verify contents
- [ ] Manual test: XML is readable and well-formatted
- [ ] Jira export includes XML attachment (if Epic 5 done)
- [ ] Linear export includes XML attachment (if Epic 5 done)

---

## Success Criteria (from Story 2.5)

- [x] XSD schema defined ✅ (already done)
- [ ] `aec.toXML()` generates valid XML
- [ ] `AEC.fromXML(xml)` reconstructs AEC entity
- [ ] Round-trip conversion works
- [ ] Jira/Linear exports include XML attachment (if Epic 5 ready)
- [ ] Download button works in UI
- [ ] All tests pass

---

## Dependencies

**Required NPM Packages:**
```json
{
  "dependencies": {
    "fast-xml-parser": "^4.3.2"
  },
  "devDependencies": {
    "@types/fast-xml-parser": "^4.0.0"
  }
}
```

---

## Rollout Plan

1. **Dev Environment:** Test thoroughly with sample AECs
2. **Staging:** Smoke test download and export
3. **Production:** Feature flag (optional) - enable for specific workspaces first

---

## Questions to Resolve

1. ✅ Use `fast-xml-parser` or `xml2js`? → **Decision: fast-xml-parser**
2. ⏳ Include XSD validation in v1 or defer to v2? → **Decision: Defer to v2**
3. ⏳ Store XML in Firebase Storage or generate on-demand? → **Decision: On-demand for v1**
4. ⏳ Should fromXML() validate against XSD before parsing? → **Decision: Defer to v2**

---

## Next Immediate Actions

**START HERE:**

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/story-2.5-aec-xml-serialization
   ```

2. **Begin Phase 1 (Setup):**
   - Install fast-xml-parser
   - Create XmlService
   - Create AECXmlMapper stub

3. **Begin Phase 2 (toXML):**
   - Implement mapper methods one by one
   - Start with metadata (simplest)
   - Add toXML() to AEC class
   - Write first unit test

**Recommended Order:**
1. Setup (1-2 hours)
2. toXML for metadata + intent (2-3 hours) → Test it
3. toXML for requirements + snapshots (2-3 hours) → Test it
4. toXML for validation + tracking + export (2-3 hours) → Test it
5. fromXML implementation (4-6 hours) → Test it
6. API endpoint (2-3 hours) → Test it
7. UI download button (2-3 hours)
8. Export integration (if Epic 5 ready)

---

**Estimated Timeline:**
- **Week 1:** Phases 1-3 (Setup, toXML, fromXML)
- **Week 2:** Phases 4-7 (API, Export, UI, Testing)
- **Week 3:** Phase 8 + Buffer (Documentation, polish)

Total: **2-3 weeks** (assuming part-time work)

---

Ready to start? Begin with Phase 1, Step 1.1 (Install XML library)! 🚀
