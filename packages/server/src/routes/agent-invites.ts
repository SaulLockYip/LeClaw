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

    // Validate role
    if (!["CEO", "Manager", "Staff"].includes(role)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid role. Must be one of: CEO, Manager, Staff" }
      });
    }

    const result = await agentInviteService.createInvite({
      companyId,
      departmentId,
      name,
      role,
      title,
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

// POST /api/agent-invites/claim - Claim an invite (no companyId prefix - standalone endpoint)
export const claimInviteRouter: Router = Router();

claimInviteRouter.post("/claim", async (req: Request, res: Response) => {
  try {
    const { inviteKey } = req.body;

    if (!inviteKey) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Missing required field: inviteKey" }
      });
    }

    const result = await agentInviteService.claimInvite(inviteKey);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "CLAIM_INVITE_FAILED",
          message: result.error ?? result.validationErrors?.join("; ") ?? "Failed to claim invite"
        }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        agent: result.agent,
        apiKey: result.apiKey,
        message: "Agent onboarded successfully. Store the API key securely - it cannot be recovered."
      }
    });
  } catch (error) {
    console.error("Error claiming agent invite:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to claim agent invite" } });
  }
});
