import { Router, Request, Response } from "express";
import * as agentInviteService from "../services/agent-invite.service.js";

export const agentInvitesRouter: Router = Router({ mergeParams: true });

// Middleware to extract and validate companyId
function requireCompanyId(req: Request, res: Response, next: () => void) {
  const companyId = req.params.companyId;
  if (!companyId) {
    return res.status(400).json({
      error: { code: "MISSING_COMPANY_ID", message: "Missing required companyId" }
    }) as unknown as void;
  }
  (req as any).companyId = companyId;
  next();
}

agentInvitesRouter.use(requireCompanyId);

// GET /api/companies/:companyId/agent-invites - List invites
agentInvitesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const invites = await agentInviteService.listInvites(companyId);
    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    console.error("Error listing agent invites:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list agent invites" } });
  }
});

// POST /api/companies/:companyId/agent-invites - Create invite
agentInvitesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { name, role, title, departmentId } = req.body;

    // Validate required fields
    if (!name || !role || !title) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Missing required fields: name, role, title" }
      });
    }

    // Validate role - ensure it's exactly one of the valid values
    const validRoles = ["CEO", "Manager", "Staff"] as const;
    const roleStr = String(role);
    if (!validRoles.includes(roleStr as typeof validRoles[number])) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: `Invalid role '${roleStr}'. Must be one of: ${validRoles.join(", ")}` }
      });
    }

    const result = await agentInviteService.createInvite({
      companyId,
      departmentId,
      name,
      role: roleStr as "CEO" | "Manager" | "Staff",
      title,
      openClawAgentId: req.body.openClawAgentId,
      openClawAgentWorkspace: req.body.openClawAgentWorkspace,
      openClawAgentDir: req.body.openClawAgentDir,
    });

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "CREATE_INVITE_FAILED",
          message: result.error ?? result.validationErrors?.join("; ") ?? "Failed to create invite"
        }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        inviteKey: result.inviteKey,
        expiresAt: result.expiresAt,
        prompt: result.prompt,
      }
    });
  } catch (error) {
    console.error("Error creating agent invite:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create agent invite" } });
  }
});

