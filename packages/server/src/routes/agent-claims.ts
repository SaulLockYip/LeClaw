import { Router, Request, Response } from "express";
import * as agentInviteService from "../services/agent-invite.service.js";
import * as agentService from "../services/agent.service.js";

export const agentClaimsRouter: Router = Router({ mergeParams: true });

// POST /api/agent-invites/claim/:inviteKey - Claim an invite and create agent
agentClaimsRouter.post("/claim/:inviteKey", async (req: Request, res: Response) => {
  try {
    const { inviteKey } = req.params;

    // Use the service to claim the invite
    const result = await agentInviteService.claimInvite(inviteKey);

    if (!result.success) {
      const status = result.error?.includes("not found") ? 404 :
                     result.error?.includes("already used") ? 409 :
                     result.error?.includes("expired") ? 410 : 400;
      return res.status(status).json({
        success: false,
        error: { code: "CLAIM_FAILED", message: result.error ?? "Failed to claim invite" }
      });
    }

    // Return agent info and API key
    res.status(201).json({
      success: true,
      data: {
        agentId: result.agentId,
        apiKey: result.apiKey,
        message: "Agent onboarded successfully. Store the API key securely - it cannot be recovered."
      }
    });
  } catch (error) {
    console.error("Error claiming invite:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to claim invite" }
    });
  }
});
