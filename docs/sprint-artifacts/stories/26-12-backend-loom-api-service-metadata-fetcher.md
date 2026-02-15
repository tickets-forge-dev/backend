# Story 26-12: Backend - Loom API Service & Metadata Fetcher

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO (Blocked by: Phase 1 + 26-11)
**Priority:** HIGH
**Effort:** 3 hours
**Assignee:** TBD

---

## Objective

Implement Loom API client to fetch video metadata and integrate metadata fetching into the AddDesignReferenceUseCase:
1. Create LoomApiClient to fetch video metadata (videoTitle, duration, thumbnailUrl, transcript, sharedId)
2. Implement 24-hour metadata caching to avoid rate limits
3. Create LoomMetadataFetcher service with error handling
4. Enhance AddDesignReferenceUseCase to fetch Loom metadata after adding design reference
5. Non-blocking enrichment: Continue if fetch fails, log errors

---

## Acceptance Criteria

- ✅ LoomApiClient.getVideoMetadata(sharedId) returns video info
- ✅ Metadata includes: videoTitle, duration (seconds), thumbnailUrl, transcript, sharedId
- ✅ Extract sharedId from Loom URL (parsing logic)
- ✅ LoomMetadataCache stores metadata in Firestore with TTL
- ✅ 24-hour cache: Don't refetch same video within 24 hours
- ✅ Transcript fetching: Optional, non-blocking
- ✅ Handle API rate limits: Log error, don't block
- ✅ AddDesignReferenceUseCase.execute() fetches metadata after adding
- ✅ Metadata merged into DesignReference.metadata.loom
- ✅ Non-blocking: If Loom not connected, metadata = null (no error)
- ✅ Graceful fallback: If API fails, design link still saved with minimal metadata
- ✅ Error logging: Include sharedId, error reason, retry guidance
- ✅ Logging: Track cache hits/misses, API calls, errors
- ✅ No TypeScript errors
- ✅ Unit tests for metadata fetching and caching

---

## Files Created

```
backend/src/loom/
  ├── application/
  │   └── services/
  │       ├── loom-metadata-cache.repository.ts    (NEW - Cache interface)
  │       └── loom-metadata.fetcher.ts             (NEW - Fetch + cache logic)
  └── infrastructure/
      └── persistence/
          └── firestore-loom-metadata-cache.repository.ts (NEW - Firestore cache)
```

---

## Files Modified

```
backend/src/loom/application/services/loom-api-client.ts
  - Implement getVideoMetadata(sharedId: string, accessToken: string) method
  - Extract sharedId from Loom URL regex pattern
  - Map API response to LoomVideoMetadata interface

backend/src/tickets/application/use-cases/AddDesignReferenceUseCase.ts (Phase 1)
  - Import LoomMetadataFetcher
  - After adding design reference with platform=loom:
    - Call fetcher.enrichMetadata(reference, workspaceId) asynchronously
    - Do NOT await (fire-and-forget with Promise.catch for logging)
    - Update reference.metadata if enrichment succeeds

backend/src/loom/loom.module.ts
  - Register LoomMetadataFetcher provider
  - Register LoomMetadataCacheRepository provider
  - Export LoomMetadataFetcher for use in tickets module
```

---

## Implementation Notes

### 1. Loom URL Parsing

```typescript
// Extract sharedId from various Loom URL formats
export function extractLoomSharedId(url: string): string | null {
  // Format: https://www.loom.com/share/abc123def456
  // Format: https://loom.com/share/abc123def456
  // Format: https://loom.com/embed/abc123def456
  const match = url.match(/loom\.com\/(share|embed)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}
```

### 2. LoomApiClient

```typescript
// backend/src/loom/application/services/loom-api-client.ts
interface LoomVideoMetadata {
  sharedId: string;
  videoTitle: string;
  duration: number; // In seconds
  thumbnailUrl: string;
  transcript?: string; // Optional
}

@Injectable()
export class LoomApiClient {
  private readonly logger = new Logger(LoomApiClient.name);

  constructor(private readonly tokenService: LoomTokenService) {}

  async getVideoMetadata(sharedId: string, accessToken: string): Promise<LoomVideoMetadata> {
    try {
      // Fetch video info
      const infoUrl = `https://api.loom.com/api/v1/videos/${sharedId}`;
      const infoResponse = await fetch(infoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!infoResponse.ok) {
        if (infoResponse.status === 404) {
          throw new Error('Video not found');
        }
        throw new Error(`Loom API error: ${infoResponse.statusText}`);
      }

      const videoData = (await infoResponse.json()) as any;

      // Extract metadata
      const metadata: LoomVideoMetadata = {
        sharedId,
        videoTitle: videoData.name || 'Untitled Video',
        duration: videoData.duration || 0,
        thumbnailUrl: videoData.thumbnail_url || '',
      };

      // Optionally fetch transcript (non-blocking)
      try {
        const transcriptUrl = `https://api.loom.com/api/v1/videos/${sharedId}/transcript`;
        const transcriptResponse = await fetch(transcriptUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (transcriptResponse.ok) {
          const transcriptData = (await transcriptResponse.json()) as any;
          metadata.transcript = transcriptData.transcript || transcriptData.text || undefined;
        }
      } catch (error) {
        // Transcript fetch is optional, don't fail the whole operation
        this.logger.warn(`Failed to fetch Loom transcript: ${error}`);
      }

      return metadata;
    } catch (error) {
      throw error;
    }
  }

  // Helper: Extract sharedId from URL
  extractSharedId(url: string): string | null {
    const match = url.match(/loom\.com\/(share|embed)\/([a-zA-Z0-9]+)/);
    return match ? match[2] : null;
  }

  // Helper: Format duration for display (e.g., "3:45")
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}
```

### 3. LoomMetadataCache Repository

```typescript
// backend/src/loom/application/services/loom-metadata-cache.repository.ts
export interface LoomMetadataCacheEntry {
  sharedId: string;
  videoTitle: string;
  duration: number;
  thumbnailUrl: string;
  transcript?: string;
  fetchedAt: Date;
  expiresAt: Date;
}

export interface LoomMetadataCacheRepository {
  get(sharedId: string): Promise<LoomMetadataCacheEntry | null>;
  set(sharedId: string, metadata: LoomMetadataCacheEntry): Promise<void>;
  delete(sharedId: string): Promise<void>;
}

export const LOOM_METADATA_CACHE_REPOSITORY = 'LOOM_METADATA_CACHE_REPOSITORY';
```

### 4. Firestore Metadata Cache

```typescript
// backend/src/loom/infrastructure/persistence/firestore-loom-metadata-cache.repository.ts
@Injectable()
export class FirestoreLoomMetadataCacheRepository implements LoomMetadataCacheRepository {
  private readonly logger = new Logger(FirestoreLoomMetadataCacheRepository.name);

  constructor(private readonly firestore: Firestore) {}

  async get(sharedId: string): Promise<LoomMetadataCacheEntry | null> {
    try {
      const doc = await this.firestore
        .collection('loom_metadata_cache')
        .doc(sharedId)
        .get();

      if (!doc.exists) return null;

      const data = doc.data() as any;
      const expiresAt = data.expiresAt.toDate();

      // Check if expired
      if (new Date() > expiresAt) {
        await this.delete(sharedId);
        return null;
      }

      return {
        sharedId: data.sharedId,
        videoTitle: data.videoTitle,
        duration: data.duration,
        thumbnailUrl: data.thumbnailUrl,
        transcript: data.transcript,
        fetchedAt: data.fetchedAt.toDate(),
        expiresAt,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get Loom metadata from cache: ${error.message}`);
      return null; // Fail gracefully
    }
  }

  async set(sharedId: string, metadata: LoomMetadataCacheEntry): Promise<void> {
    try {
      await this.firestore
        .collection('loom_metadata_cache')
        .doc(sharedId)
        .set({
          sharedId: metadata.sharedId,
          videoTitle: metadata.videoTitle,
          duration: metadata.duration,
          thumbnailUrl: metadata.thumbnailUrl,
          transcript: metadata.transcript,
          fetchedAt: Timestamp.fromDate(metadata.fetchedAt),
          expiresAt: Timestamp.fromDate(metadata.expiresAt),
        });
    } catch (error: any) {
      this.logger.error(`Failed to cache Loom metadata: ${error.message}`);
      // Don't throw - cache failure shouldn't block
    }
  }

  async delete(sharedId: string): Promise<void> {
    try {
      await this.firestore.collection('loom_metadata_cache').doc(sharedId).delete();
    } catch (error: any) {
      this.logger.error(`Failed to delete Loom metadata from cache: ${error.message}`);
    }
  }
}
```

### 5. LoomMetadataFetcher Service

```typescript
// backend/src/loom/application/services/loom-metadata.fetcher.ts
@Injectable()
export class LoomMetadataFetcher {
  private readonly logger = new Logger(LoomMetadataFetcher.name);

  constructor(
    private readonly apiClient: LoomApiClient,
    private readonly tokenService: LoomTokenService,
    @Inject(LOOM_INTEGRATION_REPOSITORY)
    private readonly integrationRepository: LoomIntegrationRepository,
    @Inject(LOOM_METADATA_CACHE_REPOSITORY)
    private readonly cacheRepository: LoomMetadataCacheRepository,
  ) {}

  /**
   * Enrich design reference with Loom metadata
   * Non-blocking: Errors logged but not thrown
   */
  async enrichMetadata(
    reference: DesignReference,
    workspaceId: string,
  ): Promise<DesignReference | null> {
    try {
      // Extract sharedId from URL
      const sharedId = this.apiClient.extractSharedId(reference.url);
      if (!sharedId) {
        this.logger.warn(`Could not extract Loom sharedId from URL: ${reference.url}`);
        return null;
      }

      // Check cache first
      const cached = await this.cacheRepository.get(sharedId);
      if (cached) {
        this.logger.log(`Loom metadata cache hit: ${sharedId}`);
        return {
          ...reference,
          metadata: {
            ...reference.metadata,
            loom: {
              videoTitle: cached.videoTitle,
              duration: cached.duration,
              thumbnailUrl: cached.thumbnailUrl,
              transcript: cached.transcript,
              sharedId: cached.sharedId,
            },
          },
        };
      }

      // Get Loom integration for workspace
      const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);
      if (!integration) {
        this.logger.log(`Loom not connected for workspace ${workspaceId}, skipping metadata fetch`);
        return null;
      }

      // Decrypt token
      const accessToken = await this.tokenService.decryptToken(integration.accessToken);

      // Fetch metadata from API
      const metadata = await this.apiClient.getVideoMetadata(sharedId, accessToken);
      this.logger.log(
        `Fetched Loom metadata for video ${sharedId}: ${metadata.videoTitle} (${this.apiClient.formatDuration(metadata.duration)})`,
      );

      // Cache metadata (24 hour TTL)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await this.cacheRepository.set(sharedId, {
        ...metadata,
        fetchedAt: now,
        expiresAt,
      });

      return {
        ...reference,
        metadata: {
          ...reference.metadata,
          loom: metadata,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch Loom metadata: ${error.message}`);
      // Don't throw - return null to allow graceful degradation
      return null;
    }
  }
}
```

### 6. AddDesignReferenceUseCase Integration

```typescript
// In backend/src/tickets/application/use-cases/AddDesignReferenceUseCase.ts
// (Already created in Phase 1, now enhanced for Loom)

export class AddDesignReferenceUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository,
    private readonly figmaMetadataFetcher: FigmaMetadataFetcher,
    private readonly loomMetadataFetcher: LoomMetadataFetcher,
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
            ticket.updateDesignReferenceMetadata(reference.id, enriched.metadata);
            return this.ticketRepository.save(ticket);
          }
        })
        .catch(error => {
          console.error(`Figma metadata fetch failed: ${error.message}`);
        });
    }

    if (reference.platform === 'loom') {
      this.loomMetadataFetcher
        .enrichMetadata(reference, command.workspaceId)
        .then(enriched => {
          if (enriched) {
            ticket.updateDesignReferenceMetadata(reference.id, enriched.metadata);
            return this.ticketRepository.save(ticket);
          }
        })
        .catch(error => {
          console.error(`Loom metadata fetch failed: ${error.message}`);
        });
    }

    return reference;
  }
}
```

### 7. LoomModule Updates

```typescript
// backend/src/loom/loom.module.ts
@Module({
  controllers: [LoomOAuthController],
  providers: [
    LoomTokenService,
    LoomApiClient,
    LoomMetadataFetcher,
    {
      provide: LOOM_INTEGRATION_REPOSITORY,
      useClass: FirestoreLoomIntegrationRepository,
    },
    {
      provide: LOOM_METADATA_CACHE_REPOSITORY,
      useClass: FirestoreLoomMetadataCacheRepository,
    },
  ],
  exports: [LoomTokenService, LoomApiClient, LoomMetadataFetcher],
})
export class LoomModule {}
```

---

## Loom API Reference

**Get Video Info:**
- `GET https://api.loom.com/api/v1/videos/{shared_id}`
- Headers: `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "abc123",
  "name": "Dashboard User Flow Demo",
  "duration": 225,
  "thumbnail_url": "https://cdn.loom.com/...",
  "updated_at": "2026-02-10T15:30:00Z"
}
```

**Get Transcript:**
- `GET https://api.loom.com/api/v1/videos/{shared_id}/transcript`
- Headers: `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "transcript": "Here's the user flow... [full transcript text]"
}
```

---

## Caching Strategy

**TTL:** 24 hours (86,400 seconds)

**Reason:**
- Loom API rate limits: Varies by plan (typically 1000+ requests/day)
- Caching reduces API calls by ~95% for repeated access
- 24 hours balances freshness vs. efficiency

**Cache Key:** Loom sharedId (extracted from URL)

**Cache Storage:** Firestore collection `loom_metadata_cache`

**Cleanup:** Automatic via Firestore TTL or manual delete on cache miss

---

## Error Handling Strategy

**Non-Blocking Enrichment:**
1. Loom not connected → Skip metadata fetch, design link saved without metadata
2. API rate limit → Log error, cache miss, retry on next add
3. Video not found (404) → Log error, don't cache
4. Network error → Log error, return null, don't block ticket save
5. Transcript fetch fails → Fetch video info anyway, transcript is optional
6. Cache failure → Log error, continue with API fetch

**Logging Levels:**
- INFO: Cache hit, metadata fetched successfully
- WARN: Could not extract sharedId from URL
- ERROR: API failures, cache failures, network errors

---

## Testing Strategy

### Unit Tests

1. **LoomApiClient**
   - ✅ extractSharedId: Parse various URL formats
   - ✅ getVideoMetadata: Return correct metadata structure
   - ✅ formatDuration: Convert seconds to HH:MM:SS format
   - ✅ Handle 404 (video not found)
   - ✅ Handle network errors
   - ✅ Transcript fetch optional (continue without it)

2. **LoomMetadataCacheRepository**
   - ✅ get: Return cached entry when not expired
   - ✅ get: Return null when expired
   - ✅ set: Store entry with correct TTL
   - ✅ delete: Remove entry

3. **LoomMetadataFetcher**
   - ✅ enrichMetadata: Cache hit (skip API call)
   - ✅ enrichMetadata: Cache miss (fetch from API)
   - ✅ enrichMetadata: Loom not connected (return null)
   - ✅ enrichMetadata: API error (log and return null)
   - ✅ enrichMetadata: Invalid sharedId (return null)

### Integration Tests

1. **AddDesignReferenceUseCase with Loom**
   - ✅ Add Loom design reference
   - ✅ Metadata fetched asynchronously
   - ✅ Ticket saved before metadata available
   - ✅ Non-blocking: API error doesn't fail use case

---

## Integration Points

**Upstream (Depends On):**
- Story 26-11: LoomOAuthController, LoomTokenService
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

1. **30 minutes:** Implement LoomApiClient.getVideoMetadata()
2. **30 minutes:** Create LoomMetadataCacheRepository interface + Firestore impl
3. **1 hour:** Create LoomMetadataFetcher with caching logic
4. **30 minutes:** Integrate into AddDesignReferenceUseCase (non-blocking)
5. **30 minutes:** Unit tests for all services
6. **Commit:** After integration tests pass

---

## Known Risks

1. **API Rate Limits:** If many users fetch Loom metadata simultaneously
   - *Mitigation:* Implement backoff + queuing (future enhancement)

2. **Cache Stampede:** Multiple requests for same video after cache expiry
   - *Mitigation:* Add distributed lock (future enhancement)

3. **Stale Thumbnails:** Loom updates video, thumbnail doesn't refresh for 24 hours
   - *Mitigation:* Document cache TTL, provide manual "refresh metadata" button (future)

4. **Transcript Length:** Loom transcripts might be very long (10k+ words)
   - *Mitigation:* Truncate to 1000 words for LLM context (future enhancement)

5. **Large Files:** Loom API might be slow for very long videos (1+ hour)
   - *Mitigation:* Timeout after 5s, return null (future enhancement)

---

## Success Metrics

- ✅ Loom metadata fetched within 2 seconds
- ✅ Cache hits reduce API calls by >95%
- ✅ Non-blocking enrichment (ticket saved immediately)
- ✅ Errors logged but don't block ticket creation
- ✅ 24-hour cache TTL enforced
- ✅ Transcript fetch optional (graceful fallback)
- ✅ All unit/integration tests pass
- ✅ 0 TypeScript errors, 0 console warnings

---

## Follow-Up Stories

- **26-13:** Frontend - Rich Preview Cards (displays metadata)
- **26-17:** Backend - TechSpec Generator Design Injection (uses metadata in LLM)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO (Blocked by: Phase 1 + 26-11)
