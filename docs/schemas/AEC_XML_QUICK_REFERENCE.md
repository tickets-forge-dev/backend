# AEC XML Quick Reference

**Version:** 1.0  
**Schema:** `docs/schemas/aec-v1.xsd`  
**Namespace:** `https://executable-tickets.com/schema/aec/v1`

---

## Minimal Valid Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<aec id="aec_abc123" version="1.0" xmlns="https://executable-tickets.com/schema/aec/v1">
  
  <metadata>
    <id>aec_abc123</id>
    <workspaceId>ws_xyz789</workspaceId>
    <status>draft</status>
    <readinessScore>0</readinessScore>
    <createdAt>2026-02-01T10:00:00Z</createdAt>
    <updatedAt>2026-02-01T10:00:00Z</updatedAt>
    <driftDetectedAt>null</driftDetectedAt>
  </metadata>

  <intent>
    <title>Implement User Authentication</title>
    <description>null</description>
    <type>feature</type>
  </intent>

  <requirements>
    <acceptanceCriteria />
    <assumptions />
  </requirements>

  <implementation>
    <tasks />
    <interfaces />
    <artifacts>
      <filesToCreate />
      <filesToModify />
    </artifacts>
    <repoPaths />
  </implementation>

  <validation>
    <results />
    <constraints />
  </validation>

  <snapshots>
    <repositoryContext>
      <repository>owner/repo</repository>
      <branch>main</branch>
      <commit>abc123</commit>
      <isDefaultBranch>true</isDefaultBranch>
      <selectedAt>2026-02-01T10:00:00Z</selectedAt>
    </repositoryContext>
  </snapshots>

  <tracking>
    <generationState>
      <currentStep>0</currentStep>
      <steps />
    </generationState>
  </tracking>

</aec>
```

---

## Section Breakdown

### 1. `<metadata>` - Required
Lifecycle and identity information.

```xml
<metadata>
  <id>aec_abc123</id>
  <workspaceId>ws_xyz789</workspaceId>
  <status>draft | validated | ready | created | drifted</status>
  <readinessScore>0-100</readinessScore>
  <createdAt>ISO 8601 timestamp</createdAt>
  <updatedAt>ISO 8601 timestamp</updatedAt>
  <driftDetectedAt>ISO 8601 or null</driftDetectedAt>
</metadata>
```

### 2. `<intent>` - Required
Product intent and user story.

```xml
<intent>
  <title>Short title (3-500 chars)</title>
  <description><![CDATA[Optional long description]]></description>
  <type>feature | bug | task</type>
  <userStory>
    <asA>Product Manager</asA>
    <iWant>connect GitHub</iWant>
    <soThat>generate code-aware tickets</soThat>
  </userStory>
</intent>
```

### 3. `<requirements>` - Required
Acceptance criteria and assumptions.

```xml
<requirements>
  <acceptanceCriteria>
    <criterion id="AC-1" priority="critical" validated="true">
      <description>User can log in</description>
      <givenWhenThen>
        <given>user is on login page</given>
        <when>enters valid credentials</when>
        <then>redirected to dashboard</then>
        <and>session token stored</and>
      </givenWhenThen>
    </criterion>
  </acceptanceCriteria>
  
  <assumptions>
    <assumption id="ASMP-1">Firebase Auth already configured</assumption>
    <assumption id="ASMP-2">Email/password provider enabled</assumption>
  </assumptions>
</requirements>
```

### 4. `<implementation>` - Required
Technical implementation details.

```xml
<implementation>
  <tasks>
    <task id="T-1" status="pending" relatedAC="AC-1,AC-2">
      <description>Create login form component</description>
      <subtasks>
        <subtask id="T-1.1" status="complete">Add email input</subtask>
        <subtask id="T-1.2" status="in-progress">Add password input</subtask>
      </subtasks>
    </task>
  </tasks>

  <interfaces>
    <interface id="INT-1" type="REST">
      <endpoint>POST /api/auth/login</endpoint>
      <guards>None (public endpoint)</guards>
      <request>{ email: string, password: string }</request>
      <response>{ token: string, user: User }</response>
      <location>backend/src/auth/controllers/auth.controller.ts</location>
    </interface>
  </interfaces>

  <artifacts>
    <filesToCreate>
      <file>client/src/auth/LoginForm.tsx</file>
      <file>backend/src/auth/use-cases/LoginUseCase.ts</file>
    </filesToCreate>
    <filesToModify>
      <file>backend/src/auth/auth.module.ts</file>
    </filesToModify>
  </artifacts>

  <repoPaths>
    <path language="typescript">backend/src/auth/**/*.ts</path>
    <path language="typescript">client/src/auth/**/*.tsx</path>
  </repoPaths>
</implementation>
```

### 5. `<validation>` - Required
Validation results and constraints.

```xml
<validation>
  <results>
    <result validator="structural" score="100" weight="1.0" passed="true">
      <issues />
    </result>
    <result validator="behavioral" score="85" weight="1.5" passed="true">
      <issues>
        <issue severity="warning">
          <description>AC-3 not in Given/When/Then format</description>
          <suggestion>Reformat as: Given X, When Y, Then Z</suggestion>
        </issue>
      </issues>
    </result>
  </results>

  <constraints>
    <constraint id="CONST-1" type="architecture">
      <rule>Domain layer has no framework dependencies</rule>
      <enforced>true</enforced>
    </constraint>
    <constraint id="CONST-2" type="security">
      <rule>Passwords must be hashed with bcrypt</rule>
      <enforced>true</enforced>
    </constraint>
  </constraints>

  <questions>
    <question id="Q-1" answered="false">
      <text>Should we support OAuth providers (Google, GitHub)?</text>
      <options>
        <option value="yes">Yes, add OAuth support</option>
        <option value="no">No, email/password only for now</option>
      </options>
      <defaultAssumption>Will use email/password only if unanswered</defaultAssumption>
    </question>
  </questions>
</validation>
```

### 6. `<snapshots>` - Required
Lock to specific code/API versions.

```xml
<snapshots>
  <repositoryContext>
    <repository>owner/repo</repository>
    <branch>main</branch>
    <commit>abc123def456</commit>
    <isDefaultBranch>true</isDefaultBranch>
    <selectedAt>2026-02-01T10:00:00Z</selectedAt>
  </repositoryContext>

  <codeSnapshot>
    <commitSha>abc123def456</commitSha>
    <indexId>idx_xyz789</indexId>
    <capturedAt>2026-02-01T11:00:00Z</capturedAt>
  </codeSnapshot>

  <apiSnapshot>
    <specUrl>https://github.com/owner/repo/openapi.yaml</specUrl>
    <hash>sha256:a1b2c3...</hash>
    <version>1.2.0</version>
    <capturedAt>2026-02-01T11:00:00Z</capturedAt>
  </apiSnapshot>
</snapshots>
```

### 7. `<tracking>` - Required
Generation progress and estimates.

```xml
<tracking>
  <generationState>
    <currentStep>8</currentStep>
    <completedAt>2026-02-01T11:30:00Z</completedAt>
    <steps>
      <step id="1" status="complete" duration="2.3s">
        <title>Intent extraction</title>
        <details>Extracted user story and key requirements</details>
      </step>
      <!-- ... steps 2-8 ... -->
    </steps>
  </generationState>

  <estimate>
    <min>16</min>
    <max>24</max>
    <unit>hours</unit>
    <confidence>high</confidence>
    <drivers>
      <driver>5 tasks across backend and frontend</driver>
      <driver>Login form with validation</driver>
      <driver>Session management</driver>
    </drivers>
    <calculatedAt>2026-02-01T11:30:00Z</calculatedAt>
  </estimate>
</tracking>
```

### 8. `<export>` - Optional
Only present when status = 'created'.

```xml
<export>
  <externalIssue>
    <platform>jira</platform>
    <issueId>PROJ-123</issueId>
    <issueKey>PROJ-123</issueKey>
    <issueUrl>https://jira.company.com/browse/PROJ-123</issueUrl>
    <exportedAt>2026-02-01T12:00:00Z</exportedAt>
    <exportedBy>user_uid_abc123</exportedBy>
  </externalIssue>

  <appendices>
    <devAppendix><![CDATA[
## Dev Context
- **Affected Modules:** backend/src/auth, client/src/auth
- **Code Snapshot:** abc123def456
- **Estimate:** 16-24 hours (high confidence)
    ]]></devAppendix>

    <qaAppendix><![CDATA[
## QA Verification
- **Readiness Score:** 90/100 (Ready)
- **Validation:** All validators passed
- **Test Focus:** Login flow, session expiration, error handling
    ]]></qaAppendix>
  </appendices>
</export>
```

---

## Enum Values Reference

```
Status:         draft | validated | ready | created | drifted
TicketType:     feature | bug | task
Priority:       critical | high | medium | low
TaskStatus:     pending | in-progress | complete | blocked
InterfaceType:  REST | GraphQL | Webhook | Repository | Service
Validator:      structural | behavioral | testability | risk | permissions
Severity:       error | warning | info
Constraint:     architecture | security | performance | accessibility | testing
StepStatus:     pending | in-progress | complete | failed
EstimateUnit:   hours | days | weeks | story-points
Confidence:     low | medium | high
Platform:       jira | linear | github
```

---

## Validation Rules

- `title`: 3-500 characters
- `readinessScore`: 0-100
- `questions`: max 3
- `currentStep`: 0-8
- `weight`: 0.0-10.0
- All timestamps: ISO 8601 format
- CDATA: Use for multiline text (description, appendices)

---

## Complete Documentation

- **Full Spec:** `docs/aec-xml-specification.md`
- **XSD Schema:** `docs/schemas/aec-v1.xsd`
- **Implementation:** `docs/epics.md` (Story 2.5)
- **Architecture:** `docs/architecture.md` (Data Architecture)
