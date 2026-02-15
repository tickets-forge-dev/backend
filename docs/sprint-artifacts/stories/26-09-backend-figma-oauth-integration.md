# Story 26-09: Backend - Figma OAuth Integration

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO (Blocked by: Phase 1)
**Priority:** HIGH
**Effort:** 3.5 hours
**Assignee:** TBD

---

## Objective

Implement Figma OAuth 2.0 integration following the existing Jira/Linear OAuth pattern:
1. Create Figma OAuth controller with start/callback endpoints
2. Implement state-signed tokens with HMAC validation (CSRF protection)
3. Create FigmaIntegrationRepository for encrypted workspace-level token storage
4. Create FigmaTokenService for token encryption/decryption
5. Handle OAuth errors gracefully with user-friendly redirects

---

## Acceptance Criteria

- ✅ FigmaOAuthController created with start/callback endpoints
- ✅ GET /figma/oauth/authorize returns OAuth URL + state token (signed with HMAC)
- ✅ GET /figma/oauth/callback exchanges code for access token and stores encrypted
- ✅ State token validated with HMAC (CSRF protection)
- ✅ Access token encrypted with AES-256-CBC before storage
- ✅ Workspace-level token storage (one token per workspace)
- ✅ FigmaIntegrationRepository implements Firestore persistence
- ✅ FigmaTokenService provides encrypt/decrypt/generateSignedState/parseSignedState
- ✅ Error handling: Invalid state → redirect with error=invalid_state
- ✅ Error handling: Token exchange failed → redirect with error=figma_connection_failed
- ✅ POST /figma/oauth/disconnect removes workspace integration
- ✅ GET /figma/oauth/connection returns connection status (connected: boolean, email, workspace name)
- ✅ Guards: FirebaseAuthGuard, WorkspaceGuard on protected endpoints
- ✅ Logging: All OAuth events logged to console
- ✅ No console warnings or TypeScript errors
- ✅ Follows existing Jira/Linear patterns exactly

---

## Files Created

```
backend/src/figma/
  ├── figma.module.ts                          (NEW - Module registration)
  ├── figma-oauth.controller.ts                (NEW - OAuth endpoints)
  ├── application/
  │   └── services/
  │       ├── figma-token.service.ts           (NEW - Encrypt/decrypt, state handling)
  │       └── figma-api-client.ts              (NEW - Figma API client, placeholder)
  ├── domain/
  │   ├── FigmaIntegration.ts                  (NEW - Domain model)
  │   └── FigmaIntegrationRepository.ts        (NEW - Repository interface)
  └── infrastructure/
      └── persistence/
          └── firestore-figma-integration.repository.ts  (NEW - Firestore impl)
```

---

## Files Modified

```
backend/src/app.module.ts
  - Import FigmaModule in imports array
  - Register Figma OAuth routes

backend/src/main.ts
  - No changes needed (Figma env vars loaded from config)
```

---

## Implementation Notes

### 1. FigmaTokenService (3 methods)

```typescript
// backend/src/figma/application/services/figma-token.service.ts
@Injectable()
export class FigmaTokenService {
  private readonly logger = new Logger(FigmaTokenService.name);
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('GITHUB_ENCRYPTION_KEY') || '';
  }

  // Exchange OAuth code for access token
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<FigmaTokenResponse> {
    const clientId = this.configService.get<string>('FIGMA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('FIGMA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Figma OAuth credentials not configured');
    }

    const response = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Figma token exchange failed: ${text}`);
    }

    const data = (await response.json()) as any;
    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'Bearer',
      expiresIn: data.expires_in,
    };
  }

  // Get user info (email, name) from access token
  async getUserInfo(accessToken: string): Promise<FigmaUserInfo> {
    const response = await fetch('https://api.figma.com/v1/me', {
      method: 'GET',
      headers: {
        'X-FIGMA-TOKEN': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Figma user info: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return {
      id: data.id,
      email: data.email,
      name: data.handle,
    };
  }

  // Encrypt token for storage
  async encryptToken(token: string): Promise<string> {
    const key = await this.getDerivedKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt token from storage
  async decryptToken(encryptedToken: string): Promise<string> {
    const parts = encryptedToken.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted token format');
    const iv = Buffer.from(parts[0], 'hex');
    const key = await this.getDerivedKey();
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Generate signed state token (HMAC)
  generateSignedState(workspaceId: string): string {
    const nonce = randomBytes(16).toString('hex');
    const payload = `${nonce}.${workspaceId}`;
    const hmac = this.computeHmac(payload);
    return `${payload}.${hmac}`;
  }

  // Parse and validate signed state token
  parseSignedState(state: string): { workspaceId: string; nonce: string } | null {
    const parts = state.split('.');
    if (parts.length !== 3) return null;
    const [nonce, workspaceId, hmac] = parts;
    const expected = this.computeHmac(`${nonce}.${workspaceId}`);
    if (hmac !== expected) return null;
    return { workspaceId, nonce };
  }

  private computeHmac(data: string): string {
    const secret = this.encryptionKey || 'default-insecure-key-change-me';
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  private async getDerivedKey(): Promise<Buffer> {
    const key = this.encryptionKey || 'default-insecure-key-change-me';
    return (await scryptAsync(key, 'salt', 32)) as Buffer;
  }
}
```

### 2. FigmaOAuthController

```typescript
// backend/src/figma/figma-oauth.controller.ts
@Controller('figma/oauth')
export class FigmaOAuthController {
  private readonly logger = new Logger(FigmaOAuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: FigmaTokenService,
    private readonly apiClient: FigmaApiClient,
    @Inject(FIGMA_INTEGRATION_REPOSITORY)
    private readonly integrationRepository: FigmaIntegrationRepository,
  ) {}

  @Get('authorize')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async authorize(@WorkspaceId() workspaceId: string): Promise<{ oauthUrl: string; state: string }> {
    const clientId = this.configService.get<string>('FIGMA_CLIENT_ID');
    const redirectUri = this.configService.get<string>('FIGMA_OAUTH_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new InternalServerErrorException('Figma OAuth not configured');
    }

    const state = this.tokenService.generateSignedState(workspaceId);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'file_content_read',
      state,
    });

    const oauthUrl = `https://www.figma.com/oauth?${params.toString()}`;
    return { oauthUrl, state };
  }

  @Get('callback')
  @Redirect()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<{ url: string }> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    try {
      const parsed = this.tokenService.parseSignedState(state);
      if (!parsed) {
        return { url: `${frontendUrl}/settings?error=invalid_state` };
      }

      const { workspaceId } = parsed;
      const redirectUri = this.configService.get<string>('FIGMA_OAUTH_REDIRECT_URI')!;

      const tokenResponse = await this.tokenService.exchangeCodeForToken(code, redirectUri);
      const userInfo = await this.apiClient.getUserInfo(tokenResponse.accessToken);
      const encryptedToken = await this.tokenService.encryptToken(tokenResponse.accessToken);

      const existing = await this.integrationRepository.findByWorkspaceId(workspaceId);
      if (existing) {
        existing.updateAccessToken(encryptedToken);
        await this.integrationRepository.save(existing);
      } else {
        const integration = FigmaIntegration.create(
          `figma_${workspaceId}`,
          workspaceId,
          encryptedToken,
          userInfo.email,
          userInfo.name,
        );
        await this.integrationRepository.save(integration);
      }

      this.logger.log(`Figma connected for workspace ${workspaceId} (${userInfo.email})`);
      return { url: `${frontendUrl}/settings?figma_connected=true` };
    } catch (error: any) {
      this.logger.error(`Figma OAuth callback failed: ${error.message}`);
      return { url: `${frontendUrl}/settings?error=figma_connection_failed` };
    }
  }

  @Get('connection')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async getConnectionStatus(@WorkspaceId() workspaceId: string) {
    const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);
    if (!integration) {
      return { connected: false };
    }

    return {
      connected: true,
      email: integration.email,
      workspace: integration.workspace,
      connectedAt: integration.connectedAt,
    };
  }

  @Post('disconnect')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async disconnect(@WorkspaceId() workspaceId: string) {
    const integration = await this.integrationRepository.findByWorkspaceId(workspaceId);
    if (!integration) {
      throw new NotFoundException('Figma not connected');
    }

    await this.integrationRepository.deleteByWorkspaceId(workspaceId);
    this.logger.log(`Figma disconnected for workspace ${workspaceId}`);
    return { success: true };
  }
}
```

### 3. FigmaIntegration Domain Model

```typescript
// backend/src/figma/domain/FigmaIntegration.ts
export class FigmaIntegration {
  private constructor(
    readonly id: string,
    readonly workspaceId: string,
    private accessToken: string,
    readonly email: string,
    readonly workspace: string,
    readonly connectedAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(id: string, workspaceId: string, encryptedToken: string, email: string, workspace: string): FigmaIntegration {
    const now = new Date();
    return new FigmaIntegration(id, workspaceId, encryptedToken, email, workspace, now, now);
  }

  static reconstitute(props: any): FigmaIntegration {
    return new FigmaIntegration(
      props.id,
      props.workspaceId,
      props.accessToken,
      props.email,
      props.workspace,
      props.connectedAt,
      props.updatedAt,
    );
  }

  updateAccessToken(encryptedToken: string): void {
    this.accessToken = encryptedToken;
  }

  toObject() {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      accessToken: this.accessToken,
      email: this.email,
      workspace: this.workspace,
      connectedAt: this.connectedAt,
      updatedAt: new Date(),
    };
  }
}
```

### 4. FigmaIntegrationRepository Interface

```typescript
// backend/src/figma/domain/FigmaIntegrationRepository.ts
export const FIGMA_INTEGRATION_REPOSITORY = 'FIGMA_INTEGRATION_REPOSITORY';

export interface FigmaIntegrationRepository {
  findByWorkspaceId(workspaceId: string): Promise<FigmaIntegration | null>;
  save(integration: FigmaIntegration): Promise<void>;
  deleteByWorkspaceId(workspaceId: string): Promise<void>;
}
```

### 5. FigmaIntegration Firestore Repository

```typescript
// backend/src/figma/infrastructure/persistence/firestore-figma-integration.repository.ts
@Injectable()
export class FirestoreFigmaIntegrationRepository implements FigmaIntegrationRepository {
  private readonly logger = new Logger(FirestoreFigmaIntegrationRepository.name);

  constructor(private readonly firestore: Firestore) {}

  async findByWorkspaceId(workspaceId: string): Promise<FigmaIntegration | null> {
    try {
      const doc = await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc('figma')
        .get();

      if (!doc.exists) return null;
      return this.toDomain(doc.data() as FigmaIntegrationDocument);
    } catch (error: any) {
      this.logger.error(`Failed to find Figma integration: ${error.message}`);
      throw error;
    }
  }

  async save(integration: FigmaIntegration): Promise<void> {
    try {
      const data = this.toDocument(integration);
      await this.firestore
        .collection('workspaces')
        .doc(integration.workspaceId)
        .collection('integrations')
        .doc('figma')
        .set(data, { merge: true });
    } catch (error: any) {
      this.logger.error(`Failed to save Figma integration: ${error.message}`);
      throw error;
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    try {
      await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc('figma')
        .delete();
    } catch (error: any) {
      this.logger.error(`Failed to delete Figma integration: ${error.message}`);
      throw error;
    }
  }

  private toDocument(integration: FigmaIntegration): FigmaIntegrationDocument {
    const props = integration.toObject();
    return {
      id: props.id,
      workspaceId: props.workspaceId,
      accessToken: props.accessToken,
      email: props.email,
      workspace: props.workspace,
      connectedAt: Timestamp.fromDate(props.connectedAt),
      updatedAt: Timestamp.fromDate(props.updatedAt),
    };
  }

  private toDomain(doc: FigmaIntegrationDocument): FigmaIntegration {
    return FigmaIntegration.reconstitute({
      id: doc.id,
      workspaceId: doc.workspaceId,
      accessToken: doc.accessToken,
      email: doc.email,
      workspace: doc.workspace,
      connectedAt: doc.connectedAt.toDate(),
      updatedAt: doc.updatedAt.toDate(),
    });
  }
}
```

### 6. FigmaModule Registration

```typescript
// backend/src/figma/figma.module.ts
@Module({
  controllers: [FigmaOAuthController],
  providers: [
    FigmaTokenService,
    FigmaApiClient,
    {
      provide: FIGMA_INTEGRATION_REPOSITORY,
      useClass: FirestoreFigmaIntegrationRepository,
    },
  ],
  exports: [FigmaTokenService, FigmaApiClient],
})
export class FigmaModule {}
```

---

## Environment Variables Required

```bash
# .env
FIGMA_CLIENT_ID=<from Figma OAuth app>
FIGMA_CLIENT_SECRET=<from Figma OAuth app>
FIGMA_OAUTH_REDIRECT_URI=http://localhost:3000/api/figma/oauth/callback (prod: https://...)
```

---

## OAuth Security Considerations

1. **State Token Protection:**
   - Generate random nonce + workspace ID
   - Sign with HMAC-SHA256 using encryption key
   - Validate HMAC on callback (CSRF protection)

2. **Token Encryption:**
   - AES-256-CBC encryption with IV
   - IV prepended to ciphertext (IV:ciphertext)
   - Encryption key derived with scrypt from GITHUB_ENCRYPTION_KEY

3. **Scope:**
   - Use minimal scope: `file_content_read` only (can read files, cannot modify)
   - No write permissions needed for metadata fetching

4. **Token Storage:**
   - Workspace-level (one per workspace, not per user)
   - Encrypted in Firestore
   - Auto-overwrite on reconnect (prevent token leakage from stale storage)

---

## Testing Strategy

### Unit Tests

1. **FigmaTokenService**
   - ✅ exchangeCodeForToken: Parses response correctly
   - ✅ getUserInfo: Extracts email and workspace name
   - ✅ encryptToken: Creates IV + ciphertext
   - ✅ decryptToken: Recovers original token
   - ✅ generateSignedState: Creates nonce + HMAC
   - ✅ parseSignedState: Validates HMAC correctly
   - ✅ parseSignedState: Rejects invalid HMAC

2. **FigmaIntegration Domain**
   - ✅ create: Initializes with timestamps
   - ✅ updateAccessToken: Updates encrypted token
   - ✅ reconstitute: Recovers from persisted data
   - ✅ toObject: Returns all fields

### Integration Tests

1. **FigmaOAuthController**
   - ✅ authorize: Returns valid OAuth URL with state
   - ✅ callback: Exchanges code and saves token
   - ✅ callback: Invalid state → redirect with error
   - ✅ callback: Token exchange failure → redirect with error
   - ✅ getConnectionStatus: Returns connected=true with email
   - ✅ getConnectionStatus: Returns connected=false when not connected
   - ✅ disconnect: Removes integration

2. **Firestore Repository**
   - ✅ save: Encrypts token in storage
   - ✅ findByWorkspaceId: Returns integration
   - ✅ findByWorkspaceId: Returns null when not found
   - ✅ deleteByWorkspaceId: Removes from Firestore

---

## Integration Points

**Upstream (Depends On):**
- ConfigService (for env vars)
- Firestore (for token storage)
- FirebaseAuthGuard, WorkspaceGuard (authentication)

**Downstream (Feeds Into):**
- Story 26-10: FigmaApiService & Metadata Fetcher (uses token to fetch metadata)
- Story 26-13: Frontend Rich Preview Cards (displays fetched metadata)

---

## Dependencies

**NestJS:**
- @nestjs/common, @nestjs/config

**Built-in Node.js:**
- crypto (encryption, HMAC, scrypt)

**Firestore:**
- firebase-admin/firestore

---

## Rollout Plan

1. **30 minutes:** Create FigmaTokenService with encryption/decryption
2. **30 minutes:** Create FigmaIntegration domain model + repository interface
3. **30 minutes:** Create FirestoreFigmaIntegrationRepository
4. **1 hour:** Create FigmaOAuthController with endpoints
5. **30 minutes:** Create FigmaModule and register in app.module.ts
6. **15 minutes:** Add env vars to .env
7. **Commit:** After integration tests pass

---

## Known Risks

1. **Figma API Availability:** Figma OAuth endpoints might be rate-limited
   - *Mitigation:* Implement exponential backoff retry logic (Story 26-10)

2. **Token Expiry:** Figma tokens might expire (need refresh token handling)
   - *Mitigation:* Store refresh_token if returned, implement refresh flow (future enhancement)

3. **Workspace Mismatch:** User connects workspace A, but tries to use with workspace B
   - *Mitigation:* Repository keyed by workspaceId, guards prevent cross-workspace access

4. **Encryption Key Rotation:** If GITHUB_ENCRYPTION_KEY changes, old tokens become unreadable
   - *Mitigation:* Document process for rotating keys (future enhancement)

---

## Success Metrics

- ✅ OAuth flow completes without errors
- ✅ Access token encrypted before storage
- ✅ State token validated with HMAC
- ✅ Error redirects include error query param
- ✅ Connection status returns correct data
- ✅ Disconnect removes integration
- ✅ All unit/integration tests pass (>80% coverage)
- ✅ 0 TypeScript errors, 0 console warnings
- ✅ Follows Jira/Linear OAuth pattern exactly

---

## Follow-Up Stories

- **26-10:** Backend - Figma API Service & Metadata Fetcher (uses this OAuth token)
- **26-14:** Frontend - Settings Page Integrations (displays connection status UI)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO (Blocked by: Phase 1)
