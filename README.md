# Forge

Transform minimal product intent into validated, code-aware, execution-ready tickets for Jira and Linear.

**Product Name:** Forge (formerly "Executable Tickets" in planning docs)

## Project Structure

**Forge** is a Turborepo monorepo containing:

```
forge/
├── backend/             # NestJS 10 backend (port 3000)
├── client/              # Next.js 15 frontend (port 3001)
├── packages/
│   ├── shared-types/    # Shared TypeScript types and Zod schemas
│   ├── typescript-config/
│   └── eslint-config/
└── docs/                # Product requirements, architecture, UX specs
```

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zustand
- **Backend:** NestJS 10, TypeScript, Clean Architecture
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **Queue:** Bull (Redis-backed)
- **AI:** Vercel AI SDK + Anthropic Claude
- **Monorepo:** Turborepo + pnpm

## Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later
- Firebase project (create at https://console.firebase.google.com)
- Redis (for background jobs)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

**Client (.env.local):**
```bash
cp client/.env.example client/.env.local
```

Edit `client/.env.local` with your Firebase web app config values.

**Backend (.env):**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your Firebase service account credentials.

### 3. Start Redis (Required for Backend)

**Using Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Using Homebrew (Mac):**
```bash
brew install redis
redis-server
```

### 4. Start Development Servers

```bash
# Start all apps (from monorepo root)
pnpm dev

# Or start individually:
cd client && pnpm dev    # Frontend on http://localhost:3001
cd backend && pnpm dev   # Backend on http://localhost:3000
```

### Docs Site (Docusaurus)

```
pnpm --filter forge-docs start   # Runs at http://localhost:3030
pnpm --filter forge-docs build   # Generates static site in docs/website/build
```

### 5. Verify Setup

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000/api
- **API Docs:** http://localhost:3000/api/docs (Swagger UI)

### 6. Validate Configuration (Optional but Recommended)

Run the setup validation script to check your configuration:

```bash
cd client
npm run validate-setup
```

This will verify:
- Environment variables are set correctly
- Backend is reachable
- Firebase configuration is complete
- PostHog API key format (if provided)

## Troubleshooting

If you encounter setup issues, see the [Setup Troubleshooting Guide](docs/SETUP-TROUBLESHOOTING.md) for:
- Common error messages and fixes
- Firebase configuration issues
- PostHog API key format errors
- Backend connectivity problems
- Environment variable setup

The app also includes a development health check banner that appears when configuration issues are detected.

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "executable-tickets" (or your preferred name)
4. Enable Google Analytics (optional)

### 2. Enable Firebase Services

**Authentication:**
1. Navigate to Authentication → Sign-in method
2. Enable "Google" provider
3. Enable "GitHub" provider
4. Add authorized domains

**Firestore Database:**
1. Navigate to Firestore Database
2. Create database (start in test mode for development)
3. Select region (us-central or your preferred region)

**Storage:**
1. Navigate to Storage
2. Get started (start in test mode for development)

### 3. Get Frontend Credentials

1. Project Settings → General
2. Scroll to "Your apps" → Add app → Web
3. Register app name: "Executable Tickets Client"
4. Copy config values to `apps/client/.env.local`:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### 4. Get Backend Credentials

1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Copy values to `apps/backend/.env`:
   - project_id → FIREBASE_PROJECT_ID
   - private_key → FIREBASE_PRIVATE_KEY
   - client_email → FIREBASE_CLIENT_EMAIL

## Architecture

This project follows **Clean Architecture** principles with **feature-based modules**:

### Backend Structure (NestJS)
```
src/
├── tickets/              # Feature module
│   ├── presentation/     # Controllers, DTOs
│   ├── application/      # Use cases, Services
│   ├── domain/           # Entities, Interfaces
│   └── infrastructure/   # Repositories, External APIs
├── indexing/             # Feature module
├── integrations/         # Feature module
└── shared/               # Cross-cutting concerns
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

**Key Principles:**
- Domain layer has NO framework dependencies
- Use cases are the only entry points for business logic
- Infrastructure implements ports defined in application/domain
- Presentation layer handles HTTP, validation, error mapping

### Frontend Structure (Next.js)
```
src/
├── app/                  # Next.js App Router pages
├── core/components/ui/   # shadcn/ui components
├── tickets/components/   # Feature components
├── stores/               # Zustand state management
├── services/             # API clients (useServices() pattern)
├── hooks/                # React hooks
└── lib/                  # Firebase, utilities
```

**Key Principles:**
- UI renders state and triggers actions only
- Business logic in Zustand store actions
- Services injected via useServices() hook
- No business logic in components or hooks

## Available Scripts

```bash
# Development
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps for production
pnpm test         # Run all tests
pnpm lint         # Lint all code
pnpm format       # Format all code with Prettier

# Individual apps
cd apps/client && pnpm dev     # Frontend only
cd apps/backend && pnpm dev    # Backend only
```

## Testing

```bash
# Run all tests
pnpm test

# Backend tests
cd apps/backend && pnpm test

# Frontend tests (configure in Story 1.2+)
cd apps/client && pnpm test
```

## Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Framework Preset: Next.js
   - Root Directory: `apps/client`
   - Build Command: `pnpm run build`
   - Output Directory: `.next`
3. Add environment variables from `.env.example`

### Backend (Google Cloud Run)

1. Build Docker image (Dockerfile will be added in Story 1.2+)
2. Deploy to Cloud Run:
```bash
gcloud run deploy executable-tickets-api \
  --source ./apps/backend \
  --region us-central1 \
  --allow-unauthenticated
```

3. Configure environment variables in Cloud Run console

## Documentation

- **PRD:** `/docs/Executable_Tickets_PRD_FULL.md`
- **Architecture:** `/docs/architecture.md`
- **UX Design:** `/docs/Executable_Tickets_UX_Design.md`
- **Epics:** `/docs/epics.md` (17 stories)
- **Sprint Status:** `/docs/sprint-artifacts/sprint-status.yaml`

## Project Standards (claude.md)

See `/CLAUDE.md` for development standards enforced for all AI agents and contributors.

## Support

For questions or issues, refer to the project documentation in `/docs` or contact the team.

---

**Current Status:** Story 1.1 complete - Foundation established
**Next Story:** Story 1.2 - Design System Setup (shadcn/ui + Linear minimalism)
