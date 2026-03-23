# Telegram Digest — Design Spec

**Date:** 2026-03-23
**Status:** Draft
**Type:** MCP Server + Claude Code Skill

## Problem

Staying on top of multiple Telegram channels is time-consuming. Scrolling through each channel to find what matters wastes time. The user wants a single command that pulls messages from selected channels and produces a concise, bullet-point digest — powered by whichever LLM they're already using.

## Solution

Two components:

1. **`telegram-digest-mcp`** — An MCP server that connects to Telegram via the User API (MTProto) and exposes tools for auth, channel management, and message fetching.
2. **`/telegram:summarize-mine`** — A Claude Code skill that orchestrates the MCP tools and prompts the host LLM to summarize.

Because it uses MCP, the server works with any MCP-compatible client (Claude Code, Gemini CLI, Cursor, Windsurf, etc.). The skill is Claude Code specific but the MCP server is universal.

## Architecture

```
┌─────────────────────────────────────────────┐
│  AI Assistant (Claude Code / Gemini / etc.)  │
│                                             │
│  ┌───────────────────────────────────────┐   │
│  │  Skill: /telegram:summarize-mine      │   │
│  │  (Claude Code specific)               │   │
│  └──────────────┬────────────────────────┘   │
│                 │ calls MCP tools             │
│  ┌──────────────▼────────────────────────┐   │
│  │  MCP Server: telegram-digest-mcp      │   │
│  │                                       │   │
│  │  Tools:                               │   │
│  │  • telegram_login          (auth)     │   │
│  │  • telegram_list_channels  (browse)   │   │
│  │  • telegram_select_channels(config)   │   │
│  │  • telegram_get_messages   (fetch)    │   │
│  └──────────────┬────────────────────────┘   │
│                 │ MTProto                     │
│  ┌──────────────▼────────────────────────┐   │
│  │  Telegram User API                    │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Key principle:** The MCP server is a data pipe only. It fetches raw messages. The host LLM handles all summarization — no LLM API key needed in the server.

## MCP Server: `telegram-digest-mcp`

### Tech Stack

- TypeScript (Node.js)
- `@modelcontextprotocol/sdk` — MCP server framework
- `telegram` (gramjs) — MTProto client for Telegram User API
- `zod` — input validation

### Project Structure

```
telegram-digest-mcp/
├── src/
│   ├── index.ts                  # MCP server entry point
│   ├── tools/
│   │   ├── login.ts              # telegram_login
│   │   ├── list-channels.ts      # telegram_list_channels
│   │   ├── select-channels.ts    # telegram_select_channels
│   │   └── get-messages.ts       # telegram_get_messages
│   ├── telegram/
│   │   └── client.ts             # gramjs wrapper (connect, auth, fetch)
│   └── config/
│       └── store.ts              # Read/write ~/.config/telegram-digest/
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Tools

#### `telegram_login`

- **Input:** `{ phone: string, code?: string }`
- **Behavior:** If `code` is omitted, initiates auth and sends SMS. If `code` is provided, completes auth.
- **Output:** `{ status: "code_sent" | "authenticated", message: string }`
- **Side effect:** Saves gramjs StringSession to `~/.config/telegram-digest/session`

#### `telegram_list_channels`

- **Input:** `{}`
- **Output:** `{ channels: { id: string, title: string, unreadCount: number }[] }`
- **Requires:** Active session

#### `telegram_select_channels`

- **Input:** `{ channelIds: string[] }`
- **Output:** `{ saved: true, count: number }`
- **Side effect:** Writes selected IDs to `~/.config/telegram-digest/config.json`

#### `telegram_get_messages`

- **Input:** `{ mode: "24h" | "since-last-read", channelIds?: string[] }`
- **Output:**
  ```json
  {
    "channels": [
      {
        "title": "Channel Name",
        "messages": [
          { "text": "message content", "date": "ISO timestamp", "sender": "name" }
        ]
      }
    ]
  }
  ```
- **Behavior:**
  - `mode: "24h"` — fetches messages from the last 24 hours
  - `mode: "since-last-read"` — fetches messages after the last-read position stored in `state.json`
  - If `channelIds` is omitted, uses the saved selection from config
- **Side effect:** Updates `state.json` with the latest message ID per channel after fetch

### Config & State

Stored at `~/.config/telegram-digest/`:

| File | Contents |
|---|---|
| `config.json` | `{ apiId: number, apiHash: string, selectedChannels: string[] }` |
| `session` | gramjs StringSession string (MTProto auth persistence) |
| `state.json` | `{ [channelId]: { lastReadMessageId: number } }` |

### Prerequisites

The user must create a Telegram app at https://my.telegram.org to obtain `api_id` and `api_hash`. These are stored in `config.json` on first login.

### MCP Registration

In Claude Code `settings.json`:

```json
{
  "mcpServers": {
    "telegram-digest": {
      "command": "npx",
      "args": ["telegram-digest-mcp"]
    }
  }
}
```

## Claude Code Skill: `/telegram:summarize-mine`

### Behavior

1. Checks if session exists → if not, walks user through login
2. Checks if channels are configured → if not, walks user through selection
3. Calls `telegram_get_messages` (default mode: `24h`)
4. Formats messages and instructs the LLM to summarize

### Flags

| Flag | Effect |
|---|---|
| (default) | Last 24 hours |
| `--catch-up` | Since last read (uses `state.json` tracking) |

### Prompt Template

```
Summarize the following Telegram channel messages into a concise digest.
For each channel, provide 3-7 bullet points capturing the key information.
Skip duplicates, spam, and low-value messages.
Use this format:

📡 Channel Name
  • Key point 1
  • Key point 2

---

{{raw messages grouped by channel}}
```

### First-Run Experience

```
User: /telegram:summarize-mine
Skill: "No session found. Let's set up Telegram access."
Skill: "Enter your api_id and api_hash from my.telegram.org"
       → calls telegram_login { phone: "+972..." }
       → gramjs sends SMS code
Skill: "Enter the code you received"
       → completes auth, session saved
Skill: "Authenticated! Now let's pick your channels."
       → calls telegram_list_channels → shows list → user picks
       → calls telegram_select_channels
Skill: "All set! Running your first digest..."
       → calls telegram_get_messages → LLM summarizes
```

After first setup, `/telegram:summarize-mine` runs the digest immediately with no prompts.

### Output Format

```
📡 Crypto Signals
  • BTC broke 95k resistance, next target 102k
  • ETH merge v2 proposal gaining traction
  • New Solana DEX launching Thursday

📡 Tech News IL
  • Intel opening new fab in Kiryat Gat — 2000 jobs
  • AI regulation bill passed first Knesset reading
```

## Decisions & Trade-offs

| Decision | Rationale |
|---|---|
| MTProto User API (not Bot API) | Access all user's channels without adding bots as admins |
| gramjs (`telegram` npm) | Most mature JS MTProto library, active maintenance |
| MCP server (not standalone CLI) | Cross-platform: works with Claude Code, Gemini CLI, Cursor, etc. |
| No bundled LLM | Host LLM handles summarization — zero API cost, works with any provider |
| `~/.config/telegram-digest/` | XDG convention, clean separation from project files |
| 24h default window | Simple, predictable daily digest |
| Since-last-read mode | Catch-up use case for less frequent users |

## Out of Scope

- Message sending / replying
- Media summarization (images, videos) — text messages only
- Real-time streaming / notifications
- Multi-account support
- Web UI
