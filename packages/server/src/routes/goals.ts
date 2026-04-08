import { Router, Request, Response, NextFunction } from "express";
import * as goalService from "../services/goal.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const goalsRouter: Router = Router({ mergeParams: true });

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

goalsRouter.use(requireCompanyId);

// GET /api/companies/:companyId/goals - List goals
goalsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const goals = await goalService.listGoalsByCompany(companyId);
    res.json({ success: true, data: goals });
  } catch (error) {
    console.error("Error listing goals:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list goals" } });
  }
});

// GET /api/companies/:companyId/goals/:id
goalsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const goal = await goalService.getGoal(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Goal ${req.params.id} not found` } });
    }
    res.json({ success: true, data: goal });
  } catch (error) {
    console.error("Error getting goal:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get goal" } });
  }
});

// PUT /api/companies/:companyId/goals/:id
goalsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
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
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Goal ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "goal_updated", payload: goal as unknown as Record<string, unknown> });

    res.json({ success: true, data: goal });
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update goal" } });
  }
});