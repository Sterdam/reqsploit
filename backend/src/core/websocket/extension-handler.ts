/**
 * Extension WebSocket Event Handler
 * Handles all events from the Chrome extension (ext:* events).
 */

import { Socket } from 'socket.io';
import { prisma } from '../../lib/prisma.js';
import { wsLogger } from '../../utils/logger.js';
import { extensionManager } from './extension-manager.js';
import { cdpRequestQueue } from '../proxy/cdp-request-queue.js';
import { wsServer } from './ws-server.js';
import type {
  ExtConnectedPayload,
  ExtRequestPausedPayload,
  ExtResponsePausedPayload,
  ExtRepeaterResultPayload,
  ExtIntruderResultPayload,
  ExtStatusPayload,
} from '../../types/extension.types.js';

/**
 * Setup extension event handlers for a socket
 */
export function setupExtensionHandlers(socket: Socket, userId: string): void {
  wsLogger.info('Setting up extension handlers', { userId, socketId: socket.id });

  // ext:connected - Extension reports initial state
  socket.on('ext:connected', (data: ExtConnectedPayload) => {
    wsLogger.info('Extension connected', { userId, version: data.extensionVersion, tabs: data.attachedTabs.length });

    extensionManager.register(userId, socket.id, data.extensionVersion, data.attachedTabs);

    // Notify dashboard
    wsServer.emitToUser(userId, 'ext:connected' as any, {
      version: data.extensionVersion,
      attachedTabs: data.attachedTabs,
    });
  });

  // ext:request-paused - Extension intercepted a request
  socket.on('ext:request-paused', async (data: ExtRequestPausedPayload) => {
    wsLogger.debug('Request paused from extension', { userId, url: data.url, method: data.method });

    try {
      // Find or create proxy session for this user
      const session = await getOrCreateSession(userId);

      // Log request to database
      await prisma.requestLog.create({
        data: {
          userId,
          proxySessionId: session.id,
          method: data.method,
          url: data.url,
          headers: data.headers,
          body: data.body || null,
          isIntercepted: true,
          tabId: data.tabId,
          resourceType: data.resourceType,
          timestamp: new Date(data.timestamp),
        },
      });

      // Add to CDP request queue
      cdpRequestQueue.hold({
        requestId: data.requestId,
        userId,
        tabId: data.tabId,
        phase: 'request',
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.body,
        resourceType: data.resourceType,
        timestamp: data.timestamp,
      });

      // Emit to dashboard
      wsServer.emitToUser(userId, 'request:held' as any, {
        sessionId: session.sessionId,
        userId,
        request: {
          id: data.requestId,
          method: data.method,
          url: data.url,
          headers: data.headers,
          body: data.body,
          timestamp: new Date(data.timestamp),
          queuedAt: new Date().toISOString(),
          isIntercepted: true,
          tabId: data.tabId,
          resourceType: data.resourceType,
        },
      });
    } catch (error) {
      wsLogger.error('Failed to handle request paused', { userId, error });
    }
  });

  // ext:response-paused - Extension intercepted a response
  socket.on('ext:response-paused', async (data: ExtResponsePausedPayload) => {
    wsLogger.debug('Response paused from extension', { userId, url: data.originalRequestUrl, status: data.statusCode });

    try {
      // Add to CDP request queue (response phase)
      cdpRequestQueue.hold({
        requestId: data.requestId,
        userId,
        tabId: data.tabId,
        phase: 'response',
        method: data.originalRequestMethod,
        url: data.originalRequestUrl,
        headers: data.headers,
        body: data.body,
        statusCode: data.statusCode,
        timestamp: data.timestamp,
      });

      // Emit to dashboard (new response:held event)
      wsServer.emitToUser(userId, 'response:held' as any, {
        userId,
        response: {
          id: data.requestId,
          statusCode: data.statusCode,
          headers: data.headers,
          body: data.body,
          originalRequestUrl: data.originalRequestUrl,
          originalRequestMethod: data.originalRequestMethod,
          tabId: data.tabId,
          timestamp: new Date(data.timestamp),
          queuedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      wsLogger.error('Failed to handle response paused', { userId, error });
    }
  });

  // ext:request-continued - Extension confirmed request was continued
  socket.on('ext:request-continued', (data: { requestId: string }) => {
    wsLogger.debug('Request continued', { userId, requestId: data.requestId });
    cdpRequestQueue.remove(data.requestId);
  });

  // ext:response-continued - Extension confirmed response was continued
  socket.on('ext:response-continued', (data: { requestId: string }) => {
    wsLogger.debug('Response continued', { userId, requestId: data.requestId });
    cdpRequestQueue.remove(data.requestId);
  });

  // ext:tab-attached - Extension attached debugger to a tab
  socket.on('ext:tab-attached', (data: { tabId: number; url: string }) => {
    wsLogger.info('Tab attached', { userId, tabId: data.tabId, url: data.url });
    extensionManager.addTab(userId, data.tabId, data.url);

    // Notify dashboard
    wsServer.emitToUser(userId, 'ext:tab-attached' as any, data);
  });

  // ext:tab-detached - Extension detached from a tab
  socket.on('ext:tab-detached', (data: { tabId: number; reason: string }) => {
    wsLogger.info('Tab detached', { userId, tabId: data.tabId, reason: data.reason });
    extensionManager.removeTab(userId, data.tabId);

    // Notify dashboard
    wsServer.emitToUser(userId, 'ext:tab-detached' as any, data);
  });

  // ext:repeater-result - Extension executed a repeater request
  socket.on('ext:repeater-result', (data: ExtRepeaterResultPayload) => {
    wsLogger.info('Repeater result received', { userId, requestId: data.requestId, status: data.statusCode });

    // Resolve pending repeater promise (stored in cdpRequestQueue)
    cdpRequestQueue.resolveRepeaterResult(data.requestId, data);

    // Notify dashboard
    wsServer.emitToUser(userId, 'repeater:result' as any, data);
  });

  // ext:intruder-result - Extension executed an intruder request
  socket.on('ext:intruder-result', async (data: ExtIntruderResultPayload) => {
    wsLogger.debug('Intruder result received', { userId, campaignId: data.campaignId, index: data.index });

    try {
      // Store in database
      await prisma.fuzzingResult.create({
        data: {
          campaignId: data.campaignId,
          payloadSet: data.payloads,
          request: { index: data.index },
          statusCode: data.statusCode || null,
          responseLength: data.responseLength || null,
          responseTime: data.responseTime || null,
          response: { headers: data.headers, body: data.body },
          error: data.error || null,
        },
      });

      // Update campaign progress
      await prisma.fuzzingCampaign.update({
        where: { id: data.campaignId },
        data: {
          completedRequests: { increment: 1 },
          ...(data.error ? { failedRequests: { increment: 1 } } : {}),
        },
      });

      // Notify dashboard
      wsServer.emitToUser(userId, 'intruder:result' as any, data);
    } catch (error) {
      wsLogger.error('Failed to store intruder result', { userId, error });
    }
  });

  // ext:status - Extension sends periodic status updates
  socket.on('ext:status', (data: ExtStatusPayload) => {
    if (extensionManager.isConnected(userId)) {
      extensionManager.updateTabs(userId, data.attachedTabs);
    }
  });

  // ext:ping - Keepalive
  socket.on('ext:ping', () => {
    // No-op, just keeps connection alive
  });
}

/**
 * Get or create a proxy session for CDP mode
 */
async function getOrCreateSession(userId: string): Promise<{ id: string; sessionId: string }> {
  // Check for existing active session
  const existing = await prisma.proxySession.findFirst({
    where: { userId, isActive: true },
    select: { id: true, sessionId: true },
  });

  if (existing) return existing;

  // Create new CDP session (no port needed)
  const session = await prisma.proxySession.create({
    data: {
      userId,
      sessionId: crypto.randomUUID(),
      proxyPort: 0, // CDP mode: no proxy port
      isActive: true,
      interceptMode: true,
      mode: 'cdp',
      extensionVersion: extensionManager.getConnection(userId)?.version,
    },
    select: { id: true, sessionId: true },
  });

  return session;
}
