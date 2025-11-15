import { PrismaClient } from '@prisma/client';
import { MITMProxy } from './mitm-proxy.js';
import { ProxyConfig, ProxySession, RequestFilters } from '../../types/proxy.types.js';
import { ProxyError, NotFoundError } from '../../utils/errors.js';
import { proxyLogger } from '../../utils/logger.js';
import { wsServer } from '../websocket/ws-server.js';

const prisma = new PrismaClient();

interface ActiveProxySession {
  proxy: MITMProxy;
  config: ProxyConfig;
  sessionData: ProxySession;
}

/**
 * Proxy Session Manager (Singleton)
 * Manages multi-user proxy sessions with dynamic port allocation
 */
export class ProxySessionManager {
  private static instance: ProxySessionManager;
  private activeSessions: Map<string, ActiveProxySession> = new Map();
  private usedPorts: Set<number> = new Set();
  private portRange: { start: number; end: number };

  private constructor() {
    this.portRange = {
      start: parseInt(process.env.PROXY_PORT_START || '8000', 10),
      end: parseInt(process.env.PROXY_PORT_END || '9000', 10),
    };

    proxyLogger.info('Proxy Session Manager initialized', {
      portRange: this.portRange,
    });

    // Clean up orphaned sessions from previous restarts
    this.cleanupOrphanedSessions();

    // Cleanup inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ProxySessionManager {
    if (!ProxySessionManager.instance) {
      ProxySessionManager.instance = new ProxySessionManager();
    }
    return ProxySessionManager.instance;
  }

  /**
   * Create a new proxy session for a user
   */
  async createSession(
    userId: string,
    interceptMode: boolean = false,
    filters?: RequestFilters
  ): Promise<ProxySession> {
    proxyLogger.info('Creating proxy session', { userId });

    // Check if user already has an active session
    const existingSession = this.getSessionByUserId(userId);
    if (existingSession) {
      proxyLogger.warn('User already has active session', { userId });
      return existingSession.sessionData;
    }

    try {
      // Allocate port
      const port = this.allocatePort();

      // Create session ID
      const sessionId = crypto.randomUUID();

      // Create proxy config
      const config: ProxyConfig = {
        host: '0.0.0.0',
        port,
        userId,
        interceptMode,
        filters,
      };

      // Create MITM proxy instance
      const proxy = new MITMProxy(config);

      // Create session in database FIRST
      const sessionData = await prisma.proxySession.create({
        data: {
          userId,
          sessionId,
          proxyPort: port,
          isActive: true,
          interceptMode,
        },
      });

      // Set up event listeners BEFORE starting proxy
      this.setupProxyEventListeners(proxy, userId, sessionId, sessionData.id);

      // Start proxy
      await proxy.start();

      // Store in active sessions
      this.activeSessions.set(userId, {
        proxy,
        config,
        sessionData,
      });

      proxyLogger.info('Proxy session created', {
        userId,
        sessionId,
        port,
      });

      return sessionData;
    } catch (error) {
      proxyLogger.error('Failed to create proxy session', { userId, error });
      throw new ProxyError('Failed to create proxy session');
    }
  }

  /**
   * Get session by user ID
   */
  getSessionByUserId(userId: string): ActiveProxySession | undefined {
    return this.activeSessions.get(userId);
  }

  /**
   * Get session info
   */
  async getSessionInfo(userId: string): Promise<ProxySession | null> {
    const activeSession = this.activeSessions.get(userId);

    if (activeSession) {
      return activeSession.sessionData;
    }

    // Check database
    const dbSession = await prisma.proxySession.findFirst({
      where: { userId, isActive: true },
    });

    return dbSession;
  }

  /**
   * Destroy a proxy session
   */
  async destroySession(userId: string): Promise<void> {
    proxyLogger.info('Destroying proxy session', { userId });

    const session = this.activeSessions.get(userId);

    if (!session) {
      throw new NotFoundError('Proxy session not found');
    }

    try {
      // Stop proxy
      await session.proxy.stop();

      // Release port
      this.releasePort(session.config.port);

      // Update database
      await prisma.proxySession.update({
        where: { id: session.sessionData.id },
        data: { isActive: false },
      });

      // Remove from active sessions
      this.activeSessions.delete(userId);

      proxyLogger.info('Proxy session destroyed', { userId });
    } catch (error) {
      proxyLogger.error('Failed to destroy proxy session', { userId, error });
      throw new ProxyError('Failed to destroy proxy session');
    }
  }

  /**
   * Update session settings
   */
  async updateSessionSettings(
    userId: string,
    settings: {
      interceptMode?: boolean;
      filters?: RequestFilters;
    }
  ): Promise<void> {
    const session = this.activeSessions.get(userId);

    if (!session) {
      throw new NotFoundError('Proxy session not found');
    }

    // Update proxy settings
    if (settings.interceptMode !== undefined) {
      session.proxy.setInterceptMode(settings.interceptMode);
      await prisma.proxySession.update({
        where: { id: session.sessionData.id },
        data: { interceptMode: settings.interceptMode },
      });
    }

    if (settings.filters) {
      session.proxy.setFilters(settings.filters);
    }

    proxyLogger.info('Session settings updated', { userId, settings });
  }

  /**
   * Get all active sessions
   */
  getAllActiveSessions(): ActiveProxySession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session count
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Allocate an available port
   */
  private allocatePort(): number {
    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }
    throw new ProxyError('No available ports in range');
  }

  /**
   * Release a port
   */
  private releasePort(port: number): void {
    this.usedPorts.delete(port);
  }

  /**
   * Setup event listeners for proxy
   */
  private setupProxyEventListeners(
    proxy: MITMProxy,
    userId: string,
    sessionId: string,
    proxySessionDbId: string
  ): void {
    proxy.on('request:intercepted', async (request) => {
      // Log request to database (now receives all requests with isIntercepted flag)
      try {
        await prisma.requestLog.create({
          data: {
            userId,
            proxySessionId: proxySessionDbId,
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body,
            isIntercepted: request.isIntercepted ?? true,
            timestamp: request.timestamp,
          },
        });

        proxyLogger.debug('Request logged', {
          method: request.method,
          url: request.url,
          isIntercepted: request.isIntercepted
        });

        // Emit to WebSocket
        wsServer.emitToUser(userId, 'request:intercepted', {
          request,
          sessionId,
          timestamp: new Date(),
        });
      } catch (error) {
        proxyLogger.error('Failed to log request', { error });
      }
    });

    proxy.on('response:received', async ({ request, response }) => {
      // Update request log with response
      try {
        const log = await prisma.requestLog.findFirst({
          where: {
            url: request.url,
            method: request.method,
            timestamp: request.timestamp,
          },
        });

        if (log) {
          await prisma.requestLog.update({
            where: { id: log.id },
            data: {
              statusCode: response.statusCode,
              responseHeaders: response.headers,
              duration: response.duration,
            },
          });
        }

        // Emit to WebSocket
        wsServer.emitToUser(userId, 'response:received', {
          request,
          response,
          sessionId,
          timestamp: new Date(),
        });
      } catch (error) {
        proxyLogger.error('Failed to update request log', { error });
      }
    });

    proxy.on('started', ({ port }) => {
      // Emit proxy started event
      wsServer.emitToUser(userId, 'proxy:started', {
        sessionId,
        proxyPort: port,
      });
    });

    proxy.on('stopped', () => {
      // Emit proxy stopped event
      wsServer.emitToUser(userId, 'proxy:stopped', {});
    });

    proxy.on('error', (error) => {
      proxyLogger.error('Proxy error', { userId, sessionId, error });

      // Emit error to user
      wsServer.emitToUser(userId, 'proxy:error', {
        message: error.message || 'Proxy error occurred',
      });
    });

    // Request queue events
    proxy.on('request:held', (data) => {
      wsServer.emitToUser(userId, 'request:held', {
        sessionId,
        ...data,
      });
    });

    proxy.on('request:forwarded', (data) => {
      wsServer.emitToUser(userId, 'request:forwarded', {
        sessionId,
        ...data,
      });
    });

    proxy.on('request:dropped', (data) => {
      wsServer.emitToUser(userId, 'request:dropped', {
        sessionId,
        ...data,
      });
    });

    proxy.on('queue:changed', (data) => {
      wsServer.emitToUser(userId, 'queue:changed', {
        sessionId,
        ...data,
      });
    });

    // Periodically emit stats
    setInterval(() => {
      const stats = proxy.getStats();
      wsServer.emitToUser(userId, 'proxy:stats', {
        totalRequests: stats.totalRequests,
        interceptedRequests: stats.interceptedRequests,
        activeConnections: stats.activeConnections,
        uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000),
      });
    }, 5000); // Every 5 seconds
  }

  /**
   * Cleanup orphaned sessions (sessions in DB but not in memory)
   * Called on startup to clean sessions from previous server restarts
   */
  private async cleanupOrphanedSessions(): Promise<void> {
    try {
      const result = await prisma.proxySession.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      if (result.count > 0) {
        proxyLogger.info('Cleaned up orphaned sessions from previous restart', {
          count: result.count,
        });
      }
    } catch (error) {
      proxyLogger.error('Failed to cleanup orphaned sessions', { error });
    }
  }

  /**
   * Cleanup inactive sessions (timeout: 30 minutes)
   */
  private async cleanupInactiveSessions(): Promise<void> {
    const timeout = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    for (const [userId, session] of this.activeSessions.entries()) {
      const lastActivity = session.sessionData.updatedAt.getTime();

      if (now - lastActivity > timeout) {
        proxyLogger.info('Cleaning up inactive session', { userId });
        try {
          await this.destroySession(userId);
        } catch (error) {
          proxyLogger.error('Failed to cleanup session', { userId, error });
        }
      }
    }
  }
}

// Export singleton instance
export const proxySessionManager = ProxySessionManager.getInstance();
