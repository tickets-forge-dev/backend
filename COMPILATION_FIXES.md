# Compilation Fixes - Epic 7.8

## Fixed Errors

### 1. GenerationOrchestrator.spec.ts - Missing Mocks
**Error**: Expected 5 arguments, but got 2
**Fix**: Added missing mock dependencies for `IndexQueryService`, `IndexRepository`, and `ValidationEngine`

```typescript
const mockIndexQueryService = {} as any;
const mockIndexRepository = {} as any;
const mockValidationEngine = {} as any;

orchestrator = new GenerationOrchestrator(
  mockAecRepository,
  mockLlmGenerator,
  mockIndexQueryService,
  mockIndexRepository,
  mockValidationEngine,
);
```

### 2. drift-detector.integration.spec.ts - Invalid RepositoryContext
**Error**: `repositoryId` does not exist in type 'RepositoryContext'
**Fix**: Removed invalid `repositoryId` and `installedAt` properties from test data

```typescript
{
  repositoryFullName: 'test/repo',
  branchName: 'main',
  commitSha: 'a'.repeat(40),
  isDefaultBranch: true,
  selectedAt: new Date(),
  // Removed: repositoryId, installedAt
}
```

## Remaining Issues

### Critical: Memory Heap Overflow

**Symptoms**:
- `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`
- Occurs during ticket creation when loading repository context
- Stack trace shows repetitive calls in file system operations

**Root Cause**:
The `MastraWorkspaceFactory` is attempting to create a `LocalFilesystem` workspace that loads the entire repository into memory. For large repositories (like this one), this exhausts the Node.js heap (even at 4GB).

**Current Implementation**:
```typescript
const filesystem = new LocalFilesystem({
  id: 'repo-fs',
  rootDir: repoPath, // Points to cloned repo
});
```

This tries to load all files from the cloned repository into memory.

**Solution Needed**:
Instead of using `LocalFilesystem` with a full repository clone, we should:

1. **Option A - GitHub API Integration** (Recommended)
   - Use Mastra's GitHub integration to access files on-demand
   - Only load files that are actually needed for validation
   - Leverage GitHub's API for file reads instead of filesystem

2. **Option B - Lazy Loading Filesystem**
   - Create a custom filesystem provider that only loads files when accessed
   - Implement streaming for large files
   - Add file size limits and filtering

3. **Option C - Minimal Context** (Quick Fix)
   - Only index and load specific files needed for validation
   - Use `.gitignore` patterns to exclude `node_modules`, build artifacts
   - Implement a whitelist of relevant directories (src/, lib/, etc.)

### Implementation Notes

The QuickPreflightValidator needs access to:
- Package.json (dependencies)
- Source files mentioned in acceptance criteria
- Configuration files (tsconfig.json, etc.)

It does NOT need:
- `node_modules/` (hundreds of MB)
- Build artifacts (`dist/`, `.next/`, etc.)
- Git history
- Documentation
- Test fixtures

### Recommended Fix (Option C - Quick)

Update `MastraWorkspaceFactory.ts` to create a filtered filesystem:

```typescript
const filesystem = new LocalFilesystem({
  id: 'repo-fs',
  rootDir: repoPath,
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.git/**',
    '**/build/**',
  ],
  maxFileSize: 1024 * 1024, // 1MB per file limit
});
```

Or implement on-demand file loading:
```typescript
// Only load files when agent explicitly requests them
// Don't pre-load entire directory tree
```

## Status

- ✅ TypeScript compilation errors fixed
- ❌ Memory issue blocking development
- ⚠️ Backend cannot start due to heap overflow

## Next Steps

1. Implement Option C (filtered filesystem) or Option A (GitHub API) 
2. Test with actual repository to verify memory usage
3. Add monitoring to track workspace memory consumption
4. Document memory limits and repository size constraints
