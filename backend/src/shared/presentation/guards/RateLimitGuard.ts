import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Simple in-memory rate limiting guard
 * Limits requests per IP address
 * Default: 5 requests per 60 seconds
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  // Track request counts per IP: { ip: [timestamp1, timestamp2, ...] }
  private requestLog = new Map<string, number[]>();
  
  // Cleanup interval (every 5 minutes)
  private cleanupInterval = 5 * 60 * 1000;
  
  // Request limit per window
  private limit = 5;
  
  // Time window in milliseconds
  private windowMs = 60 * 1000;

  constructor() {
    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create request log for this IP
    if (!this.requestLog.has(ip)) {
      this.requestLog.set(ip, []);
    }

    const timestamps = this.requestLog.get(ip);
    if (!timestamps) {
      this.requestLog.set(ip, [now]);
      return true;
    }

    // Remove timestamps outside the window
    const recentRequests = timestamps.filter(t => t > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.limit) {
      throw new HttpException(
        `Too many requests from this IP address. Maximum ${this.limit} requests per minute.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    
    // Record this request
    recentRequests.push(now);
    this.requestLog.set(ip, recentRequests);
    
    return true;
  }

  /**
   * Extract client IP address from request
   * Handles proxies (X-Forwarded-For header)
   */
  private getClientIp(request: any): string {
    // Check X-Forwarded-For header (for proxies)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwardedFor.split(',')[0].trim();
    }
    
    // Fall back to socket address
    return request.socket?.remoteAddress || 'unknown';
  }

  /**
   * Cleanup old entries to prevent memory leaks
   * Removes entries that have no requests in the current window
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [ip, timestamps] of this.requestLog.entries()) {
      const recentRequests = timestamps.filter(t => t > windowStart);
      
      if (recentRequests.length === 0) {
        this.requestLog.delete(ip);
      } else {
        this.requestLog.set(ip, recentRequests);
      }
    }
  }
}
