/**
 * Projects API Routes
 */

import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma.js';

const router = Router();
const projectService = new ProjectService(prisma);

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, target } = req.body;

    if (!name || !target) {
      return res.status(400).json({
        success: false,
        error: 'Name and target are required',
      });
    }

    const project = await projectService.createProject({
      userId,
      name,
      description,
      target,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const options = {
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      sortBy: req.query.sortBy as 'createdAt' | 'updatedAt' | 'name' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await projectService.listProjects(userId, options);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        offset: options.offset || 0,
        limit: options.limit || 50,
      },
    });
  } catch (error: any) {
    console.error('Error listing projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const project = await projectService.getProject(id, userId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/projects/:id
 * Update project
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, description, target } = req.body;

    const project = await projectService.updateProject(id, userId, {
      name,
      description,
      target,
    });

    res.json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await projectService.deleteProject(id, userId);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/projects/:id/stats
 * Get project statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const stats = await projectService.getProjectStats(id, userId);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/projects/:id/export
 * Export project report
 */
router.get('/:id/export', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const report = await projectService.exportProjectReport(id, userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=project-${id}-${Date.now()}.json`);
    res.json(report);
  } catch (error: any) {
    console.error('Error exporting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Findings Routes ==========

/**
 * POST /api/projects/:projectId/findings
 * Create a new finding
 */
router.post('/:projectId/findings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;
    const { title, description, severity, proof } = req.body;

    if (!title || !description || !severity || !proof) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, severity, and proof are required',
      });
    }

    const finding = await projectService.createFinding({
      projectId,
      userId,
      title,
      description,
      severity,
      proof,
    });

    res.status(201).json({ success: true, data: finding });
  } catch (error: any) {
    console.error('Error creating finding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/projects/:projectId/findings
 * List findings for a project
 */
router.get('/:projectId/findings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;

    const options = {
      severity: req.query.severity ? (req.query.severity as string).split(',') : undefined,
      status: req.query.status ? (req.query.status as string).split(',') : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await projectService.listFindings(projectId, userId, options);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        offset: options.offset || 0,
        limit: options.limit || 50,
      },
    });
  } catch (error: any) {
    console.error('Error listing findings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/projects/:projectId/findings/:findingId
 * Get finding by ID
 */
router.get('/:projectId/findings/:findingId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { findingId } = req.params;

    const finding = await projectService.getFinding(findingId, userId);

    if (!finding) {
      return res.status(404).json({ success: false, error: 'Finding not found' });
    }

    res.json({ success: true, data: finding });
  } catch (error: any) {
    console.error('Error fetching finding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/projects/:projectId/findings/:findingId
 * Update finding
 */
router.patch('/:projectId/findings/:findingId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { findingId } = req.params;
    const { title, description, severity, status, proof } = req.body;

    const finding = await projectService.updateFinding(findingId, userId, {
      title,
      description,
      severity,
      status,
      proof,
    });

    res.json({ success: true, data: finding });
  } catch (error: any) {
    console.error('Error updating finding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/projects/:projectId/findings/:findingId
 * Delete finding
 */
router.delete('/:projectId/findings/:findingId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { findingId } = req.params;

    await projectService.deleteFinding(findingId, userId);

    res.json({ success: true, message: 'Finding deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting finding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
