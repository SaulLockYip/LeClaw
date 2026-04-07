import { Router, Request, Response, NextFunction } from "express";
import * as issueService from "../services/issue.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const issuesRouter: Router = Router();

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

issuesRouter.use(requireCompanyId);

// GET /api/companies/:companyId/issues - List issues
issuesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const departmentId = req.query.departmentId as string | undefined;

    if (departmentId) {
      const issues = await issueService.listIssuesByDepartment(departmentId);
      return res.json({ success: true, data: issues });
    }

    const issues = await issueService.listIssuesByCompany(companyId);
    res.json({ success: true, data: issues });
  } catch (error) {
    console.error("Error listing issues:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list issues" } });
  }
});

// POST /api/companies/:companyId/issues - Create issue
issuesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const issue = await issueService.createIssue({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      assigneeAgentId: req.body.assigneeAgentId,
      departmentId: req.body.departmentId,
      subIssues: req.body.subIssues,
      report: req.body.report,
      projectId: req.body.projectId,
      goalId: req.body.goalId,
      companyId,
    });

    broadcastEvent({ type: "issue_created", payload: issue as unknown as Record<string, unknown> });

    res.status(201).json({ success: true, data: issue });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create issue" } });
  }
});

// GET /api/companies/:companyId/issues/:id
issuesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const issue = await issueService.getIssue(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }
    res.json({ success: true, data: issue });
  } catch (error) {
    console.error("Error getting issue:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get issue" } });
  }
});

// PUT /api/companies/:companyId/issues/:id
issuesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const issue = await issueService.updateIssue(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      assigneeAgentId: req.body.assigneeAgentId,
      subIssues: req.body.subIssues,
      report: req.body.report,
      projectId: req.body.projectId,
      goalId: req.body.goalId,
    });
    if (!issue) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "issue_updated", payload: issue as unknown as Record<string, unknown> });

    res.json({ success: true, data: issue });
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update issue" } });
  }
});

// DELETE /api/companies/:companyId/issues/:id
issuesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await issueService.deleteIssue(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete issue" } });
  }
});