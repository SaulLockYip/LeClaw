import { Router, Request, Response, NextFunction } from "express";
import * as departmentService from "../services/department.service.js";
import * as agentService from "../services/agent.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const departmentsRouter: Router = Router({ mergeParams: true });

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

// Middleware to require CEO role
function requireCeo(req: Request, res: Response, next: NextFunction) {
  const { role } = (req as any).agentInfo;
  if (role !== "CEO") {
    return res.status(403).json({
      success: false, error: { code: "FORBIDDEN", message: "Only CEO can perform this action" }
    });
  }
  next();
}

// Middleware to require CEO or same department Manager role
async function requireCeoOrSameDepartmentManager(req: Request, res: Response, next: NextFunction) {
  const { role, agentId } = (req as any).agentInfo;
  const departmentId = req.params.id;

  if (role === "CEO") {
    return next();
  }

  if (role === "Manager") {
    // Check if this manager belongs to the department being updated
    try {
      const managerDept = await agentService.getAgent(agentId, (req as any).companyId);
      if (managerDept && managerDept.departmentId === departmentId) {
        return next();
      }
    } catch (error) {
      // Fall through to forbidden
    }
  }

  return res.status(403).json({
    success: false, error: { code: "FORBIDDEN", message: "Only CEO or same department Manager can perform this action" }
  });
}

departmentsRouter.use(requireCompanyId);
departmentsRouter.use(requireApiKey);

// GET /api/companies/:companyId/departments - List departments
// Uses API key for authentication, no role guard
departmentsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const departments = await departmentService.listDepartmentsByCompany(companyId);
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error("Error listing departments:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list departments" } });
  }
});

// POST /api/companies/:companyId/departments - Create department
// Requires API key + CEO role
departmentsRouter.post("/", requireCeo, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const department = await departmentService.createDepartment({
      name: req.body.name,
      companyId,
      description: req.body.description,
    });

    broadcastEvent({ type: "department_created", payload: department as unknown as Record<string, unknown> });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create department" } });
  }
});

// GET /api/companies/:companyId/departments/:id
departmentsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const department = await departmentService.getDepartment(req.params.id, companyId);
    if (!department) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Department ${req.params.id} not found` } });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    console.error("Error getting department:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get department" } });
  }
});

// PUT /api/companies/:companyId/departments/:id
// Requires API key + CEO or same department Manager role
departmentsRouter.put("/:id", requireCeoOrSameDepartmentManager, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const department = await departmentService.updateDepartment(req.params.id, companyId, {
      name: req.body.name,
      description: req.body.description,
    });
    if (!department) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Department ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "department_updated", payload: department as unknown as Record<string, unknown> });

    res.json({ success: true, data: department });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update department" } });
  }
});

// DELETE /api/companies/:companyId/departments/:id
departmentsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const deleted = await departmentService.deleteDepartment(req.params.id, companyId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Department ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "department_deleted", payload: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete department" } });
  }
});