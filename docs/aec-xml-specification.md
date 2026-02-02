# AEC XML Specification
**Version:** 1.0
**Status:** Specification (Not Yet Implemented)
**Target Epic:** Epic 2 (Story 2.5 - AEC XML Serialization Format)
**Created:** 2026-02-01
**Author:** Product/Engineering Team

---

## Executive Summary

This specification defines a machine-readable XML format for the **Agent Executable Contract (AEC)** - a structured format that extends beyond storage to become a true "Agent Executable Contract" that AI agents and external systems can parse, validate, and execute.

**Purpose:**
- **Agent execution format** - External AI agents can parse and execute tickets autonomously
- **Export format** - Attach to Jira/Linear exports for full context preservation
- **Version control artifact** - Commit alongside code for traceability and historical reference
- **Contract validation** - Schema-validated against AEC.xsd for structural integrity
- **Human-readable documentation** - More readable than JSON for reviews and audits

---

## Relationship to Existing AEC

**Current Implementation (TypeScript/JSON):**
```typescript
// backend/src/tickets/domain/aec/AEC.ts
class AEC { ... } // Domain entity
→ Serialized to JSON in Firestore
→ Used for internal system operations (creation, validation, export)
```

**Proposed XML Format:**
```xml
AEC Domain Entity (TypeScript)
  ↓ (toXML() method)
AEC.xml file
  ↓ (used for)
- Export attachments (Jira/Linear/GitHub Issues)
- External agent consumption (AI agents, automation tools)
- Version control (commit with code changes)
- Documentation archives (human-readable snapshots)
- Schema validation (XSD-based structural validation)
```

**Key Principle:** The TypeScript domain entity (`AEC.ts`) remains the **single source of truth**. XML is a **projection/export format**, not a replacement.

**Design Decision:** Unlike the story-context.xml format (which is human-first), the AEC XML format is **machine-first** with human-readability as a secondary benefit.

---

## XML Schema Overview

```xml
<aec id="aec_abc123" version="1.0" xmlns="https://executable-tickets.com/schema/aec/v1">
  <metadata>...</metadata>
  <intent>...</intent>
  <requirements>...</requirements>
  <implementation>...</implementation>
  <validation>...</validation>
  <snapshots>...</snapshots>
  <tracking>...</tracking>
  <export>...</export>
</aec>
```

---

## Complete Schema Definition

### Root Element: `<aec>`

```xml
<aec
  id="aec_abc123"
  version="1.0"
  xmlns="https://executable-tickets.com/schema/aec/v1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="https://executable-tickets.com/schema/aec/v1 aec-v1.xsd">

  <!-- All child elements below -->

</aec>
```

**Attributes:**
- `id` (required): AEC identifier (e.g., "aec_abc123")
- `version` (required): Schema version (e.g., "1.0")
- `xmlns` (required): Namespace URI
- `xsi:schemaLocation` (optional): XSD schema location

---

### Section 1: `<metadata>`

**Purpose:** AEC lifecycle and identity information

```xml
<metadata>
  <id>aec_abc123</id>
  <workspaceId>ws_xyz789</workspaceId>
  <status>ready</status> <!-- draft | validated | ready | created | drifted -->
  <readinessScore>85</readinessScore>
  <createdAt>2026-02-01T10:30:00Z</createdAt>
  <updatedAt>2026-02-01T14:45:00Z</updatedAt>
  <driftDetectedAt>null</driftDetectedAt> <!-- or ISO timestamp if drifted -->
</metadata>
```

**Field Definitions:**
- `id`: Unique AEC identifier
- `workspaceId`: Tenant/workspace identifier
- `status`: Current lifecycle state
- `readinessScore`: 0-100 validation score
- `createdAt/updatedAt`: ISO 8601 timestamps
- `driftDetectedAt`: Timestamp when drift detected (null if not drifted)

---

### Section 2: `<intent>`

**Purpose:** Product intent and user story

```xml
<intent>
  <title>GitHub App Integration - Read-Only Repo Access</title>
  <description><![CDATA[
    Connect GitHub organization to Executable Tickets so the system
    can read the codebase and generate code-aware tickets.
  ]]></description>
  <type>feature</type> <!-- feature | bug | task -->

  <userStory>
    <asA>Product Manager</asA>
    <iWant>connect my GitHub organization to Executable Tickets</iWant>
    <soThat>the system can read my codebase and generate code-aware tickets</soThat>
  </userStory>
</intent>
```

**Field Definitions:**
- `title`: Short ticket title (3-500 chars)
- `description`: Detailed description (CDATA for multiline text)
- `type`: Ticket classification
- `userStory`: Standard user story format (As a... I want... So that...)

---

### Section 3: `<requirements>`

**Purpose:** Executable acceptance criteria and assumptions

```xml
<requirements>
  <acceptanceCriteria>
    <criterion id="AC-1" priority="critical" validated="true">
      <description>Settings Integration Page</description>
      <givenWhenThen>
        <given>user is a workspace admin</given>
        <when>they navigate to Settings → Integrations → GitHub</when>
        <then>they see Connect GitHub button and OAuth flow explanation</then>
      </givenWhenThen>
    </criterion>

    <criterion id="AC-2" priority="high" validated="true">
      <description>GitHub OAuth Flow</description>
      <givenWhenThen>
        <given>user clicks "Connect GitHub"</given>
        <when>OAuth flow completes</when>
        <then>user authorizes GitHub App with read:repo, read:org, read:user permissions</then>
        <and>user is redirected back to app with authorization code</and>
      </givenWhenThen>
    </criterion>

    <!-- More criteria -->
  </acceptanceCriteria>

  <assumptions>
    <assumption id="ASMP-1">GitHub OAuth app credentials are available in environment</assumption>
    <assumption id="ASMP-2">Firebase Auth is already configured and working</assumption>
    <assumption id="ASMP-3">User has admin permissions in their GitHub organization</assumption>
  </assumptions>
</requirements>
```

**Field Definitions:**
- `criterion`: Individual acceptance criterion
  - `id`: Unique identifier (AC-1, AC-2, etc.)
  - `priority`: critical | high | medium | low
  - `validated`: Boolean - passed validation
  - `description`: Human-readable summary
  - `givenWhenThen`: Structured BDD format
- `assumption`: Explicit assumptions with unique IDs

---

### Section 4: `<implementation>`

**Purpose:** Technical implementation details

```xml
<implementation>
  <tasks>
    <task id="T-1" status="pending" relatedAC="AC-1,AC-2">
      <description>GitHub App Setup (manual OAuth app creation)</description>
      <subtasks>
        <subtask id="T-1.1" status="pending">Create GitHub App in Developer Settings</subtask>
        <subtask id="T-1.2" status="pending">Configure OAuth callback URL</subtask>
        <subtask id="T-1.3" status="pending">Set required permissions</subtask>
      </subtasks>
    </task>

    <task id="T-2" status="pending" relatedAC="AC-2,AC-3">
      <description>Backend OAuth Controller</description>
      <subtasks>
        <subtask id="T-2.1">Create github-oauth.controller.ts</subtask>
        <subtask id="T-2.2">Add GET /api/github/oauth/authorize endpoint</subtask>
        <subtask id="T-2.3">Add GET /api/github/oauth/callback endpoint</subtask>
      </subtasks>
    </task>

    <!-- More tasks -->
  </tasks>

  <interfaces>
    <interface id="INT-1" type="REST">
      <endpoint>POST /api/github/oauth/authorize</endpoint>
      <guards>FirebaseAuthGuard, WorkspaceGuard</guards>
      <request>No body</request>
      <response><![CDATA[{ oauthUrl: string, state: string }]]></response>
      <location>backend/src/github/presentation/controllers/github-oauth.controller.ts</location>
    </interface>

    <interface id="INT-2" type="REST">
      <endpoint>GET /api/github/oauth/callback</endpoint>
      <guards>None (public, redirected from GitHub)</guards>
      <request>Query: { code: string, state: string }</request>
      <response><![CDATA[{ success: boolean, message: string }]]></response>
      <location>backend/src/github/presentation/controllers/github-oauth.controller.ts</location>
    </interface>

    <!-- More interfaces -->
  </interfaces>

  <artifacts>
    <filesToCreate>
      <file>backend/src/github/presentation/controllers/github-oauth.controller.ts</file>
      <file>backend/src/github/application/services/github-token.service.ts</file>
      <file>backend/src/github/domain/GitHubIntegration.ts</file>
      <file>client/src/settings/components/GitHubIntegration.tsx</file>
      <file>client/src/stores/settings.store.ts</file>
    </filesToCreate>

    <filesToModify>
      <file>backend/src/github/github.module.ts</file>
      <file>client/src/services/github.service.ts</file>
      <file>client/src/tickets/components/RepositorySelector.tsx</file>
    </filesToModify>
  </artifacts>

  <repoPaths>
    <path language="typescript">backend/src/github/**/*.ts</path>
    <path language="typescript">client/src/settings/**/*.tsx</path>
    <path language="typescript">client/src/services/github.service.ts</path>
  </repoPaths>
</implementation>
```

**Field Definitions:**
- `tasks`: Implementation tasks with status tracking
- `interfaces`: API contracts and signatures
- `artifacts`: Files to create/modify
- `repoPaths`: Code modules affected

---

### Section 5: `<validation>`

**Purpose:** Validation results and constraints

```xml
<validation>
  <results>
    <result validator="structural" score="100" weight="1.0" passed="true">
      <issues />
    </result>

    <result validator="behavioral" score="90" weight="1.5" passed="true">
      <issues>
        <issue severity="warning">
          <description>Some acceptance criteria not in Given/When/Then format</description>
          <suggestion>Reformat AC-4 as: Given X, When Y, Then Z</suggestion>
        </issue>
      </issues>
    </result>

    <result validator="testability" score="85" weight="2.0" passed="true">
      <issues />
    </result>

    <result validator="risk" score="75" weight="1.0" passed="true">
      <issues>
        <issue severity="info">
          <description>OAuth integration requires external dependency</description>
          <suggestion>Ensure proper error handling for GitHub API failures</suggestion>
        </issue>
      </issues>
    </result>

    <result validator="permissions" score="100" weight="3.0" passed="true">
      <issues />
    </result>
  </results>

  <constraints>
    <constraint id="CONST-1" type="architecture">
      <rule>Clean Architecture - Domain layer must have NO framework dependencies</rule>
      <enforced>true</enforced>
    </constraint>

    <constraint id="CONST-2" type="security">
      <rule>Tokens MUST be encrypted before storing in Firestore</rule>
      <enforced>true</enforced>
    </constraint>

    <constraint id="CONST-3" type="security">
      <rule>Webhook endpoint must verify signature using HMAC-SHA256</rule>
      <enforced>true</enforced>
    </constraint>

    <!-- More constraints -->
  </constraints>

  <questions if="readinessScore &lt; 75">
    <!-- Max 3 clarification questions if score is low -->
    <question id="Q-1" answered="true">
      <text>Should webhook events be processed synchronously or queued?</text>
      <options>
        <option value="sync">Process synchronously</option>
        <option value="queue">Queue for background processing (recommended)</option>
      </options>
      <answer>queue</answer>
      <defaultAssumption>If unanswered, will use background queue</defaultAssumption>
    </question>
  </questions>
</validation>
```

**Field Definitions:**
- `results`: Validation outcomes from 5 validators
- `constraints`: Architectural and security rules
- `questions`: Clarification questions (max 3, only if readiness < 75)

---

### Section 6: `<snapshots>`

**Purpose:** Lock to specific code/API versions

```xml
<snapshots>
  <repositoryContext>
    <repository>anthropics/forge</repository>
    <branch>main</branch>
    <commit>abc123def456789</commit>
    <isDefaultBranch>true</isDefaultBranch>
    <selectedAt>2026-02-01T10:30:00Z</selectedAt>
  </repositoryContext>

  <codeSnapshot if="status in ['ready', 'created']">
    <commitSha>abc123def456789</commitSha>
    <indexId>idx_xyz789</indexId>
    <capturedAt>2026-02-01T14:00:00Z</capturedAt>
  </codeSnapshot>

  <apiSnapshot if="applicable">
    <specUrl>https://github.com/anthropics/forge/blob/main/openapi.yaml</specUrl>
    <hash>sha256:a1b2c3d4e5f6...</hash>
    <version>1.2.0</version>
    <capturedAt>2026-02-01T14:00:00Z</capturedAt>
  </apiSnapshot>
</snapshots>
```

**Field Definitions:**
- `repositoryContext`: Branch and commit selected during creation
- `codeSnapshot`: Locked code version (only when status = ready/created)
- `apiSnapshot`: Locked API contract version (if applicable)

---

### Section 7: `<tracking>`

**Purpose:** Generation progress and estimation

```xml
<tracking>
  <generationState>
    <currentStep>8</currentStep>
    <completedAt>2026-02-01T14:45:00Z</completedAt>
    <steps>
      <step id="1" status="complete" duration="2.3s">
        <title>Intent extraction</title>
        <details>Extracted user story and key requirements</details>
      </step>
      <step id="2" status="complete" duration="1.8s">
        <title>Type detection</title>
        <details>Classified as: feature</details>
      </step>
      <step id="3" status="complete" duration="4.2s">
        <title>Repo index query</title>
        <details>Found 8 relevant code modules</details>
      </step>
      <!-- Steps 4-8 -->
    </steps>
  </generationState>

  <estimate>
    <min>40</min>
    <max>60</max>
    <unit>hours</unit>
    <confidence>medium</confidence> <!-- low | medium | high -->
    <drivers>
      <driver>12 tasks across backend and frontend</driver>
      <driver>OAuth integration complexity</driver>
      <driver>Webhook setup and security testing</driver>
    </drivers>
    <calculatedAt>2026-02-01T14:45:00Z</calculatedAt>
  </estimate>
</tracking>
```

**Field Definitions:**
- `generationState`: 8-step progress tracking
- `estimate`: Effort estimation with confidence and drivers

---

### Section 8: `<export>`

**Purpose:** External issue tracking

```xml
<export if="status = 'created'">
  <externalIssue>
    <platform>jira</platform> <!-- jira | linear -->
    <issueId>PROJ-123</issueId>
    <issueKey>PROJ-123</issueKey>
    <issueUrl>https://jira.company.com/browse/PROJ-123</issueUrl>
    <exportedAt>2026-02-01T15:00:00Z</exportedAt>
    <exportedBy>user_uid_abc123</exportedBy>
  </externalIssue>

  <appendices>
    <devAppendix><![CDATA[
## Dev Context
- **Affected Modules:** backend/src/github/**/*.ts, client/src/settings/**/*.tsx
- **Code Snapshot:** abc123def456 (https://github.com/anthropics/forge/commit/abc123def456)
- **Estimate:** 40-60 hours (medium confidence)
- **Drivers:** 12 tasks, OAuth complexity, webhook security
    ]]></devAppendix>

    <qaAppendix><![CDATA[
## QA Verification
- **Readiness Score:** 85/100 (Ready)
- **Validation Results:** All validators passed
- **Acceptance Criteria:** 8 criteria (see above)
- **Test Focus:** OAuth flow, token security, webhook signature verification
    ]]></qaAppendix>
  </appendices>
</export>
```

**Field Definitions:**
- `externalIssue`: Jira/Linear issue details
- `appendices`: Dev and QA context (included in export)

---

## XSD Schema File

**Location:** `docs/schemas/aec-v1.xsd`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  targetNamespace="https://executable-tickets.com/schema/aec/v1"
  xmlns="https://executable-tickets.com/schema/aec/v1"
  elementFormDefault="qualified">

  <!-- Root element -->
  <xs:element name="aec">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="metadata" type="MetadataType"/>
        <xs:element name="intent" type="IntentType"/>
        <xs:element name="requirements" type="RequirementsType"/>
        <xs:element name="implementation" type="ImplementationType"/>
        <xs:element name="validation" type="ValidationType"/>
        <xs:element name="snapshots" type="SnapshotsType"/>
        <xs:element name="tracking" type="TrackingType"/>
        <xs:element name="export" type="ExportType" minOccurs="0"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:string" use="required"/>
      <xs:attribute name="version" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>

  <!-- Complex types defined here -->
  <!-- See full XSD in separate file -->

</xs:schema>
```

---

## Implementation Plan

### Story 2.5: AEC XML Serialization Format

**Epic:** Epic 2 - Ticket Creation & AEC Engine
**Priority:** P2 (Nice to have for v1, required for v2)
**Depends On:** Story 2.3 (AEC Domain Model)

**Acceptance Criteria:**

1. **XML Schema Defined**
   - Create `docs/schemas/aec-v1.xsd` with complete schema
   - Validate against sample AEC XML files
   - Document all elements and attributes

2. **AEC Domain Method: toXML()**
   - Add `toXML(): string` method to AEC class
   - Generates valid XML conforming to schema
   - Handles null values, CDATA escaping, ISO timestamps
   - Unit tests verify XML output validity

3. **AEC Domain Method: fromXML()**
   - Add static `fromXML(xml: string): AEC` method
   - Parses XML back to AEC domain entity
   - Validates against XSD schema
   - Handles malformed XML gracefully

4. **Storage Integration**
   - Optionally store XML alongside JSON in Firestore
   - Add `/workspaces/{id}/aecs/{id}/aec.xml` Storage bucket path
   - Generate XML on demand (not stored by default for v1)

5. **Export Integration**
   - Include AEC.xml as attachment when exporting to Jira/Linear
   - Add download link in ticket detail UI
   - "Download AEC.xml" button next to Export button

6. **CLI Tool (Optional)**
   - `aec-cli validate <file>.xml` - validate against schema
   - `aec-cli convert <file>.json` - convert JSON AEC to XML
   - `aec-cli diff <v1>.xml <v2>.xml` - show differences

**Tasks:**
- Create XSD schema file
- Implement toXML() with unit tests
- Implement fromXML() with unit tests
- Add XML export to Jira/Linear integration
- Add download button in UI
- Write documentation

**Out of Scope for v1:**
- XML as primary storage format (JSON remains primary)
- Real-time XML updates (generate on demand only)
- XML-based API endpoints

---

## Usage Examples

### Example 1: Export AEC for External Agent

```typescript
// Backend use case
const aec = await aecRepository.findById(aecId);
const aecXml = aec.toXML();

// Save to Storage
await storage.bucket('aec-exports').file(`${aecId}.xml`).save(aecXml);

// Return download URL
const url = await storage.bucket('aec-exports').file(`${aecId}.xml`).getSignedUrl();
```

### Example 2: Attach to Jira Export

```typescript
// In ExportToJiraUseCase
const aec = await aecRepository.findById(aecId);
const aecXml = aec.toXML();

// Create Jira issue
const issue = await jiraClient.createIssue({
  summary: aec.title,
  description: formatDescription(aec),
});

// Attach AEC.xml
await jiraClient.addAttachment(issue.id, {
  filename: `AEC-${aec.id}.xml`,
  content: aecXml,
});
```

### Example 3: Version Control Integration

```bash
# Commit AEC alongside code
git add src/features/github-integration/
git add docs/aecs/4-1-github-app-integration.xml
git commit -m "Implement GitHub OAuth integration (closes AEC-123)"
```

### Example 4: External AI Agent Execution

```python
# External agent reads AEC.xml
import xml.etree.ElementTree as ET

tree = ET.parse('aec_abc123.xml')
root = tree.getroot()

# Extract requirements
criteria = root.findall('.//acceptanceCriteria/criterion')
for criterion in criteria:
    ac_id = criterion.get('id')
    description = criterion.find('description').text
    print(f"{ac_id}: {description}")

# Execute against codebase
verify_acceptance_criteria(criteria)
```

---

## Benefits Summary

**For AI Agents:**
- Structured, parseable format
- Schema validation ensures consistency
- Clear separation of concerns (intent, implementation, validation)

**For Teams:**
- Human-readable contract document
- Version control friendly
- Full context in exports
- Audit trail

**For System:**
- Format stability (v1, v2, etc.)
- Cross-platform compatibility
- Language-agnostic (any system can parse XML)

---

## Migration Path

**Phase 1 (v1):**
- Implement toXML()/fromXML()
- Export on demand only
- Attach to Jira/Linear exports

**Phase 2 (v2):**
- Store XML alongside JSON
- XML-based API endpoints
- Real-time XML updates

**Phase 3 (v3+):**
- XML as primary storage (JSON for backward compat)
- Distributed agent execution via XML
- Contract-driven development

---

## References

- [AEC Domain Model](../backend/src/tickets/domain/aec/AEC.ts)
- [Story 2.3: AEC Domain Model](./epics.md#story-23-aec-domain-model)
- [Architecture: Data Architecture](./architecture.md#data-architecture)
- [PRD: Agent Executable Contract](./prd.md#agent-executable-contract)

---

**Status:** ✅ Specification Complete - Ready for Implementation
**Next Step:** Add Story 2.5 to Epic 2 in epics.md and sprint-status.yaml
