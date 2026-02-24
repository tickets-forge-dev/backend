---
id: getting-started
title: Getting Started
description: Set up Forge locally and run the monorepo services.
---

## Prerequisites
- Node.js 20+
- pnpm 8+
- Redis running locally (required for the backend job queue)
- A Firebase project for authentication, Firestore, and storage

## Install dependencies
From the repo root:

```bash
pnpm install
```

## Configure environment variables
1. Copy client env: `cp client/.env.example client/.env.local` and fill with your Firebase web app values.
2. Copy backend env: `cp backend/.env.example backend/.env` and fill with your Firebase service account values.

## Run the apps
- All apps: `pnpm dev`
- Frontend only: `cd client && pnpm dev` (http://localhost:3001)
- Backend only: `cd backend && pnpm dev` (http://localhost:3000/api)

## Run the docs
The docs live in `docs/website`:

```bash
pnpm --filter forge-docs start
```

The site runs at http://localhost:3030. Build the static site with:

```bash
pnpm --filter forge-docs build
```
