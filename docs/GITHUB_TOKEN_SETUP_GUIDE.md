# GitHub Token Setup & Integration Testing Guide

**Status:** Ready to test end-to-end
**Date:** 2026-02-05

---

## ✅ Step-by-Step Setup

### Step 1: Add Token to Environment
```bash
cd backend

# Option A: Direct edit (recommended)
# Open .env in your editor and add this line:
GITHUB_TOKEN=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

# Option B: Command line
echo "GITHUB_TOKEN=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" >> .env
```

**Verify it was added:**
```bash
grep "GITHUB_TOKEN" .env
# Should output: GITHUB_TOKEN=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
```

### Step 2: Start Backend Server
```bash
cd backend
npm run dev

# Expected output:
# ✓ Compiled successfully
# [Nest] 12345   - 02/05/2026, 2:30:00 PM     LOG [NestFactory] Nest application successfully started +123ms
# Server running on http://localhost:3000
```

Wait for "Server running on http://localhost:3000" message.

### Step 3: Run GitHub Integration Tests

#### Quick Test (1 minute)
```bash
bash /tmp/test-github-integration.sh

# Expected output:
# 1️⃣  Creating ticket with GitHub context...
# ✅ Ticket created: abc123...
#
# 2️⃣  Checking if GitHub code was read...
# 3️⃣  Starting question round (calls GitHub)...
# ✅ Generated 3 questions
#
# 4️⃣  Sample questions (should mention React, webpack, etc):
# [questions about React architecture]
#
# ✅ GitHub integration test complete!
```

#### Manual Test (detailed verification)
```bash
# 1. Create ticket with real GitHub repo
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add authentication to React app",
    "description": "Implement OAuth2 login with Google",
    "repositoryFullName": "facebook/react",
    "branchName": "main"
  }'

# Copy the ticket ID from response
# Example: "id": "ticket_abc123def456"

# 2. Start first question round
TICKET_ID="ticket_abc123def456"  # Replace with actual ID

curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/start-round \
  -H "Content-Type: application/json" \
  -d '{"roundNumber": 1}'

# 3. Examine the response - look for:
# ✅ questions array with length > 0
# ✅ Questions mention "React" or "webpack" or actual framework names
# ✅ codebaseContext shows detected stack (not "unknown")
```

---

## 🔍 What to Look For (Success Indicators)

### ✅ GitHub Service Working
Look in terminal output for:
```
🎯 [StartQuestionRoundUseCase] Analyzing repository: facebook/react
🎯 [StartQuestionRoundUseCase] Fetching repository tree...
🎯 [StartQuestionRoundUseCase] Read package.json
🎯 [StartQuestionRoundUseCase] Detecting technology stack...
🎯 [StartQuestionRoundUseCase] Analyzing codebase patterns...
🎯 [StartQuestionRoundUseCase] Context built successfully. Stack: React
```

### ✅ Code-Aware Questions
Questions should mention actual technology from the repo:
```
Sample questions for facebook/react:
- "What's your primary target: browser, Node.js, or both?"
- "Are you using TypeScript or plain JavaScript?"
- "Which React patterns are most important: hooks, class components, or both?"
- "Do you need SSR (Server-Side Rendering) capability?"
```

### ❌ Stub Data (GitHub Not Working)
If you see these, GitHub integration failed:
```
Questions mention generic things:
- "What's your primary programming language?"
- "Tell us about your team size"
- No mention of React, webpack, or actual stack

Check logs for:
❌ "No repository context available, using minimal context"
❌ "Error building codebase context: GitHubAuthError"
```

---

## 🧪 Verification Checklist

Run through these tests in order:

### Test 1: Token Configuration ✅
```bash
grep "GITHUB_TOKEN" backend/.env
# ✅ Should output the token
```

### Test 2: Backend Starts ✅
```bash
cd backend && npm run dev
# ✅ Should see "Server running on http://localhost:3000"
# ✅ No errors in console
```

### Test 3: Create Ticket ✅
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title": "Test ticket", "description": "Testing GitHub integration"}'

# ✅ Should return 200 with ticket ID
```

### Test 4: Start Question Round ✅
```bash
curl -X POST http://localhost:3000/api/tickets/{TICKET_ID}/start-round \
  -H "Content-Type: application/json" \
  -d '{"roundNumber": 1}'

# ✅ Should return 200 with questions
# ✅ Check logs for GitHub API calls
```

### Test 5: Code-Aware Questions ✅
```bash
# Get ticket with real GitHub repo
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryFullName": "facebook/react",
    "branchName": "main"
  }'

# Start round and verify questions mention React/webpack
curl -X POST http://localhost:3000/api/tickets/{ID}/start-round \
  -H "Content-Type: application/json" \
  -d '{"roundNumber": 1}' | jq '.currentRound.questions[0].question'

# ✅ Should mention framework-specific details
```

### Test 6: Answer & Continue ✅
```bash
# Submit answers to get next round
curl -X POST http://localhost:3000/api/tickets/{ID}/submit-answers \
  -H "Content-Type: application/json" \
  -d '{
    "roundNumber": 1,
    "answers": {
      "question_1": "React with TypeScript",
      "question_2": "Hooks and Functional Components"
    }
  }'

# ✅ Should return nextAction: "continue" or "finalize"
```

---

## 🚨 Troubleshooting

### Issue: "No GitHub code context, using minimal context"
```
Cause: GITHUB_TOKEN not set or invalid
Fix:
1. Check .env has GITHUB_TOKEN=ghp_...
2. Verify token is valid at https://github.com/settings/tokens
3. Restart backend (npm run dev)
4. Try again
```

### Issue: "API rate limit exceeded"
```
Cause: Made too many GitHub requests (60/hour for unauthenticated)
Fix:
1. Wait 1 hour
2. Or use a different token
3. Or test with smaller repos first
```

### Issue: Questions don't mention actual stack
```
Cause: GitHub service failed silently, using stub data
Fix:
1. Check terminal for error logs
2. Verify repository exists and is public
3. Try with facebook/react (guaranteed public)
4. Check GITHUB_TOKEN in .env
```

### Issue: "Cannot read package.json"
```
Cause: Repository doesn't have package.json at root
Fix:
1. Try with facebook/react (has package.json)
2. Or specify different repo: node/node, golang/go, etc.
```

---

## 📊 Expected Results

### With GitHub Integration Working
```
Ticket: "Add authentication to React app"
Repository: facebook/react (main branch)

Questions Generated:
1. "Your React app primarily targets: browser, server, or both?"
   Type: radio
   Detected from: codebase uses both client & server code

2. "Using TypeScript or JavaScript?"
   Type: radio
   Detected from: package.json has typescript

3. "Which auth pattern: session, JWT, or OAuth?"
   Type: radio
   Detected from: existing React patterns in codebase

Stack Detected:
- Framework: React
- Language: JavaScript (TypeScript support)
- Package Manager: npm
- Build tool: webpack/babel
- Testing: Jest
```

### Without GitHub Integration (stub data)
```
Ticket: "Add authentication to React app"
Repository: facebook/react (main branch)

Questions Generated:
1. "What's your team size?"
2. "Tell us about your architecture"
3. "What's your primary language?"

Stack Detected:
- Framework: unknown
- Language: unknown
- Package Manager: npm (default)
- Build tool: unknown
```

---

## 📝 Quick Reference

| Command | Purpose |
|---------|---------|
| `echo "GITHUB_TOKEN=ghp_..." >> backend/.env` | Add token |
| `grep GITHUB_TOKEN backend/.env` | Verify token set |
| `cd backend && npm run dev` | Start backend |
| `bash /tmp/test-github-integration.sh` | Run tests |
| `curl -X POST http://localhost:3000/api/tickets ...` | Create ticket |
| `curl http://localhost:3000/api/tickets/{id}` | Get ticket details |

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ Backend starts without errors
2. ✅ `grep GITHUB_TOKEN backend/.env` shows the token
3. ✅ Create ticket with `repositoryFullName: "facebook/react"`
4. ✅ Question round generates 3+ questions
5. ✅ Questions mention "React", "webpack", "TypeScript", or similar
6. ✅ Terminal shows logs like "Analyzing repository: facebook/react"
7. ✅ Questions are different from stub data (not generic)

**If all 7 pass: GitHub integration is working! 🎉**

---

## Next Steps (After Testing)

1. **Test with your own repos** (if public)
2. **Answer questions** and move through rounds
3. **Check final spec** for quality score
4. **Commit test results** with documentation

---

## Documentation Location

- Setup Guide: `docs/GITHUB_TOKEN_SETUP_GUIDE.md` (this file)
- Status Report: `docs/GITHUB_INTEGRATION_STATUS.md`
- Test Script: `/tmp/test-github-integration.sh`
- Frontend Integration: `docs/FRONTEND_INTEGRATION_COMPLETE.md`
