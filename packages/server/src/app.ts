import express, { Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { healthRouter } from "./routes/health.js";
import { companiesRouter } from "./routes/companies.js";
import { departmentsRouter } from "./routes/departments.js";
import { agentsRouter } from "./routes/agents.js";
import { agentInvitesRouter } from "./routes/agent-invites.js";
import { issuesRouter } from "./routes/issues.js";
import { goalsRouter } from "./routes/goals.js";
import { projectsRouter } from "./routes/projects.js";
import { approvalsRouter } from "./routes/approvals.js";
import { eventsRouter } from "./routes/events.js";
import { openclawAgentsRouter } from "./routes/openclaw-agents.js";
import { agentClaimsRouter } from "./routes/agent-claims.js";
import { agentsMeRouter } from "./routes/agents-me.js";
import { agentsListRouter } from "./routes/agents-list.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDistPath = path.resolve(__dirname, "../../ui/dist");

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API routes FIRST (must be before static middleware)
  app.use("/health", healthRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/companies", companiesRouter);
  app.use("/api/companies/:companyId/agent-invites", agentInvitesRouter);
  app.use("/api/companies/:companyId/departments", departmentsRouter);
  app.use("/api/companies/:companyId/agents", agentsRouter);
    app.use("/api/companies/:companyId/issues", issuesRouter);
  app.use("/api/companies/:companyId/goals", goalsRouter);
  app.use("/api/companies/:companyId/projects", projectsRouter);
  app.use("/api/companies/:companyId/approvals", approvalsRouter);
  app.use("/api/openclaw", openclawAgentsRouter);
  app.use("/api/agent-invites", agentClaimsRouter);
  app.use("/api/agents", agentsListRouter);
  app.use("/api/agents/me", agentsMeRouter);

  // Serve UI static files (serves index.html for SPA at root)
  app.use(express.static(uiDistPath));

  // Catch-all route for SPA (must be last)
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(uiDistPath, "index.html"));
  });

  return app;
}