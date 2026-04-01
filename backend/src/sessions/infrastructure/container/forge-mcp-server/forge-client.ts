// Forge API HTTP client — runs inside E2B sandbox
// Uses environment variables injected by the session bootstrap

const FORGE_API_URL = process.env.FORGE_API_URL || '';
const FORGE_SESSION_JWT = process.env.FORGE_SESSION_JWT || '';
const TICKET_ID = process.env.TICKET_ID || '';

async function forgeRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  const url = `${FORGE_API_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_SESSION_JWT}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Forge API error: ${response.status} ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function getTicketContext(): Promise<unknown> {
  return forgeRequest('GET', `/tickets/${TICKET_ID}`);
}

export async function getRepositoryContext(): Promise<unknown> {
  // Fetch ticket to get repo info, then fetch the project profile
  const ticket = (await forgeRequest('GET', `/tickets/${TICKET_ID}`)) as Record<string, any>;
  const repoFullName = ticket?.repositoryContext?.repositoryFullName;

  if (!repoFullName) {
    return { message: 'No repository connected to this ticket. Explore the codebase directly.' };
  }

  try {
    const profile = await forgeRequest('GET', `/project-profiles?repo=${encodeURIComponent(repoFullName)}`);
    return profile;
  } catch {
    // Profile may not exist — return basic repo info
    return {
      repository: repoFullName,
      branch: ticket?.repositoryContext?.branchName || 'main',
      message: 'No codebase profile available. Explore the repository structure directly.',
    };
  }
}

export async function startImplementation(branchName: string): Promise<void> {
  await forgeRequest('POST', `/tickets/${TICKET_ID}/start-implementation`, {
    branchName,
    qaItems: [],
  });
}

export async function recordExecutionEvent(
  type: 'decision' | 'risk' | 'scope_change',
  title: string,
  description: string,
): Promise<void> {
  await forgeRequest('POST', `/tickets/${TICKET_ID}/execution-events`, {
    type,
    title,
    description,
  });
}

export async function submitSettlement(settlement: {
  executionSummary: string;
  filesChanged: Array<{ path: string; additions: number; deletions: number }>;
  divergences: Array<{ area: string; intended: string; actual: string; justification: string }>;
}): Promise<void> {
  await forgeRequest('POST', `/tickets/${TICKET_ID}/settle`, settlement);
}
