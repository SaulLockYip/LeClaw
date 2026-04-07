import { Router, Request, Response, NextFunction } from "express";
import * as companyService from "../services/company.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const companiesRouter: Router = Router();

// Middleware to extract and validate companyId
function requireCompanyId(req: Request, res: Response, next: NextFunction) {
  const companyId = req.header("companyId") ?? req.query.companyId as string ?? req.query.company_id as string;
  if (!companyId) {
    return res.status(400).json({
      error: { code: "MISSING_COMPANY_ID", message: "Missing required companyId" }
    });
  }
  (req as any).companyId = companyId;
  next();
}

// GET /api/companies - List all companies
companiesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const companies = await companyService.listCompanies();
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error("Error listing companies:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list companies" } });
  }
});

// POST /api/companies - Create company
companiesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const company = await companyService.createCompany({
      name: req.body.name,
      description: req.body.description,
    });

    broadcastEvent({ type: "company_created", payload: company as unknown as Record<string, unknown> });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create company" } });
  }
});

// GET /api/companies/:id
companiesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const company = await companyService.getCompany(req.params.id);
    if (!company) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Company ${req.params.id} not found` } });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    console.error("Error getting company:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get company" } });
  }
});

// PUT /api/companies/:id
companiesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const company = await companyService.updateCompany(req.params.id, {
      name: req.body.name,
      description: req.body.description,
    });
    if (!company) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Company ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "company_updated", payload: company as unknown as Record<string, unknown> });

    res.json({ success: true, data: company });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update company" } });
  }
});

// DELETE /api/companies/:id
companiesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await companyService.deleteCompany(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Company ${req.params.id} not found` } });
    }

    broadcastEvent({ type: "company_deleted", payload: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete company" } });
  }
});