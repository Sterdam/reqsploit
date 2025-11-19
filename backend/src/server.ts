import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';

// Prisma singleton
import { prisma } from './lib/prisma.js';

// Routes
import authRoutes from './api/routes/auth.routes.js';
import proxyRoutes from './api/routes/proxy.routes.js';
import certificateRoutes from './api/routes/certificate.routes.js';
import aiRoutes from './api/routes/ai.routes.js';
import repeaterRoutes from './api/routes/repeater.routes.js';
import decoderRoutes from './api/routes/decoder.routes.js';
import intruderRoutes from './api/routes/intruder.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import billingRoutes from './routes/billing.routes.js';
import tagsRoutes from './routes/tags.routes.js';
import scanRoutes from './routes/scan.routes.js';

// Middlewares
import { errorHandler, notFoundHandler } from './api/middlewares/error-handler.middleware.js';
import { apiLimiter } from './api/middlewares/rate-limit.middleware.js';

// Core Services
import { wsServer } from './core/websocket/ws-server.js';
import { certificateManager } from './core/proxy/certificate-manager.js';

// Utils
import logger from './utils/logger.js';

const app: Express = express();
const server = http.createServer(app);

// Port configuration
const PORT = parseInt(process.env.BACKEND_PORT || '3000', 10);
const HOST = process.env.BACKEND_HOST || '0.0.0.0';

/**
 * Middleware Configuration
 */

// Security
app.use(helmet({
  contentSecurityPolicy: false, // Will be configured per route if needed
}));

// CORS
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
// Webhook route needs raw body for Stripe signature verification
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
// All other routes use JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

/**
 * Routes
 */

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
  });
});

// API routes with rate limiting
app.use('/api', apiLimiter);

// API health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/repeater', repeaterRoutes);
app.use('/api/decoder', decoderRoutes);
app.use('/api/intruder', intruderRoutes);

// New comprehensive routes
app.use('/api/requests', requestsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/scan', scanRoutes);

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Database Connection
 */
async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }
}

/**
 * Initialize Default Root CA Certificate
 * Generates a default certificate for the extension to use
 */
async function initializeDefaultCertificate(): Promise<void> {
  try {
    const defaultUserId = process.env.DEFAULT_CERT_USER_ID || 'default';

    // Check if default user exists, create if not
    let defaultUser = await prisma.user.findUnique({
      where: { email: 'extension@reqsploit.local' },
    });

    if (!defaultUser) {
      logger.info('Creating default certificate user for extension');
      defaultUser = await prisma.user.create({
        data: {
          email: 'extension@reqsploit.local',
          name: 'Extension Default User',
          passwordHash: 'N/A', // No password needed for this account
          plan: 'FREE',
          isActive: true,
          emailVerified: true,
        },
      });
    }

    // Generate Root CA if it doesn't exist
    await certificateManager.generateRootCA(defaultUser.id);
    logger.info('✓ Default Root CA certificate ready for extension');
  } catch (error) {
    logger.warn('Failed to initialize default certificate (will be generated on first use)', { error });
    // Don't crash the server if cert generation fails
  }
}

/**
 * Graceful Shutdown
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Shutdown WebSocket server
      await wsServer.shutdown();
      logger.info('WebSocket server closed');

      // Disconnect database
      await prisma.$disconnect();
      logger.info('Database disconnected');

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

/**
 * Start Server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize default certificate for extension
    await initializeDefaultCertificate();

    // Initialize WebSocket server
    wsServer.initialize(server);
    logger.info('WebSocket server initialized');

    // Start HTTP server
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 ReqSploit Backend Server started`, {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV,
        pid: process.pid,
      });
      logger.info(`📡 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`🔐 API endpoint: http://${HOST}:${PORT}/api`);
      logger.info(`🔌 WebSocket endpoint: ws://${HOST}:${PORT}`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export { app, server, prisma };
