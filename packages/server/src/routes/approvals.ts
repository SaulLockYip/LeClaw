import { Router, Request, Response, NextFunction } from "express";
import * as approvalService from "../services/approval.service.js";
import * as agentService from "../services/agent.service.js";
import { broadcastEvent } from "../sse/event-bus.js";
import type { AgentRole } from "@leclaw/shared";
import { isValidUUID } from "../utils/validation.js";

export const approvalsRouter: Router = Router({ mergeParams: true });

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

// Middleware to require Manager or CEO role
function requireManagerOrCeo(req: Request, res: Response, next: NextFunction) {
  const { role } = (req as any).agentInfo;
  if (role !== "Manager" && role !== "CEO") {
    return res.status(403).json({
      success: false, error: { code: "FORBIDDEN", message: "Only Manager or CEO can perform this action" }
    });
  }
  next();
}

approvalsRouter.use(requireCompanyId);
approvalsRouter.use(requireApiKey);

// POST /api/companies/:companyId/approvals - Create approval
// Uses API key to determine requester automatically
approvalsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { agentId, role } = (req as any).agentInfo;
    const { title, description, type } = req.body;

    // Determine approverId based on type and requester role
    let approverId: string | undefined;
    if (type === "agent_approve") {
      // CEO doesn't need an approver for agent_approve
      if (role === "CEO") {
        return res.status(400).json({
          success: false, error: { code: "INVALID_REQUEST", message: "CEO does not need approval for agent_approve" }
        });
      }
      const foundApprover = await approvalService.findApproverForAgent(agentId, companyId);
      if (!foundApprover) {
        return res.status(400).json({
          success: false, error: { code: "NO_APPROVER", message: "Could not find an approver for this request" }
        });
      }
      approverId = foundApprover;
    }

    const approval = await approvalService.createApproval({
      companyId,
      title,
      description,
      requesterAgentId: agentId,
      type: type ?? "human_approve",
      approverId,
    });

    broadcastEvent({ type: "approval_created", payload: approval as unknown as Record<string, unknown> });

    res.status(201).json({ success: true, data: approval });
  } catch (error) {
    console.error("Error creating approval:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create approval" } });
  }
});

// GET /api/companies/:companyId/approvals - List approvals
// Query params:
// - status: filter by status (Pending, Approved, Rejected)
// - mine: if true, only return approvals submitted by the authenticated agent
// For web-ui (no auth), returns all approvals
approvalsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const agentInfo = (req as any).agentInfo;
    const { status, mine } = req.query;

    let approvals;
    if (mine === "true" && agentInfo) {
      // List only approvals submitted by this agent
      approvals = await approvalService.listApprovalsByRequester(
        agentInfo.agentId,
        companyId,
        status as any
      );
    } else {
      // List all approvals for the company
      approvals = await approvalService.listApprovalsByCompany(companyId);
      // Apply status filter if provided
      if (status) {
        approvals = approvals.filter(a => a.status === status);
      }
    }

    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error("Error listing approvals:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list approvals" } });
  }
});

// GET /api/companies/:companyId/approvals/approver - Find approver for an agent
// Query params:
// - agentId: the agent who needs an approver
// Returns the approver ID or null if no approver is needed (e.g., CEO)
approvalsRouter.get("/approver", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { agentId } = req.query;

    if (!agentId || typeof agentId !== "string") {
      return res.status(400).json({
        success: false, error: { code: "MISSING_AGENT_ID", message: "Missing required agentId query parameter" }
      });
    }

    const approverId = await approvalService.findApproverForAgent(agentId as string, companyId);
    res.json({ success: true, data: { approverId } });
  } catch (error) {
    console.error("Error finding approver:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to find approver" } });
  }
});

// GET /api/companies/:companyId/approvals/:id
approvalsRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
  }
  try {
    const approval = await approvalService.getApproval(id);
    if (!approval) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Approval ${id} not found` } });
    }
    res.json({ success: true, data: approval });
  } catch (error) {
    console.error("Error getting approval:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get approval" } });
  }
});

// PUT /api/companies/:companyId/approvals/:id/approve - Approve an approval (Manager/CEO only)
approvalsRouter.put("/:id/approve", requireManagerOrCeo, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
  }
  try {
    const { agentId } = (req as any).agentInfo;

    // Get the approval first to verify it exists and is pending
    const existingApproval = await approvalService.getApproval(id);
    if (!existingApproval) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Approval ${id} not found` } });
    }
    if (existingApproval.status !== "Pending") {
      return res.status(400).json({ success: false, error: { code: "INVALID_STATUS", message: "Approval is not pending" } });
    }
    // Verify the approver is the authenticated agent
    if (existingApproval.approverId !== agentId) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You are not the assigned approver for this approval" } });
    }

    const approval = await approvalService.updateApproval(id, {
      status: "Approved",
      message: req.body.message,
    });

    broadcastEvent({ type: "approval_updated", payload: approval as unknown as Record<string, unknown> });

    res.json({ success: true, data: approval });
  } catch (error) {
    console.error("Error approving approval:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to approve approval" } });
  }
});

// PUT /api/companies/:companyId/approvals/:id/reject - Reject an approval (Manager/CEO only)
approvalsRouter.put("/:id/reject", requireManagerOrCeo, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
  }
  try {
    const { agentId } = (req as any).agentInfo;
    const { message } = req.body;

    // Get the approval first to verify it exists and is pending
    const existingApproval = await approvalService.getApproval(id);
    if (!existingApproval) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Approval ${id} not found` } });
    }
    if (existingApproval.status !== "Pending") {
      return res.status(400).json({ success: false, error: { code: "INVALID_STATUS", message: "Approval is not pending" } });
    }
    // Verify the approver is the authenticated agent
    if (existingApproval.approverId !== agentId) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You are not the assigned approver for this approval" } });
    }

    const approval = await approvalService.updateApproval(id, {
      status: "Rejected",
      message: message,
    });

    broadcastEvent({ type: "approval_updated", payload: approval as unknown as Record<string, unknown> });

    res.json({ success: true, data: approval });
  } catch (error) {
    console.error("Error rejecting approval:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to reject approval" } });
  }
});

// PUT /api/companies/:companyId/approvals/:id
// Legacy endpoint for general updates (uses API key but doesn't require manager/ceo role)
approvalsRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid ID format" } });
  }
  try {
    const approval = await approvalService.updateApproval(id, {
      status: req.body.status,
      message: req.body.message,
    });
    if (!approval) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Approval ${id} not found` } });
    }

    broadcastEvent({ type: "approval_updated", payload: approval as unknown as Record<string, unknown> });

    res.json({ success: true, data: approval });
  } catch (error) {
    console.error("Error updating approval:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update approval" } });
  }
});