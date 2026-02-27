/**
 * Work Session Service
 * Manages work sessions for organizing testing activities and AI analyses
 */

import { PrismaClient } from '@prisma/client';
import { aiLogger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface WorkSessionData {
  name: string;
  description?: string;
  projectId?: string;
}

export interface WorkSessionStats {
  id: string;
  name: string;
  description: string | null;
  projectId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  isActive: boolean;
  totalRequests: number;
  totalAnalyses: number;
  tokensConsumed: number;
  projectName?: string;
}

export class WorkSessionService {
  /**
   * Create a new work session
   */
  async createSession(userId: string, data: WorkSessionData) {
    aiLogger.info('Creating work session', {
      userId,
      sessionName: data.name,
      projectId: data.projectId,
    });

    const session = await prisma.workSession.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        projectId: data.projectId,
        isActive: true,
      },
      include: {
        project: {
          select: {
            name: true,
            target: true,
          },
        },
      },
    });

    aiLogger.info('Work session created', {
      sessionId: session.id,
      userId,
    });

    return session;
  }

  /**
   * Get active session for user
   */
  async getActiveSession(userId: string) {
    const session = await prisma.workSession.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        project: {
          select: {
            name: true,
            target: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return session;
  }

  /**
   * Get or create active session
   * If no active session exists, create one with default name
   */
  async getOrCreateActiveSession(userId: string, projectId?: string) {
    let session = await this.getActiveSession(userId);

    if (!session) {
      // Create default session
      const now = new Date();
      const defaultName = `Session ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

      session = await this.createSession(userId, {
        name: defaultName,
        description: 'Auto-created session',
        projectId,
      });
    }

    return session;
  }

  /**
   * End current session
   */
  async endSession(userId: string, sessionId: string) {
    aiLogger.info('Ending work session', { userId, sessionId });

    const session = await prisma.workSession.update({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    aiLogger.info('Work session ended', {
      sessionId,
      userId,
      duration: session.endedAt ? session.endedAt.getTime() - session.startedAt.getTime() : 0,
    });

    return session;
  }

  /**
   * Update session statistics
   */
  async incrementSessionStats(sessionId: string, stats: {
    requests?: number;
    analyses?: number;
    tokens?: number;
  }) {
    return await prisma.workSession.update({
      where: { id: sessionId },
      data: {
        ...(stats.requests && { totalRequests: { increment: stats.requests } }),
        ...(stats.analyses && { totalAnalyses: { increment: stats.analyses } }),
        ...(stats.tokens && { tokensConsumed: { increment: stats.tokens } }),
      },
    });
  }

  /**
   * Get all sessions for user
   */
  async getUserSessions(userId: string, limit: number = 50): Promise<WorkSessionStats[]> {
    const sessions = await prisma.workSession.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });

    return sessions.map(session => ({
      id: session.id,
      name: session.name,
      description: session.description,
      projectId: session.projectId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      isActive: session.isActive,
      totalRequests: session.totalRequests,
      totalAnalyses: session.totalAnalyses,
      tokensConsumed: session.tokensConsumed,
      projectName: session.project?.name,
    }));
  }

  /**
   * Get session details with all analyses
   */
  async getSessionDetails(userId: string, sessionId: string) {
    const session = await prisma.workSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        project: {
          select: {
            name: true,
            target: true,
          },
        },
        aiAnalyses: {
          include: {
            requestLog: {
              select: {
                url: true,
                method: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  /**
   * Delete session and all associated data
   */
  async deleteSession(userId: string, sessionId: string) {
    aiLogger.info('Deleting work session', { userId, sessionId });

    await prisma.workSession.delete({
      where: {
        id: sessionId,
        userId,
      },
    });

    aiLogger.info('Work session deleted', { sessionId, userId });
  }

  /**
   * Update session name/description
   */
  async updateSession(userId: string, sessionId: string, data: {
    name?: string;
    description?: string;
  }) {
    return await prisma.workSession.update({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      },
    });
  }
}

// Export singleton instance
export const workSessionService = new WorkSessionService();
