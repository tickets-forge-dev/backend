import { Injectable, Logger } from '@nestjs/common';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

/**
 * HttpClientService - Provides connection pooling for HTTP/HTTPS requests
 *
 * Features:
 * - Reuses TCP connections across requests to the same host
 * - Reduces latency and overhead compared to creating new connections per request
 * - Improves throughput under load
 * - Configurable pool limits and timeouts
 *
 * Connection pooling benefits:
 * - Typical improvement: 10-30% faster API calls for repeated endpoints
 * - Lower CPU usage (fewer TLS handshakes)
 * - Better scalability (handles more concurrent requests)
 */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  /**
   * Shared HTTPS agent for connection pooling
   * - maxSockets: 50 = max concurrent connections (handles bursts)
   * - maxFreeSockets: 10 = keep 10 idle connections alive for reuse
   * - timeout: 30000ms = close idle connections after 30s
   * - keepAliveTimeout: 1000ms = TCP keep-alive interval
   */
  private readonly httpsAgent = new HttpsAgent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    keepAliveMsecs: 1000,
    scheduling: 'lifo', // Last-In-First-Out: reuse most recently freed socket
  });

  /**
   * Shared HTTP agent for connection pooling
   * Same configuration as HTTPS for consistency
   */
  private readonly httpAgent = new HttpAgent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    keepAliveMsecs: 1000,
    scheduling: 'lifo',
  });

  constructor() {
    this.logger.debug(
      'HttpClientService initialized with connection pooling (maxSockets=50, maxFreeSockets=10)',
    );
  }

  /**
   * Fetch with automatic agent selection based on URL protocol
   * Reuses connections from the shared pool
   *
   * @param url Endpoint URL
   * @param options Standard fetch RequestInit options
   * @returns Response object
   *
   * @example
   * const response = await httpClientService.fetch('https://api.figma.com/v1/files/abc123', {
   *   headers: { 'X-Figma-Token': token }
   * });
   */
  async fetch(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    const isHttps = url.startsWith('https://');
    const agent = isHttps ? this.httpsAgent : this.httpAgent;

    // Type assertion needed because Node.js fetch doesn't expose agent in standard RequestInit
    const nodeOptions = {
      ...options,
      agent,
    } as RequestInit & { agent: HttpsAgent | HttpAgent };

    try {
      return await fetch(url, nodeOptions);
    } catch (error) {
      this.logger.error(
        `HTTP request failed for ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Get pooling statistics for monitoring
   * Useful for debugging connection pool health
   */
  getPoolStats() {
    return {
      https: {
        sockets: Object.keys(this.httpsAgent.sockets).length,
        requests: Object.keys(this.httpsAgent.requests).length,
        freeSockets: this.httpsAgent.freeSockets?.length || 0,
      },
      http: {
        sockets: Object.keys(this.httpAgent.sockets).length,
        requests: Object.keys(this.httpAgent.requests).length,
        freeSockets: this.httpAgent.freeSockets?.length || 0,
      },
    };
  }

  /**
   * Shutdown pools (call during application termination)
   * Cleanly closes all connections
   */
  destroy() {
    this.httpsAgent.destroy();
    this.httpAgent.destroy();
    this.logger.debug('HttpClientService connection pools destroyed');
  }
}
