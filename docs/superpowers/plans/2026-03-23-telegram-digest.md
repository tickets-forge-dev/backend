# Telegram Digest MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MCP server that connects to Telegram via MTProto and exposes tools for auth, channel selection, and message fetching — enabling any MCP-compatible AI assistant to summarize Telegram channels.

**Architecture:** Standalone TypeScript MCP server using gramjs for MTProto and `@modelcontextprotocol/sdk` for the MCP protocol. Config/state persisted at `~/.config/telegram-digest/`. A companion Claude Code skill (`/telegram:summarize-mine`) orchestrates the tools and formats the LLM prompt.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk` ^1.26.0, `telegram` (gramjs), `zod`, `tsup`, `vitest`

**Spec:** `docs/superpowers/specs/2026-03-23-telegram-digest-design.md`

**Project location:** `/home/forge/Documents/forge/telegram-digest-mcp/`

---

## File Map

| File | Responsibility |
|---|---|
| `src/index.ts` | MCP server entry point — registers tools, starts stdio transport |
| `src/config/store.ts` | Read/write `~/.config/telegram-digest/{config,state,session}` |
| `src/telegram/client.ts` | gramjs wrapper — connect, login, fetch channels, fetch messages |
| `src/tools/login.ts` | `telegram_login` tool definition + handler |
| `src/tools/logout.ts` | `telegram_logout` tool definition + handler |
| `src/tools/list-channels.ts` | `telegram_list_channels` tool definition + handler |
| `src/tools/select-channels.ts` | `telegram_select_channels` tool definition + handler |
| `src/tools/get-messages.ts` | `telegram_get_messages` tool definition + handler |
| `src/types.ts` | Shared types (ToolResult, config shapes, message shapes) |
| `tests/config/store.test.ts` | Config store unit tests |
| `tests/tools/select-channels.test.ts` | Channel selection logic tests |
| `tests/tools/get-messages.test.ts` | Message fetching logic tests |
| `skill/telegram-summarize.md` | Claude Code skill file for `/telegram:summarize-mine` |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/types.ts`

- [ ] **Step 1: Create project directory and initialize**

```bash
mkdir -p /home/forge/Documents/forge/telegram-digest-mcp
cd /home/forge/Documents/forge/telegram-digest-mcp
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "telegram-digest-mcp",
  "version": "0.1.0",
  "description": "MCP server for Telegram channel digest — fetches messages for AI-powered summarization",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "telegram-digest-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "telegram": "^2.26.22",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.17.0",
    "tsup": "^8.3.5",
    "typescript": "^5.6.3",
    "vitest": "^4.0.18"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create `tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  clean: true,
  dts: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
*.tsbuildinfo
```

- [ ] **Step 7: Create `src/types.ts`**

```typescript
// MCP tool result types (avoid importing SDK types directly for Zod v4 compat)
export interface TextContent {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: TextContent[];
  isError?: boolean;
}

// Config shapes
export interface TelegramDigestConfig {
  apiId?: number;
  apiHash?: string;
  selectedChannels: string[];
}

export interface ChannelState {
  lastReadMessageId: number;
}

export type TelegramDigestState = Record<string, ChannelState>;

// Message shapes
export interface ChannelInfo {
  id: string;
  title: string;
  unreadCount: number;
}

export interface ChannelMessage {
  id: number;
  text: string;
  date: string;
  sender: string;
}

export interface ChannelMessages {
  title: string;
  messageCount: number;
  messages: ChannelMessage[];
}
```

- [ ] **Step 8: Install dependencies**

```bash
cd /home/forge/Documents/forge/telegram-digest-mcp
npm install
```

- [ ] **Step 9: Commit scaffolding**

```bash
git init
git add .
git commit -m "chore: scaffold telegram-digest-mcp project"
```

---

## Task 2: Config Store

**Files:**
- Create: `src/config/store.ts`
- Create: `tests/config/store.test.ts`

The config store reads/writes JSON files at `~/.config/telegram-digest/`. It handles missing dirs/files gracefully.

- [ ] **Step 1: Write failing tests for config store**

```typescript
// tests/config/store.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ConfigStore } from "../src/config/store.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("ConfigStore", () => {
  let store: ConfigStore;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `tg-digest-test-${Date.now()}`);
    store = new ConfigStore(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("getConfig", () => {
    it("returns default config when no file exists", async () => {
      const config = await store.getConfig();
      expect(config).toEqual({ selectedChannels: [] });
    });

    it("reads existing config", async () => {
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, "config.json"),
        JSON.stringify({ apiId: 123, apiHash: "abc", selectedChannels: ["1"] })
      );
      const config = await store.getConfig();
      expect(config.apiId).toBe(123);
      expect(config.selectedChannels).toEqual(["1"]);
    });
  });

  describe("saveConfig", () => {
    it("creates dir and writes config", async () => {
      await store.saveConfig({ apiId: 123, apiHash: "abc", selectedChannels: [] });
      const raw = await fs.readFile(path.join(testDir, "config.json"), "utf-8");
      expect(JSON.parse(raw).apiId).toBe(123);
    });
  });

  describe("session", () => {
    it("returns empty string when no session exists", async () => {
      const session = await store.getSession();
      expect(session).toBe("");
    });

    it("saves and reads session", async () => {
      await store.saveSession("session-string-123");
      const session = await store.getSession();
      expect(session).toBe("session-string-123");
    });

    it("clears session", async () => {
      await store.saveSession("session-string-123");
      await store.clearSession();
      const session = await store.getSession();
      expect(session).toBe("");
    });
  });

  describe("state", () => {
    it("returns empty state when no file exists", async () => {
      const state = await store.getState();
      expect(state).toEqual({});
    });

    it("saves and reads state", async () => {
      await store.saveState({ "-1001234": { lastReadMessageId: 42 } });
      const state = await store.getState();
      expect(state["-1001234"].lastReadMessageId).toBe(42);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/forge/Documents/forge/telegram-digest-mcp
npx vitest run tests/config/store.test.ts
```

Expected: FAIL — `ConfigStore` not found

- [ ] **Step 3: Implement `src/config/store.ts`**

```typescript
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { TelegramDigestConfig, TelegramDigestState } from "../types.js";

const DEFAULT_DIR = path.join(os.homedir(), ".config", "telegram-digest");

export class ConfigStore {
  constructor(private readonly dir: string = DEFAULT_DIR) {}

  private filePath(name: string): string {
    return path.join(this.dir, name);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private async readJson<T>(name: string, fallback: T): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath(name), "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private async writeJson(name: string, data: unknown): Promise<void> {
    await this.ensureDir();
    await fs.writeFile(this.filePath(name), JSON.stringify(data, null, 2));
  }

  async getConfig(): Promise<TelegramDigestConfig> {
    return this.readJson<TelegramDigestConfig>("config.json", {
      selectedChannels: [],
    });
  }

  async saveConfig(config: TelegramDigestConfig): Promise<void> {
    await this.writeJson("config.json", config);
  }

  async getSession(): Promise<string> {
    try {
      return await fs.readFile(this.filePath("session"), "utf-8");
    } catch {
      return "";
    }
  }

  async saveSession(session: string): Promise<void> {
    await this.ensureDir();
    await fs.writeFile(this.filePath("session"), session);
  }

  async clearSession(): Promise<void> {
    try {
      await fs.unlink(this.filePath("session"));
    } catch {
      // Already gone
    }
  }

  async getState(): Promise<TelegramDigestState> {
    return this.readJson<TelegramDigestState>("state.json", {});
  }

  async saveState(state: TelegramDigestState): Promise<void> {
    await this.writeJson("state.json", state);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/config/store.test.ts
```

Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/store.ts tests/config/store.test.ts
git commit -m "feat: add config store for persisting settings and state"
```

---

## Task 3: Telegram Client Wrapper

**Files:**
- Create: `src/telegram/client.ts`

This wraps gramjs with a clean interface. No unit tests — gramjs requires a real Telegram connection. We'll test this via integration later.

- [ ] **Step 1: Create `src/telegram/client.ts`**

```typescript
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl/index.js";
import type { ConfigStore } from "../config/store.js";
import type { ChannelInfo, ChannelMessage } from "../types.js";

export class TelegramClientWrapper {
  private client: TelegramClient | null = null;

  constructor(private readonly configStore: ConfigStore) {}

  private async getClient(): Promise<TelegramClient> {
    if (this.client?.connected) return this.client;

    const config = await this.configStore.getConfig();
    if (!config.apiId || !config.apiHash) {
      throw new Error("Not configured. Call telegram_login first.");
    }

    const sessionStr = await this.configStore.getSession();
    const session = new StringSession(sessionStr);

    this.client = new TelegramClient(session, config.apiId, config.apiHash, {
      connectionRetries: 3,
    });

    await this.client.connect();
    return this.client;
  }

  async startLogin(
    apiId: number,
    apiHash: string,
    phone: string
  ): Promise<{ phoneCodeHash: string }> {
    // Save credentials
    const config = await this.configStore.getConfig();
    await this.configStore.saveConfig({ ...config, apiId, apiHash });

    const session = new StringSession("");
    this.client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 3,
    });
    await this.client.connect();

    const result = await this.client.invoke(
      new Api.auth.SendCode({
        phoneNumber: phone,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({}),
      })
    );

    return { phoneCodeHash: result.phoneCodeHash };
  }

  async completeLogin(
    phone: string,
    code: string,
    phoneCodeHash: string
  ): Promise<{ needsPassword: boolean }> {
    if (!this.client) throw new Error("Call startLogin first");

    try {
      await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash,
          phoneCode: code,
        })
      );

      // Save session
      const sessionStr = (this.client.session as StringSession).save();
      await this.configStore.saveSession(sessionStr);

      return { needsPassword: false };
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "errorMessage" in err &&
        (err as { errorMessage: string }).errorMessage === "SESSION_PASSWORD_NEEDED"
      ) {
        return { needsPassword: true };
      }
      throw err;
    }
  }

  async completePasswordLogin(password: string): Promise<void> {
    if (!this.client) throw new Error("Call startLogin first");

    const passwordResult = await this.client.invoke(
      new Api.account.GetPassword()
    );

    // _computePasswordSrpCheck is an internal gramjs helper not in public types
    const computeSrp = (this.client as unknown as {
      _computePasswordSrpCheck: (pwd: typeof passwordResult, p: string) => Promise<unknown>;
    })._computePasswordSrpCheck;

    await this.client.invoke(
      new Api.auth.CheckPassword({
        password: await computeSrp.call(this.client, passwordResult, password),
      })
    );

    const sessionStr = (this.client.session as StringSession).save();
    await this.configStore.saveSession(sessionStr);
  }

  async logout(): Promise<void> {
    try {
      const client = await this.getClient();
      await client.invoke(new Api.auth.LogOut());
    } catch {
      // Best-effort
    }
    await this.configStore.clearSession();
    const config = await this.configStore.getConfig();
    await this.configStore.saveConfig({
      ...config,
      apiId: undefined,
      apiHash: undefined,
    });
    this.client = null;
  }

  async listChannels(): Promise<ChannelInfo[]> {
    const client = await this.getClient();
    const dialogs = await client.getDialogs({});

    return dialogs
      .filter(
        (d) =>
          d.entity &&
          (d.entity instanceof Api.Channel || d.entity instanceof Api.Chat)
      )
      .map((d) => ({
        id: d.entity!.id.toString(),
        title: d.title || "Untitled",
        unreadCount: d.unreadCount || 0,
      }));
  }

  async getMessages(
    channelId: string,
    opts: { afterMessageId?: number; afterDate?: Date; limit: number }
  ): Promise<{ messages: ChannelMessage[]; totalCount: number }> {
    const client = await this.getClient();
    const entity = await client.getEntity(channelId);

    const params: Record<string, unknown> = {
      limit: opts.limit,
    };

    if (opts.afterMessageId) {
      params.minId = opts.afterMessageId;
    }

    if (opts.afterDate) {
      params.offsetDate = Math.floor(opts.afterDate.getTime() / 1000);
    }

    const rawMessages = await client.getMessages(entity, params);

    const messages: ChannelMessage[] = rawMessages
      .filter((m) => m.message) // skip empty/service messages
      .map((m) => ({
        id: m.id,
        text: m.message || "",
        date: new Date((m.date || 0) * 1000).toISOString(),
        sender:
          m.sender && "firstName" in m.sender
            ? `${m.sender.firstName || ""} ${m.sender.lastName || ""}`.trim()
            : m.sender && "title" in m.sender
              ? (m.sender.title as string)
              : "Unknown",
      }));

    return {
      messages,
      totalCount: rawMessages.total || messages.length,
    };
  }

  async disconnect(): Promise<void> {
    if (this.client?.connected) {
      await this.client.disconnect();
    }
    this.client = null;
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npx tsc --noEmit
```

Expected: no errors (may need to install deps first with `npm install`)

- [ ] **Step 3: Commit**

```bash
git add src/telegram/client.ts
git commit -m "feat: add Telegram client wrapper for MTProto via gramjs"
```

---

## Task 4: Tool — `telegram_login`

**Files:**
- Create: `src/tools/login.ts`

- [ ] **Step 1: Create `src/tools/login.ts`**

```typescript
import { z } from "zod";
import type { TelegramClientWrapper } from "../telegram/client.js";
import type { ToolResult } from "../types.js";

export const loginToolDefinition = {
  name: "telegram_login",
  description:
    "Authenticate with Telegram. Step 1: pass apiId, apiHash, phone to send SMS code. Step 2: pass code to verify. Step 3 (if 2FA): pass password.",
  inputSchema: {
    type: "object" as const,
    properties: {
      apiId: { type: "number", description: "Telegram API ID from my.telegram.org" },
      apiHash: { type: "string", description: "Telegram API hash from my.telegram.org" },
      phone: { type: "string", description: "Phone number with country code (e.g. +1234567890)" },
      code: { type: "string", description: "SMS verification code" },
      password: { type: "string", description: "2FA cloud password (if enabled)" },
    },
  },
};

const InputSchema = z.object({
  apiId: z.number().optional(),
  apiHash: z.string().optional(),
  phone: z.string().optional(),
  code: z.string().optional(),
  password: z.string().optional(),
});

// In-flight login state (per server instance)
let pendingLogin: { phone: string; phoneCodeHash: string } | null = null;

export async function handleLogin(
  args: unknown,
  client: TelegramClientWrapper
): Promise<ToolResult> {
  const input = InputSchema.parse(args);

  try {
    // Step 3: Password (2FA)
    if (input.password) {
      await client.completePasswordLogin(input.password);
      pendingLogin = null;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "authenticated",
              message: "Successfully authenticated with Telegram.",
            }),
          },
        ],
      };
    }

    // Step 2: SMS code
    if (input.code) {
      if (!pendingLogin) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "error",
                message: "No pending login. Start with apiId, apiHash, and phone.",
              }),
            },
          ],
          isError: true,
        };
      }

      const result = await client.completeLogin(
        pendingLogin.phone,
        input.code,
        pendingLogin.phoneCodeHash
      );

      if (result.needsPassword) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "password_required",
                message: "2FA is enabled. Please provide your cloud password.",
              }),
            },
          ],
        };
      }

      pendingLogin = null;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "authenticated",
              message: "Successfully authenticated with Telegram.",
            }),
          },
        ],
      };
    }

    // Step 1: Initiate login
    if (input.apiId && input.apiHash && input.phone) {
      const result = await client.startLogin(
        input.apiId,
        input.apiHash,
        input.phone
      );

      pendingLogin = {
        phone: input.phone,
        phoneCodeHash: result.phoneCodeHash,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "code_sent",
              message: "Verification code sent via SMS. Call again with the code.",
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "error",
            message:
              "Invalid input. Provide (apiId + apiHash + phone), (code), or (password).",
          }),
        },
      ],
      isError: true,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error during login";

    const isExpiredCode =
      message.includes("PHONE_CODE_EXPIRED") ||
      message.includes("PHONE_CODE_INVALID");

    if (isExpiredCode) {
      pendingLogin = null;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message:
                "Code expired or invalid. Request a new code by calling with apiId, apiHash, and phone again.",
            }),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ status: "error", message }) }],
      isError: true,
    };
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/tools/login.ts
git commit -m "feat: add telegram_login tool with multi-step auth flow"
```

---

## Task 5: Tool — `telegram_logout`

**Files:**
- Create: `src/tools/logout.ts`

- [ ] **Step 1: Create `src/tools/logout.ts`**

```typescript
import type { TelegramClientWrapper } from "../telegram/client.js";
import type { ToolResult } from "../types.js";

export const logoutToolDefinition = {
  name: "telegram_logout",
  description:
    "Log out of Telegram. Destroys session and clears credentials. Preserves channel selection.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function handleLogout(
  _args: unknown,
  client: TelegramClientWrapper
): Promise<ToolResult> {
  try {
    await client.logout();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ status: "logged_out" }),
        },
      ],
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error during logout";
    return {
      content: [{ type: "text", text: JSON.stringify({ status: "error", message }) }],
      isError: true,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tools/logout.ts
git commit -m "feat: add telegram_logout tool"
```

---

## Task 6: Tool — `telegram_list_channels`

**Files:**
- Create: `src/tools/list-channels.ts`

- [ ] **Step 1: Create `src/tools/list-channels.ts`**

```typescript
import type { TelegramClientWrapper } from "../telegram/client.js";
import type { ToolResult } from "../types.js";

export const listChannelsToolDefinition = {
  name: "telegram_list_channels",
  description:
    "List all Telegram channels and supergroups you are subscribed to. Returns id, title, and unread count.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function handleListChannels(
  _args: unknown,
  client: TelegramClientWrapper
): Promise<ToolResult> {
  try {
    const channels = await client.listChannels();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ channels }),
        },
      ],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("AUTH_KEY") || message.includes("SESSION")) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "session_expired",
              message: "Session expired. Run telegram_login to re-authenticate.",
            }),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ error: "unknown", message }) }],
      isError: true,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tools/list-channels.ts
git commit -m "feat: add telegram_list_channels tool"
```

---

## Task 7: Tool — `telegram_select_channels`

**Files:**
- Create: `src/tools/select-channels.ts`
- Create: `tests/tools/select-channels.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/tools/select-channels.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ConfigStore } from "../src/config/store.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("telegram_select_channels", () => {
  let store: ConfigStore;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `tg-select-test-${Date.now()}`);
    store = new ConfigStore(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("saves selected channel IDs to config", async () => {
    await store.saveConfig({ apiId: 1, apiHash: "a", selectedChannels: [] });
    const config = await store.getConfig();
    const updated = { ...config, selectedChannels: ["-1001", "-1002"] };
    await store.saveConfig(updated);

    const result = await store.getConfig();
    expect(result.selectedChannels).toEqual(["-1001", "-1002"]);
  });

  it("overwrites previous selection", async () => {
    await store.saveConfig({ apiId: 1, apiHash: "a", selectedChannels: ["-1001"] });
    const config = await store.getConfig();
    await store.saveConfig({ ...config, selectedChannels: ["-1003"] });

    const result = await store.getConfig();
    expect(result.selectedChannels).toEqual(["-1003"]);
  });
});
```

- [ ] **Step 2: Run test to verify it passes** (config store already implemented)

```bash
npx vitest run tests/tools/select-channels.test.ts
```

Expected: PASS (this tests the config store layer — the tool handler is thin)

- [ ] **Step 3: Create `src/tools/select-channels.ts`**

```typescript
import { z } from "zod";
import type { ConfigStore } from "../config/store.js";
import type { ToolResult } from "../types.js";

export const selectChannelsToolDefinition = {
  name: "telegram_select_channels",
  description:
    "Save which Telegram channels to include in your digest. Pass an array of channel ID strings.",
  inputSchema: {
    type: "object" as const,
    properties: {
      channelIds: {
        type: "array",
        items: { type: "string" },
        description: "Array of channel ID strings to save for digest",
      },
    },
    required: ["channelIds"],
  },
};

const InputSchema = z.object({
  channelIds: z.array(z.string()).min(1, "Select at least one channel"),
});

export async function handleSelectChannels(
  args: unknown,
  configStore: ConfigStore
): Promise<ToolResult> {
  const input = InputSchema.parse(args);

  const config = await configStore.getConfig();
  await configStore.saveConfig({
    ...config,
    selectedChannels: input.channelIds,
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ saved: true, count: input.channelIds.length }),
      },
    ],
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/tools/select-channels.ts tests/tools/select-channels.test.ts
git commit -m "feat: add telegram_select_channels tool"
```

---

## Task 8: Tool — `telegram_get_messages`

**Files:**
- Create: `src/tools/get-messages.ts`
- Create: `tests/tools/get-messages.test.ts`

- [ ] **Step 1: Write failing tests for get-messages logic**

```typescript
// tests/tools/get-messages.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ConfigStore } from "../src/config/store.js";
import { handleGetMessages } from "../src/tools/get-messages.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { ToolResult } from "../src/types.js";

// Minimal mock for TelegramClientWrapper
function createMockClient(
  channels: { id: string; title: string }[] = [],
  messages: { id: number; text: string; date: string; sender: string }[] = []
) {
  return {
    listChannels: async () =>
      channels.map((c) => ({ ...c, unreadCount: 0 })),
    getMessages: async (_id: string, _opts: unknown) => ({
      messages,
      totalCount: messages.length,
    }),
  } as unknown as import("../src/telegram/client.js").TelegramClientWrapper;
}

describe("handleGetMessages", () => {
  let store: ConfigStore;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `tg-getmsg-test-${Date.now()}`);
    store = new ConfigStore(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("returns no_channels error when no channels configured", async () => {
    const client = createMockClient();
    const result = await handleGetMessages(
      { mode: "24h" },
      client,
      store
    );
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe("no_channels");
    expect(result.isError).toBe(true);
  });

  it("fetches messages for configured channels", async () => {
    await store.saveConfig({
      apiId: 1,
      apiHash: "a",
      selectedChannels: ["-1001"],
    });
    const client = createMockClient(
      [{ id: "-1001", title: "Test Channel" }],
      [{ id: 42, text: "hello", date: "2026-03-23T10:00:00Z", sender: "Bob" }]
    );
    const result = await handleGetMessages(
      { mode: "24h" },
      client,
      store
    );
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.channels).toHaveLength(1);
    expect(parsed.channels[0].title).toBe("Test Channel");
    expect(parsed.channels[0].messages[0].text).toBe("hello");
  });

  it("updates last-read state with newest message ID", async () => {
    await store.saveConfig({
      apiId: 1,
      apiHash: "a",
      selectedChannels: ["-1001"],
    });
    const client = createMockClient(
      [{ id: "-1001", title: "Test Channel" }],
      [
        { id: 99, text: "newest", date: "2026-03-23T12:00:00Z", sender: "Alice" },
        { id: 50, text: "older", date: "2026-03-23T08:00:00Z", sender: "Bob" },
      ]
    );
    await handleGetMessages({ mode: "24h" }, client, store);
    const state = await store.getState();
    expect(state["-1001"].lastReadMessageId).toBe(99);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/tools/get-messages.test.ts
```

Expected: FAIL — `handleGetMessages` not found

- [ ] **Step 3: Create `src/tools/get-messages.ts`**

```typescript
import { z } from "zod";
import type { TelegramClientWrapper } from "../telegram/client.js";
import type { ConfigStore } from "../config/store.js";
import type { ChannelMessages, ToolResult } from "../types.js";

export const getMessagesToolDefinition = {
  name: "telegram_get_messages",
  description:
    'Fetch messages from selected Telegram channels. Mode "24h" gets last 24 hours. Mode "since-last-read" gets messages since the last summarize run.',
  inputSchema: {
    type: "object" as const,
    properties: {
      mode: {
        type: "string",
        enum: ["24h", "since-last-read"],
        description: "Fetch mode: last 24 hours or since last read position",
      },
      channelIds: {
        type: "array",
        items: { type: "string" },
        description: "Optional override — specific channel IDs to fetch. Defaults to saved selection.",
      },
      limit: {
        type: "number",
        description: "Max messages per channel (default: 100)",
      },
    },
    required: ["mode"],
  },
};

const InputSchema = z.object({
  mode: z.enum(["24h", "since-last-read"]),
  channelIds: z.array(z.string()).optional(),
  limit: z.number().min(1).max(500).default(100),
});

export async function handleGetMessages(
  args: unknown,
  client: TelegramClientWrapper,
  configStore: ConfigStore
): Promise<ToolResult> {
  const input = InputSchema.parse(args);

  // Resolve channel IDs
  const config = await configStore.getConfig();
  const channelIds = input.channelIds ?? config.selectedChannels;

  if (channelIds.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "no_channels",
            message: "No channels configured. Run telegram_select_channels first.",
          }),
        },
      ],
      isError: true,
    };
  }

  // Fetch channel titles once before the loop (not per-channel)
  let channelTitleMap: Map<string, string>;
  try {
    const allChannels = await client.listChannels();
    channelTitleMap = new Map(allChannels.map((c) => [c.id, c.title]));
  } catch {
    channelTitleMap = new Map();
  }

  const state = await configStore.getState();
  const results: ChannelMessages[] = [];

  for (let i = 0; i < channelIds.length; i++) {
    const channelId = channelIds[i];
    try {
      const fetchOpts: {
        afterMessageId?: number;
        afterDate?: Date;
        limit: number;
      } = { limit: input.limit };

      if (input.mode === "24h") {
        fetchOpts.afterDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      } else if (input.mode === "since-last-read") {
        const channelState = state[channelId];
        if (channelState) {
          fetchOpts.afterMessageId = channelState.lastReadMessageId;
        }
        // If no state exists, fetch last 24h as fallback
        if (!fetchOpts.afterMessageId) {
          fetchOpts.afterDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }
      }

      const { messages, totalCount } = await client.getMessages(
        channelId,
        fetchOpts
      );

      results.push({
        title: channelTitleMap.get(channelId) ?? `Channel ${channelId}`,
        messageCount: totalCount,
        messages,
      });

      // Update last-read state with the newest message ID
      if (messages.length > 0) {
        // Messages are sorted newest-first by gramjs
        const newestMessageId = Math.max(...messages.map((m) => m.id));
        state[channelId] = { lastReadMessageId: newestMessageId };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";

      if (message.includes("AUTH_KEY") || message.includes("SESSION")) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "session_expired",
                message:
                  "Session expired. Run telegram_login to re-authenticate.",
              }),
            },
          ],
          isError: true,
        };
      }

      // FloodWait handling
      if (message.includes("FloodWait") || message.includes("FLOOD_WAIT")) {
        const waitMatch = message.match(/(\d+)/);
        const retryAfter = waitMatch ? parseInt(waitMatch[1], 10) : 60;

        if (retryAfter <= 60) {
          // Auto-retry after waiting, then retry THIS channel (decrement index)
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
          i--; // Retry the same channel
          continue;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "rate_limited",
                message: `Telegram rate limit. Try again in ${retryAfter}s.`,
                retryAfter,
              }),
            },
          ],
          isError: true,
        };
      }

      // Skip this channel but continue with others
      results.push({
        title: channelTitleMap.get(channelId) ?? `Channel ${channelId}`,
        messageCount: 0,
        messages: [],
      });
    }
  }

  // Save updated state
  await configStore.saveState(state);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ channels: results }),
      },
    ],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/tools/get-messages.test.ts
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/tools/get-messages.ts tests/tools/get-messages.test.ts
git commit -m "feat: add telegram_get_messages tool with 24h and since-last-read modes"
```

---

## Task 9: MCP Server Entry Point

**Files:**
- Create: `src/index.ts`

This wires everything together — registers all tools, starts the stdio transport.

- [ ] **Step 1: Create `src/index.ts`**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { ConfigStore } from "./config/store.js";
import { TelegramClientWrapper } from "./telegram/client.js";

import { loginToolDefinition, handleLogin } from "./tools/login.js";
import { logoutToolDefinition, handleLogout } from "./tools/logout.js";
import {
  listChannelsToolDefinition,
  handleListChannels,
} from "./tools/list-channels.js";
import {
  selectChannelsToolDefinition,
  handleSelectChannels,
} from "./tools/select-channels.js";
import {
  getMessagesToolDefinition,
  handleGetMessages,
} from "./tools/get-messages.js";

const configStore = new ConfigStore();
const telegramClient = new TelegramClientWrapper(configStore);

const server = new Server(
  { name: "telegram-digest", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// List all tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    loginToolDefinition,
    logoutToolDefinition,
    listChannelsToolDefinition,
    selectChannelsToolDefinition,
    getMessagesToolDefinition,
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "telegram_login":
      return handleLogin(args, telegramClient);
    case "telegram_logout":
      return handleLogout(args, telegramClient);
    case "telegram_list_channels":
      return handleListChannels(args, telegramClient);
    case "telegram_select_channels":
      return handleSelectChannels(args, configStore);
    case "telegram_get_messages":
      return handleGetMessages(args, telegramClient, configStore);
    default:
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await telegramClient.disconnect();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("telegram-digest MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Build and verify**

```bash
cd /home/forge/Documents/forge/telegram-digest-mcp
npm run build
```

Expected: `dist/index.js` created with no errors

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add MCP server entry point with all tools registered"
```

---

## Task 10: Claude Code Skill

**Files:**
- Create: `skill/telegram-summarize.md`

This is the Claude Code skill that users invoke with `/telegram:summarize-mine`.

- [ ] **Step 1: Create `skill/telegram-summarize.md`**

```markdown
---
name: summarize-mine
description: Summarize your selected Telegram channels into a concise bullet-point digest
args: --catch-up (optional, uses since-last-read mode instead of last 24h)
---

# Telegram Channel Digest

You are summarizing the user's Telegram channels. Follow these steps exactly.

## Step 1: Check Authentication

Call the `telegram_get_messages` tool with `{ "mode": "24h" }`.

- If it returns `session_expired` or an auth error → go to **Setup Flow** below.
- If it returns `no_channels` → go to **Channel Selection** below.
- If it returns channels with messages → go to **Step 2**.

## Setup Flow

Tell the user:
> "No Telegram session found. Let's set up access."
> "Go to https://my.telegram.org, create an app, and give me your api_id, api_hash, and phone number."

When the user provides these, call `telegram_login` with `{ "apiId": <id>, "apiHash": "<hash>", "phone": "<phone>" }`.

When it returns `code_sent`, ask: "Enter the SMS code you received."
Call `telegram_login` with `{ "code": "<code>" }`.

If it returns `password_required`, ask: "Enter your 2FA cloud password."
Call `telegram_login` with `{ "password": "<password>" }`.

After `authenticated`, proceed to **Channel Selection**.

## Channel Selection

Call `telegram_list_channels` to get all channels.

Present them as a numbered list:
```
1. Channel Name (42 unread)
2. Another Channel (0 unread)
...
```

Ask: "Which channels do you want in your digest? Give me the numbers."

Call `telegram_select_channels` with the chosen channel IDs.

Then proceed to **Step 1** again (it will now succeed).

## Step 2: Summarize

Take the messages returned from `telegram_get_messages` and produce a digest.

Serialize the messages as plain text:
```
## Channel Name (N messages)
[2026-03-23 10:15] sender: message text
[2026-03-23 10:17] sender: another message
```

Then summarize into this format — 3 to 7 bullet points per channel, skipping duplicates, spam, and low-value messages:

```
📡 Channel Name
  • Key point 1
  • Key point 2

📡 Another Channel
  • Key point 1
```

If a channel had 0 messages, note: "📡 Channel Name — no new messages"

## Args

If the user passed `--catch-up`, use `{ "mode": "since-last-read" }` instead of `{ "mode": "24h" }`.
```

- [ ] **Step 2: Commit**

```bash
git add skill/telegram-summarize.md
git commit -m "feat: add Claude Code skill for /telegram:summarize-mine"
```

---

## Task 11: Build, Verify & Final Commit

- [ ] **Step 1: Run all tests**

```bash
cd /home/forge/Documents/forge/telegram-digest-mcp
npx vitest run
```

Expected: all tests pass

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean build, `dist/index.js` created

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Add README with setup instructions**

Create `README.md` with:
- What the project does
- Prerequisites (Telegram app credentials)
- Installation (`npx telegram-digest-mcp` or register in Claude Code settings)
- Available tools
- Skill usage (`/telegram:summarize-mine`)

- [ ] **Step 5: Final commit**

```bash
git add README.md
git commit -m "docs: add README with setup and usage instructions"
```
