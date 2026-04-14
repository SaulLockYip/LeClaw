import { Router, Request, Response, NextFunction } from "express";
import { eq, desc } from "drizzle-orm";
import { issues, issueComments, subIssues } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import * as issueService from "../services/issue.service.js";
import * as agentService from "../services/agent.service.js";
import { broadcastEvent } from "../sse/event-bus.js";
import { isValidUUID } from "../utils/validation.js";

export const issuesRouter: Router = Router({ mergeParams: true });

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
  const { role } = (req as any).agentInfo;
  if (role !== "CEO") {
    return res.status(403).json({
      success: false, error: { code: "FORBIDDEN", message: "Only CEO can perform this action" }
    });
  }
  next();
}

// Middleware to filter by role: CEO sees all, Manager/Staff sees their department only
// For web-ui (no auth), allows full access
async function requireRoleForIssueAccess(req: Request, res: Response, next: NextFunction) {
  const agentInfo = (req as any).agentInfo;

  // If no auth (web-ui mode), allow full access
  if (!agentInfo) {
    return next();
  }

  const { role, agentId } = agentInfo;
  const companyId = (req as any).companyId;

  if (role === "CEO") {
    return next();
  }

  // Manager/Staff: get agent's department and attach to request
  try {
    const agent = await agentService.getAgent(agentId, companyId);
    if (agent) {
      (req as any).agentDepartmentId = agent.departmentId;
      return next();
    }
  } catch (error) {
    // Fall through to forbidden
  }

  return res.status(403).json({
    success: false, error: { code: "FORBIDDEN", message: "Not authorized to access this issue data" }
  });
}

issuesRouter.use(requireCompanyId);
issuesRouter.use(requireApiKey);

// GET /api/companies/:companyId/issues - List issues
// CEO: all issues, Manager/Staff: department-filtered
// For web-ui (no auth), returns all issues
issuesRouter.get("/", requireRoleForIssueAccess, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const agentInfo = (req as any).agentInfo;
    const agentDepartmentId = (req as any).agentDepartmentId;
    const departmentId = req.query.departmentId as string | undefined;

    // If no auth (web-ui mode), return all issues for company
    if (!agentInfo) {
      const issues = await issueService.listIssuesByCompany(companyId);
      return res.json({ success: true, data: issues });
    }

    const role = agentInfo.role;

    // Manager/Staff can only see their department's issues unless CEO
    if (role !== "CEO" && departmentId && departmentId !== agentDepartmentId) {
      return res.status(403).json({
        success: false, error: { code: "FORBIDDEN", message: "Cannot access issues from other departments" }
      });
    }

    if (departmentId) {
      const issues = await issueService.listIssuesByDepartment(departmentId);
      return res.json({ success: true, data: issues });
    }

    // Manager/Staff: filter by their department
    if (role !== "CEO" && agentDepartmentId) {
      const issues = await issueService.listIssuesByDepartment(agentDepartmentId);
      return res.json({ success: true, data: issues });
    }

    const issues = await issueService.listIssuesByCompany(companyId);
    res.json({ success: true, data: issues });
  } catch (error) {
    console.error("Error listing issues:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list issues" } });
  }
});

// POST /api/companies/:companyId/issues - Create issue
// No role guard - all roles can create
issuesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const issue = await issueService.createIssue({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
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
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create issue" } });
  }
});

// GET /api/companies/:companyId/issues/:id
// CEO: all, Manager/Staff: same department only
issuesRouter.get("/:id", requireRoleForIssueAccess, async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    const issue = await issueService.getIssue(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }

    // Check department access for Manager/Staff
    const agentInfo = (req as any).agentInfo;
    // Allow full access for web-ui (no auth)
    if (agentInfo) {
      const role = agentInfo.role;
      const agentDepartmentId = (req as any).agentDepartmentId;
      if (role !== "CEO" && issue.departmentId !== agentDepartmentId) {
        return res.status(403).json({
          success: false, error: { code: "FORBIDDEN", message: "Cannot access issues from other departments" }
        });
      }
    }

    res.json({ success: true, data: issue });
  } catch (error) {
    console.error("Error getting issue:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get issue" } });
  }
});

// PUT /api/companies/:companyId/issues/:id
// CEO: all, Manager/Staff: same department only
issuesRouter.put("/:id", requireRoleForIssueAccess, async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    // Check department access first
    const existing = await issueService.getIssue(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }

    const agentInfo = (req as any).agentInfo;
    // Allow full access for web-ui (no auth)
    if (agentInfo) {
      const role = agentInfo.role;
      const agentDepartmentId = (req as any).agentDepartmentId;
      if (role !== "CEO" && existing.departmentId !== agentDepartmentId) {
        return res.status(403).json({
          success: false, error: { code: "FORBIDDEN", message: "Cannot update issues from other departments" }
        });
      }
    }

    const issue = await issueService.updateIssue(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      subIssues: req.body.subIssues,
      report: req.body.report,
      projectId: req.body.projectId,
      goalId: req.body.goalId,
    });

    broadcastEvent({ type: "issue_updated", payload: issue as unknown as Record<string, unknown> });

    res.json({ success: true, data: issue });
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update issue" } });
  }
});

// DELETE /api/companies/:companyId/issues/:id
issuesRouter.delete("/:id", requireRoleForIssueAccess, async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    const deleted = await issueService.deleteIssue(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete issue" } });
  }
});

// POST /api/companies/:companyId/issues/:id/comments - Add comment
issuesRouter.post("/:id/comments", async (req: Request, res: Response) => {
  try {
    const { agentInfo } = req as any;
    const comment = await issueService.addComment(
      req.params.id,
      agentInfo.agentId,
      req.body.message
    );

    broadcastEvent({ type: "issue_comment_added", payload: comment as unknown as Record<string, unknown> });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to add comment" } });
  }
});

// GET /api/companies/:companyId/issues/:id/comments - Get comments
issuesRouter.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const comments = await db
      .select()
      .from(issueComments)
      .where(eq(issueComments.issueId, req.params.id))
      .orderBy(desc(issueComments.timestamp));

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error("Error listing comments:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list comments" } });
  }
});

// GET /api/companies/:companyId/issues/:id/report - Get report
issuesRouter.get("/:id/report", async (req: Request, res: Response) => {
  try {
    const issue = await issueService.getIssue(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }
    res.json({ success: true, data: { report: issue.report ?? "" } });
  } catch (error) {
    console.error("Error getting report:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get report" } });
  }
});

// PUT /api/companies/:companyId/issues/:id/report - Update report (append-only)
issuesRouter.put("/:id/report", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const [issue] = await db
      .select({ report: issues.report })
      .from(issues)
      .where(eq(issues.id, req.params.id))
      .limit(1);

    if (!issue) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Issue ${req.params.id} not found` } });
    }

    // Append with separator if existing report
    const separator = issue.report ? "\n\n---\n\n" : "";
    const updatedReport = `${issue.report ?? ""}${separator}${req.body.report ?? ""}`;

    await db.update(issues)
      .set({ report: updatedReport, updatedAt: new Date() } as any)
      .where(eq(issues.id, req.params.id));

    res.json({ success: true, data: { report: updatedReport } });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update report" } });
  }
});

// POST /api/companies/:companyId/issues/sub-issues - Create sub-issue
issuesRouter.post("/sub-issues", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { agentInfo } = req as any;

    // Verify parent issue exists
    const [parentIssue] = await db
      .select({ id: issues.id, departmentId: issues.departmentId, subIssues: issues.subIssues })
      .from(issues)
      .where(eq(issues.id, req.body.parentIssueId))
      .limit(1);

    if (!parentIssue) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Parent issue not found` } });
    }

    // Insert the sub-issue
    const [subIssue] = await db.insert(subIssues).values({
      parentIssueId: req.body.parentIssueId,
      title: req.body.title,
      description: req.body.description ?? null,
      assigneeAgentId: req.body.assigneeAgentId,
    } as any).returning();

    // Update parent's subIssues array
    const updatedSubIssues = [...(parentIssue.subIssues ?? []), subIssue.id];
    await db.update(issues)
      .set({ subIssues: updatedSubIssues, updatedAt: new Date() } as any)
      .where(eq(issues.id, req.body.parentIssueId));

    res.status(201).json({ success: true, data: subIssue });
  } catch (error) {
    console.error("Error creating sub-issue:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create sub-issue" } });
  }
});

// GET /api/companies/:companyId/issues/sub-issues/:id - Get sub-issue
issuesRouter.get("/sub-issues/:id", async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    const db = await getDb();
    const [subIssue] = await db
      .select()
      .from(subIssues)
      .where(eq(subIssues.id, req.params.id))
      .limit(1);

    if (!subIssue) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Sub-issue ${req.params.id} not found` } });
    }

    res.json({ success: true, data: subIssue });
  } catch (error) {
    console.error("Error getting sub-issue:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get sub-issue" } });
  }
});

// PUT /api/companies/:companyId/issues/sub-issues/:id - Update sub-issue
issuesRouter.put("/sub-issues/:id", async (req: Request, res: Response) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
    }
    const db = await getDb();

    // Check if sub-issue exists
    const [existing] = await db
      .select({ id: subIssues.id })
      .from(subIssues)
      .where(eq(subIssues.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Sub-issue ${req.params.id} not found` } });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.assigneeAgentId !== undefined) updateData.assigneeAgentId = req.body.assigneeAgentId;

    await db.update(subIssues)
      .set(updateData as any)
      .where(eq(subIssues.id, req.params.id));

    const [updated] = await db.select().from(subIssues).where(eq(subIssues.id, req.params.id));

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating sub-issue:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update sub-issue" } });
  }
});
