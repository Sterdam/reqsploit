import http from 'http';
import https from 'https';
import net from 'net';
import { URL } from 'url';
import { EventEmitter } from 'events';
import { certificateManager } from './certificate-manager.js';
import { HTTPRequest, HTTPResponse, ProxyConfig, RequestFilters } from '../../types/proxy.types.js';
import { ProxyError } from '../../utils/errors.js';
import { proxyLogger } from '../../utils/logger.js';
import { RequestQueue, PendingRequest } from './request-queue.js';

export interface ProxyStats {
  totalRequests: number;
  interceptedRequests: number;
  activeConnections: number;
  startTime: Date;
}

/**
 * MITM Proxy Server
 * Intercepts HTTP/HTTPS traffic with SSL certificate generation
 */
export class MITMProxy extends EventEmitter {
  private userId: string;
  private port: number;
  private server: http.Server | null = null;
  private interceptMode: boolean;
  private filters: RequestFilters;
  private stats: ProxyStats;
  private isRunning: boolean = false;
  private requestQueue: RequestQueue;
  private proxySessionId: string;

  constructor(config: ProxyConfig) {
    super();
    this.userId = config.userId;
    this.port = config.port;
    this.interceptMode = config.interceptMode;
    this.filters = config.filters || {};
    this.proxySessionId = crypto.randomUUID();
    this.stats = {
      totalRequests: 0,
      interceptedRequests: 0,
      activeConnections: 0,
      startTime: new Date(),
    };

    // Initialize request queue
    this.requestQueue = new RequestQueue();

    // Forward queue events to proxy events
    this.requestQueue.on('request:held', (data) => this.emit('request:held', data));
    this.requestQueue.on('request:forwarded', (data) => this.emit('request:forwarded', data));
    this.requestQueue.on('request:dropped', (data) => this.emit('request:dropped', data));
    this.requestQueue.on('request:undo-success', (data) => this.emit('request:undo-success', data));
    this.requestQueue.on('request:final-drop', (data) => this.emit('request:final-drop', data));
    this.requestQueue.on('queue:changed', (data) => this.emit('queue:changed', data));

    proxyLogger.info('MITM Proxy initialized', {
      userId: this.userId,
      port: this.port,
      proxySessionId: this.proxySessionId,
    });
  }

  /**
   * Start the proxy server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new ProxyError('Proxy is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        // Ensure user has Root CA
        this.ensureRootCA()
          .then(() => {
            // Create HTTP server for CONNECT method (HTTPS tunneling)
            this.server = http.createServer(this.handleHttpRequest.bind(this));

            // Handle CONNECT for HTTPS
            this.server.on('connect', this.handleConnect.bind(this));

            // Error handling
            this.server.on('error', (error) => {
              proxyLogger.error('Proxy server error', { userId: this.userId, error });
              this.emit('error', error);
            });

            // Start listening
            this.server.listen(this.port, () => {
              this.isRunning = true;
              proxyLogger.info('MITM Proxy started', {
                userId: this.userId,
                port: this.port,
              });
              this.emit('started', { port: this.port });
              resolve();
            });
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the proxy server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    return new Promise(async (resolve) => {
      // Shutdown request queue first (forward all pending requests)
      await this.requestQueue.shutdown();

      this.server!.close(() => {
        this.isRunning = false;
        proxyLogger.info('MITM Proxy stopped', { userId: this.userId, port: this.port });
        this.emit('stopped');
        resolve();
      });
    });
  }

  /**
   * Handle HTTP requests (non-HTTPS)
   */
  private async handleHttpRequest(
    clientReq: http.IncomingMessage,
    clientRes: http.ServerResponse
  ): Promise<void> {
    this.stats.totalRequests++;
    this.stats.activeConnections++;

    const startTime = Date.now();

    proxyLogger.info('HTTP request received', {
      method: clientReq.method,
      url: clientReq.url,
      userId: this.userId,
    });

    try {
      // Parse request
      const request = await this.parseRequest(clientReq);

      // Check if should intercept
      const shouldIntercept = this.shouldInterceptRequest(request);

      // Always emit request event with intercept status
      if (shouldIntercept) {
        this.stats.interceptedRequests++;
      }

      proxyLogger.info('Emitting request:intercepted event', {
        url: request.url,
        isIntercepted: shouldIntercept,
        userId: this.userId,
      });

      this.emit('request:intercepted', { ...request, isIntercepted: shouldIntercept });

      // If should intercept, hold in queue for user action
      if (shouldIntercept) {
        const pendingRequest: PendingRequest = {
          ...request,
          userId: this.userId,
          proxySessionId: this.proxySessionId,
          isIntercepted: true,
          queuedAt: new Date(),
          clientReq,
          clientRes,
          isHttps: false,
        };

        await this.requestQueue.hold(pendingRequest);
        // Request is now in queue, will be forwarded later via WebSocket command
        return;
      }

      // Not intercepted - forward immediately
      const targetUrl = new URL(request.url);
      const options: http.RequestOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 80,
        path: targetUrl.pathname + targetUrl.search,
        method: request.method,
        headers: request.headers,
      };

      const proxyReq = http.request(options, (proxyRes) => {
        // Parse response
        const response = this.parseResponse(proxyRes, Date.now() - startTime);

        // Emit response event
        this.emit('response:received', { request, response });

        // Forward response to client
        clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(clientRes);
      });

      proxyReq.on('error', (error) => {
        proxyLogger.error('Proxy request error', { error });
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end('Bad Gateway');
      });

      // Write request body if present
      if (request.body) {
        proxyReq.write(request.body);
      }
      proxyReq.end();
    } catch (error) {
      proxyLogger.error('HTTP request handling error', { error });
      clientRes.writeHead(500, { 'Content-Type': 'text/plain' });
      clientRes.end('Internal Proxy Error');
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Handle CONNECT method for HTTPS tunneling
   */
  private async handleConnect(
    clientReq: http.IncomingMessage,
    clientSocket: net.Socket,
    head: Buffer
  ): Promise<void> {
    this.stats.totalRequests++;

    try {
      const targetUrl = clientReq.url || '';
      const [hostname, portStr] = targetUrl.split(':');
      const port = parseInt(portStr || '443', 10);

      proxyLogger.info('CONNECT request (HTTPS tunnel)', {
        hostname,
        port,
        userId: this.userId,
      });

      // Generate certificate for this domain
      const certPair = await certificateManager.generateDomainCert(hostname || '', this.userId);

      // Create HTTPS server for this connection
      const httpsServer = https.createServer(
        {
          key: certPair.key,
          cert: certPair.cert,
        },
        async (req, res) => {
          await this.handleHttpsRequest(req, res, hostname || '');
        }
      );

      // Tell client the tunnel is established
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

      // Pipe client to HTTPS server
      httpsServer.emit('connection', clientSocket);

      // Handle the buffered data
      if (head.length > 0) {
        clientSocket.unshift(head);
      }
    } catch (error) {
      proxyLogger.error('CONNECT handling error', { error });
      clientSocket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    }
  }

  /**
   * Handle HTTPS requests (after CONNECT tunnel)
   */
  private async handleHttpsRequest(
    clientReq: http.IncomingMessage,
    clientRes: http.ServerResponse,
    targetHost: string
  ): Promise<void> {
    this.stats.activeConnections++;
    const startTime = Date.now();

    proxyLogger.info('HTTPS request received', {
      method: clientReq.method,
      url: clientReq.url,
      host: targetHost,
      userId: this.userId,
    });

    try {
      // Parse request
      const request = await this.parseRequest(clientReq, true, targetHost);

      // Check if should intercept
      const shouldIntercept = this.shouldInterceptRequest(request);

      // Always emit request event with intercept status
      if (shouldIntercept) {
        this.stats.interceptedRequests++;
      }

      proxyLogger.info('Emitting request:intercepted event', {
        url: request.url,
        isIntercepted: shouldIntercept,
        userId: this.userId,
      });

      this.emit('request:intercepted', { ...request, isIntercepted: shouldIntercept });

      // If should intercept, hold in queue for user action
      if (shouldIntercept) {
        const pendingRequest: PendingRequest = {
          ...request,
          userId: this.userId,
          proxySessionId: this.proxySessionId,
          isIntercepted: true,
          queuedAt: new Date(),
          clientReq,
          clientRes,
          isHttps: true,
          targetHost,
        };

        await this.requestQueue.hold(pendingRequest);
        // Request is now in queue, will be forwarded later via WebSocket command
        return;
      }

      // Not intercepted - forward immediately
      const targetUrl = new URL(request.url);
      const options: https.RequestOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 443,
        path: targetUrl.pathname + targetUrl.search,
        method: request.method,
        headers: request.headers,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        const response = this.parseResponse(proxyRes, Date.now() - startTime);

        this.emit('response:received', { request, response });

        // Forward response
        clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(clientRes);
      });

      proxyReq.on('error', (error) => {
        proxyLogger.error('HTTPS proxy request error', { error });
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end('Bad Gateway');
      });

      // Write request body if present
      if (request.body) {
        proxyReq.write(request.body);
      }
      proxyReq.end();
    } catch (error) {
      proxyLogger.error('HTTPS request handling error', { error });
      clientRes.writeHead(500);
      clientRes.end('Internal Proxy Error');
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Parse incoming request
   */
  private async parseRequest(
    req: http.IncomingMessage,
    isHttps: boolean = false,
    targetHost?: string
  ): Promise<HTTPRequest> {
    const url = isHttps && targetHost
      ? `https://${targetHost}${req.url}`
      : req.url || '';

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    }

    // Read body (for POST, PUT, PATCH)
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      body = await this.readRequestBody(req);
    }

    return {
      id: crypto.randomUUID(),
      method: req.method || 'GET',
      url,
      headers,
      body,
      timestamp: new Date(),
    };
  }

  /**
   * Parse response
   */
  private parseResponse(
    res: http.IncomingMessage,
    duration: number
  ): HTTPResponse {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(res.headers)) {
      if (value) {
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    }

    return {
      statusCode: res.statusCode || 200,
      statusMessage: res.statusMessage || 'OK',
      headers,
      duration,
    };
  }

  /**
   * Read request body
   */
  private readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve(body);
      });
    });
  }

  /**
   * Check if request should be intercepted based on filters
   */
  private shouldInterceptRequest(request: HTTPRequest): boolean {
    if (!this.interceptMode) {
      return false;
    }

    const { methods, domains, urlPatterns } = this.filters;

    // Filter by method
    if (methods && methods.length > 0) {
      if (!methods.includes(request.method)) {
        return false;
      }
    }

    // Filter by domain
    if (domains && domains.length > 0) {
      const url = new URL(request.url);
      if (!domains.some((d) => url.hostname.includes(d))) {
        return false;
      }
    }

    // Filter by URL pattern
    if (urlPatterns && urlPatterns.length > 0) {
      if (!urlPatterns.some((pattern) => request.url.includes(pattern))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Ensure Root CA exists for user
   */
  private async ensureRootCA(): Promise<void> {
    let rootCA = await certificateManager.getRootCAForUser(this.userId);

    if (!rootCA) {
      proxyLogger.info('Generating Root CA for user', { userId: this.userId });
      await certificateManager.generateRootCA(this.userId);
    }
  }

  /**
   * Update intercept mode
   */
  setInterceptMode(enabled: boolean): void {
    this.interceptMode = enabled;
    proxyLogger.info('Intercept mode changed', {
      userId: this.userId,
      interceptMode: enabled,
    });
  }

  /**
   * Update filters
   */
  setFilters(filters: RequestFilters): void {
    this.filters = filters;
    proxyLogger.info('Filters updated', { userId: this.userId, filters });
  }

  /**
   * Get current stats
   */
  getStats(): ProxyStats {
    return { ...this.stats };
  }

  /**
   * Check if proxy is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get request queue instance for external control (WebSocket handlers)
   */
  getRequestQueue(): RequestQueue {
    return this.requestQueue;
  }

  /**
   * Get proxy session ID
   */
  getSessionId(): string {
    return this.proxySessionId;
  }
}
