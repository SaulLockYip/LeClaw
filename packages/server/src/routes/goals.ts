import { Router, Request, Response, NextFunction } from "express";
import * as goalService from "../services/goal.service.js";
import * as agentService from "../services/agent.service.js";
import { broadcastEvent } from "../sse/event-bus.js";
import { isValidUUID } from "../utils/validation.js";

export const goalsRouter: Router = Router({ mergeParams: true });

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

// Middleware to require CEO role
function requireCeo(req: Request, res: Response, next: NextFunction) {
  const agentInfo = (req as any).agentInfo;
  if (!agentInfo) {
    return res.status(401).json({
      success: false, error: { code: "UNAUTHORIZED", message: "API key required for this action" }
    });
  }
  if (agentInfo.role !== "CEO") {
    return res.status(403).json({
      success: false, error: { code: "FORBIDDEN", message: "Only CEO can perform this action" }
    });
  }
  next();
}

goalsRouter.use(requireCompanyId);
goalsRouter.use(requireApiKey);

// POST /api/companies/:companyId/goals - Create goal
// Requires API key + CEO role
goalsRouter.post("/", requireCeo, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const goal = await goalService.createGoal({
      companyId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      verification: req.body.verification,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      departmentIds: req.body.departmentIds,
      issueIds: req.body.issueIds,
    });

    broadcastEvent({ type: "goal_created", payload: goal as unknown as Record<string, unknown> });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create goal" } });
  }
});

// GET /api/companies/:companyId/goals - List goals
goalsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const goals = await goalService.listGoalsByCompany(companyId);
    res.json({ success: true, data: goals });
  } catch (error) {
    console.error("Error listing goals:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list goals" } });
  }
});

// GET /api/companies/:companyId/goals/:id
goalsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    const goal = await goalService.getGoal(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Goal ${req.params.id} not found` } });
    }
    res.json({ success: true, data: goal });
  } catch (error) {
    console.error("Error getting goal:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get goal" } });
  }
});

// PUT /api/companies/:companyId/goals/:id
// Requires API key + CEO role
goalsRouter.put("/:id", requireCeo, async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    const goal = await goalService.updateGoal(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      verification: req.body.verification,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      departmentIds: req.body.departmentIds,
      issueIds: req.body.issueIds,
    });
    if (!goal) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Goal ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "goal_updated", payload: goal as unknown as Record<string, unknown> });

    res.json({ success: true, data: goal });
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update goal" } });
  }
});

// DELETE /api/companies/:companyId/goals/:id
// Requires API key + CEO role
goalsRouter.delete("/:id", requireCeo, async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    const deleted = await goalService.deleteGoal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Goal ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "goal_deleted", payload: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete goal" } });
  }
});