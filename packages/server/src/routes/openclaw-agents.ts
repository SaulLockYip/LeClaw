import { Router, Request, Response } from "express";
import { scanOpenClawAgents } from "@leclaw/shared/openclaw-scanner";

export const openclawAgentsRouter: Router = Router();

// GET /api/openclaw/agents - Scan and return available OpenClaw agents
openclawAgentsRouter.get("/agents", async (_req: Request, res: Response) => {
  try {
    const result = scanOpenClawAgents();
    res.json({
      success: true,
      data: {
        agents: result.agents,
        errors: result.errors,
      }
    });
  } catch (error) {
    console.error("Error scanning OpenClaw agents:", error);
    res.status(500).json({
      success: false, error: { code: "INTERNAL_ERROR", message: "Failed to scan OpenClaw agents" }
    });
  }
});
