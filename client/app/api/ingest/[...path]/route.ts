import { NextRequest, NextResponse } from 'next/server';

/**
 * PostHog Analytics Reverse Proxy
 *
 * Routes PostHog requests through our domain to avoid ad blocker issues.
 * Requests to /api/ingest/* are forwarded to us.i.posthog.com
 *
 * This prevents ad blockers from blocking analytics since requests
 * appear to come from the same domain as the app.
 *
 * Example:
 * POST /api/ingest/e/ → POST https://us.i.posthog.com/e/
 * POST /api/ingest/decide/ → POST https://us.i.posthog.com/decide/
 */

const POSTHOG_HOST = 'https://us.i.posthog.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathname = resolvedParams.path.join('/');
  const url = new URL(request.url);

  // Forward to PostHog with original query params
  const targetUrl = `${POSTHOG_HOST}/${pathname}${url.search}`;

  try {
    const body = await request.text();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'forge-proxy',
      },
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('[PostHog Proxy] Error forwarding request:', error);
    return NextResponse.json(
      { error: 'Failed to forward request to PostHog' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathname = resolvedParams.path.join('/');
  const url = new URL(request.url);

  // Forward to PostHog with original query params
  const targetUrl = `${POSTHOG_HOST}/${pathname}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'forge-proxy',
      },
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('[PostHog Proxy] Error forwarding request:', error);
    return NextResponse.json(
      { error: 'Failed to forward request to PostHog' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
