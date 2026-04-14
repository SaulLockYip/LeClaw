import { Router, Request, Response, NextFunction } from "express";
import * as agentService from "../services/agent.service.js";

export const agentsListRouter: Router = Router();

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

agentsListRouter.use(requireApiKey);

// GET /api/agents - List all agents for the authenticated agent's company
agentsListRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).agentInfo;

    const agents = await agentService.listAgentsWithDepartment(companyId);

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    console.error("Error listing agents:", error);
    res.status(500).json({
      success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list agents" }
    });
  }
});
