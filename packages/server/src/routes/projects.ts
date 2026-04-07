import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const projectsRouter = Router();

// Middleware to extract and validate companyId
function requireCompanyId(req: Request, res: Response, next: NextFunction) {
  const companyId = req.params.companyId;
  if (!companyId) {
    return res.status(400).json({
      error: { code: "MISSING_COMPANY_ID", message: "Missing required companyId" }
    });
  }
  (req as any).companyId = companyId;
  next();
}

projectsRouter.use(requireCompanyId);

// GET /api/companies/:companyId/projects - List projects
projectsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const projects = await projectService.listProjectsByCompany(companyId);
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error listing projects:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list projects" } });
  }
});

// GET /api/companies/:companyId/projects/:id
projectsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const project = await projectService.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Project ${req.params.id} not found` } });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Error getting project:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get project" } });
  }
});

// PUT /api/companies/:companyId/projects/:id
projectsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const project = await projectService.updateProject(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      projectDir: req.body.projectDir,
      issueIds: req.body.issueIds,
    });
    if (!project) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Project ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "project_updated", payload: project as unknown as Record<string, unknown> });

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update project" } });
  }
});