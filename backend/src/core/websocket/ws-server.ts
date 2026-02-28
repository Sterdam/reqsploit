import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  WS_ROOMS,
} from '../../types/websocket.types.js';
import { verifyAccessToken } from '../../services/auth.service.js';
import { wsLogger } from '../../utils/logger.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { proxySessionManager } from '../proxy/session-manager.js';
import { RequestModification } from '../../types/proxy.types.js';
import { setupExtensionHandlers } from './extension-handler.js';
import { extensionManager } from './extension-manager.js';
import { cdpRequestQueue } from '../proxy/cdp-request-queue.js';

/**
 * WebSocket Server (Singleton)
 * Manages real-time bidirectional communication with clients
 */

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

export class WebSocketServer {
  private static instance: WebSocketServer;
  private io: TypedServer | null = null;
  private connections: Map<string, Set<string>> = new Map(); // userId → socketIds

  private constructor() {
    wsLogger.info('WebSocket Server instance created');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer();
    }
    return WebSocketServer.instance;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    if (this.io) {
      wsLogger.warn('WebSocket server already initialized');
      return;
    }

    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];

    this.io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupConnectionHandler();
    this.bridgeCDPQueueEvents();

    wsLogger.info('WebSocket server initialized', {
      allowedOrigins,
    });
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io!.use(async (socket: TypedSocket, next) => {
      try {
        // Extract token from handshake auth
        const token = socket.handshake.auth.token;

        if (!token) {
          throw new UnauthorizedError('Authentication token required');
        }

        // Verify JWT token
        const user = await verifyAccessToken(token);

        // Attach user data to socket
        socket.data.userId = user.id;
        socket.data.authenticated = true;

        wsLogger.debug('Socket authenticated', {
          socketId: socket.id,
          userId: user.id,
        });

        next();
      } catch (error) {
        wsLogger.error('Socket authentication failed', {
          socketId: socket.id,
          error,
        });
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup connection event handler
   */
  private setupConnectionHandler(): void {
    // Provide emit function to ExtensionManager
    extensionManager.setEmitFunction((socketId: string, event: string, data: any) => {
      this.io?.to(socketId).emit(event as any, data);
    });

    this.io!.on('connection', (socket: TypedSocket) => {
      const userId = socket.data.userId;
      const isExtension = socket.handshake.query.client === 'extension';

      wsLogger.info('Client connected', {
        socketId: socket.id,
        userId,
        clientType: isExtension ? 'extension' : 'dashboard',
      });

      // Track connection
      this.trackConnection(userId, socket.id);

      // Join user room
      socket.join(WS_ROOMS.user(userId));

      // Emit authenticated event
      socket.emit('authenticated', {
        userId,
        sessionId: socket.id,
      });

      if (isExtension) {
        // Setup extension-specific event handlers
        setupExtensionHandlers(socket as any, userId);
      }

      // Setup standard event handlers (dashboard)
      this.setupEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        if (isExtension) {
          extensionManager.unregister(userId);
          // Notify dashboard that extension disconnected
          this.emitToUser(userId, 'ext:disconnected');
        }
        this.handleDisconnect(userId, socket.id);
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(socket: TypedSocket): void {
    const userId = socket.data.userId;

    // Proxy Control Events - relay to extension for CDP attachment
    socket.on('proxy:start', async (data) => {
      wsLogger.info('Proxy start requested', { userId, data });
      if (extensionManager.isConnected(userId)) {
        extensionManager.startIntercept(userId, { attachAll: true });
      }
    });

    socket.on('proxy:stop', async () => {
      wsLogger.info('Proxy stop requested', { userId });
      if (extensionManager.isConnected(userId)) {
        extensionManager.stopIntercept(userId);
      }
    });

    socket.on('proxy:toggle-intercept', async (data) => {
      wsLogger.info('Intercept mode toggle requested', { userId, enabled: data.enabled });
      if (extensionManager.isConnected(userId)) {
        extensionManager.toggleIntercept(userId, { enabled: data.enabled });
      }
    });

    // Request Management Events
    // CDP mode: use cdpRequestQueue; Legacy: use proxySessionManager
    socket.on('request:forward', async (data) => {
      wsLogger.debug('Request forward', { userId, requestId: data.requestId });

      try {
        // Try CDP queue first (extension-based)
        const cdpPending = cdpRequestQueue.getQueue(userId).find((r) => r.requestId === data.requestId);
        if (cdpPending) {
          cdpRequestQueue.forward(userId, data.requestId, data.modifications);
          wsLogger.info('Request forwarded via CDP', { userId, requestId: data.requestId });
          return;
        }

        // Fallback: legacy proxy session
        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        await queue.forward(data.requestId, data.modifications);
        wsLogger.info('Request forwarded via proxy', { userId, requestId: data.requestId });
      } catch (error) {
        wsLogger.error('Failed to forward request', { userId, requestId: data.requestId, error });
        socket.emit('error', { message: 'Failed to forward request' });
      }
    });

    socket.on('request:drop', async (data) => {
      wsLogger.debug('Request drop', { userId, requestId: data.requestId });

      try {
        // Try CDP queue first
        const cdpPending = cdpRequestQueue.getQueue(userId).find((r) => r.requestId === data.requestId);
        if (cdpPending) {
          cdpRequestQueue.drop(userId, data.requestId);
          wsLogger.info('Request dropped via CDP', { userId, requestId: data.requestId });
          return;
        }

        // Fallback: legacy
        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        queue.drop(data.requestId);
        wsLogger.info('Request dropped via proxy', { userId, requestId: data.requestId });
      } catch (error) {
        wsLogger.error('Failed to drop request', { userId, requestId: data.requestId, error });
        socket.emit('error', { message: 'Failed to drop request' });
      }
    });

    socket.on('request:modify', async (data) => {
      wsLogger.debug('Request modify', { userId, requestId: data.requestId });

      try {
        // Try CDP queue first
        const cdpPending = cdpRequestQueue.getQueue(userId).find((r) => r.requestId === data.requestId);
        if (cdpPending) {
          // Convert dashboard modifications to CDP format
          const mods = data.modifications ? {
            method: data.modifications.method,
            url: data.modifications.url,
            headers: data.modifications.headers
              ? Object.entries(data.modifications.headers).map(([name, value]) => ({ name, value: value as string }))
              : undefined,
            postData: data.modifications.body,
          } : undefined;

          cdpRequestQueue.forward(userId, data.requestId, mods);
          wsLogger.info('Request modified and forwarded via CDP', { userId, requestId: data.requestId });
          return;
        }

        // Fallback: legacy
        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const modifications: RequestModification = {
          requestId: data.requestId,
          modifications: data.modifications,
        };

        await queue.forward(data.requestId, modifications);
        wsLogger.info('Request modified and forwarded via proxy', { userId, requestId: data.requestId });
      } catch (error) {
        wsLogger.error('Failed to modify request', { userId, requestId: data.requestId, error });
        socket.emit('error', { message: 'Failed to modify request' });
      }
    });

    // Response Management Events (CDP only)
    socket.on('response:forward', async (data) => {
      wsLogger.debug('Response forward', { userId, requestId: data.requestId });
      try {
        cdpRequestQueue.forward(userId, data.requestId, data.modifications);
      } catch (error) {
        wsLogger.error('Failed to forward response', { userId, error });
        socket.emit('error', { message: 'Failed to forward response' });
      }
    });

    socket.on('response:drop', async (data) => {
      wsLogger.debug('Response drop', { userId, requestId: data.requestId });
      try {
        cdpRequestQueue.drop(userId, data.requestId);
      } catch (error) {
        wsLogger.error('Failed to drop response', { userId, error });
        socket.emit('error', { message: 'Failed to drop response' });
      }
    });

    // Request queue query
    socket.on('request:get-queue', async () => {
      wsLogger.debug('Get request queue', { userId });

      try {
        // Try CDP queue first
        const cdpQueue = cdpRequestQueue.getQueue(userId);
        if (cdpQueue.length > 0 || extensionManager.isConnected(userId)) {
          socket.emit('request:queue', { queue: cdpQueue });
          return;
        }

        // Fallback: legacy proxy session
        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('request:queue', { queue: [] });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const queueData = queue.getQueue();

        socket.emit('request:queue', { queue: queueData });
      } catch (error) {
        wsLogger.error('Failed to get request queue', { userId, error });
        socket.emit('error', { message: 'Failed to get request queue' });
      }
    });

    // Bulk Request Management
    socket.on('request:bulk-forward', async (data) => {
      wsLogger.info('Bulk forward requested', { userId, count: data.requestIds.length });

      try {
        // Try CDP queue first
        if (extensionManager.isConnected(userId)) {
          const result = await cdpRequestQueue.bulkForward(userId, data.requestIds);
          socket.emit('bulk:result', { action: 'forward', ...result });
          return;
        }

        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const result = await queue.bulkForward(data.requestIds);
        socket.emit('bulk:result', { action: 'forward', ...result });
      } catch (error) {
        wsLogger.error('Bulk forward failed', { userId, error });
        socket.emit('error', { message: 'Bulk forward failed' });
      }
    });

    socket.on('request:bulk-drop', async (data) => {
      wsLogger.info('Bulk drop requested', { userId, count: data.requestIds.length });

      try {
        if (extensionManager.isConnected(userId)) {
          const result = cdpRequestQueue.bulkDrop(userId, data.requestIds);
          socket.emit('bulk:result', { action: 'drop', ...result });
          return;
        }

        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const result = queue.bulkDrop(data.requestIds);
        socket.emit('bulk:result', { action: 'drop', ...result });
      } catch (error) {
        wsLogger.error('Bulk drop failed', { userId, error });
        socket.emit('error', { message: 'Bulk drop failed' });
      }
    });

    socket.on('request:forward-by-pattern', async (data) => {
      wsLogger.info('Pattern-based forward requested', { userId, pattern: data.urlPattern });

      try {
        if (extensionManager.isConnected(userId)) {
          const result = cdpRequestQueue.forwardByPattern(userId, data.urlPattern);
          socket.emit('bulk:result', { action: 'forward', ...result });
          return;
        }

        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const result = await queue.forwardByPattern(data.urlPattern);
        socket.emit('bulk:result', { action: 'forward', ...result });
      } catch (error) {
        wsLogger.error('Pattern forward failed', { userId, error });
        socket.emit('error', { message: 'Pattern forward failed' });
      }
    });

    socket.on('request:drop-by-pattern', async (data) => {
      wsLogger.info('Pattern-based drop requested', { userId, pattern: data.urlPattern });

      try {
        if (extensionManager.isConnected(userId)) {
          const result = cdpRequestQueue.dropByPattern(userId, data.urlPattern);
          socket.emit('bulk:result', { action: 'drop', ...result });
          return;
        }

        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const result = queue.dropByPattern(data.urlPattern);
        socket.emit('bulk:result', { action: 'drop', ...result });
      } catch (error) {
        wsLogger.error('Pattern drop failed', { userId, error });
        socket.emit('error', { message: 'Pattern drop failed' });
      }
    });

    // Smart Filters Management
    socket.on('smart-filters:get', async () => {
      wsLogger.debug('Get smart filters', { userId });

      try {
        // CDP mode: relay to extension
        if (extensionManager.isConnected(userId)) {
          // Extension manages its own filters, return default
          socket.emit('smart-filters:config', { filters: [] });
          return;
        }

        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('smart-filters:config', { filters: [] });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const filters = queue.getSmartFilters();
        socket.emit('smart-filters:config', { filters });
      } catch (error) {
        wsLogger.error('Failed to get smart filters', { userId, error });
        socket.emit('error', { message: 'Failed to get smart filters' });
      }
    });

    socket.on('smart-filters:update', async (data) => {
      wsLogger.info('Update smart filters', { userId, count: data.filters.length });

      try {
        // CDP mode: relay to extension
        if (extensionManager.isConnected(userId)) {
          extensionManager.updateFilters(userId, { filters: data.filters });
          socket.emit('smart-filters:config', { filters: data.filters });
          return;
        }

        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        queue.setSmartFilters(data.filters);
        socket.emit('smart-filters:config', { filters: data.filters });
      } catch (error) {
        wsLogger.error('Failed to update smart filters', { userId, error });
        socket.emit('error', { message: 'Failed to update smart filters' });
      }
    });

    // Tab Management Events (Dashboard → Extension relay)
    socket.on('tabs:list', async () => {
      wsLogger.debug('List tabs requested', { userId });
      if (extensionManager.isConnected(userId)) {
        extensionManager.listTabs(userId);
      } else {
        socket.emit('tabs:list', { tabs: [] });
      }
    });

    socket.on('tabs:attach', async (data) => {
      wsLogger.info('Attach tab requested', { userId, tabId: data.tabId });
      if (extensionManager.isConnected(userId)) {
        extensionManager.attachTab(userId, data.tabId);
      }
    });

    socket.on('tabs:detach', async (data) => {
      wsLogger.info('Detach tab requested', { userId, tabId: data.tabId });
      if (extensionManager.isConnected(userId)) {
        extensionManager.detachTab(userId, data.tabId);
      }
    });

    socket.on('tabs:attach-all', async () => {
      wsLogger.info('Attach all tabs requested', { userId });
      if (extensionManager.isConnected(userId)) {
        extensionManager.attachAllTabs(userId);
      }
    });

    // AI Analysis Events
    socket.on('ai:analyze-request', async (data) => {
      wsLogger.debug('AI analysis requested', { userId, requestId: data.requestId });
      // Trigger AI analysis (will be implemented in AI service)
    });

    socket.on('ai:apply-suggestion', async (data) => {
      wsLogger.debug('AI suggestion applied', {
        userId,
        requestId: data.requestId,
        suggestionId: data.suggestionId,
      });
      // Apply AI suggestion to request
    });
  }

  /**
   * Bridge CDPRequestQueue events to WebSocket so the dashboard
   * receives confirmation when requests are forwarded/dropped.
   */
  private bridgeCDPQueueEvents(): void {
    // Forward confirmation → dashboard removes from queue UI
    cdpRequestQueue.on('request:forwarded', (data: { userId: string; requestId: string; wasModified: boolean }) => {
      this.emitToUser(data.userId, 'request:forwarded' as any, {
        requestId: data.requestId,
        wasModified: data.wasModified,
      });
    });

    cdpRequestQueue.on('response:forwarded', (data: { userId: string; requestId: string; wasModified: boolean }) => {
      this.emitToUser(data.userId, 'response:forwarded', {
        userId: data.userId,
        requestId: data.requestId,
      });
    });

    // Drop confirmation → dashboard shows undo option
    cdpRequestQueue.on('request:dropped', (data: { userId: string; requestId: string; canUndo: boolean; graceSeconds: number }) => {
      this.emitToUser(data.userId, 'request:dropped' as any, {
        requestId: data.requestId,
        canUndo: data.canUndo,
        graceSeconds: data.graceSeconds,
      });
    });

    cdpRequestQueue.on('response:dropped', (data: { userId: string; requestId: string; canUndo: boolean; graceSeconds: number }) => {
      this.emitToUser(data.userId, 'response:dropped', {
        userId: data.userId,
        requestId: data.requestId,
      });
    });

    // Final drop after grace period → dashboard removes undo option
    cdpRequestQueue.on('request:final-drop', (data: { userId: string; requestId: string }) => {
      this.emitToUser(data.userId, 'request:final-drop' as any, {
        requestId: data.requestId,
      });
    });

    // Undo success → dashboard re-adds request to queue
    cdpRequestQueue.on('request:undo-success', (data: { userId: string; requestId: string }) => {
      this.emitToUser(data.userId, 'request:undo-success' as any, {
        requestId: data.requestId,
      });
    });

    wsLogger.info('CDP queue events bridged to WebSocket');
  }

  /**
   * Track user connection
   */
  private trackConnection(userId: string, socketId: string): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(socketId);

    wsLogger.debug('Connection tracked', {
      userId,
      socketId,
      totalConnections: this.connections.get(userId)!.size,
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(userId: string, socketId: string): void {
    wsLogger.info('Client disconnected', {
      socketId,
      userId,
    });

    // Remove from tracking
    const userSockets = this.connections.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Emit event to specific user
   */
  emitToUser<K extends keyof ServerToClientEvents>(
    userId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    if (!this.io) {
      wsLogger.error('WebSocket server not initialized');
      return;
    }

    this.io.to(WS_ROOMS.user(userId)).emit(event, ...(args as any));

    wsLogger.info('Event emitted to user', {
      userId,
      event,
      room: WS_ROOMS.user(userId),
    });
  }

  /**
   * Emit event to specific session
   */
  emitToSession<K extends keyof ServerToClientEvents>(
    sessionId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    if (!this.io) {
      wsLogger.error('WebSocket server not initialized');
      return;
    }

    this.io.to(WS_ROOMS.proxySession(sessionId)).emit(event, ...(args as any));

    wsLogger.debug('Event emitted to session', {
      sessionId,
      event,
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    if (!this.io) {
      wsLogger.error('WebSocket server not initialized');
      return;
    }

    this.io.emit(event, ...(args as any));

    wsLogger.debug('Event broadcasted', { event });
  }

  /**
   * Get connected socket count for user
   */
  getUserSocketCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * Get total connected clients
   */
  getTotalConnections(): number {
    let total = 0;
    for (const sockets of this.connections.values()) {
      total += sockets.size;
    }
    return total;
  }

  /**
   * Get IO instance (for advanced usage)
   */
  getIO(): TypedServer {
    if (!this.io) {
      throw new Error('WebSocket server not initialized');
    }
    return this.io;
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    if (!this.io) {
      return;
    }

    wsLogger.info('Shutting down WebSocket server');

    // Close all connections
    this.io.close();
    this.connections.clear();
    this.io = null;

    wsLogger.info('WebSocket server shutdown complete');
  }
}

// Export singleton instance
export const wsServer = WebSocketServer.getInstance();
