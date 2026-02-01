# Story 4.1 Enhancement: Branch Selection & Default Detection

## Problem Statement

When creating tickets, the PM must specify which branch to analyze:
- Different branches have different code states
- Default branch varies by repository (main, master, develop, etc.)
- Teams may want to validate against specific branches

## Requirements

### R1: Automatic Default Branch Detection
System must:
1. Query GitHub API for repository's default branch
2. Cache default branch per repository
3. Auto-select default branch when creating ticket
4. Show clear indication of which branch is selected

### R2: Manual Branch Selection
PM must be able to:
1. See list of available branches
2. Switch between branches before generating ticket
3. Search branches (for repos with many branches)
4. See branch metadata (last commit, author, date)

### R3: Branch Context in AEC
AEC must store:
1. Selected branch name
2. Branch HEAD commit SHA at time of generation
3. Repository full name (owner/repo)
4. This enables drift detection later

---

## UI/UX Design

### Ticket Creation Form - Enhanced

```
┌─────────────────────────────────────────────────┐
│ Create Ticket                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Title *                                         │
│ ┌─────────────────────────────────────────────┐│
│ │ Add user authentication                     ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Description (optional)                          │
│ ┌─────────────────────────────────────────────┐│
│ │ Users should be able to log in...          ││
│ │                                             ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Repository & Branch *                           │
│ ┌─────────────────────────────────────────────┐│
│ │ owner/repo-name                  [Connected]││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Branch: main ▼                 (default)    ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [Cancel]                      [Generate Ticket]│
└─────────────────────────────────────────────────┘
```

### Branch Selector Dropdown

```
┌─────────────────────────────────────────────────┐
│ Branch: main ▼                       (default)  │
└─────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ 🔍 Search branches...                           │
├─────────────────────────────────────────────────┤
│ ⭐ main (default)                               │
│    Last commit: 2 hours ago by @alice           │
│    💚 All checks passing                         │
│                                                 │
│ develop                                         │
│    Last commit: 5 minutes ago by @bob           │
│    🟡 2 checks pending                           │
│                                                 │
│ feature/auth-refactor                           │
│    Last commit: 1 day ago by @alice             │
│    ❌ 1 check failed                             │
│                                                 │
│ release/v2.0                                    │
│    Last commit: 3 days ago by @charlie          │
│    💚 All checks passing                         │
│                                                 │
│ [Show 12 more branches...]                      │
└─────────────────────────────────────────────────┘
```

### Mobile/Compact View

```
┌─────────────────────────┐
│ Repository              │
│ owner/repo-name   [✓]   │
│                         │
│ Branch                  │
│ main (default)    [▼]   │
│                         │
│ [Generate Ticket]       │
└─────────────────────────┘
```

---

## Technical Implementation

### 1. GitHub API Integration

**Fetch Default Branch:**
```typescript
// GET /repos/{owner}/{repo}
interface GitHubRepository {
  default_branch: string; // "main", "master", "develop", etc.
  name: string;
  full_name: string;
  // ... other fields
}
```

**Fetch Branches:**
```typescript
// GET /repos/{owner}/{repo}/branches
interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}
```

**Fetch Branch Details:**
```typescript
// GET /repos/{owner}/{repo}/commits/{branch}
interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; date: string };
    message: string;
  };
}

// GET /repos/{owner}/{repo}/commits/{sha}/status
interface GitHubStatus {
  state: 'success' | 'pending' | 'failure';
  statuses: Array<{
    context: string;
    state: string;
    description: string;
  }>;
}
```

### 2. Backend Schema Updates

**AEC Domain Model Enhancement:**
```typescript
interface AEC {
  // ... existing fields
  
  // NEW: Repository context
  repositoryContext: RepositoryContext;
}

interface RepositoryContext {
  repositoryFullName: string; // "owner/repo"
  branchName: string;         // "main"
  commitSha: string;          // "abc123..."
  isDefaultBranch: boolean;   // true/false
  selectedAt: Date;           // When user selected this branch
}
```

**Firestore Structure:**
```
workspaces/{workspaceId}/aecs/{aecId}
  {
    ...existing fields,
    repositoryContext: {
      repositoryFullName: "myorg/myrepo",
      branchName: "main",
      commitSha: "abc123def456...",
      isDefaultBranch: true,
      selectedAt: "2026-02-01T05:52:00Z"
    }
  }
```

### 3. API Endpoints

**New Endpoint: Get Repository Info**
```typescript
GET /api/github/repos/:owner/:repo

Response:
{
  fullName: "owner/repo",
  defaultBranch: "main",
  branches: [
    {
      name: "main",
      isDefault: true,
      lastCommit: {
        sha: "abc123",
        author: "alice",
        date: "2026-02-01T03:00:00Z",
        message: "Fix auth bug"
      },
      checksStatus: "success"
    },
    // ... more branches
  ]
}
```

**Enhanced Create Ticket Endpoint:**
```typescript
POST /api/tickets

Body:
{
  title: "Add auth",
  description: "...",
  repositoryFullName: "owner/repo",  // NEW
  branchName: "main"                 // NEW
}

Response:
{
  id: "aec_...",
  repositoryContext: {
    repositoryFullName: "owner/repo",
    branchName: "main",
    commitSha: "abc123...",
    isDefaultBranch: true,
    selectedAt: "2026-02-01T05:52:00Z"
  },
  // ... other fields
}
```

### 4. Frontend Implementation

**Repository Service:**
```typescript
// client/src/services/github.service.ts
export class GitHubService {
  async getRepository(owner: string, repo: string) {
    const response = await this.client.get(
      `/github/repos/${owner}/${repo}`
    );
    return response.data;
  }

  async getBranches(owner: string, repo: string) {
    const response = await this.client.get(
      `/github/repos/${owner}/${repo}/branches`
    );
    return response.data;
  }
}
```

**Zustand Store Enhancement:**
```typescript
// client/src/stores/tickets.store.ts
interface TicketsState {
  // ... existing fields
  
  // NEW: Repository state
  selectedRepository: string | null; // "owner/repo"
  selectedBranch: string | null;     // "main"
  availableBranches: Branch[];
  defaultBranch: string | null;
  
  // NEW: Actions
  setRepository: (fullName: string) => Promise<void>;
  setBranch: (branchName: string) => void;
  loadBranches: () => Promise<void>;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  // ... existing state
  
  selectedRepository: null,
  selectedBranch: null,
  availableBranches: [],
  defaultBranch: null,
  
  setRepository: async (fullName: string) => {
    set({ selectedRepository: fullName });
    
    const { githubService } = useServices();
    const repoData = await githubService.getRepository(
      ...fullName.split('/')
    );
    
    set({
      defaultBranch: repoData.defaultBranch,
      selectedBranch: repoData.defaultBranch, // Auto-select default
      availableBranches: repoData.branches
    });
  },
  
  setBranch: (branchName: string) => {
    set({ selectedBranch: branchName });
  },
  
  loadBranches: async () => {
    const { selectedRepository } = get();
    if (!selectedRepository) return;
    
    const { githubService } = useServices();
    const branches = await githubService.getBranches(
      ...selectedRepository.split('/')
    );
    
    set({ availableBranches: branches });
  }
}));
```

**Branch Selector Component:**
```typescript
// client/src/tickets/components/BranchSelector.tsx
export function BranchSelector() {
  const {
    selectedBranch,
    availableBranches,
    defaultBranch,
    setBranch
  } = useTicketsStore();
  
  return (
    <Select
      value={selectedBranch || ''}
      onValueChange={setBranch}
    >
      <SelectTrigger>
        <SelectValue>
          {selectedBranch}
          {selectedBranch === defaultBranch && (
            <span className="text-[var(--text-tertiary)]"> (default)</span>
          )}
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent>
        {availableBranches.map(branch => (
          <SelectItem key={branch.name} value={branch.name}>
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                {branch.isDefault && '⭐'}
                {branch.name}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                {formatRelativeTime(branch.lastCommit.date)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## Default Branch Detection Logic

### Strategy 1: GitHub API (Preferred)
```typescript
async getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const response = await octokit.rest.repos.get({ owner, repo });
    return response.data.default_branch; // "main", "master", etc.
  } catch (error) {
    // Fallback to common defaults
    return this.guessDefaultBranch(owner, repo);
  }
}
```

### Strategy 2: Fallback Detection
```typescript
async guessDefaultBranch(owner: string, repo: string): Promise<string> {
  const commonDefaults = ['main', 'master', 'develop', 'trunk'];
  
  for (const branch of commonDefaults) {
    const exists = await this.branchExists(owner, repo, branch);
    if (exists) return branch;
  }
  
  // Last resort: get first branch from list
  const branches = await this.listBranches(owner, repo);
  return branches[0]?.name || 'main';
}
```

### Strategy 3: Cache Default Branch
```typescript
// Cache in Firestore to avoid repeated API calls
interface WorkspaceRepository {
  workspaceId: string;
  repositoryFullName: string;
  defaultBranch: string;
  lastChecked: Date;
  cacheExpiresAt: Date; // Refresh after 24 hours
}
```

---

## Edge Cases & Solutions

### Edge Case 1: User Doesn't Have GitHub Connected
```
┌─────────────────────────────────────────────────┐
│ Repository & Branch                             │
│ ┌─────────────────────────────────────────────┐│
│ │ ⚠️  No GitHub account connected              ││
│ │                                             ││
│ │ [Connect GitHub Account]                    ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Edge Case 2: No Repository Selected Yet
```
┌─────────────────────────────────────────────────┐
│ Repository & Branch                             │
│ ┌─────────────────────────────────────────────┐│
│ │ [Select Repository...]                      ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Branch: (Select repo first)                 ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Edge Case 3: Repository Deleted/Access Revoked
```
┌─────────────────────────────────────────────────┐
│ ❌ Repository not accessible                    │
│                                                 │
│ owner/deleted-repo                              │
│                                                 │
│ Possible reasons:                               │
│ • Repository deleted                            │
│ • Access revoked                                │
│ • GitHub token expired                          │
│                                                 │
│ [Reconnect GitHub] [Select Different Repo]      │
└─────────────────────────────────────────────────┘
```

### Edge Case 4: Empty Repository (No Branches)
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Empty Repository                            │
│                                                 │
│ This repository has no branches yet.            │
│ Initialize the repository first.                │
│                                                 │
│ [View on GitHub] [Select Different Repo]        │
└─────────────────────────────────────────────────┘
```

### Edge Case 5: Branch Deleted After Selection
```
During generation:
⚠️ Warning: Branch "feature/old-work" no longer exists
   Using latest commit SHA for analysis
   
After generation:
🔴 This ticket was created from a deleted branch
   Branch: feature/old-work (deleted)
   Commit: abc123 (still accessible)
```

---

## Validation Rules

### Frontend Validation
```typescript
const validateTicketForm = (form: TicketForm) => {
  const errors = [];
  
  if (!form.title || form.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!form.repositoryFullName) {
    errors.push('Repository must be selected');
  }
  
  if (!form.branchName) {
    errors.push('Branch must be selected');
  }
  
  return errors;
};
```

### Backend Validation
```typescript
class CreateTicketUseCase {
  async execute(command: CreateTicketCommand): Promise<AEC> {
    // Validate repository exists and is accessible
    const repoExists = await this.githubService.verifyRepositoryAccess(
      command.repositoryFullName
    );
    
    if (!repoExists) {
      throw new RepositoryNotAccessibleError(command.repositoryFullName);
    }
    
    // Validate branch exists
    const branchExists = await this.githubService.verifyBranchExists(
      command.repositoryFullName,
      command.branchName
    );
    
    if (!branchExists) {
      throw new BranchNotFoundError(command.branchName);
    }
    
    // Get current commit SHA for the branch
    const commitSha = await this.githubService.getBranchHead(
      command.repositoryFullName,
      command.branchName
    );
    
    // Create AEC with repository context
    const aec = AEC.createDraft(
      command.workspaceId,
      command.title,
      command.description,
      {
        repositoryFullName: command.repositoryFullName,
        branchName: command.branchName,
        commitSha,
        isDefaultBranch: command.branchName === defaultBranch,
        selectedAt: new Date()
      }
    );
    
    // ... rest of creation logic
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('BranchSelector', () => {
  it('auto-selects default branch', async () => {
    // Given: Repository with "main" as default
    const repo = { defaultBranch: 'main', branches: [...] };
    
    // When: Repository selected
    await store.setRepository('owner/repo');
    
    // Then: Default branch auto-selected
    expect(store.selectedBranch).toBe('main');
  });
  
  it('handles custom default branch', async () => {
    // Given: Repository with "develop" as default
    const repo = { defaultBranch: 'develop', branches: [...] };
    
    // When: Repository selected
    await store.setRepository('owner/repo');
    
    // Then: "develop" auto-selected
    expect(store.selectedBranch).toBe('develop');
  });
});
```

### Integration Tests
```typescript
describe('Ticket Creation with Branch', () => {
  it('creates ticket with selected branch context', async () => {
    // Given: User selects non-default branch
    await createTicket({
      title: 'Test',
      repositoryFullName: 'owner/repo',
      branchName: 'feature/new-thing'
    });
    
    // Then: AEC stores branch context
    const aec = await getTicket(aecId);
    expect(aec.repositoryContext.branchName).toBe('feature/new-thing');
    expect(aec.repositoryContext.isDefaultBranch).toBe(false);
  });
});
```

---

## Implementation Checklist

### Phase 1: Basic Branch Support (2 days)
- [ ] Add repositoryContext to AEC domain model
- [ ] Update Firestore schema
- [ ] Add GitHub API client for branches
- [ ] Create BranchSelector component
- [ ] Update CreateTicketForm with branch selection
- [ ] Backend validation for branch existence

### Phase 2: Enhanced UX (1 day)
- [ ] Branch search/filter
- [ ] Show last commit info
- [ ] Cache default branch per repo
- [ ] Loading states
- [ ] Error handling

### Phase 3: Polish (1 day)
- [ ] Branch status indicators (CI checks)
- [ ] Keyboard navigation
- [ ] Mobile responsive
- [ ] Accessibility (ARIA)
- [ ] Tests

---

## Success Metrics

**Usability:**
- 95% of users stick with default branch
- 5% switch branches before generation
- 0 errors from deleted/invalid branches

**Technical:**
- API response time <500ms
- Cache hit rate >80% for default branches
- Zero tickets created without branch context

---

## Future Enhancements

### Multi-Branch Compare (v2)
```
Compare changes across branches:
- main vs develop
- feature/x vs main
- release/v1 vs release/v2
```

### Branch-Specific Validation (v2)
```
Validation rules that vary by branch:
- Stricter on main/master
- Relaxed on feature branches
- Release branches require QA sign-off
```

### Auto-Branch Selection (v2)
```
Smart defaults based on context:
- Bug tickets → main
- Feature tickets → develop
- Release tickets → release/x.y
```

---

**Status**: ✅ Ready for Implementation  
**Priority**: Critical (Blocks Epic 4)  
**Risk**: Low (Well-defined APIs)
