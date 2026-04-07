import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as approvalService from "../services/approval.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const approvalsRouter = Router();

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

approvalsRouter.use(requireCompanyId);

// GET /api/companies/:companyId/approvals - List approvals
approvalsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const approvals = await approvalService.listApprovalsByCompany(companyId);
    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error("Error listing approvals:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list approvals" } });
  }
});

// GET /api/companies/:companyId/approvals/:id
approvalsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const approval = await approvalService.getApproval(req.params.id);
    if (!approval) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Approval ${req.params.id} not found` } });
    }
    res.json({ success: true, data: approval });
  } catch (error) {
    console.error("Error getting approval:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get approval" } });
  }
});

// PUT /api/companies/:companyId/approvals/:id
approvalsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const approval = await approvalService.updateApproval(req.params.id, {
      status: req.body.status,
      rejectMessage: req.body.rejectMessage,
    });
    if (!approval) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Approval ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "approval_updated", payload: approval as unknown as Record<string, unknown> });

    res.json({ success: true, data: approval });
  } catch (error) {
    console.error("Error updating approval:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update approval" } });
  }
});