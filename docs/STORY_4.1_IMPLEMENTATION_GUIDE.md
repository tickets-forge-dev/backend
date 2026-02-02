# Story 4.1: GitHub App Integration - Implementation Guide

**Story:** GitHub App Integration - Read-Only Repo Access  
**Started:** 2026-02-02  
**Status:** 🟡 Ready to Start  
**Estimated Effort:** 40-60 hours

---

## Quick Start

```bash
# 1. Create feature branch from main
git checkout main
git pull
git checkout -b feature/story-4.1-github-app-integration

# 2. Ensure you're in project root
cd /Users/Idana/Documents/GitHub/forge

# 3. Follow implementation phases below
```

---

## Prerequisites Checklist

Before starting:
- [ ] Read story file: `docs/sprint-artifacts/4-1-github-app-integration-read-only-repo-access.md`
- [ ] Read context file: `docs/sprint-artifacts/4-1-github-app-integration-read-only-repo-access.context.xml`
- [ ] GitHub account with admin access
- [ ] Story 4.0 (Branch Selection) completed ✅

---

## Phase 1: GitHub App Setup (Manual) ⏱️ 30-60 minutes

### Step 1.1: Create GitHub App

Go to: https://github.com/settings/apps/new

**App Settings:**
```
Name: Executable Tickets (Dev)
Description: Read-only access for code-aware ticket generation
Homepage URL: http://localhost:3000
Callback URL: http://localhost:3000/api/auth/github/callback
Setup URL: (leave empty)
Webhook URL: http://localhost:3001/api/webhooks/github
  (or use ngrok: https://your-ngrok-url.ngrok.io/api/webhooks/github)
Webhook Secret: Generate random string (save for .env)
```

**Repository Permissions:**
- Contents: Read-only
- Metadata: Read-only (auto-selected)

**Organization Permissions:**
- Members: Read-only

**User Permissions:**
- Email addresses: Read-only

**Subscribe to Events:**
- [x] Push
- [x] Pull request

**Where can this GitHub App be installed?**
- [x] Any account

Click **Create GitHub App**

### Step 1.2: Save Credentials

After creation, you'll see:

1. **App ID** - Copy this
2. **Client ID** - Copy this
3. Click **Generate a new client secret** - Copy this immediately (shown once)
4. Webhook Secret - Copy what you used above

### Step 1.3: Generate Private Key (Optional for OAuth)

Scroll down to "Private keys" section:
- Click **Generate a private key**
- Save the `.pem` file (optional for App installation, not needed for OAuth)

### Step 1.4: Update Environment Variables

**Backend `.env`:**
```bash
# GitHub App OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_APP_ID=your_app_id_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# GitHub OAuth Callback URL
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Optional: For token encryption (or use existing encryption key)
GITHUB_TOKEN_ENCRYPTION_KEY=generate_random_32_char_key
```

### Step 1.5: Install App to Your Test Organization

1. Go to your GitHub App page
2. Click "Install App" in left sidebar
3. Select your test organization or personal account
4. Choose "All repositories" or "Only select repositories"
5. Click "Install"

---

## Phase 2: Backend Domain Layer ⏱️ 4-6 hours

### Step 2.1: Create GitHubIntegration Entity

**File:** `backend/src/github/domain/GitHubIntegration.ts`

```typescript
import { randomUUID } from 'crypto';

export type GitHubConnectionStatus = 'disconnected' | 'connected' | 'error';

export class GitHubIntegration {
  private constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    private _accessToken: string,
    private _refreshToken: string | null,
    private _expiresAt: Date | null,
    private _selectedRepositoryIds: string[],
    private _webhookSecret: string,
    private _status: GitHubConnectionStatus,
    private _installedAt: Date,
    private _lastSyncedAt: Date | null,
    private _githubUserId: number,
    private _githubUsername: string,
  ) {}

  static create(
    workspaceId: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date | null,
    webhookSecret: string,
    githubUserId: number,
    githubUsername: string,
  ): GitHubIntegration {
    return new GitHubIntegration(
      `github_${randomUUID()}`,
      workspaceId,
      accessToken,
      refreshToken,
      expiresAt,
      [],
      webhookSecret,
      'connected',
      new Date(),
      null,
      githubUserId,
      githubUsername,
    );
  }

  static reconstitute(
    id: string,
    workspaceId: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date | null,
    selectedRepositoryIds: string[],
    webhookSecret: string,
    status: GitHubConnectionStatus,
    installedAt: Date,
    lastSyncedAt: Date | null,
    githubUserId: number,
    githubUsername: string,
  ): GitHubIntegration {
    return new GitHubIntegration(
      id,
      workspaceId,
      accessToken,
      refreshToken,
      expiresAt,
      selectedRepositoryIds,
      webhookSecret,
      status,
      installedAt,
      lastSyncedAt,
      githubUserId,
      githubUsername,
    );
  }

  selectRepositories(repositoryIds: string[]): void {
    this._selectedRepositoryIds = repositoryIds;
    this._lastSyncedAt = new Date();
  }

  updateToken(accessToken: string, refreshToken: string | null, expiresAt: Date | null): void {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    this._expiresAt = expiresAt;
  }

  markAsError(): void {
    this._status = 'error';
  }

  disconnect(): void {
    this._status = 'disconnected';
  }

  isTokenExpired(): boolean {
    if (!this._expiresAt) return false;
    return new Date() >= this._expiresAt;
  }

  // Getters
  get accessToken(): string {
    return this._accessToken;
  }
  get refreshToken(): string | null {
    return this._refreshToken;
  }
  get expiresAt(): Date | null {
    return this._expiresAt;
  }
  get selectedRepositoryIds(): string[] {
    return [...this._selectedRepositoryIds];
  }
  get webhookSecret(): string {
    return this._webhookSecret;
  }
  get status(): GitHubConnectionStatus {
    return this._status;
  }
  get installedAt(): Date {
    return this._installedAt;
  }
  get lastSyncedAt(): Date | null {
    return this._lastSyncedAt;
  }
  get githubUserId(): number {
    return this._githubUserId;
  }
  get githubUsername(): string {
    return this._githubUsername;
  }
}
```

### Step 2.2: Create Repository Interface

**File:** `backend/src/github/domain/GitHubIntegrationRepository.ts`

```typescript
import { GitHubIntegration } from './GitHubIntegration';

export interface IGitHubIntegrationRepository {
  save(integration: GitHubIntegration): Promise<void>;
  findByWorkspace(workspaceId: string): Promise<GitHubIntegration | null>;
  delete(workspaceId: string): Promise<void>;
}
```

### Step 2.3: Create Value Objects

**File:** `backend/src/github/domain/GitHubRepository.ts`

```typescript
export interface GitHubRepository {
  id: string;
  nodeId: string;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  updatedAt: Date;
  language: string | null;
}
```

---

## Phase 3: Application Layer ⏱️ 8-10 hours

### Step 3.1: Create GitHub Token Service

**File:** `backend/src/github/application/services/GitHubTokenService.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface GitHubTokenResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  githubUserId: number;
  githubUsername: string;
}

@Injectable()
export class GitHubTokenService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly encryptionKey: Buffer;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID!;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    
    // Encryption key should be 32 bytes
    const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || 'dev-key-32-characters-long!!!';
    this.encryptionKey = Buffer.from(key.slice(0, 32));
  }

  async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
    // Exchange authorization code for access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description}`);
    }

    // Get user info
    const octokit = new Octokit({ auth: data.access_token });
    const { data: user } = await octokit.users.getAuthenticated();

    // Calculate expiration (GitHub tokens don't expire by default)
    const expiresAt = data.expires_in 
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt,
      githubUserId: user.id,
      githubUsername: user.login,
    };
  }

  async refreshToken(refreshToken: string): Promise<GitHubTokenResponse> {
    // GitHub OAuth doesn't support refresh tokens by default
    // This is a placeholder for when/if you enable expiring tokens
    throw new Error('Token refresh not supported');
  }

  async revokeToken(accessToken: string): Promise<void> {
    // Revoke the OAuth token
    await fetch(`https://api.github.com/applications/${this.clientId}/token`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });
  }

  encryptToken(token: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptToken(encryptedToken: string): string {
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Step 3.2: Create Use Cases

**File:** `backend/src/github/application/use-cases/ConnectGitHubUseCase.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IGitHubIntegrationRepository } from '../../domain/GitHubIntegrationRepository';
import { GitHubIntegration } from '../../domain/GitHubIntegration';
import { GitHubTokenService } from '../services/GitHubTokenService';

@Injectable()
export class ConnectGitHubUseCase {
  constructor(
    private readonly repository: IGitHubIntegrationRepository,
    private readonly tokenService: GitHubTokenService,
  ) {}

  async execute(workspaceId: string, code: string, webhookSecret: string): Promise<void> {
    // Exchange code for token
    const tokenResponse = await this.tokenService.exchangeCodeForToken(code);

    // Encrypt token before storage
    const encryptedToken = this.tokenService.encryptToken(tokenResponse.accessToken);
    const encryptedRefreshToken = tokenResponse.refreshToken
      ? this.tokenService.encryptToken(tokenResponse.refreshToken)
      : null;

    // Check if integration already exists
    const existing = await this.repository.findByWorkspace(workspaceId);
    
    if (existing) {
      // Update existing integration
      existing.updateToken(encryptedToken, encryptedRefreshToken, tokenResponse.expiresAt);
      await this.repository.save(existing);
    } else {
      // Create new integration
      const integration = GitHubIntegration.create(
        workspaceId,
        encryptedToken,
        encryptedRefreshToken,
        tokenResponse.expiresAt,
        webhookSecret,
        tokenResponse.githubUserId,
        tokenResponse.githubUsername,
      );
      await this.repository.save(integration);
    }
  }
}
```

**File:** `backend/src/github/application/use-cases/GetGitHubRepositoriesUseCase.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { IGitHubIntegrationRepository } from '../../domain/GitHubIntegrationRepository';
import { GitHubRepository } from '../../domain/GitHubRepository';
import { GitHubTokenService } from '../services/GitHubTokenService';

@Injectable()
export class GetGitHubRepositoriesUseCase {
  constructor(
    private readonly repository: IGitHubIntegrationRepository,
    private readonly tokenService: GitHubTokenService,
  ) {}

  async execute(workspaceId: string): Promise<GitHubRepository[]> {
    // Get integration
    const integration = await this.repository.findByWorkspace(workspaceId);
    if (!integration || integration.status === 'disconnected') {
      throw new Error('GitHub not connected');
    }

    // Decrypt token
    const token = this.tokenService.decryptToken(integration.accessToken);

    // Fetch repositories
    const octokit = new Octokit({ auth: token });
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
    });

    return repos.map(repo => ({
      id: String(repo.id),
      nodeId: repo.node_id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      htmlUrl: repo.html_url,
      defaultBranch: repo.default_branch,
      updatedAt: new Date(repo.updated_at),
      language: repo.language,
    }));
  }
}
```

**File:** `backend/src/github/application/use-cases/SelectRepositoriesUseCase.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IGitHubIntegrationRepository } from '../../domain/GitHubIntegrationRepository';

@Injectable()
export class SelectRepositoriesUseCase {
  constructor(
    private readonly repository: IGitHubIntegrationRepository,
  ) {}

  async execute(workspaceId: string, repositoryIds: string[]): Promise<void> {
    const integration = await this.repository.findByWorkspace(workspaceId);
    if (!integration) {
      throw new Error('GitHub not connected');
    }

    integration.selectRepositories(repositoryIds);
    await this.repository.save(integration);
  }
}
```

**File:** `backend/src/github/application/use-cases/DisconnectGitHubUseCase.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IGitHubIntegrationRepository } from '../../domain/GitHubIntegrationRepository';
import { GitHubTokenService } from '../services/GitHubTokenService';

@Injectable()
export class DisconnectGitHubUseCase {
  constructor(
    private readonly repository: IGitHubIntegrationRepository,
    private readonly tokenService: GitHubTokenService,
  ) {}

  async execute(workspaceId: string): Promise<void> {
    const integration = await this.repository.findByWorkspace(workspaceId);
    if (!integration) {
      return; // Already disconnected
    }

    try {
      // Revoke token on GitHub
      const token = this.tokenService.decryptToken(integration.accessToken);
      await this.tokenService.revokeToken(token);
    } catch (error) {
      // Continue even if revocation fails
      console.error('Failed to revoke GitHub token:', error);
    }

    // Delete from database
    await this.repository.delete(workspaceId);
  }
}
```

---

## Phase 4: Infrastructure Layer ⏱️ 4-6 hours

### Step 4.1: Create Firestore Repository Implementation

**File:** `backend/src/github/infrastructure/persistence/FirestoreGitHubIntegrationRepository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { IGitHubIntegrationRepository } from '../../domain/GitHubIntegrationRepository';
import { GitHubIntegration } from '../../domain/GitHubIntegration';

@Injectable()
export class FirestoreGitHubIntegrationRepository implements IGitHubIntegrationRepository {
  constructor(private readonly firestore: Firestore) {}

  async save(integration: GitHubIntegration): Promise<void> {
    const docRef = this.firestore
      .collection('workspaces')
      .doc(integration.workspaceId)
      .collection('integrations')
      .doc('github');

    await docRef.set({
      id: integration.id,
      workspaceId: integration.workspaceId,
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt,
      selectedRepositoryIds: integration.selectedRepositoryIds,
      webhookSecret: integration.webhookSecret,
      status: integration.status,
      installedAt: integration.installedAt,
      lastSyncedAt: integration.lastSyncedAt,
      githubUserId: integration.githubUserId,
      githubUsername: integration.githubUsername,
    });
  }

  async findByWorkspace(workspaceId: string): Promise<GitHubIntegration | null> {
    const docRef = this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection('integrations')
      .doc('github');

    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return GitHubIntegration.reconstitute(
      data.id,
      data.workspaceId,
      data.accessToken,
      data.refreshToken,
      data.expiresAt?.toDate() || null,
      data.selectedRepositoryIds || [],
      data.webhookSecret,
      data.status,
      data.installedAt.toDate(),
      data.lastSyncedAt?.toDate() || null,
      data.githubUserId,
      data.githubUsername,
    );
  }

  async delete(workspaceId: string): Promise<void> {
    const docRef = this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection('integrations')
      .doc('github');

    await docRef.delete();
  }
}
```

---

## Phase 5: Presentation Layer ⏱️ 6-8 hours

### Step 5.1: Create Controller

**File:** `backend/src/github/presentation/controllers/GitHubOAuthController.ts`

```typescript
import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { FirebaseAuthGuard } from '../../../shared/infrastructure/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/infrastructure/guards/WorkspaceGuard';
import { WorkspaceId } from '../../../shared/infrastructure/decorators/WorkspaceId';
import { ConnectGitHubUseCase } from '../../application/use-cases/ConnectGitHubUseCase';
import { GetGitHubRepositoriesUseCase } from '../../application/use-cases/GetGitHubRepositoriesUseCase';
import { SelectRepositoriesUseCase } from '../../application/use-cases/SelectRepositoriesUseCase';
import { DisconnectGitHubUseCase } from '../../application/use-cases/DisconnectGitHubUseCase';

@Controller('api/github')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class GitHubOAuthController {
  constructor(
    private readonly connectGitHubUseCase: ConnectGitHubUseCase,
    private readonly getRepositoriesUseCase: GetGitHubRepositoriesUseCase,
    private readonly selectRepositoriesUseCase: SelectRepositoriesUseCase,
    private readonly disconnectGitHubUseCase: DisconnectGitHubUseCase,
  ) {}

  @Get('oauth/authorize')
  getOAuthUrl(@WorkspaceId() workspaceId: string) {
    const clientId = process.env.GITHUB_CLIENT_ID!;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL!;
    const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', callbackUrl);
    url.searchParams.append('scope', 'read:user repo');
    url.searchParams.append('state', state);

    return { url: url.toString() };
  }

  @Get('oauth/callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // Decode state
      const { workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString());
      
      // Connect GitHub
      const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET!;
      await this.connectGitHubUseCase.execute(workspaceId, code, webhookSecret);

      // Redirect to settings page
      res.redirect('/settings/integrations?github=connected');
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect('/settings/integrations?github=error');
    }
  }

  @Get('repositories')
  async listRepositories(@WorkspaceId() workspaceId: string) {
    const repositories = await this.getRepositoriesUseCase.execute(workspaceId);
    return { repositories };
  }

  @Post('repositories/select')
  async selectRepositories(
    @WorkspaceId() workspaceId: string,
    @Body() body: { repositoryIds: string[] },
  ) {
    await this.selectRepositoriesUseCase.execute(workspaceId, body.repositoryIds);
    return { success: true };
  }

  @Post('disconnect')
  async disconnect(@WorkspaceId() workspaceId: string) {
    await this.disconnectGitHubUseCase.execute(workspaceId);
    return { success: true };
  }
}
```

### Step 5.2: Create Webhook Handler

**File:** `backend/src/github/infrastructure/webhooks/GitHubWebhookHandler.ts`

```typescript
import { Controller, Post, Req, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { createHmac } from 'crypto';

@Controller('api/webhooks/github')
export class GitHubWebhookHandler {
  private readonly webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET!;
  }

  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
  ) {
    // Verify signature
    if (!this.verifySignature(req.body, signature)) {
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    // Handle events
    switch (event) {
      case 'push':
        await this.handlePushEvent(req.body);
        break;
      case 'pull_request':
        await this.handlePullRequestEvent(req.body);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    return { received: true };
  }

  private verifySignature(payload: any, signature: string): boolean {
    const hmac = createHmac('sha256', this.webhookSecret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
    return digest === signature;
  }

  private async handlePushEvent(payload: any): Promise<void> {
    console.log('Push event received:', {
      repository: payload.repository.full_name,
      ref: payload.ref,
      commits: payload.commits.length,
    });
    
    // TODO: Queue re-index job (Story 4.2)
  }

  private async handlePullRequestEvent(payload: any): Promise<void> {
    console.log('Pull request event received:', {
      repository: payload.repository.full_name,
      action: payload.action,
      number: payload.pull_request.number,
    });
    
    // TODO: Update branch list (Story 4.2)
  }
}
```

### Step 5.3: Create GitHub Module

**File:** `backend/src/github/github.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { GitHubOAuthController } from './presentation/controllers/GitHubOAuthController';
import { GitHubWebhookHandler } from './infrastructure/webhooks/GitHubWebhookHandler';
import { GitHubTokenService } from './application/services/GitHubTokenService';
import { ConnectGitHubUseCase } from './application/use-cases/ConnectGitHubUseCase';
import { GetGitHubRepositoriesUseCase } from './application/use-cases/GetGitHubRepositoriesUseCase';
import { SelectRepositoriesUseCase } from './application/use-cases/SelectRepositoriesUseCase';
import { DisconnectGitHubUseCase } from './application/use-cases/DisconnectGitHubUseCase';
import { FirestoreGitHubIntegrationRepository } from './infrastructure/persistence/FirestoreGitHubIntegrationRepository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [GitHubOAuthController, GitHubWebhookHandler],
  providers: [
    GitHubTokenService,
    ConnectGitHubUseCase,
    GetGitHubRepositoriesUseCase,
    SelectRepositoriesUseCase,
    DisconnectGitHubUseCase,
    {
      provide: 'IGitHubIntegrationRepository',
      useClass: FirestoreGitHubIntegrationRepository,
    },
  ],
  exports: [GitHubTokenService],
})
export class GitHubModule {}
```

### Step 5.4: Register Module in App

**File:** `backend/src/app.module.ts`

```typescript
import { GitHubModule } from './github/github.module';

@Module({
  imports: [
    // ... existing modules
    GitHubModule,
  ],
  // ...
})
export class AppModule {}
```

---

## Phase 6: Frontend Implementation ⏱️ 10-15 hours

### Step 6.1: Update GitHub Service

**File:** `client/src/services/github.service.ts`

```typescript
class GitHubService {
  async getOAuthUrl(): Promise<string> {
    const response = await fetch('/api/github/oauth/authorize', {
      headers: { Authorization: `Bearer ${await this.getAuthToken()}` },
    });
    const data = await response.json();
    return data.url;
  }

  async getConnectionStatus(workspaceId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/github/repositories', {
        headers: { Authorization: `Bearer ${await this.getAuthToken()}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listRepositories(): Promise<GitHubRepository[]> {
    const response = await fetch('/api/github/repositories', {
      headers: { Authorization: `Bearer ${await this.getAuthToken()}` },
    });
    const data = await response.json();
    return data.repositories;
  }

  async selectRepositories(repositoryIds: string[]): Promise<void> {
    await fetch('/api/github/repositories/select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify({ repositoryIds }),
    });
  }

  async disconnect(): Promise<void> {
    await fetch('/api/github/disconnect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await this.getAuthToken()}` },
    });
  }

  private async getAuthToken(): Promise<string> {
    // Get from Firebase Auth or your auth service
    // Implementation depends on your auth setup
    return 'token';
  }
}

export const githubService = new GitHubService();
```

### Step 6.2: Create Settings Store

**File:** `client/src/stores/settings.store.ts`

```typescript
import { create } from 'zustand';
import { githubService } from '../services/github.service';

interface SettingsStore {
  githubConnected: boolean;
  githubRepositories: GitHubRepository[];
  selectedRepositoryIds: string[];
  loading: boolean;
  
  loadGitHubStatus: () => Promise<void>;
  connectGitHub: () => Promise<void>;
  loadRepositories: () => Promise<void>;
  selectRepositories: (ids: string[]) => Promise<void>;
  disconnectGitHub: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  githubConnected: false,
  githubRepositories: [],
  selectedRepositoryIds: [],
  loading: false,

  loadGitHubStatus: async () => {
    const connected = await githubService.getConnectionStatus();
    set({ githubConnected: connected });
  },

  connectGitHub: async () => {
    const url = await githubService.getOAuthUrl();
    window.open(url, '_blank', 'width=600,height=700');
  },

  loadRepositories: async () => {
    set({ loading: true });
    try {
      const repos = await githubService.listRepositories();
      set({ githubRepositories: repos });
    } finally {
      set({ loading: false });
    }
  },

  selectRepositories: async (ids: string[]) => {
    await githubService.selectRepositories(ids);
    set({ selectedRepositoryIds: ids });
  },

  disconnectGitHub: async () => {
    await githubService.disconnect();
    set({ 
      githubConnected: false,
      githubRepositories: [],
      selectedRepositoryIds: [],
    });
  },
}));
```

### Step 6.3: Create GitHub Integration Component

**File:** `client/src/settings/components/GitHubIntegration.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { useSettingsStore } from '@/stores/settings.store';
import { Github, CheckCircle, XCircle } from 'lucide-react';

export function GitHubIntegration() {
  const {
    githubConnected,
    githubRepositories,
    selectedRepositoryIds,
    loading,
    loadGitHubStatus,
    connectGitHub,
    loadRepositories,
    selectRepositories,
    disconnectGitHub,
  } = useSettingsStore();

  const [localSelection, setLocalSelection] = useState<string[]>([]);

  useEffect(() => {
    loadGitHubStatus();
  }, []);

  useEffect(() => {
    if (githubConnected) {
      loadRepositories();
    }
  }, [githubConnected]);

  useEffect(() => {
    setLocalSelection(selectedRepositoryIds);
  }, [selectedRepositoryIds]);

  const handleConnect = async () => {
    await connectGitHub();
    // Popup will redirect back, listen for that
    window.addEventListener('focus', () => {
      setTimeout(() => loadGitHubStatus(), 1000);
    }, { once: true });
  };

  const handleSaveSelection = async () => {
    await selectRepositories(localSelection);
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect GitHub?')) {
      await disconnectGitHub();
    }
  };

  if (!githubConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Github className="h-6 w-6" />
          <h3 className="text-lg font-medium">GitHub</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Connect your GitHub organization for code-aware ticket generation.
          Read-only access, no code writes.
        </p>

        <Button onClick={handleConnect} className="gap-2">
          <Github className="h-4 w-4" />
          Connect GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-medium">GitHub Connected</h3>
            <p className="text-sm text-muted-foreground">
              Select repositories to index for code-aware tickets
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>

      {loading ? (
        <p>Loading repositories...</p>
      ) : (
        <div className="space-y-4">
          <h4 className="font-medium">Select Repositories</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {githubRepositories.map((repo) => (
              <label
                key={repo.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={localSelection.includes(repo.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setLocalSelection([...localSelection, repo.id]);
                    } else {
                      setLocalSelection(localSelection.filter(id => id !== repo.id));
                    }
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{repo.fullName}</p>
                  {repo.description && (
                    <p className="text-sm text-muted-foreground">{repo.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <Button onClick={handleSaveSelection} disabled={localSelection.length === 0}>
            Save Selection ({localSelection.length} repos)
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 7: Testing ⏱️ 6-8 hours

### Step 7.1: Unit Tests

**File:** `backend/src/github/domain/GitHubIntegration.spec.ts`

```typescript
import { GitHubIntegration } from './GitHubIntegration';

describe('GitHubIntegration', () => {
  it('should create new integration', () => {
    const integration = GitHubIntegration.create(
      'ws_123',
      'token',
      null,
      null,
      'secret',
      12345,
      'testuser',
    );

    expect(integration.workspaceId).toBe('ws_123');
    expect(integration.status).toBe('connected');
    expect(integration.selectedRepositoryIds).toEqual([]);
  });

  it('should select repositories', () => {
    const integration = GitHubIntegration.create(
      'ws_123',
      'token',
      null,
      null,
      'secret',
      12345,
      'testuser',
    );

    integration.selectRepositories(['repo1', 'repo2']);

    expect(integration.selectedRepositoryIds).toEqual(['repo1', 'repo2']);
    expect(integration.lastSyncedAt).toBeTruthy();
  });

  it('should detect expired tokens', () => {
    const pastDate = new Date(Date.now() - 1000);
    const integration = GitHubIntegration.create(
      'ws_123',
      'token',
      null,
      pastDate,
      'secret',
      12345,
      'testuser',
    );

    expect(integration.isTokenExpired()).toBe(true);
  });
});
```

### Step 7.2: Integration Tests

Test OAuth flow end-to-end in development environment.

---

## Phase 8: Documentation & Deployment ⏱️ 2-3 hours

### Step 8.1: Update .env.example

```bash
# Add to backend/.env.example:
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_APP_ID=your_app_id_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=generate_random_32_char_key
```

### Step 8.2: Update Sprint Status

```yaml
# In docs/sprint-artifacts/sprint-status.yaml
4-1-github-app-integration-read-only-repo-access: done
```

---

## Testing Checklist

- [ ] GitHub App created and configured
- [ ] OAuth flow works (connect button → GitHub → callback)
- [ ] Token stored encrypted in Firestore
- [ ] Repository list loads after connection
- [ ] Repository selection persists
- [ ] Disconnect flow works
- [ ] Webhook receives events (use ngrok for local testing)
- [ ] Error handling works (OAuth blocked, rate limits)
- [ ] All unit tests pass
- [ ] Integration tests pass

---

## Success Criteria

Story 4.1 is complete when:
- ✅ GitHub App created and configured
- ✅ OAuth flow works end-to-end
- ✅ Tokens encrypted and stored securely
- ✅ Repository list displayed
- ✅ Repository selection persisted
- ✅ Webhooks configured and receiving events
- ✅ Disconnect flow works
- ✅ Error handling implemented
- ✅ All tests pass
- ✅ PR merged to main

---

## Next Story

After Story 4.1 is complete, continue with:
**Story 4.2:** Code Indexing - Build Repo Index for Query

This will use the GitHub connection to index repository contents.

---

**READY TO START?** Begin with Phase 1 (GitHub App Setup)! 🚀
