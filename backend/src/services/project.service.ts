/**
 * ProjectService - Project/Target organization and management
 *
 * Features:
 * - Create and manage penetration testing projects
 * - Organize requests by target/project
 * - Track findings and vulnerabilities per project
 * - Project statistics and analytics
 * - Export project reports
 */

import { PrismaClient, Project, Finding, Prisma } from '@prisma/client';

interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
  target: string; // Base URL
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  target?: string;
}

interface CreateFindingInput {
  projectId: string;
  userId: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  proof: Record<string, any>; // Screenshots, requests, etc.
}

interface UpdateFindingInput {
  title?: string;
  description?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_POSITIVE' | 'WONT_FIX';
  proof?: Record<string, any>;
}

interface ProjectStats {
  totalRequests: number;
  totalFindings: number;
  findingsBySeverity: Record<string, number>;
  findingsByStatus: Record<string, number>;
  totalAnalyses: number;
  uniqueVulnerabilityTypes: number;
  lastActivity: Date | null;
}

export class ProjectService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectInput): Promise<Project> {
    return this.prisma.project.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        target: data.target,
      },
      include: {
        requests: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
        findings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get project by ID
   */
  async getProject(id: string, userId: string): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        requests: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        findings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * List all projects for a user
   */
  async listProjects(
    userId: string,
    options?: {
      search?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ data: Project[]; total: number }> {
    const { search, limit = 50, offset = 0, sortBy = 'updatedAt', sortOrder = 'desc' } = options || {};

    const where: Prisma.ProjectWhereInput = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { target: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          _count: {
            select: {
              requests: true,
              findings: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Update project
   */
  async updateProject(id: string, userId: string, data: UpdateProjectInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id, userId },
      data,
    });
  }

  /**
   * Delete project
   */
  async deleteProject(id: string, userId: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id, userId },
    });
  }

  /**
   * Get project statistics
   */
  async getProjectStats(id: string, userId: string): Promise<ProjectStats> {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        requests: {
          select: {
            timestamp: true,
            aiAnalyses: {
              select: {
                id: true,
                vulnerabilities: {
                  select: {
                    type: true,
                  },
                },
              },
            },
          },
        },
        findings: {
          select: {
            severity: true,
            status: true,
          },
        },
      },
    });

    if (!project) throw new Error('Project not found');

    // Calculate findings by severity
    const findingsBySeverity: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0,
    };
    project.findings.forEach((finding) => {
      findingsBySeverity[finding.severity]++;
    });

    // Calculate findings by status
    const findingsByStatus: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      FALSE_POSITIVE: 0,
      WONT_FIX: 0,
    };
    project.findings.forEach((finding) => {
      findingsByStatus[finding.status]++;
    });

    // Calculate total analyses and unique vulnerability types
    const allVulnerabilityTypes = new Set<string>();
    let totalAnalyses = 0;
    project.requests.forEach((req) => {
      totalAnalyses += req.aiAnalyses.length;
      req.aiAnalyses.forEach((analysis) => {
        analysis.vulnerabilities.forEach((vuln) => {
          allVulnerabilityTypes.add(vuln.type);
        });
      });
    });

    // Get last activity
    const lastActivity =
      project.requests.length > 0
        ? project.requests.reduce((latest, req) => {
            return req.timestamp > latest ? req.timestamp : latest;
          }, project.requests[0].timestamp)
        : null;

    return {
      totalRequests: project.requests.length,
      totalFindings: project.findings.length,
      findingsBySeverity,
      findingsByStatus,
      totalAnalyses,
      uniqueVulnerabilityTypes: allVulnerabilityTypes.size,
      lastActivity,
    };
  }

  // ========== Finding Management ==========

  /**
   * Create a new finding
   */
  async createFinding(data: CreateFindingInput): Promise<Finding> {
    // Verify project belongs to user
    const project = await this.prisma.project.findFirst({
      where: { id: data.projectId, userId: data.userId },
    });
    if (!project) throw new Error('Project not found');

    return this.prisma.finding.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        proof: data.proof,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            target: true,
          },
        },
      },
    });
  }

  /**
   * Get finding by ID
   */
  async getFinding(id: string, userId: string): Promise<Finding | null> {
    return this.prisma.finding.findFirst({
      where: {
        id,
        project: { userId },
      },
      include: {
        project: true,
      },
    });
  }

  /**
   * List findings for a project
   */
  async listFindings(
    projectId: string,
    userId: string,
    options?: {
      severity?: string[];
      status?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: Finding[]; total: number }> {
    const { severity, status, limit = 50, offset = 0 } = options || {};

    // Verify project belongs to user
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new Error('Project not found');

    const where: Prisma.FindingWhereInput = {
      projectId,
      ...(severity && severity.length > 0 && { severity: { in: severity as any } }),
      ...(status && status.length > 0 && { status: { in: status as any } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.finding.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.finding.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Update finding
   */
  async updateFinding(
    id: string,
    userId: string,
    data: UpdateFindingInput
  ): Promise<Finding> {
    // Verify finding belongs to user's project
    const finding = await this.getFinding(id, userId);
    if (!finding) throw new Error('Finding not found');

    return this.prisma.finding.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete finding
   */
  async deleteFinding(id: string, userId: string): Promise<void> {
    // Verify finding belongs to user's project
    const finding = await this.getFinding(id, userId);
    if (!finding) throw new Error('Finding not found');

    await this.prisma.finding.delete({
      where: { id },
    });
  }

  /**
   * Export project report as JSON
   */
  async exportProjectReport(id: string, userId: string): Promise<any> {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        requests: {
          include: {
            aiAnalyses: {
              include: {
                vulnerabilities: true,
              },
            },
          },
        },
        findings: true,
      },
    });

    if (!project) throw new Error('Project not found');

    const stats = await this.getProjectStats(id, userId);

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        target: project.target,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      statistics: stats,
      findings: project.findings,
      requests: project.requests.map((req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        timestamp: req.timestamp,
        statusCode: req.statusCode,
        duration: req.duration,
        analyses: req.aiAnalyses,
      })),
      exportedAt: new Date(),
    };
  }
}
