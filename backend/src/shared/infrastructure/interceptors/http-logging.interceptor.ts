/**
 * HTTP Logging Interceptor
 *
 * Provides comprehensive request/response logging with:
 * - Request details (method, URL, headers, body)
 * - Response details (status, headers, body)
 * - Execution time
 * - Error tracking
 * - Beautiful formatting with colors
 *
 * Layer: Infrastructure
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  params?: any;
  query?: any;
  body?: any;
  headers?: any;
  user?: any;
}

interface ResponseLog {
  timestamp: string;
  statusCode: number;
  duration: number;
  body?: any;
  headers?: any;
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  private readonly maxBodyLength = 1000; // Max characters to log for body

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Log request
    this.logRequest(request);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logResponse(request, response, data, duration);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logError(request, response, error, duration);
        return throwError(() => error);
      }),
    );
  }

  private logRequest(request: Request): void {
    const requestLog: RequestLog = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      body: this.sanitizeBody(request.body),
      headers: this.sanitizeHeaders(request.headers),
      user: (request as any).user?.uid,
    };

    this.logger.log(this.formatRequest(requestLog));
  }

  private logResponse(request: Request, response: Response, data: any, duration: number): void {
    const responseLog: ResponseLog = {
      timestamp: new Date().toISOString(),
      statusCode: response.statusCode,
      duration,
      body: this.truncateBody(data),
      headers: this.sanitizeHeaders(response.getHeaders()),
    };

    this.logger.log(this.formatResponse(request, responseLog));
  }

  private logError(request: Request, response: Response, error: any, duration: number): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      statusCode: error.status || 500,
      duration,
      error: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      },
    };

    this.logger.error(this.formatError(request, errorLog));
  }

  private formatRequest(log: RequestLog): string {
    const lines: string[] = [];
    lines.push('');
    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║  📨 INCOMING REQUEST                                          ║');
    lines.push('╠═══════════════════════════════════════════════════════════════╣');
    lines.push(`║  ${log.method.padEnd(6)} ${log.url.padEnd(53)}║`);
    lines.push('╠═══════════════════════════════════════════════════════════════╣');

    if (log.user) {
      lines.push(`║  🔐 User: ${log.user.substring(0, 50).padEnd(50)}║`);
    }

    if (Object.keys(log.params || {}).length > 0) {
      lines.push(`║  📍 Params: ${JSON.stringify(log.params).substring(0, 46).padEnd(46)}║`);
    }

    if (Object.keys(log.query || {}).length > 0) {
      lines.push(`║  🔍 Query: ${JSON.stringify(log.query).substring(0, 47).padEnd(47)}║`);
    }

    if (log.body && Object.keys(log.body).length > 0) {
      const bodyStr = JSON.stringify(log.body, null, 2);
      const bodyLines = bodyStr.split('\n').slice(0, 5); // First 5 lines
      lines.push('║  📦 Body:                                                     ║');
      bodyLines.forEach((line) => {
        lines.push(`║     ${line.substring(0, 56).padEnd(56)}║`);
      });
      if (bodyStr.split('\n').length > 5) {
        lines.push('║     ... (truncated)                                           ║');
      }
    }

    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    return lines.join('\n');
  }

  private formatResponse(request: Request, log: ResponseLog): string {
    const lines: string[] = [];
    const statusEmoji = this.getStatusEmoji(log.statusCode);
    const durationColor = log.duration > 1000 ? '🔴' : log.duration > 500 ? '🟡' : '🟢';

    lines.push('');
    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║  📤 OUTGOING RESPONSE                                         ║');
    lines.push('╠═══════════════════════════════════════════════════════════════╣');
    lines.push(`║  ${request.method.padEnd(6)} ${request.url.substring(0, 53).padEnd(53)}║`);
    lines.push('╠═══════════════════════════════════════════════════════════════╣');
    lines.push(`║  ${statusEmoji} Status: ${String(log.statusCode).padEnd(49)}║`);
    lines.push(
      `║  ${durationColor} Duration: ${log.duration}ms${String('').padEnd(52 - String(log.duration).length)}║`,
    );

    if (log.body) {
      const bodyStr = typeof log.body === 'string' ? log.body : JSON.stringify(log.body, null, 2);
      const bodyLines = bodyStr.split('\n').slice(0, 5);
      lines.push('║  📦 Response:                                                 ║');
      bodyLines.forEach((line) => {
        lines.push(`║     ${line.substring(0, 56).padEnd(56)}║`);
      });
      if (bodyStr.split('\n').length > 5) {
        lines.push('║     ... (truncated)                                           ║');
      }
    }

    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    return lines.join('\n');
  }

  private formatError(request: Request, log: any): string {
    const lines: string[] = [];
    lines.push('');
    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║  ❌ ERROR RESPONSE                                            ║');
    lines.push('╠═══════════════════════════════════════════════════════════════╣');
    lines.push(`║  ${request.method.padEnd(6)} ${request.url.substring(0, 53).padEnd(53)}║`);
    lines.push('╠═══════════════════════════════════════════════════════════════╣');
    lines.push(`║  🔴 Status: ${String(log.statusCode).padEnd(48)}║`);
    lines.push(
      `║  ⏱️  Duration: ${log.duration}ms${String('').padEnd(50 - String(log.duration).length)}║`,
    );
    lines.push('║  💥 Error:                                                    ║');

    const errorLines = log.error.message.split('\n');
    errorLines.forEach((line: string) => {
      lines.push(`║     ${line.substring(0, 56).padEnd(56)}║`);
    });

    if (log.error.stack) {
      lines.push('║  📚 Stack:                                                    ║');
      const stackLines = log.error.stack.split('\n');
      stackLines.forEach((line: string) => {
        lines.push(`║     ${line.substring(0, 56).padEnd(56)}║`);
      });
    }

    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    return lines.join('\n');
  }

  private getStatusEmoji(status: number): string {
    if (status >= 200 && status < 300) return '✅';
    if (status >= 300 && status < 400) return '🔄';
    if (status >= 400 && status < 500) return '⚠️';
    return '❌';
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    this.sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private truncateBody(data: any): any {
    if (!data) return data;

    const str = typeof data === 'string' ? data : JSON.stringify(data);
    if (str.length > this.maxBodyLength) {
      return str.substring(0, this.maxBodyLength) + '... (truncated)';
    }

    return data;
  }
}
