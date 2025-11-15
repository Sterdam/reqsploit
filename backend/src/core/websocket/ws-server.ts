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
    this.io!.on('connection', (socket: TypedSocket) => {
      const userId = socket.data.userId;

      wsLogger.info('Client connected', {
        socketId: socket.id,
        userId,
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

      // Setup event handlers
      this.setupEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(userId, socket.id);
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(socket: TypedSocket): void {
    const userId = socket.data.userId;

    // Proxy Control Events
    socket.on('proxy:start', async (data) => {
      wsLogger.info('Proxy start requested', { userId, data });
      // This will be handled by proxy event handlers
    });

    socket.on('proxy:stop', async () => {
      wsLogger.info('Proxy stop requested', { userId });
      // This will be handled by proxy event handlers
    });

    socket.on('proxy:toggle-intercept', async (data) => {
      wsLogger.info('Intercept mode toggle requested', { userId, enabled: data.enabled });
      // This will be handled by proxy event handlers
    });

    // Request Management Events
    socket.on('request:forward', async (data) => {
      wsLogger.debug('Request forward', { userId, requestId: data.requestId });

      try {
        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          wsLogger.error('No active proxy session for user', { userId });
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        await queue.forward(data.requestId, data.modifications);

        wsLogger.info('Request forwarded successfully', { userId, requestId: data.requestId });
      } catch (error) {
        wsLogger.error('Failed to forward request', { userId, requestId: data.requestId, error });
        socket.emit('error', { message: 'Failed to forward request' });
      }
    });

    socket.on('request:drop', async (data) => {
      wsLogger.debug('Request drop', { userId, requestId: data.requestId });

      try {
        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          wsLogger.error('No active proxy session for user', { userId });
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        queue.drop(data.requestId);

        wsLogger.info('Request dropped successfully', { userId, requestId: data.requestId });
      } catch (error) {
        wsLogger.error('Failed to drop request', { userId, requestId: data.requestId, error });
        socket.emit('error', { message: 'Failed to drop request' });
      }
    });

    socket.on('request:modify', async (data) => {
      wsLogger.debug('Request modify', { userId, requestId: data.requestId });

      try {
        const session = proxySessionManager.getSessionByUserId(userId);
        if (!session) {
          wsLogger.error('No active proxy session for user', { userId });
          socket.emit('error', { message: 'No active proxy session' });
          return;
        }

        const queue = session.proxy.getRequestQueue();
        const modifications: RequestModification = {
          requestId: data.requestId,
          modifications: data.modifications,
        };

        await queue.forward(data.requestId, modifications);

        wsLogger.info('Request modified and forwarded', { userId, requestId: data.requestId });
      } catch (error) {
        wsLogger.error('Failed to modify request', { userId, requestId: data.requestId, error });
        socket.emit('error', { message: 'Failed to modify request' });
      }
    });

    // Request queue query
    socket.on('request:get-queue', async () => {
      wsLogger.debug('Get request queue', { userId });

      try {
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
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    if (!this.io) {
      wsLogger.error('WebSocket server not initialized');
      return;
    }

    this.io.to(WS_ROOMS.user(userId)).emit(event, data);

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
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    if (!this.io) {
      wsLogger.error('WebSocket server not initialized');
      return;
    }

    this.io.to(WS_ROOMS.proxySession(sessionId)).emit(event, data);

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
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    if (!this.io) {
      wsLogger.error('WebSocket server not initialized');
      return;
    }

    this.io.emit(event, data);

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
