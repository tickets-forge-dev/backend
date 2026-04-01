export interface SandboxConfig {
  anthropicApiKey: string;
  githubToken: string;
  forgeApiUrl: string;
  forgeSessionJwt: string;
  ticketId: string;
  repoUrl: string;
  branch: string;
  systemPrompt: string;
  maxDurationMs: number;
  /** Anthropic model ID to use inside the sandbox (read by ANTHROPIC_MODEL env var) */
  model: string;
  /** GitHub App installation ID — used for PR creation after completion */
  installationId?: number;
  /** Marketplace skill IDs to mount as --plugin-dir in the sandbox */
  skillIds?: string[];
}

export interface SandboxHandle {
  id: string;
  onStdout(handler: (line: string) => void): void;
  onStderr(handler: (line: string) => void): void;
  onExit(handler: (code: number) => void): void;
  destroy(): Promise<void>;
}

export interface SandboxPort {
  create(config: SandboxConfig): Promise<SandboxHandle>;
}

export const SANDBOX_PORT = Symbol('SandboxPort');
