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
