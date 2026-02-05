# Iterative Ticket Creation - cURL Test Guide

This guide demonstrates the full iterative 3-round question refinement workflow using cURL commands.

## Prerequisites

You'll need a valid Firebase ID token. Here are your options:

### Option 1: Get a Test Token from Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication > Users
4. Create a test user or use an existing one
5. Click on the user and copy the UID
6. Use Firebase SDK to generate a token (see Option 2)

### Option 2: Generate Token with Firebase Admin SDK
```bash
# Install Firebase Admin SDK
npm install -g firebase-admin

# Create a test token script
cat > generate-test-token.js << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().createCustomToken('test-user-123')
  .then(token => {
    console.log('Test token:', token);
  })
  .catch(error => console.log('Error creating custom token:', error));
EOF

node generate-test-token.js
```

### Option 3: Disable Auth for Development (Not Recommended for Production)
Edit `backend/src/tickets/presentation/controllers/tickets.controller.ts`:
```typescript
// Temporarily remove @UseGuards for testing
@Controller('tickets')
// @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class TicketsController {
```

## Full Workflow - cURL Commands

### Configuration
```bash
API_BASE="http://localhost:3000/api"
AUTH_TOKEN="Bearer YOUR_FIREBASE_ID_TOKEN_HERE"
WORKSPACE_ID="workspace-123"
```

### Step 1: Create Draft Ticket
```bash
curl -X POST "$API_BASE/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "title": "Add real-time notifications to dashboard",
    "description": "Users should receive real-time updates when team members make changes",
    "repositoryContext": {
      "owner": "anthropics",
      "name": "claude-code",
      "branch": "main"
    }
  }' | jq '.'
```

**Expected Response:**
```json
{
  "id": "aec-uuid-here",
  "title": "Add real-time notifications to dashboard",
  "status": "draft",
  "questionRounds": [],
  "currentRound": 0,
  "techSpec": null
}
```

**Extract for next steps:**
```bash
TICKET_ID=$(previous_response | jq -r '.id')
```

### Step 2: Start Question Round 1
```bash
curl -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 1
  }' | jq '.questionRounds[0].questions'
```

**Expected Response:**
```json
[
  {
    "id": "q1-uuid",
    "text": "What real-time technology are you considering?",
    "type": "select",
    "options": [
      { "label": "WebSocket", "value": "websocket" },
      { "label": "Server-Sent Events", "value": "sse" },
      { "label": "Long Polling", "value": "polling" }
    ],
    "context": "Critical for performance and scalability",
    "impact": "Affects infrastructure design and message queue choice"
  },
  ...more questions...
]
```

### Step 3: Submit Round 1 Answers
```bash
curl -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 1,
    "answers": {
      "q1-uuid": "websocket",
      "q2-uuid": "dashboard-notifications",
      "q3-uuid": "jwt"
    }
  }' | jq '.'
```

**Expected Response:**
```json
{
  "aec": {
    "id": "aec-uuid",
    "status": "in-question-round-1",
    "questionRounds": [
      {
        "roundNumber": 1,
        "questions": [...],
        "answers": {
          "q1-uuid": "websocket",
          "q2-uuid": "dashboard-notifications",
          "q3-uuid": "jwt"
        },
        "answeredAt": "2026-02-05T..."
      }
    ]
  },
  "nextAction": "continue-asking"
}
```

### Step 4: Start Question Round 2 (if nextAction = "continue-asking")
```bash
curl -X POST "$API_BASE/tickets/$TICKET_ID/start-round" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 2
  }' | jq '.questionRounds[1].questions'
```

Questions in Round 2 will be more targeted based on Round 1 answers.

### Step 5: Submit Round 2 Answers
```bash
curl -X POST "$API_BASE/tickets/$TICKET_ID/submit-answers" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{
    "roundNumber": 2,
    "answers": {
      "q4-uuid": "redis",
      "q5-uuid": "rabbitmq",
      "q6-uuid": "horizontal-scaling"
    }
  }' | jq '.nextAction'
```

### Step 6: Optional Round 3 (if nextAction = "continue-asking")
Repeat Steps 4-5 with `roundNumber: 3`

### Step 7: Finalize Technical Specification
```bash
curl -X POST "$API_BASE/tickets/$TICKET_ID/finalize" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{}' | jq '.techSpec | {problemStatement, acceptanceCriteria: (.acceptanceCriteria | length), fileChanges: (.fileChanges | length)}'
```

**Expected Response:**
```json
{
  "problemStatement": "Implement real-time notification system for dashboard using WebSocket...",
  "acceptanceCriteria": 8,
  "fileChanges": 12
}
```

### Step 8: Retrieve Final Ticket State
```bash
curl -X GET "$API_BASE/tickets/$TICKET_ID" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" | jq '{status, rounds: (.questionRounds | length), currentRound, hasSpec: (.techSpec != null)}'
```

**Expected Response:**
```json
{
  "status": "ready",
  "rounds": 2,
  "currentRound": 2,
  "hasSpec": true
}
```

---

## Quick Test: Skip to Finalize (Manual Override)

Skip remaining rounds and go directly to finalization:

```bash
curl -X POST "$API_BASE/tickets/$TICKET_ID/skip-to-finalize" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" \
  -d '{}' | jq '.status'
```

Expected: `"questions-complete"`

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid data) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Ticket not found |
| 409 | Invalid state transition (e.g., answering Round 1 before it starts) |
| 500 | Server error (LLM failure, etc.) |

---

## Environment Variables for Easy Testing

Create a `.env.test` file:
```bash
API_BASE="http://localhost:3000/api"
FIREBASE_ID_TOKEN="your-token-here"
WORKSPACE_ID="workspace-test-123"

# Export for use in scripts
export API_BASE FIREBASE_ID_TOKEN WORKSPACE_ID
```

Then use in scripts:
```bash
source .env.test
curl -X POST "$API_BASE/tickets" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  ...
```

---

## Debugging

### View all questions in a round
```bash
curl -X GET "$API_BASE/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" | jq '.questionRounds[] | {round: .roundNumber, questions: (.questions | length), answered: (.answers | length)}'
```

### Check current round status
```bash
curl -X GET "$API_BASE/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" | jq '{currentRound, status, rounds: (.questionRounds | length)}'
```

### View generated spec
```bash
curl -X GET "$API_BASE/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Workspace-Id: $WORKSPACE_ID" | jq '.techSpec'
```

---

## Common Issues

### "Invalid token format"
- Ensure token is a valid Firebase ID token
- Check token hasn't expired (`iss` claim should match Firebase project)
- Verify header format: `Authorization: Bearer <token>`

### "No authorization token provided"
- Add `-H "Authorization: Bearer $AUTH_TOKEN"` to curl command
- Ensure `$AUTH_TOKEN` contains a valid token

### "Invalid state transition"
- Rounds must be answered sequentially (1 → 2 → 3)
- Can't start Round 2 until Round 1 is answered
- Max 3 rounds (Round 3 is final)

### "Questions not generated"
- Check backend logs for LLM errors
- Verify codebase context is valid (owner/repo/branch exist on GitHub)
- GitHub rate limiting might affect codebase analysis

---

## Next Steps

Once you have the technical specification generated:

1. **Validate** - Run validation suite
2. **Review** - Stakeholders review specification
3. **Create Ticket** - Convert to actual GitHub issue
4. **Assign** - Assign to developer team

See `/docs/workflows/ticket-creation.md` for full workflow details.
