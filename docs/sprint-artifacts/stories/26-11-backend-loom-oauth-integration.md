# Story 26-11: Backend - Loom OAuth Integration

**Epic:** Epic 26 - Design Link Integration with LLM Leverage
**Status:** TODO (Blocked by: Phase 1)
**Priority:** HIGH
**Effort:** 3.5 hours
**Assignee:** TBD

---

## Objective

Implement Loom OAuth 2.0 integration following the existing Figma/Linear OAuth pattern:
1. Create Loom OAuth controller with start/callback endpoints
2. Implement state-signed tokens with HMAC validation (CSRF protection)
3. Create LoomIntegrationRepository for encrypted workspace-level token storage
4. Create LoomTokenService for token encryption/decryption + token exchange
5. Handle OAuth errors gracefully with user-friendly redirects

---

## Acceptance Criteria

- ✅ LoomOAuthController created with start/callback endpoints
- ✅ GET /loom/oauth/authorize returns OAuth URL + state token (signed with HMAC)
- ✅ GET /loom/oauth/callback exchanges code for access token and stores encrypted
- ✅ State token validated with HMAC (CSRF protection)
- ✅ Access token encrypted with AES-256-CBC before storage
- ✅ Workspace-level token storage (one token per workspace)
- ✅ LoomIntegrationRepository implements Firestore persistence
- ✅ LoomTokenService provides encrypt/decrypt/generateSignedState/parseSignedState
- ✅ LoomTokenService.exchangeCodeForToken() exchanges OAuth code for access token
- ✅ Error handling: Invalid state → redirect with error=invalid_state
- ✅ Error handling: Token exchange failed → redirect with error=loom_connection_failed
- ✅ POST /loom/oauth/disconnect removes workspace integration
- ✅ GET /loom/oauth/connection returns connection status (connected: boolean, email, workspace name)
- ✅ Guards: FirebaseAuthGuard, WorkspaceGuard on protected endpoints
- ✅ Logging: All OAuth events logged to console
- ✅ No console warnings or TypeScript errors
- ✅ Follows existing Figma/Linear patterns exactly

---

## Files Created

```
backend/src/loom/
  ├── loom.module.ts                           (NEW - Module registration)
  ├── loom-oauth.controller.ts                 (NEW - OAuth endpoints)
  ├── application/
  │   └── services/
  │       ├── loom-token.service.ts            (NEW - Encrypt/decrypt, state, token exchange)
  │       └── loom-api-client.ts               (NEW - Loom API client, placeholder)
  ├── domain/
  │   ├── LoomIntegration.ts                   (NEW - Domain model)
  │   └── LoomIntegrationRepository.ts         (NEW - Repository interface)
  └── infrastructure/
      └── persistence/
          └── firestore-loom-integration.repository.ts   (NEW - Firestore impl)
```

---

## Files Modified

```
backend/src/app.module.ts
  - Import LoomModule in imports array
  - Register Loom OAuth routes

backend/src/main.ts
  - No changes needed (Loom env vars loaded from config)
```

---

## Implementation Notes

### 1. LoomTokenService

```typescript
// backend/src/loom/application/services/loom-token.service.ts
export interface LoomTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
}

export interface LoomUserInfo {
  id: string;
  email: string;
  name: string;
  workspace?: string;
}

@Injectable()
export class LoomTokenService {
  private readonly logger = new Logger(LoomTokenService.name);
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('GITHUB_ENCRYPTION_KEY') || '';
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<LoomTokenResponse> {
    const clientId = this.configService.get<string>('LOOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('LOOM_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Loom OAuth credentials not configured');
    }

    const response = await fetch('https://api.loom.com/api/v1/oauth/token', {
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
      throw new Error(`Loom token exchange failed: ${text}`);
    }

    const data = (await response.json()) as any;

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'Bearer',
      expiresIn: data.expires_in || 3600,
      refreshToken: data.refresh_token,
    };
  }

  async getUserInfo(accessToken: string): Promise<LoomUserInfo> {
    const response = await fetch('https://api.loom.com/api/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Loom user info: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    return {
      id: data.user?.id || data.id,
      email: data.user?.email || data.email,
      name: data.user?.full_name || data.full_name || 'Unknown',
      workspace: data.workspace?.name,
    };
  }

  async encryptToken(token: string): Promise<string> {
    const key = await this.getDerivedKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

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

  generateSignedState(workspaceId: string): string {
    const nonce = randomBytes(16).toString('hex');
    const payload = `${nonce}.${workspaceId}`;
    const hmac = this.computeHmac(payload);
    return `${payload}.${hmac}`;
  }

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

### 2. LoomOAuthController

```typescript
// backend/src/loom/loom-oauth.controller.ts
@Controller('loom/oauth')
export class LoomOAuthController {
  private readonly logger = new Logger(LoomOAuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: LoomTokenService,
    private readonly apiClient: LoomApiClient,
    @Inject(LOOM_INTEGRATION_REPOSITORY)
    private readonly integrationRepository: LoomIntegrationRepository,
  ) {}

  @Get('authorize')
  @UseGuards(FirebaseAuthGuard, WorkspaceGuard)
  async authorize(@WorkspaceId() workspaceId: string): Promise<{ oauthUrl: string; state: string }> {
    const clientId = this.configService.get<string>('LOOM_CLIENT_ID');
    const redirectUri = this.configService.get<string>('LOOM_OAUTH_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new InternalServerErrorException('Loom OAuth not configured');
    }

    const state = this.tokenService.generateSignedState(workspaceId);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'video:library',
      state,
    });

    const oauthUrl = `https://app.loom.com/oauth/authorize?${params.toString()}`;

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
      const redirectUri = this.configService.get<string>('LOOM_OAUTH_REDIRECT_URI')!;

      const tokenResponse = await this.tokenService.exchangeCodeForToken(code, redirectUri);
      const userInfo = await this.apiClient.getUserInfo(tokenResponse.accessToken);
      const encryptedToken = await this.tokenService.encryptToken(tokenResponse.accessToken);

      const existing = await this.integrationRepository.findByWorkspaceId(workspaceId);
      if (existing) {
        existing.updateAccessToken(encryptedToken);
        await this.integrationRepository.save(existing);
      } else {
        const integration = LoomIntegration.create(
          `loom_${workspaceId}`,
          workspaceId,
          encryptedToken,
          userInfo.email,
          userInfo.workspace || 'Default',
        );
        await this.integrationRepository.save(integration);
      }

      this.logger.log(`Loom connected for workspace ${workspaceId} (${userInfo.email})`);
      return { url: `${frontendUrl}/settings?loom_connected=true` };
    } catch (error: any) {
      this.logger.error(`Loom OAuth callback failed: ${error.message}`);
      return { url: `${frontendUrl}/settings?error=loom_connection_failed` };
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
      throw new NotFoundException('Loom not connected');
    }

    await this.integrationRepository.deleteByWorkspaceId(workspaceId);
    this.logger.log(`Loom disconnected for workspace ${workspaceId}`);
    return { success: true };
  }
}
```

### 3. LoomIntegration Domain Model

```typescript
// backend/src/loom/domain/LoomIntegration.ts
export class LoomIntegration {
  private constructor(
    readonly id: string,
    readonly workspaceId: string,
    private accessToken: string,
    readonly email: string,
    readonly workspace: string,
    readonly connectedAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    workspaceId: string,
    encryptedToken: string,
    email: string,
    workspace: string,
  ): LoomIntegration {
    const now = new Date();
    return new LoomIntegration(id, workspaceId, encryptedToken, email, workspace, now, now);
  }

  static reconstitute(props: any): LoomIntegration {
    return new LoomIntegration(
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

### 4. LoomIntegrationRepository Interface

```typescript
// backend/src/loom/domain/LoomIntegrationRepository.ts
export const LOOM_INTEGRATION_REPOSITORY = 'LOOM_INTEGRATION_REPOSITORY';

export interface LoomIntegrationRepository {
  findByWorkspaceId(workspaceId: string): Promise<LoomIntegration | null>;
  save(integration: LoomIntegration): Promise<void>;
  deleteByWorkspaceId(workspaceId: string): Promise<void>;
}
```

### 5. LoomIntegration Firestore Repository

```typescript
// backend/src/loom/infrastructure/persistence/firestore-loom-integration.repository.ts
@Injectable()
export class FirestoreLoomIntegrationRepository implements LoomIntegrationRepository {
  private readonly logger = new Logger(FirestoreLoomIntegrationRepository.name);

  constructor(private readonly firestore: Firestore) {}

  async findByWorkspaceId(workspaceId: string): Promise<LoomIntegration | null> {
    try {
      const doc = await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc('loom')
        .get();

      if (!doc.exists) return null;
      return this.toDomain(doc.data() as LoomIntegrationDocument);
    } catch (error: any) {
      this.logger.error(`Failed to find Loom integration: ${error.message}`);
      throw error;
    }
  }

  async save(integration: LoomIntegration): Promise<void> {
    try {
      const data = this.toDocument(integration);
      await this.firestore
        .collection('workspaces')
        .doc(integration.workspaceId)
        .collection('integrations')
        .doc('loom')
        .set(data, { merge: true });
    } catch (error: any) {
      this.logger.error(`Failed to save Loom integration: ${error.message}`);
      throw error;
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    try {
      await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc('loom')
        .delete();
    } catch (error: any) {
      this.logger.error(`Failed to delete Loom integration: ${error.message}`);
      throw error;
    }
  }

  private toDocument(integration: LoomIntegration): LoomIntegrationDocument {
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

  private toDomain(doc: LoomIntegrationDocument): LoomIntegration {
    return LoomIntegration.reconstitute({
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

### 6. LoomModule Registration

```typescript
// backend/src/loom/loom.module.ts
@Module({
  controllers: [LoomOAuthController],
  providers: [
    LoomTokenService,
    LoomApiClient,
    {
      provide: LOOM_INTEGRATION_REPOSITORY,
      useClass: FirestoreLoomIntegrationRepository,
    },
  ],
  exports: [LoomTokenService, LoomApiClient],
})
export class LoomModule {}
```

---

## Environment Variables Required

```bash
# .env
LOOM_CLIENT_ID=<from Loom OAuth app>
LOOM_CLIENT_SECRET=<from Loom OAuth app>
LOOM_OAUTH_REDIRECT_URI=http://localhost:3000/api/loom/oauth/callback (prod: https://...)
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
   - Use minimal scope: `video:library` (read video metadata only)
   - No create/delete permissions

4. **Token Storage:**
   - Workspace-level (one per workspace, not per user)
   - Encrypted in Firestore
   - Auto-overwrite on reconnect

---

## Testing Strategy

### Unit Tests

1. **LoomTokenService**
   - ✅ exchangeCodeForToken: Parses response correctly
   - ✅ getUserInfo: Extracts email and workspace name
   - ✅ encryptToken: Creates IV + ciphertext
   - ✅ decryptToken: Recovers original token
   - ✅ generateSignedState: Creates nonce + HMAC
   - ✅ parseSignedState: Validates HMAC correctly
   - ✅ parseSignedState: Rejects invalid HMAC

2. **LoomIntegration Domain**
   - ✅ create: Initializes with timestamps
   - ✅ updateAccessToken: Updates encrypted token
   - ✅ reconstitute: Recovers from persisted data
   - ✅ toObject: Returns all fields

### Integration Tests

1. **LoomOAuthController**
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
- Story 26-12: LoomApiService & Metadata Fetcher (uses token to fetch metadata)
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

1. **30 minutes:** Create LoomTokenService with encryption/decryption
2. **30 minutes:** Create LoomIntegration domain model + repository interface
3. **30 minutes:** Create FirestoreLoomIntegrationRepository
4. **1 hour:** Create LoomOAuthController with endpoints
5. **30 minutes:** Create LoomModule and register in app.module.ts
6. **15 minutes:** Add env vars to .env
7. **Commit:** After integration tests pass

---

## Known Risks

1. **Loom API Availability:** Loom OAuth endpoints might be rate-limited
   - *Mitigation:* Implement exponential backoff retry logic (Story 26-12)

2. **Token Expiry:** Loom tokens might expire (need refresh token handling)
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
- ✅ Follows Figma/Linear OAuth pattern exactly

---

## Follow-Up Stories

- **26-12:** Backend - Loom API Service & Metadata Fetcher (uses this OAuth token)
- **26-14:** Frontend - Settings Page Integrations (displays connection status UI)

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Status:** TODO (Blocked by: Phase 1)
