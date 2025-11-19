/**
 * Campaign Manager Service
 * Manages fuzzing campaign execution with concurrency control
 */

import { EventEmitter } from 'events';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { PayloadEngine, type AttackType, type PayloadSet, type PayloadPosition } from './payload-engine.service.js';
import http from 'http';
import https from 'https';
import logger from '../utils/logger.js';

export interface CampaignConfig {
  id: string;
  userId: string;
  name: string;
  requestTemplate: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  payloadPositions: PayloadPosition[];
  payloadSets: PayloadSet[];
  attackType: AttackType;
  concurrency: number;
  delayMs: number;
}

export interface CampaignProgress {
  campaignId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'stopped';
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  currentProgress: number; // percentage
}

/**
 * Campaign Manager
 * Handles fuzzing campaign execution with concurrency control and progress tracking
 */
export class CampaignManager extends EventEmitter {
  private activeCampaigns: Map<string, boolean> = new Map();
  private pausedCampaigns: Set<string> = new Set();

  /**
   * Start a fuzzing campaign
   */
  async startCampaign(config: CampaignConfig): Promise<void> {
    const { id, attackType, payloadSets, concurrency, delayMs } = config;

    // Check if already running
    if (this.activeCampaigns.get(id)) {
      throw new Error('Campaign is already running');
    }

    // Mark as running
    this.activeCampaigns.set(id, true);
    this.pausedCampaigns.delete(id);

    // Update database status
    await prisma.fuzzingCampaign.update({
      where: { id },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Generate payload combinations
    const combinations = PayloadEngine.generateAttackCombinations(attackType, payloadSets);

    // Update total requests count
    await prisma.fuzzingCampaign.update({
      where: { id },
      data: { totalRequests: combinations.length },
    });

    // Execute campaign with concurrency control
    await this.executeCampaign(config, combinations);

    // Mark as completed
    this.activeCampaigns.delete(id);
    await prisma.fuzzingCampaign.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    logger.info('Campaign completed', { campaignId: id, totalRequests: combinations.length });
  }

  /**
   * Execute campaign with concurrency control
   */
  private async executeCampaign(config: CampaignConfig, combinations: string[][]): Promise<void> {
    const { id, concurrency, delayMs } = config;
    let completed = 0;
    let failed = 0;

    // Create batches for concurrency control
    const batches: string[][][] = [];
    for (let i = 0; i < combinations.length; i += concurrency) {
      batches.push(combinations.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      // Check if paused
      while (this.pausedCampaigns.has(id)) {
        await this.delay(1000);
      }

      // Check if stopped
      if (!this.activeCampaigns.get(id)) {
        break;
      }

      // Execute batch in parallel
      const promises = batch.map((payloads) => this.executeRequest(config, payloads));
      const results = await Promise.allSettled(promises);

      // Count results
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          completed++;
        } else {
          failed++;
        }
      });

      // Update progress in database
      await prisma.fuzzingCampaign.update({
        where: { id },
        data: {
          completedRequests: completed,
          failedRequests: failed,
        },
      });

      // Emit progress event
      this.emit('progress', {
        campaignId: id,
        totalRequests: combinations.length,
        completedRequests: completed,
        failedRequests: failed,
        currentProgress: Math.round((completed / combinations.length) * 100),
      });

      // Apply delay between batches
      if (delayMs > 0 && batches.indexOf(batch) < batches.length - 1) {
        await this.delay(delayMs);
      }
    }
  }

  /**
   * Execute a single fuzzed request
   */
  private async executeRequest(config: CampaignConfig, payloads: string[]): Promise<void> {
    const { id, requestTemplate, payloadPositions } = config;
    const startTime = Date.now();

    try {
      // Apply payloads to template
      let url = requestTemplate.url;
      let body = requestTemplate.body || '';

      // Replace markers in URL
      payloadPositions.forEach((position, index) => {
        const marker = `§${position.id}§`;
        url = url.replace(marker, payloads[index] || '');
        body = body.replace(marker, payloads[index] || '');
      });

      // Execute HTTP request
      const response = await this.sendHttpRequest({
        method: requestTemplate.method,
        url,
        headers: requestTemplate.headers,
        body: body || undefined,
      });

      const responseTime = Date.now() - startTime;

      // Store result
      await prisma.fuzzingResult.create({
        data: {
          campaignId: id,
          payloadSet: payloads,
          request: {
            method: requestTemplate.method,
            url,
            headers: requestTemplate.headers,
            body: body || null,
          },
          statusCode: response.statusCode,
          responseLength: response.body?.length || 0,
          responseTime,
          response: {
            headers: response.headers,
            body: response.body,
          },
        },
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Store error result
      await prisma.fuzzingResult.create({
        data: {
          campaignId: id,
          payloadSet: payloads,
          request: {
            method: requestTemplate.method,
            url: requestTemplate.url,
            headers: requestTemplate.headers,
            body: requestTemplate.body || null,
          },
          statusCode: null,
          responseLength: null,
          responseTime,
          response: Prisma.JsonNull,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Send HTTP request
   */
  private async sendHttpRequest(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(request.url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        method: request.method,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          ...request.headers,
          'Content-Length': request.body ? Buffer.byteLength(request.body) : 0,
        },
      };

      const req = client.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk.toString();
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers as Record<string, string>,
            body,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      // Set timeout (30 seconds)
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (request.body) {
        req.write(request.body);
      }

      req.end();
    });
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    this.pausedCampaigns.add(campaignId);

    await prisma.fuzzingCampaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });

    logger.info('Campaign paused', { campaignId });
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    this.pausedCampaigns.delete(campaignId);

    await prisma.fuzzingCampaign.update({
      where: { id: campaignId },
      data: { status: 'running' },
    });

    logger.info('Campaign resumed', { campaignId });
  }

  /**
   * Stop a campaign
   */
  async stopCampaign(campaignId: string): Promise<void> {
    this.activeCampaigns.delete(campaignId);
    this.pausedCampaigns.delete(campaignId);

    await prisma.fuzzingCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'stopped',
        completedAt: new Date(),
      },
    });

    logger.info('Campaign stopped', { campaignId });
  }

  /**
   * Get campaign progress
   */
  async getProgress(campaignId: string): Promise<CampaignProgress> {
    const campaign = await prisma.fuzzingCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      campaignId: campaign.id,
      status: campaign.status as CampaignProgress['status'],
      totalRequests: campaign.totalRequests,
      completedRequests: campaign.completedRequests,
      failedRequests: campaign.failedRequests,
      currentProgress:
        campaign.totalRequests > 0
          ? Math.round((campaign.completedRequests / campaign.totalRequests) * 100)
          : 0,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const campaignManager = new CampaignManager();
