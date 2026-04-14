import { Router, Request, Response, NextFunction } from "express";
import * as agentService from "../services/agent.service.js";

export const agentsMeRouter: Router = Router();

// Middleware to extract and validate API key
async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers.authorization?.replace(/^Bearer /, "");

  if (!apiKey) {
    return res.status(401).json({
      success: false, error: { code: "MISSING_API_KEY", message: "Missing API key" }
    });
  }

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

agentsMeRouter.use(requireApiKey);

// GET /api/agents/me - Get current authenticated agent's info
agentsMeRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { agentId, companyId, role } = (req as any).agentInfo;

    // Get full agent details
    const agent = await agentService.getAgent(agentId, companyId);

    if (!agent) {
      return res.status(404).json({
        success: false, error: { code: "NOT_FOUND", message: "Agent not found" }
      });
    }

    res.json({
      success: true,
      data: {
        agentId: agent.id,
        name: agent.name,
        role: agent.role,
        title: agent.title,
        companyId: agent.companyId,
        departmentId: agent.departmentId,
      }
    });
  } catch (error) {
    console.error("Error getting agent info:", error);
    res.status(500).json({
      success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get agent info" }
    });
  }
});
