# Story 4.2 - Implementation Guide

**Status:** Phase 1 Paused - Ready to Resume  
**Date:** 2026-02-02  
**Completed:** Task 1 (Partial) - Webhook handler  
**Remaining:** Tasks 2-14

---

## 📦 Phase 1: Core Indexing (Tasks 1-6)

### Prerequisites

**1. Install Dependencies**
```bash
cd /Users/Idana/Documents/GitHub/forge
pnpm add -w simple-git tree-sitter tree-sitter-javascript tree-sitter-typescript \
  tree-sitter-python tree-sitter-go tree-sitter-java tree-sitter-rust \
  tree-sitter-ruby tree-sitter-c-sharp @nestjs/throttler @nestjs/terminus
```

**2. Start Redis (Required for Bull queue)**
```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Or Docker
docker run -d -p 6379:6379 redis:alpine
```

**3. Add Environment Variables**
Add to `backend/.env` (and `.env.example`):
```bash
GITHUB_WEBHOOK_SECRET=your-secret-here-min-32-chars
MAX_REPO_SIZE_MB=2048
MAX_FILES_PER_INDEX=50000
CLONE_TIMEOUT_MS=300000
PARSE_TIMEOUT_MS=10000
WORKSPACE_STORAGE_QUOTA=10
REDIS_URL=redis://localhost:6379
```

---

## 🏗️ Implementation Order

### ✅ Task 1: Webhook Handler [PARTIALLY COMPLETE]

**Status:** Handler created, needs wiring to queue

**File:** `backend/src/github/infrastructure/webhooks/github-webhook.handler.ts`

**Remaining Work:**
1. Wire up to indexing queue (after Task 5)
2. Add to `github.module.ts` providers array
3. Test with ngrok + GitHub webhook

---

### Task 2: Domain Models (Start Here)

**Why First:** No dependencies, defines contracts for everything else

**Files to Create:**

#### 1. `backend/src/indexing/domain/FileMetadata.ts`
```typescript
/**
 * FileMetadata Value Object
 * Represents parsed metadata for a single file
 */
export class FileMetadata {
  constructor(
    public readonly path: string,
    public readonly language: string,
    public readonly size: number,
    public readonly exports: string[],
    public readonly imports: string[],
    public readonly functions: string[],
    public readonly classes: string[],
    public readonly summary: string,
    public readonly loc: number,
    public readonly parseWarnings: string[],
  ) {}

  static create(data: Partial<FileMetadata>): FileMetadata {
    return new FileMetadata(
      data.path || '',
      data.language || 'unknown',
      data.size || 0,
      data.exports || [],
      data.imports || [],
      data.functions || [],
      data.classes || [],
      data.summary || '',
      data.loc || 0,
      data.parseWarnings || [],
    );
  }
}
```

#### 2. `backend/src/indexing/domain/Index.ts`
```typescript
/**
 * Index Aggregate Root
 * Represents a repository code index
 */
import { FileMetadata } from './FileMetadata';

export type IndexStatus = 'pending' | 'indexing' | 'completed' | 'failed';

export interface ErrorDetails {
  type: string;
  message: string;
  files?: string[];
}

export class Index {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly repositoryId: number,
    public readonly repositoryName: string,
    public readonly commitSha: string,
    public status: IndexStatus,
    public filesIndexed: number,
    public totalFiles: number,
    public filesSkipped: number,
    public parseErrors: number,
    public readonly createdAt: Date,
    public completedAt: Date | null,
    public indexDurationMs: number,
    public repoSizeMB: number,
    public errorDetails: ErrorDetails | null,
    public files: FileMetadata[],
  ) {}

  static create(data: {
    id: string;
    workspaceId: string;
    repositoryId: number;
    repositoryName: string;
    commitSha: string;
  }): Index {
    return new Index(
      data.id,
      data.workspaceId,
      data.repositoryId,
      data.repositoryName,
      data.commitSha,
      'pending',
      0,
      0,
      0,
      0,
      new Date(),
      null,
      0,
      0,
      null,
      [],
    );
  }

  addFile(file: FileMetadata): void {
    this.files.push(file);
    this.filesIndexed++;
  }

  markIndexing(totalFiles: number): void {
    this.status = 'indexing';
    this.totalFiles = totalFiles;
  }

  markComplete(durationMs: number): void {
    this.status = 'completed';
    this.completedAt = new Date();
    this.indexDurationMs = durationMs;
  }

  markFailed(error: ErrorDetails): void {
    this.status = 'failed';
    this.completedAt = new Date();
    this.errorDetails = error;
  }

  incrementSkipped(): void {
    this.filesSkipped++;
  }

  incrementParseErrors(): void {
    this.parseErrors++;
  }
}
```

#### 3. `backend/src/indexing/domain/IndexRepository.ts`
```typescript
/**
 * IndexRepository Port (Interface)
 * Defines persistence operations - implemented in infrastructure layer
 */
import { Index } from './Index';

export interface IndexRepository {
  save(index: Index): Promise<void>;
  findById(indexId: string): Promise<Index | null>;
  findByWorkspaceAndRepo(workspaceId: string, repoId: number): Promise<Index[]>;
  updateProgress(indexId: string, progress: number, total: number): Promise<void>;
  delete(indexId: string): Promise<void>;
}

export const INDEX_REPOSITORY = 'INDEX_REPOSITORY';
```

#### 4. `backend/src/indexing/infrastructure/persistence/firestore-index.repository.ts`
```typescript
/**
 * Firestore Index Repository Implementation
 */
import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { Index, IndexStatus } from '../../domain/Index';
import { IndexRepository } from '../../domain/IndexRepository';
import { FileMetadata } from '../../domain/FileMetadata';

@Injectable()
export class FirestoreIndexRepository implements IndexRepository {
  private readonly logger = new Logger(FirestoreIndexRepository.name);
  private readonly collection = 'indexes';

  constructor(private readonly firestore: Firestore) {}

  async save(index: Index): Promise<void> {
    const docRef = this.firestore
      .collection('workspaces')
      .doc(index.workspaceId)
      .collection(this.collection)
      .doc(index.id);

    await docRef.set({
      id: index.id,
      workspaceId: index.workspaceId,
      repositoryId: index.repositoryId,
      repositoryName: index.repositoryName,
      commitSha: index.commitSha,
      status: index.status,
      filesIndexed: index.filesIndexed,
      totalFiles: index.totalFiles,
      filesSkipped: index.filesSkipped,
      parseErrors: index.parseErrors,
      createdAt: index.createdAt,
      completedAt: index.completedAt,
      indexDurationMs: index.indexDurationMs,
      repoSizeMB: index.repoSizeMB,
      errorDetails: index.errorDetails,
      files: index.files.map(f => ({
        path: f.path,
        language: f.language,
        size: f.size,
        exports: f.exports,
        imports: f.imports,
        functions: f.functions,
        classes: f.classes,
        summary: f.summary,
        loc: f.loc,
        parseWarnings: f.parseWarnings,
      })),
    });

    this.logger.log(`Saved index ${index.id} for workspace ${index.workspaceId}`);
  }

  async findById(indexId: string): Promise<Index | null> {
    // Query across all workspaces (or optimize with workspace hint)
    const snapshot = await this.firestore
      .collectionGroup(this.collection)
      .where('id', '==', indexId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return this.mapToIndex(snapshot.docs[0].data());
  }

  async findByWorkspaceAndRepo(
    workspaceId: string,
    repoId: number,
  ): Promise<Index[]> {
    const snapshot = await this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection(this.collection)
      .where('repositoryId', '==', repoId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.mapToIndex(doc.data()));
  }

  async updateProgress(
    indexId: string,
    progress: number,
    total: number,
  ): Promise<void> {
    // Find document first
    const snapshot = await this.firestore
      .collectionGroup(this.collection)
      .where('id', '==', indexId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        filesIndexed: progress,
        totalFiles: total,
      });
    }
  }

  async delete(indexId: string): Promise<void> {
    const snapshot = await this.firestore
      .collectionGroup(this.collection)
      .where('id', '==', indexId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  }

  private mapToIndex(data: any): Index {
    return new Index(
      data.id,
      data.workspaceId,
      data.repositoryId,
      data.repositoryName,
      data.commitSha,
      data.status as IndexStatus,
      data.filesIndexed,
      data.totalFiles,
      data.filesSkipped || 0,
      data.parseErrors || 0,
      data.createdAt.toDate(),
      data.completedAt?.toDate() || null,
      data.indexDurationMs || 0,
      data.repoSizeMB || 0,
      data.errorDetails || null,
      (data.files || []).map((f: any) => FileMetadata.create(f)),
    );
  }
}
```

---

### Task 3: File Parser Service

**File:** `backend/src/indexing/application/services/file-parser.service.ts`

See story Dev Notes for Tree-sitter implementation examples.

**Key Methods:**
- `parseFile(filePath, content)` - Main entry point
- `detectLanguage(filePath)` - Extension-based detection
- `extractSymbols(tree, language)` - Tree-sitter queries
- Fallback to metadata-only for unsupported languages

---

### Task 4: Repository Indexer Service

**File:** `backend/src/indexing/application/services/repo-indexer.service.ts`

**Dependencies:**
- GitHubApiService (existing)
- GitHubTokenService (existing)
- FileParserService (Task 3)
- IndexRepository (Task 2)

**Flow:**
1. Get GitHub token (decrypt)
2. Clone repo with simple-git
3. Walk file tree
4. Parse each file with FileParserService
5. Build Index domain entity
6. Save to Firestore
7. Cleanup temp dir

---

### Task 5: Indexing Job Queue

**File:** `backend/src/indexing/application/jobs/indexing.job.ts`

**Bull Processor:**
- Queue name: 'indexing'
- Job: 'index-repository'
- Progress tracking via `job.progress()`
- Retry: 3 attempts (configured in module)

---

### Task 6: Index Query Service

**File:** `backend/src/indexing/application/services/index-query.service.ts`

**Methods:**
- `findModulesByIntent(intent, indexId)` - Keyword search
- `findFilesByPath(pattern, indexId)` - Path-based search
- `getIndexStats(indexId)` - Metadata

---

## 🧪 Testing Strategy

**Unit Tests:**
- FileParserService with small code samples
- Index domain model business logic
- Query service relevance ranking
- Webhook signature verification

**Integration Tests:**
- Full indexing flow with test repo
- Webhook triggers job
- Progress tracking

---

## 🚀 Resuming Implementation

**Quick Start:**
```bash
# 1. Install dependencies (see Prerequisites)
# 2. Start Redis
# 3. Create domain models (Task 2)
# 4. Implement File Parser (Task 3)
# 5. Implement Repo Indexer (Task 4)
# 6. Set up Job Queue (Task 5)
# 7. Add Query Service (Task 6)
# 8. Wire everything together
# 9. Test with small repo
```

**Estimated Time:**
- Tasks 2-6: 4-6 hours
- Testing: 1-2 hours
- **Total Phase 1:** ~6-8 hours

---

## 📋 Phase 2 & 3 (Defer for Now)

**Phase 2: Production Hardening**
- Tasks 12-14: Resource limits, security, observability, failure recovery
- Estimate: 3-4 hours

**Phase 3: Testing**
- Task 11: Comprehensive test coverage
- Estimate: 2-3 hours

---

## 📞 Support

**If stuck, refer to:**
- Story context file: `4-2-code-indexing-build-repo-index-for-query.context.xml`
- Tree-sitter docs: https://tree-sitter.github.io/tree-sitter/
- Story 4.1 learnings: GitHubApiService, GitHubTokenService patterns

**Next Session Checklist:**
- [ ] Dependencies installed
- [ ] Redis running
- [ ] Environment variables configured
- [ ] Domain models complete (Task 2)
- [ ] Ready to implement services
