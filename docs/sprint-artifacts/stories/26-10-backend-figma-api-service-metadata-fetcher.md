# Story 26-10: Backend - Figma API Service & Metadata Fetcher

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO (Blocked by: Phase 1 + 26-09)
**Priority:** HIGH
**Effort:** 3 hours
**Assignee:** TBD

---

## Objective

Implement Figma API client to fetch file metadata and integrate metadata fetching into the AddDesignReferenceUseCase:
1. Create FigmaApiClient to fetch file metadata (fileName, thumbnailUrl, lastModified, fileKey)
2. Implement 24-hour metadata caching to avoid rate limits
3. Create FigmaMetadataFetcher service with error handling
4. Enhance AddDesignReferenceUseCase to fetch Figma metadata after adding design reference
5. Non-blocking enrichment: Continue if fetch fails, log errors

---

## Acceptance Criteria

- ✅ FigmaApiClient.getFileMetadata(fileKey) returns file info
- ✅ Metadata includes: fileName, thumbnailUrl, lastModified, fileKey
- ✅ Extract fileKey from Figma URL (parsing logic)
- ✅ FigmaMetadataCache stores metadata in Firestore with TTL
- ✅ 24-hour cache: Don't refetch same file within 24 hours
- ✅ Handle API rate limits: Log error, don't block
- ✅ AddDesignReferenceUseCase.execute() fetches metadata after adding
- ✅ Metadata merged into DesignReference.metadata.figma
- ✅ Non-blocking: If Figma not connected, metadata = null (no error)
- ✅ Graceful fallback: If API fails, design link still saved with minimal metadata
- ✅ Error logging: Include fileKey, error reason, retry guidance
- ✅ Logging: Track cache hits/misses, API calls, errors
- ✅ No TypeScript errors
- ✅ Unit tests for metadata fetching and caching

---

## Files Created

```
backend/src/figma/
  ├── application/
  │   └── services/
  │       ├── figma-metadata-cache.repository.ts    (NEW - Cache interface)
  │       └── figma-metadata.fetcher.ts             (NEW - Fetch + cache logic)
  └── infrastructure/
      └── persistence/
          └── firestore-figma-metadata-cache.repository.ts (NEW - Firestore cache)
```

---

## Files Modified

```
backend/src/figma/application/services/figma-api-client.ts
  - Implement getFileMetadata(fileKey: string, accessToken: string) method
  - Extract fileKey from Figma URL regex pattern
  - Map API response to FigmaFileMetadata interface

backend/src/tickets/application/use-cases/AddDesignReferenceUseCase.ts (Phase 1)
  - Import FigmaMetadataFetcher
  - After adding design reference with platform=figma:
    - Call fetcher.enrichMetadata(reference, workspaceId) asynchronously
    - Do NOT await (fire-and-forget with Promise.catch for logging)
    - Update reference.metadata if enrichment succeeds

backend/src/figma/figma.module.ts
  - Register FigmaMetadataFetcher provider
  - Register FigmaMetadataCacheRepository provider
  - Export FigmaMetadataFetcher for use in tickets module
```

---

## Implementation Notes

### 1. Figma URL Parsing

```typescript
// Extract fileKey from various Figma URL formats
export function extractFigmaFileKey(url: string): string | null {
  // Format: https://www.figma.com/file/FILEID/filename
  // Format: https://figma.com/file/FILEID
  const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
```

### 2. FigmaApiClient

```typescript
// backend/src/figma/application/services/figma-api-client.ts
interface FigmaFileMetadata {
  fileKey: string;
  fileName: string;
  thumbnailUrl: string;
  lastModified: Date;
}

@Injectable()
export class FigmaApiClient {
  private readonly logger = new Logger(FigmaApiClient.name);

  constructor(private readonly tokenService: FigmaTokenService) {}

  async getFileMetadata(fileKey: string, accessToken: string): Promise<FigmaFileMetadata> {
    const url = `https://api.figma.com/v1/files/${fileKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-FIGMA-TOKEN': accessToken,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited by Figma API');
      }
      if (response.status === 404) {
        throw new Error('File not found');
      }
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    return {
      fileKey,
      fileName: data.name || 'Untitled',
      thumbnailUrl: data.thumbnailUrl || '',
      lastModified: new Date(data.lastModified),
    };
  }

  // Helper: Extract fileKey from URL
  extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
}
```

### 3. FigmaMetadataCache Repository

```typescript
// backend/src/figma/application/services/figma-metadata-cache.repository.ts
export interface FigmaMetadataCacheEntry {
  fileKey: string;
  fileName: string;
  thumbnailUrl: string;
  lastModified: Date;
  fetchedAt: Date;
  expiresAt: Date;
}

export interface FigmaMetadataCacheRepository {
  get(fileKey: string): Promise<FigmaMetadataCacheEntry | null>;
  set(fileKey: string, metadata: FigmaMetadataCacheEntry): Promise<void>;
  delete(fileKey: string): Promise<void>;
}

export const FIGMA_METADATA_CACHE_REPOSITORY = 'FIGMA_METADATA_CACHE_REPOSITORY';
```

### 4. Firestore Metadata Cache

```typescript
// backend/src/figma/infrastructure/persistence/firestore-figma-metadata-cache.repository.ts
@Injectable()
export class FirestoreFigmaMetadataCacheRepository implements FigmaMetadataCacheRepository {
  private readonly logger = new Logger(FirestoreFigmaMetadataCacheRepository.name);

  constructor(private readonly firestore: Firestore) {}

  async get(fileKey: string): Promise<FigmaMetadataCacheEntry | null> {
    try {
      const doc = await this.firestore
        .collection('figma_metadata_cache')
        .doc(fileKey)
        .get();

      if (!doc.exists) return null;

      const data = doc.data() as any;
      const expiresAt = data.expiresAt.toDate();

      // Check if expired
      if (new Date() > expiresAt) {
        await this.delete(fileKey);
        return null;
      }

      return {
        fileKey: data.fileKey,
        fileName: data.fileName,
        thumbnailUrl: data.thumbnailUrl,
        lastModified: data.lastModified.toDate(),
        fetchedAt: data.fetchedAt.toDate(),
        expiresAt,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get Figma metadata from cache: ${error.message}`);
      return null; // Fail gracefully
    }
  }

  async set(fileKey: string, metadata: FigmaMetadataCacheEntry): Promise<void> {
    try {
      await this.firestore
        .collection('figma_metadata_cache')
        .doc(fileKey)
        .set({
          fileKey: metadata.fileKey,
          fileName: metadata.fileName,
          thumbnailUrl: metadata.thumbnailUrl,
          lastModified: Timestamp.fromDate(metadata.lastModified),
          fetchedAt: Timestamp.fromDate(metadata.fetchedAt),
          expiresAt: Timestamp.fromDate(metadata.expiresAt),
        });
    } catch (error: any) {
      this.logger.error(`Failed to cache Figma metadata: ${error.message}`);
      // Don't throw - cache failure shouldn't block
    }
  }

  async delete(fileKey: string): Promise<void> {
    try {
      await this.firestore.collection('figma_metadata_cache').doc(fileKey).delete();
    } catch (error: any) {
      this.logger.error(`Failed to delete Figma metadata from cache: ${error.message}`);
    }
  }
}
```

### 5. FigmaMetadataFetcher Service

```typescript
// backend/src/figma/application/services/figma-metadata.fetcher.ts
@Injectable()
export class FigmaMetadataFetcher {
  private readonly logger = new Logger(FigmaMetadataFetcher.name);

  constructor(
    private readonly apiClient: FigmaApiClient,
    private readonly tokenService: FigmaTokenService,
    @Inject(FIGMA_INTEGRATION_REPOSITORY)
    private readonly integrationRepository: FigmaIntegrationRepository,
    @Inject(FIGMA_METADATA_CACHE_REPOSITORY)
    private readonly cacheRepository: FigmaMetadataCacheRepository,
  ) {}

  /**
   * Enrich design reference with Figma metadata
   * Non-blocking: Errors logged but not thrown
   */
  async enrichMetadata(
    reference: DesignReference,
    workspaceId: string,
  ): Promise<DesignReference | null> {
    try {
      // Extract fileKey from URL
      const fileKey = this.apiClient.extractFileKey(reference.url);
      if (!fileKey) {
        this.logger.warn(`Could not extract Figma fileKey from URL: ${reference.url}`);
        return null;
      }

      // Check cache first
      const cached = await this.cacheRepository.get(fileKey);
      if (cached) {
        this.logger.log(`Figma metadata cache hit: ${fileKey}`);
        return {
          ...reference,
          metadata: {
            ...reference.metadata,
            figma: {
              fileName: cached.fileName,
              thumbnailUrl: cached.thumbnailUrl,
              lastModified: cached.lastModified,
              fileKey: cached.fileKey,
            },
          },
        };
      }

      // Get Figma integration for workspace
      const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);
      if (!integration) {
        this.logger.log(`Figma not connected for workspace ${workspaceId}, skipping metadata fetch`);
        return null;
      }

      // Decrypt token
      const accessToken = await this.tokenService.decryptToken(integration.accessToken);

      // Fetch metadata from API
      const metadata = await this.apiClient.getFileMetadata(fileKey, accessToken);
      this.logger.log(`Fetched Figma metadata for file ${fileKey}: ${metadata.fileName}`);

      // Cache metadata (24 hour TTL)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await this.cacheRepository.set(fileKey, {
        ...metadata,
        fetchedAt: now,
        expiresAt,
      });

      return {
        ...reference,
        metadata: {
          ...reference.metadata,
          figma: metadata,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch Figma metadata: ${error.message}`);
      // Don't throw - return null to allow graceful degradation
      return null;
    }
  }
}
```

### 6. AddDesignReferenceUseCase Integration

```typescript
// In backend/src/tickets/application/use-cases/AddDesignReferenceUseCase.ts
// (Already created in Phase 1, now enhanced)

export class AddDesignReferenceUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository,
    private readonly figmaMetadataFetcher: FigmaMetadataFetcher,
  ) {}

  async execute(command: AddDesignReferenceCommand): Promise<DesignReference> {
    // 1. Validate ticket exists
    const ticket = await this.ticketRepository.findById(command.ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Validate workspace
    if (ticket.workspaceId !== command.workspaceId) {
      throw new ForbiddenException('Cannot add design reference to ticket in different workspace');
    }

    // 3. Create and add reference to ticket
    const reference = DesignReference.create({
      url: command.url,
      title: command.title,
      platform: detectPlatform(command.url),
      addedAt: new Date(),
      addedBy: command.userId,
    });

    ticket.addDesignReference(reference); // Enforces max 5 limit in domain

    // 4. Save ticket
    await this.ticketRepository.save(ticket);

    // 5. Fetch metadata asynchronously (non-blocking)
    if (reference.platform === 'figma') {
      this.figmaMetadataFetcher
        .enrichMetadata(reference, command.workspaceId)
        .then(enriched => {
          if (enriched) {
            // Update reference with metadata in ticket
            ticket.updateDesignReferenceMetadata(reference.id, enriched.metadata);
            return this.ticketRepository.save(ticket);
          }
        })
        .catch(error => {
          // Log but don't block
          console.error(`Figma metadata fetch failed: ${error.message}`);
        });
    }

    return reference;
  }
}
```

### 7. FigmaModule Updates

```typescript
// backend/src/figma/figma.module.ts
@Module({
  controllers: [FigmaOAuthController],
  providers: [
    FigmaTokenService,
    FigmaApiClient,
    FigmaMetadataFetcher,
    {
      provide: FIGMA_INTEGRATION_REPOSITORY,
      useClass: FirestoreFigmaIntegrationRepository,
    },
    {
      provide: FIGMA_METADATA_CACHE_REPOSITORY,
      useClass: FirestoreFigmaMetadataCacheRepository,
    },
  ],
  exports: [FigmaTokenService, FigmaApiClient, FigmaMetadataFetcher],
})
export class FigmaModule {}
```

---

## Figma API Reference

**Endpoint:** `GET https://api.figma.com/v1/files/{file_key}`

**Headers:**
- `X-FIGMA-TOKEN: <access_token>`

**Response:**
```json
{
  "name": "Dashboard Redesign v2",
  "lastModified": "2026-02-10T15:30:00Z",
  "thumbnailUrl": "https://s3-us-west-1.amazonaws.com/figma-service-avatars/...",
  "version": "123",
  "role": "owner"
}
```

---

## Caching Strategy

**TTL:** 24 hours (86,400 seconds)

**Reason:**
- Figma API rate limits: 300 requests per minute per user
- Caching reduces API calls by ~95% for repeated access
- 24 hours balances freshness vs. efficiency

**Cache Key:** Figma fileKey (extracted from URL)

**Cache Storage:** Firestore collection `figma_metadata_cache`

**Cleanup:** Automatic via Firestore TTL or manual delete on cache miss

---

## Error Handling Strategy

**Non-Blocking Enrichment:**
1. Figma not connected → Skip metadata fetch, design link saved without metadata
2. API rate limit (429) → Log error, cache miss, retry on next add
3. File not found (404) → Log error, don't cache
4. Network error → Log error, return null, don't block ticket save
5. Cache failure → Log error, continue with API fetch

**Logging Levels:**
- INFO: Cache hit, metadata fetched successfully
- WARN: Could not extract fileKey from URL
- ERROR: API failures, cache failures, network errors

---

## Testing Strategy

### Unit Tests

1. **FigmaApiClient**
   - ✅ extractFileKey: Parse various URL formats
   - ✅ getFileMetadata: Return correct metadata structure
   - ✅ Handle 404 (file not found)
   - ✅ Handle 429 (rate limited)
   - ✅ Handle network errors

2. **FigmaMetadataCacheRepository**
   - ✅ get: Return cached entry when not expired
   - ✅ get: Return null when expired
   - ✅ set: Store entry with correct TTL
   - ✅ delete: Remove entry

3. **FigmaMetadataFetcher**
   - ✅ enrichMetadata: Cache hit (skip API call)
   - ✅ enrichMetadata: Cache miss (fetch from API)
   - ✅ enrichMetadata: Figma not connected (return null)
   - ✅ enrichMetadata: API error (log and return null)
   - ✅ enrichMetadata: Invalid fileKey (return null)

### Integration Tests

1. **AddDesignReferenceUseCase with Figma**
   - ✅ Add Figma design reference
   - ✅ Metadata fetched asynchronously
   - ✅ Ticket saved before metadata available
   - ✅ Non-blocking: API error doesn't fail use case

---

## Integration Points

**Upstream (Depends On):**
- Story 26-09: FigmaOAuthController, FigmaTokenService
- FirestoreRepository (cache storage)
- DesignReference value object (Phase 1)

**Downstream (Feeds Into):**
- Story 26-13: Frontend Rich Preview Cards (displays fetched metadata)
- Story 26-17: Backend TechSpec Generator Design Injection (uses metadata in prompts)

---

## Dependencies

**NestJS:**
- @nestjs/common

**Built-in Node.js:**
- fetch API (Node 18+)

**Firestore:**
- firebase-admin/firestore

---

## Rollout Plan

1. **30 minutes:** Implement FigmaApiClient.getFileMetadata()
2. **30 minutes:** Create FigmaMetadataCacheRepository interface + Firestore impl
3. **1 hour:** Create FigmaMetadataFetcher with caching logic
4. **30 minutes:** Integrate into AddDesignReferenceUseCase (non-blocking)
5. **30 minutes:** Unit tests for all services
6. **Commit:** After integration tests pass

---

## Known Risks

1. **API Rate Limits:** If many users fetch Figma metadata simultaneously
   - *Mitigation:* Implement backoff + queuing (future enhancement)

2. **Cache Stampede:** Multiple requests for same file after cache expiry
   - *Mitigation:* Add distributed lock (future enhancement)

3. **Stale Thumbnails:** Figma updates file, thumbnail doesn't refresh for 24 hours
   - *Mitigation:* Document cache TTL, provide manual "refresh metadata" button (future)

4. **Large Files:** Figma API might be slow for very large files
   - *Mitigation:* Timeout after 5s, return null (future enhancement)

---

## Success Metrics

- ✅ Figma metadata fetched within 2 seconds
- ✅ Cache hits reduce API calls by >95%
- ✅ Non-blocking enrichment (ticket saved immediately)
- ✅ Errors logged but don't block ticket creation
- ✅ 24-hour cache TTL enforced
- ✅ All unit/integration tests pass
- ✅ 0 TypeScript errors, 0 console warnings

---

## Follow-Up Stories

- **26-13:** Frontend - Rich Preview Cards (displays metadata)
- **26-17:** Backend - TechSpec Generator Design Injection (uses metadata in LLM)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO (Blocked by: Phase 1 + 26-09)
