import { Router, Request, Response, NextFunction } from "express";
import * as agentInviteService from "../services/agent-invite.service.js";
import * as agentService from "../services/agent.service.js";

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
      error: { code: "INVALID_API_KEY", message: "Invalid API key" }
    });
  }
}

agentInvitesRouter.use(requireCompanyId);
agentInvitesRouter.use(requireApiKey);

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
// Web UI (no auth) has full permissions, CLI uses role-based restrictions
agentInvitesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const agentInfo = (req as any).agentInfo;
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

    // Permission check based on agent role (only for CLI with auth, web-ui skips)
    if (agentInfo) {
      const { role: agentRole } = agentInfo;
      if (agentRole === "CEO") {
        // CEO can invite Manager or Staff, but not another CEO
        if (roleStr === "CEO") {
          return res.status(403).json({
            error: { code: "FORBIDDEN", message: "Cannot invite another CEO" }
          });
        }
      } else if (agentRole === "Manager") {
        // Manager can only invite Staff to their own department
        if (roleStr !== "Staff") {
          return res.status(403).json({
            error: { code: "FORBIDDEN", message: "Manager can only invite Staff" }
          });
        }
        if (departmentId !== agentInfo.departmentId) {
          return res.status(403).json({
            error: { code: "FORBIDDEN", message: "Manager can only invite Staff to their own department" }
          });
        }
      } else {
        // Staff cannot invite anyone
        return res.status(403).json({
          error: { code: "FORBIDDEN", message: "Only CEO or Manager can invite agents" }
        });
      }
    }

    // For Staff role, departmentId is required
    if (roleStr === "Staff" && !departmentId) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Staff role requires departmentId" }
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

