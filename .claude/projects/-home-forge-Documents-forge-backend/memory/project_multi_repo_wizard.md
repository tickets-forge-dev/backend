---
name: project_multi_repo_wizard
description: Multi-repo wizard creation flow — next implementation phase for feat/multi-repo branch
type: project
---

Multi-repo domain model is done (feat/multi-repo branch). Next phase: wizard creation flow.

**What's done:**
- Domain: `RepositoryEntry[]` on AEC, backward-compat `repositoryContext` getter
- Infrastructure: AECMapper lazy migration (old single → new array)
- API: `repositories[]` in ticket response, `?repo=` query param on session start
- Frontend: multi-repo chips in ticket header, repo picker in develop blade

**What's NOT done (wizard + creation):**
- `generation-wizard.store.ts` — needs `secondaryRepo: { owner, name, branch }` alongside primary
- `CodebaseStep.tsx` — needs "+ Add second repository" button (max 2), second RepositorySelector + BranchSelector
- `CreateTicketDto.ts` — needs `repositories[]` array field
- `CreateTicketUseCase.ts` — needs to build `RepositoryEntry[]` from input, validate both repos
- Spec generation — needs to analyze BOTH codebases, merge file changes across repos
- Questions — need to reference which repo each question/AC relates to

**Key constraint:** Max 2 repos per ticket.
