/**
 * Repeater Service
 * Handles manual request resending with modifications (like Burp Repeater)
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';

const repeaterLogger = logger.child({ service: 'repeater' });

export interface RepeaterRequest {
  id?: string;
  userId: string;
  name?: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  originalRequestId?: string; // Link to original HTTPRequest if came from history
}

export interface RepeaterResponse {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number; // milliseconds
  timestamp: Date;
}

export interface RepeaterHistoryEntry {
  id: string;
  requestId: string;
  request: RepeaterRequest;
  response: RepeaterResponse;
  timestamp: Date;
}

export class RepeaterService {
  /**
   * Send a request and measure response time
   */
  async sendRequest(request: RepeaterRequest): Promise<RepeaterResponse> {
    const startTime = Date.now();

    try {
      const parsedUrl = new URL(request.url);
      const isHttps = parsedUrl.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      return await new Promise((resolve, reject) => {
        const options: http.RequestOptions = {
          method: request.method,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          headers: request.headers,
          timeout: 30000, // 30 second timeout
        };

        const req = httpModule.request(options, (res) => {
          const chunks: Buffer[] = [];

          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            const responseTime = Date.now() - startTime;
            const bodyBuffer = Buffer.concat(chunks);
            const body = bodyBuffer.toString('utf-8');

            const response: RepeaterResponse = {
              statusCode: res.statusCode || 0,
              statusMessage: res.statusMessage || '',
              headers: res.headers as Record<string, string>,
              body,
              responseTime,
              timestamp: new Date(),
            };

            repeaterLogger.info('Request sent successfully', {
              url: request.url,
              method: request.method,
              statusCode: response.statusCode,
              responseTime,
            });

            resolve(response);
          });
        });

        req.on('error', (error) => {
          repeaterLogger.error('Request failed', {
            url: request.url,
            error: error.message,
          });
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout after 30 seconds'));
        });

        // Write request body if present
        if (request.body) {
          req.write(request.body);
        }

        req.end();
      });
    } catch (error) {
      repeaterLogger.error('Failed to send request', {
        url: request.url,
        error,
      });
      throw error;
    }
  }

  /**
   * Save a request template for later reuse
   */
  async saveTemplate(
    userId: string,
    name: string,
    request: RepeaterRequest
  ): Promise<{ id: string; name: string }> {
    try {
      const template = await prisma.repeaterTemplate.create({
        data: {
          userId,
          name,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body || null,
        },
        select: {
          id: true,
          name: true,
        },
      });

      repeaterLogger.info('Template saved', { userId, name, templateId: template.id });

      return template;
    } catch (error) {
      repeaterLogger.error('Failed to save template', { userId, name, error });
      throw error;
    }
  }

  /**
   * Get all templates for a user
   */
  async getTemplates(userId: string): Promise<RepeaterRequest[]> {
    try {
      const templates = await prisma.repeaterTemplate.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      repeaterLogger.info('Fetching templates', { userId, count: templates.length });

      return templates.map((t) => ({
        id: t.id,
        userId: t.userId,
        name: t.name,
        method: t.method,
        url: t.url,
        headers: t.headers as Record<string, string>,
        body: t.body || undefined,
      }));
    } catch (error) {
      repeaterLogger.error('Failed to fetch templates', { userId, error });
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    try {
      await prisma.repeaterTemplate.deleteMany({
        where: {
          id: templateId,
          userId, // Ensure user owns the template
        },
      });

      repeaterLogger.info('Template deleted', { userId, templateId });
    } catch (error) {
      repeaterLogger.error('Failed to delete template', {
        userId,
        templateId,
        error,
      });
      throw error;
    }
  }

  /**
   * Load request from history by ID
   */
  async loadFromHistory(
    userId: string,
    requestId: string
  ): Promise<RepeaterRequest | null> {
    try {
      const request = await prisma.hTTPRequest.findFirst({
        where: {
          id: requestId,
          userId,
        },
      });

      if (!request) {
        return null;
      }

      return {
        userId,
        method: request.method,
        url: request.url,
        headers: request.requestHeaders as Record<string, string>,
        body: request.requestBody || undefined,
        originalRequestId: request.id,
      };
    } catch (error) {
      repeaterLogger.error('Failed to load request from history', {
        userId,
        requestId,
        error,
      });
      throw error;
    }
  }
}

export const repeaterService = new RepeaterService();
