/**
 * AI Job Queue Service
 * Manages persistent background AI processing jobs
 */

import { prisma } from '../lib/prisma.js';
import { AIJobStatus, AIJobType, AIMode } from '@prisma/client';
import { aiLogger } from '../utils/logger.js';

const jobLogger = aiLogger;

export interface CreateJobData {
  userId: string;
  type: AIJobType;
  requestData: any; // Request details to process
  model?: string; // Preferred model
  mode?: AIMode;
}

export interface JobResult {
  jobId: string;
  status: AIJobStatus;
  progress: number;
  resultId?: string;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

class AIJobService {
  /**
   * Create a new AI job
   */
  async createJob(data: CreateJobData): Promise<string> {
    const job = await prisma.aIJob.create({
      data: {
        userId: data.userId,
        type: data.type,
        requestData: data.requestData,
        model: data.model || 'auto',
        mode: data.mode || 'DEFAULT',
        status: 'PENDING',
      },
    });

    jobLogger.info('AI job created', {
      jobId: job.id,
      userId: data.userId,
      type: data.type,
    });

    // Trigger background processing (async)
    this.triggerProcessing(job.id).catch(err => {
      jobLogger.error('Failed to trigger job processing', {
        jobId: job.id,
        error: err.message,
      });
    });

    return job.id;
  }

  /**
   * Get job status and result
   */
  async getJob(jobId: string): Promise<JobResult | null> {
    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        progress: true,
        resultId: true,
        errorMessage: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!job) return null;

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      resultId: job.resultId || undefined,
      errorMessage: job.errorMessage || undefined,
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
    };
  }

  /**
   * Get all active jobs for a user
   */
  async getUserJobs(userId: string, includeCompleted = false): Promise<JobResult[]> {
    const statusFilter = includeCompleted
      ? {} // All statuses
      : { status: { in: ['PENDING', 'PROCESSING'] as AIJobStatus[] } };

    const jobs = await prisma.aIJob.findMany({
      where: {
        userId,
        ...statusFilter,
      },
      select: {
        id: true,
        type: true,
        status: true,
        progress: true,
        resultId: true,
        errorMessage: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return jobs.map(job => ({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      resultId: job.resultId || undefined,
      errorMessage: job.errorMessage || undefined,
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
    }));
  }

  /**
   * Cancel a pending or processing job
   */
  async cancelJob(jobId: string, userId: string): Promise<boolean> {
    const job = await prisma.aIJob.findFirst({
      where: {
        id: jobId,
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (!job) return false;

    await prisma.aIJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });

    jobLogger.info('AI job cancelled', { jobId, userId });
    return true;
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId: string, progress: number): Promise<void> {
    await prisma.aIJob.update({
      where: { id: jobId },
      data: { progress },
    });
  }

  /**
   * Mark job as processing
   */
  async startProcessing(jobId: string): Promise<void> {
    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    jobLogger.info('Job processing started', { jobId });
  }

  /**
   * Mark job as completed with result
   */
  async completeJob(jobId: string, resultId: string): Promise<void> {
    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        resultId,
        progress: 100,
        completedAt: new Date(),
      },
    });

    jobLogger.info('Job completed', { jobId, resultId });
  }

  /**
   * Mark job as failed with error
   */
  async failJob(jobId: string, errorMessage: string): Promise<void> {
    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
      select: { attempts: true, maxAttempts: true },
    });

    if (!job) return;

    // Check if we should retry
    const shouldRetry = job.attempts < job.maxAttempts;

    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: shouldRetry ? 'PENDING' : 'FAILED',
        errorMessage,
        lastError: errorMessage,
        completedAt: shouldRetry ? undefined : new Date(),
      },
    });

    if (shouldRetry) {
      jobLogger.warn('Job failed, will retry', {
        jobId,
        attempt: job.attempts,
        maxAttempts: job.maxAttempts,
      });

      // Retry after 5 seconds
      setTimeout(() => {
        this.triggerProcessing(jobId).catch(err => {
          jobLogger.error('Retry failed', { jobId, error: err.message });
        });
      }, 5000);
    } else {
      jobLogger.error('Job permanently failed', { jobId, errorMessage });
    }
  }

  /**
   * Trigger background job processing
   * This will be called automatically when a job is created
   */
  private async triggerProcessing(jobId: string): Promise<void> {
    // Import job processor dynamically to avoid circular dependencies
    const { processAIJob } = await import('./ai-job-processor.js');

    // Process in background (don't await)
    setImmediate(() => {
      processAIJob(jobId).catch(err => {
        jobLogger.error('Job processing error', {
          jobId,
          error: err.message,
        });
      });
    });
  }

  /**
   * Get pending jobs count for monitoring
   */
  async getPendingJobsCount(): Promise<number> {
    return prisma.aIJob.count({
      where: { status: 'PENDING' },
    });
  }

  /**
   * Cleanup old completed/failed jobs
   */
  async cleanupOldJobs(daysToKeep = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.aIJob.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
        completedAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      jobLogger.info('Old jobs cleaned up', { count: result.count });
    }

    return result.count;
  }
}

export const aiJobService = new AIJobService();
