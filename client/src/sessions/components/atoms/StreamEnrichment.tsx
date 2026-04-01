import React from 'react';

// --- Types ---

interface TicketData {
  acceptanceCriteria?: string[];
  techSpec?: {
    fileChanges?: { path: string }[];
    apiChanges?: {
      endpoints?: { method: string; path: string; description?: string }[];
    };
    visualExpectations?: {
      expectations?: { screen: string; state: string }[];
    };
  };
}

interface EnrichmentResult {
  type: 'ac' | 'file' | 'api' | 'screen';
  label: string;
}

// --- Constants ---

const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'and', 'for', 'in', 'of', 'with', 'on', 'at', 'by',
  'from', 'or', 'as', 'it', 'that', 'this', 'will', 'can',
  'should', 'must', 'have', 'has', 'had', 'not', 'but', 'do',
  'does', 'did', 'its', 'we', 'i', 'you',
]);

const MIN_SIGNIFICANT_WORD_MATCHES = 3;

// --- Pure matching logic ---

function extractSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !COMMON_WORDS.has(w));
}

function matchAcceptanceCriteria(
  messageContent: string,
  acceptanceCriteria: string[],
): EnrichmentResult | null {
  const messageWords = new Set(extractSignificantWords(messageContent));

  for (let idx = 0; idx < acceptanceCriteria.length; idx++) {
    const ac = acceptanceCriteria[idx];
    const acWords = extractSignificantWords(ac);
    const matchCount = acWords.filter((w) => messageWords.has(w)).length;

    if (matchCount >= MIN_SIGNIFICANT_WORD_MATCHES) {
      return {
        type: 'ac',
        label: `AC #${idx + 1} \u00b7 ${ac}`,
      };
    }
  }

  return null;
}

function matchFilePath(
  messageContent: string,
  fileChanges: { path: string }[],
  totalFiles: number,
): EnrichmentResult | null {
  const messageLower = messageContent.toLowerCase();

  for (let idx = 0; idx < fileChanges.length; idx++) {
    const filePath = fileChanges[idx].path;
    if (messageLower.includes(filePath.toLowerCase())) {
      return {
        type: 'file',
        label: `${idx + 1} of ${totalFiles} files \u00b7 ${filePath}`,
      };
    }
  }

  return null;
}

function matchApiEndpoint(
  messageContent: string,
  endpoints: { method: string; path: string; description?: string }[],
): EnrichmentResult | null {
  const messageLower = messageContent.toLowerCase();

  for (const endpoint of endpoints) {
    const pattern = `${endpoint.method.toLowerCase()} ${endpoint.path.toLowerCase()}`;
    if (messageLower.includes(pattern)) {
      const desc = endpoint.description ? ` \u00b7 ${endpoint.description}` : '';
      return {
        type: 'api',
        label: `${endpoint.method.toUpperCase()} ${endpoint.path}${desc}`,
      };
    }
  }

  return null;
}

function matchScreen(
  messageContent: string,
  expectations: { screen: string; state: string }[],
): EnrichmentResult | null {
  const messageLower = messageContent.toLowerCase();

  for (const expectation of expectations) {
    if (messageLower.includes(expectation.screen.toLowerCase())) {
      return {
        type: 'screen',
        label: `Screen: ${expectation.screen} \u00b7 ${expectation.state}`,
      };
    }
  }

  return null;
}

/**
 * Pure function that detects the first enrichment match from a message
 * against ticket data. Priority: AC > File > API > Screen.
 * Returns null if no match found.
 */
export function detectEnrichment(
  messageContent: string,
  ticket: TicketData | null | undefined,
): EnrichmentResult | null {
  if (!messageContent || !ticket) return null;

  // 1. Acceptance Criteria (highest priority)
  if (ticket.acceptanceCriteria?.length) {
    const acMatch = matchAcceptanceCriteria(
      messageContent,
      ticket.acceptanceCriteria,
    );
    if (acMatch) return acMatch;
  }

  // 2. File path matching
  if (ticket.techSpec?.fileChanges?.length) {
    const fileMatch = matchFilePath(
      messageContent,
      ticket.techSpec.fileChanges,
      ticket.techSpec.fileChanges.length,
    );
    if (fileMatch) return fileMatch;
  }

  // 3. API endpoint matching
  if (ticket.techSpec?.apiChanges?.endpoints?.length) {
    const apiMatch = matchApiEndpoint(
      messageContent,
      ticket.techSpec.apiChanges.endpoints,
    );
    if (apiMatch) return apiMatch;
  }

  // 4. Screen matching (lowest priority)
  if (ticket.techSpec?.visualExpectations?.expectations?.length) {
    const screenMatch = matchScreen(
      messageContent,
      ticket.techSpec.visualExpectations.expectations,
    );
    if (screenMatch) return screenMatch;
  }

  return null;
}

// --- Component ---

interface StreamEnrichmentProps {
  messageContent: string;
  ticket: TicketData | null | undefined;
}

export function StreamEnrichment({
  messageContent,
  ticket,
}: StreamEnrichmentProps) {
  const enrichment = detectEnrichment(messageContent, ticket);

  if (!enrichment) return null;

  return (
    <div className="text-[10px] text-[var(--text-tertiary)] border-l-2 border-[var(--border-subtle)] pl-2 py-0.5 ml-7 mt-1">
      {enrichment.label}
    </div>
  );
}

export default StreamEnrichment;
