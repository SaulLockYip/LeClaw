import { Router, Request, Response, NextFunction } from "express";
import * as agentService from "../services/agent.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const agentsRouter: Router = Router({ mergeParams: true });

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

agentsRouter.use(requireCompanyId);

// POST /api/companies/:companyId/agents - Create agent
agentsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const result = await agentService.createAgent(companyId, {
      name: req.body.name,
      role: req.body.role,
      departmentId: req.body.departmentId,
      openClawAgentId: req.body.openClawAgentId,
      openClawAgentWorkspace: req.body.openClawAgentWorkspace,
      openClawAgentDir: req.body.openClawAgentDir,
    });

    broadcastEvent({ type: "agent_created", payload: result.agent as unknown as Record<string, unknown> });

    // Return the agent AND the API key (only time it's returned)
    res.status(201).json({
      success: true,
      data: result.agent,
      apiKey: result.apiKey,
      message: "Agent created. Store the API key securely - it cannot be recovered."
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create agent" } });
  }
});

// GET /api/companies/:companyId/agents - List agents
agentsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const agents = await agentService.listAgentsByCompany(companyId);
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error("Error listing agents:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list agents" } });
  }
});

// GET /api/companies/:companyId/agents/:id
agentsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const agent = await agentService.getAgent(req.params.id, companyId);
    if (!agent) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Agent ${req.params.id} not found` } });
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    console.error("Error getting agent:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get agent" } });
  }
});

// PUT /api/companies/:companyId/agents/:id
agentsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const agent = await agentService.updateAgent(req.params.id, companyId, {
      name: req.body.name,
    });
    if (!agent) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Agent ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "agent_updated", payload: agent as unknown as Record<string, unknown> });

    res.json({ success: true, data: agent });
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update agent" } });
  }
});