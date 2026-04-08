import { Router, Request, Response, NextFunction } from "express";
import * as departmentService from "../services/department.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const departmentsRouter: Router = Router({ mergeParams: true });

// Middleware to extract and validate companyId
function requireCompanyId(req: Request, res: Response, next: NextFunction) {
  console.log("[DEBUG] req.params:", JSON.stringify(req.params));
  const companyId = req.params.companyId;
  if (!companyId) {
    return res.status(400).json({
      error: { code: "MISSING_COMPANY_ID", message: "Missing required companyId" }
    });
  }
  (req as any).companyId = companyId;
  next();
}

departmentsRouter.use(requireCompanyId);

// GET /api/companies/:companyId/departments - List departments
departmentsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const departments = await departmentService.listDepartmentsByCompany(companyId);
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error("Error listing departments:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list departments" } });
  }
});

// POST /api/companies/:companyId/departments - Create department
departmentsRouter.post("/", async (req: Request, res: Response) => {
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
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create department" } });
  }
});

// GET /api/companies/:companyId/departments/:id
departmentsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const department = await departmentService.getDepartment(req.params.id, companyId);
    if (!department) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Department ${req.params.id} not found` } });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    console.error("Error getting department:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get department" } });
  }
});

// PUT /api/companies/:companyId/departments/:id
departmentsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const department = await departmentService.updateDepartment(req.params.id, companyId, {
      name: req.body.name,
      description: req.body.description,
    });
    if (!department) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Department ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "department_updated", payload: department as unknown as Record<string, unknown> });

    res.json({ success: true, data: department });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update department" } });
  }
});

// DELETE /api/companies/:companyId/departments/:id
departmentsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const deleted = await departmentService.deleteDepartment(req.params.id, companyId);
    if (!deleted) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Department ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "department_deleted", payload: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete department" } });
  }
});