import { Router, Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service.js";
import * as agentService from "../services/agent.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const projectsRouter: Router = Router({ mergeParams: true });

// Middleware to extract and validate companyId
function requireCompanyId(req: Request, res: Response, next: NextFunction) {
  const companyId = req.params.companyId;
  if (!companyId) {
    return res.status(400).json({
      success: false, error: { code: "MISSING_COMPANY_ID", message: "Missing required companyId" }
    });
  }
  (req as any).companyId = companyId;
  next();
}

// Middleware to extract and validate API key (optional - for CLI auth, web-ui can omit)
async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers.authorization?.replace(/^Bearer /, "");

  // If no API key provided, allow request to proceed (web-ui mode without auth)
  if (!apiKey) {
    return next();
  }

  // If API key is provided, verify it
  try {
    const agentInfo = await agentService.verifyApiKey(apiKey);
    (req as any).agentInfo = agentInfo;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false, error: { code: "INVALID_API_KEY", message: "Invalid API key" }
    });
  }
}

// Middleware to require CEO or Manager role
function requireCeoOrManager(req: Request, res: Response, next: NextFunction) {
  const { role } = (req as any).agentInfo;
  if (role !== "CEO" && role !== "Manager") {
    return res.status(403).json({
      success: false, error: { code: "FORBIDDEN", message: "Only CEO or Manager can perform this action" }
    });
  }
  next();
}

projectsRouter.use(requireCompanyId);
projectsRouter.use(requireApiKey);

// POST /api/companies/:companyId/projects - Create project
// Requires API key + CEO or Manager role
projectsRouter.post("/", requireCeoOrManager, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const project = await projectService.createProject(companyId, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      projectDir: req.body.projectDir,
      issueIds: req.body.issueIds,
    });

    broadcastEvent({ type: "project_created", payload: project as unknown as Record<string, unknown> });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create project" } });
  }
});

// GET /api/companies/:companyId/projects - List projects
projectsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const projects = await projectService.listProjectsByCompany(companyId);
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error listing projects:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list projects" } });
  }
});

// GET /api/companies/:companyId/projects/:id
projectsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const project = await projectService.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Project ${req.params.id} not found` } });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Error getting project:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get project" } });
  }
});

// PUT /api/companies/:companyId/projects/:id
// Requires API key + CEO or Manager role
projectsRouter.put("/:id", requireCeoOrManager, async (req: Request, res: Response) => {
  try {
    const project = await projectService.updateProject(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      projectDir: req.body.projectDir,
      issueIds: req.body.issueIds,
    });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Project ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "project_updated", payload: project as unknown as Record<string, unknown> });

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update project" } });
  }
});