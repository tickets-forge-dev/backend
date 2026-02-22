---
id: what-is-forge
title: What is Forge
description: Learn the product intent and principles behind Forge.
---

Forge is a system that converts minimal product intent into validated, code-aware tickets ready for execution. It keeps teams aligned with architecture rules so backend, frontend, and shared packages stay consistent as the product evolves.

## Why it exists
- Reduce handoffs by capturing intent once and generating actionable tickets.
- Keep implementation aligned with Clean Architecture (backend) and state-driven UI (frontend).
- Provide fast feedback loops so teams can ship safely.

## How it is built
- **Frontend:** Next.js 15 (App Router), React 18, Tailwind, Zustand for state, with UI logic kept out of components.
- **Backend:** NestJS 10 with Clean Architecture boundaries (presentation → application → domain ← infrastructure).
- **Shared:** TypeScript packages for schemas and configs to avoid drift between services.

## Where to go next
- Follow the [Getting Started](/getting-started) guide to run the apps locally.
- Check the repository README for deeper setup and architecture details.
