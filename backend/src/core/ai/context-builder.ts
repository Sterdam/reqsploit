/**
 * Intelligent Context Builder
 *
 * Builds comprehensive application context from request history:
 * - Technology detection
 * - Authentication flow understanding
 * - API endpoint mapping
 * - Session management patterns
 * - Request flow analysis
 */

import { PrismaClient } from '@prisma/client';

export interface ApplicationContext {
  technology: string[];
  authentication?: string;
  sessionType?: string;
  apiEndpoints: string[];
  framework?: string;
  securityHeaders: string[];
  vulnerabilityIndicators: VulnerabilityIndicator[];
}

export interface VulnerabilityIndicator {
  type: string;
  confidence: number;
  evidence: string;
  location: string;
}

export interface RequestFlow {
  sequence: Array<{
    method: string;
    url: string;
    timestamp: Date;
    duration?: number;
    statusCode?: number;
  }>;
  userJourney: string;
  criticalPaths: string[];
}

export class ContextBuilder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Build application context from request history
   */
  async buildApplicationContext(
    userId: string,
    targetDomain: string,
    timeWindow = 3600000 // 1 hour
  ): Promise<ApplicationContext> {
    // Get recent requests for this domain
    const requests = await this.prisma.requestLog.findMany({
      where: {
        userId,
        url: { contains: targetDomain },
        timestamp: {
          gte: new Date(Date.now() - timeWindow),
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const context: ApplicationContext = {
      technology: [],
      apiEndpoints: [],
      securityHeaders: [],
      vulnerabilityIndicators: [],
    };

    if (requests.length === 0) {
      return context;
    }

    // Detect technology stack
    context.technology = this.detectTechnology(requests);

    // Detect framework
    context.framework = this.detectFramework(requests);

    // Detect authentication mechanism
    context.authentication = this.detectAuthentication(requests);

    // Detect session management
    context.sessionType = this.detectSessionManagement(requests);

    // Map API endpoints
    context.apiEndpoints = this.mapApiEndpoints(requests);

    // Detect security headers
    context.securityHeaders = this.detectSecurityHeaders(requests);

    // Identify vulnerability indicators
    context.vulnerabilityIndicators = this.identifyVulnerabilityIndicators(requests);

    return context;
  }

  /**
   * Detect technology stack from headers and responses
   */
  private detectTechnology(requests: any[]): string[] {
    const technologies = new Set<string>();

    for (const req of requests) {
      const headers = req.responseHeaders || {};

      // Server header
      const server = headers['server'] || headers['Server'];
      if (server) {
        if (server.toLowerCase().includes('nginx')) technologies.add('Nginx');
        if (server.toLowerCase().includes('apache')) technologies.add('Apache');
        if (server.toLowerCase().includes('cloudflare')) technologies.add('Cloudflare');
        if (server.toLowerCase().includes('express')) technologies.add('Express.js');
      }

      // X-Powered-By
      const poweredBy = headers['x-powered-by'] || headers['X-Powered-By'];
      if (poweredBy) {
        if (poweredBy.toLowerCase().includes('php')) technologies.add('PHP');
        if (poweredBy.toLowerCase().includes('asp.net')) technologies.add('ASP.NET');
        if (poweredBy.toLowerCase().includes('express')) technologies.add('Express.js');
      }

      // Content-Type for API detection
      const contentType = headers['content-type'] || headers['Content-Type'];
      if (contentType) {
        if (contentType.includes('application/json')) technologies.add('JSON API');
        if (contentType.includes('application/xml')) technologies.add('XML API');
        if (contentType.includes('application/graphql')) technologies.add('GraphQL');
      }

      // Response body analysis
      if (req.responseBody) {
        const body = req.responseBody.toLowerCase();
        if (body.includes('react')) technologies.add('React');
        if (body.includes('vue')) technologies.add('Vue.js');
        if (body.includes('angular')) technologies.add('Angular');
        if (body.includes('next.js') || body.includes('_next')) technologies.add('Next.js');
        if (body.includes('wordpress')) technologies.add('WordPress');
        if (body.includes('laravel')) technologies.add('Laravel');
      }
    }

    return Array.from(technologies);
  }

  /**
   * Detect web framework
   */
  private detectFramework(requests: any[]): string | undefined {
    for (const req of requests) {
      const headers = req.responseHeaders || {};

      // Framework-specific headers
      if (headers['x-powered-by']) {
        const poweredBy = headers['x-powered-by'].toLowerCase();
        if (poweredBy.includes('laravel')) return 'Laravel';
        if (poweredBy.includes('django')) return 'Django';
        if (poweredBy.includes('rails')) return 'Ruby on Rails';
        if (poweredBy.includes('express')) return 'Express.js';
      }

      // Cookie patterns
      const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
      if (setCookie) {
        const cookies = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
        if (cookies.includes('laravel_session')) return 'Laravel';
        if (cookies.includes('PHPSESSID')) return 'PHP';
        if (cookies.includes('sessionid')) return 'Django';
        if (cookies.includes('connect.sid')) return 'Express.js';
      }

      // URL patterns
      if (req.url.includes('/api/v1') || req.url.includes('/api/v2')) {
        return 'REST API';
      }
      if (req.url.includes('/graphql')) {
        return 'GraphQL API';
      }
    }

    return undefined;
  }

  /**
   * Detect authentication mechanism
   */
  private detectAuthentication(requests: any[]): string | undefined {
    for (const req of requests) {
      const reqHeaders = req.headers || {};

      // JWT Detection
      const auth = reqHeaders['authorization'] || reqHeaders['Authorization'];
      if (auth) {
        if (auth.toString().startsWith('Bearer ')) {
          // Check if it looks like JWT
          const token = auth.toString().substring(7);
          if (token.split('.').length === 3) {
            return 'JWT (Bearer Token)';
          }
          return 'Bearer Token';
        }
        if (auth.toString().startsWith('Basic ')) {
          return 'Basic Authentication';
        }
      }

      // Session cookie detection
      const cookie = reqHeaders['cookie'] || reqHeaders['Cookie'];
      if (cookie) {
        if (cookie.toString().includes('session')) {
          return 'Session-based (Cookies)';
        }
      }

      // OAuth detection
      if (req.url.includes('oauth') || req.url.includes('authorize')) {
        return 'OAuth 2.0';
      }
    }

    return undefined;
  }

  /**
   * Detect session management type
   */
  private detectSessionManagement(requests: any[]): string | undefined {
    let hasCookies = false;
    let hasJWT = false;

    for (const req of requests) {
      const headers = req.responseHeaders || {};
      const setCookie = headers['set-cookie'] || headers['Set-Cookie'];

      if (setCookie) {
        hasCookies = true;
        const cookies = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;

        if (cookies.toLowerCase().includes('httponly')) {
          return 'Server-side Sessions (HttpOnly Cookies)';
        }
      }

      const auth = req.headers?.['authorization'] || req.headers?.['Authorization'];
      if (auth?.toString().startsWith('Bearer ')) {
        hasJWT = true;
      }
    }

    if (hasJWT) return 'Stateless (JWT)';
    if (hasCookies) return 'Server-side Sessions';

    return undefined;
  }

  /**
   * Map API endpoints from requests
   */
  private mapApiEndpoints(requests: any[]): string[] {
    const endpoints = new Set<string>();

    for (const req of requests) {
      try {
        const url = new URL(req.url);
        const path = url.pathname;

        // Clean up dynamic IDs in paths
        const cleanPath = path
          .replace(/\/\d+/g, '/:id')
          .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
          .replace(/\/[a-f0-9]{24}/g, '/:objectId');

        const endpoint = `${req.method} ${cleanPath}`;
        endpoints.add(endpoint);
      } catch {
        // Invalid URL, skip
      }
    }

    return Array.from(endpoints).slice(0, 20); // Limit to 20 most recent
  }

  /**
   * Detect security headers
   */
  private detectSecurityHeaders(requests: any[]): string[] {
    const securityHeaders = new Set<string>();

    const securityHeaderNames = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy',
    ];

    for (const req of requests) {
      const headers = req.responseHeaders || {};

      for (const headerName of securityHeaderNames) {
        if (headers[headerName] || headers[headerName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-')]) {
          securityHeaders.add(headerName);
        }
      }
    }

    return Array.from(securityHeaders);
  }

  /**
   * Identify vulnerability indicators from request patterns
   */
  private identifyVulnerabilityIndicators(requests: any[]): VulnerabilityIndicator[] {
    const indicators: VulnerabilityIndicator[] = [];

    for (const req of requests) {
      try {
        const url = new URL(req.url);

        // SQL Injection indicators
        const sqlParams = ['id', 'user', 'userid', 'username', 'search', 'query', 'filter'];
        for (const [key, value] of url.searchParams.entries()) {
          if (sqlParams.some(p => key.toLowerCase().includes(p))) {
            indicators.push({
              type: 'SQLi',
              confidence: 60,
              evidence: `Parameter '${key}' with value '${value}' in ${req.method} ${url.pathname}`,
              location: 'query',
            });
          }
        }

        // XSS indicators
        const xssParams = ['name', 'comment', 'message', 'text', 'content', 'description'];
        for (const [key, value] of url.searchParams.entries()) {
          if (xssParams.some(p => key.toLowerCase().includes(p))) {
            indicators.push({
              type: 'XSS',
              confidence: 55,
              evidence: `Parameter '${key}' in ${req.method} ${url.pathname}`,
              location: 'query',
            });
          }
        }

        // IDOR indicators
        if (url.pathname.match(/\/\d+$/) || url.pathname.match(/\/[a-f0-9-]{36}$/)) {
          indicators.push({
            type: 'IDOR',
            confidence: 50,
            evidence: `Numeric/UUID ID in path: ${url.pathname}`,
            location: 'path',
          });
        }

        // Missing authentication on API
        if (!req.headers?.['authorization'] && url.pathname.includes('/api/')) {
          indicators.push({
            type: 'AUTH_BYPASS',
            confidence: 40,
            evidence: `No authentication on API endpoint: ${req.method} ${url.pathname}`,
            location: 'headers',
          });
        }

        // Insecure cookie detection
        const setCookie = req.responseHeaders?.['set-cookie'];
        if (setCookie) {
          const cookies = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
          if (!cookies.toLowerCase().includes('httponly') || !cookies.toLowerCase().includes('secure')) {
            indicators.push({
              type: 'SESSION_FIXATION',
              confidence: 70,
              evidence: 'Session cookie without HttpOnly or Secure flag',
              location: 'cookie',
            });
          }
        }
      } catch {
        // Invalid URL or data, skip
      }
    }

    // Deduplicate by type
    const seen = new Set<string>();
    return indicators.filter(ind => {
      if (seen.has(ind.type)) return false;
      seen.add(ind.type);
      return true;
    });
  }

  /**
   * Build request flow analysis
   */
  async buildRequestFlow(
    userId: string,
    targetDomain: string,
    timeWindow = 3600000
  ): Promise<RequestFlow> {
    const requests = await this.prisma.requestLog.findMany({
      where: {
        userId,
        url: { contains: targetDomain },
        timestamp: {
          gte: new Date(Date.now() - timeWindow),
        },
      },
      select: {
        method: true,
        url: true,
        timestamp: true,
        duration: true,
        statusCode: true,
      },
      orderBy: { timestamp: 'asc' },
      take: 50,
    });

    const sequence = requests.map(r => ({
      method: r.method,
      url: r.url,
      timestamp: r.timestamp,
      duration: r.duration || undefined,
      statusCode: r.statusCode || undefined,
    }));

    // Identify user journey
    const userJourney = this.identifyUserJourney(sequence);

    // Identify critical paths
    const criticalPaths = this.identifyCriticalPaths(sequence);

    return {
      sequence,
      userJourney,
      criticalPaths,
    };
  }

  /**
   * Identify user journey from request sequence
   */
  private identifyUserJourney(sequence: any[]): string {
    if (sequence.length === 0) return 'Unknown';

    const paths = sequence.map(r => {
      try {
        return new URL(r.url).pathname;
      } catch {
        return '';
      }
    });

    // Detect common patterns
    if (paths.some(p => p.includes('/login'))) {
      if (paths.some(p => p.includes('/dashboard') || p.includes('/home'))) {
        return 'Login Flow → Dashboard Access';
      }
      return 'Authentication Flow';
    }

    if (paths.some(p => p.includes('/register') || p.includes('/signup'))) {
      return 'Registration Flow';
    }

    if (paths.some(p => p.includes('/checkout') || p.includes('/payment'))) {
      return 'E-commerce Checkout Flow';
    }

    if (paths.some(p => p.includes('/api/'))) {
      return 'API Interaction';
    }

    return 'General Navigation';
  }

  /**
   * Identify critical paths (authentication, payment, etc.)
   */
  private identifyCriticalPaths(sequence: any[]): string[] {
    const critical: string[] = [];

    for (const req of sequence) {
      try {
        const path = new URL(req.url).pathname;

        if (path.includes('/login') || path.includes('/auth')) {
          critical.push(`Authentication: ${req.method} ${path}`);
        }
        if (path.includes('/password') || path.includes('/reset')) {
          critical.push(`Password Management: ${req.method} ${path}`);
        }
        if (path.includes('/payment') || path.includes('/checkout')) {
          critical.push(`Payment: ${req.method} ${path}`);
        }
        if (path.includes('/admin')) {
          critical.push(`Admin Access: ${req.method} ${path}`);
        }
      } catch {
        // Invalid URL
      }
    }

    return Array.from(new Set(critical));
  }
}
