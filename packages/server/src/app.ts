import express, { Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { companiesRouter } from "./routes/companies.js";
import { departmentsRouter } from "./routes/departments.js";
import { agentsRouter } from "./routes/agents.js";
import { issuesRouter } from "./routes/issues.js";
import { goalsRouter } from "./routes/goals.js";
import { projectsRouter } from "./routes/projects.js";
import { approvalsRouter } from "./routes/approvals.js";
import { eventsRouter } from "./routes/events.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.use("/health", healthRouter);

  // SSE endpoint
  app.use("/api/events", eventsRouter);

  // Company routes (no company filter needed)
  app.use("/api/companies", companiesRouter);

  // Nested routes with company filter middleware
  app.use("/api/companies/:companyId/departments", departmentsRouter);
  app.use("/api/companies/:companyId/agents", agentsRouter);
  app.use("/api/companies/:companyId/issues", issuesRouter);
  app.use("/api/companies/:companyId/goals", goalsRouter);
  app.use("/api/companies/:companyId/projects", projectsRouter);
  app.use("/api/companies/:companyId/approvals", approvalsRouter);

  return app;
}