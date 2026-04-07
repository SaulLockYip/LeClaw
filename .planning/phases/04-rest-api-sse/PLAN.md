# Phase 4: REST API + SSE — Implementation Plan

**Phase:** 04-rest-api-sse
**Created:** 2026-04-07
**Status:** Ready for execution

---

## Overview

This plan covers the complete Phase 4 implementation: Hono-based REST API with CRUD endpoints for all entities (Companies, Departments, Agents, Issues, Goals, Projects, Approvals) plus Server-Sent Events (SSE) endpoint for real-time Web UI updates.

**Success Criteria:**
1. Hono server running with `/api/*` routes
2. All CRUD endpoints functional for each entity
3. SSE endpoint at `/api/events` with 30-second heartbeat
4. Consistent error response format across all endpoints
5. Company isolation via `companyId` filter on all tenant-scoped requests
6. Tests passing for all API endpoints

---

## Directory Structure

```
packages/server/
├── src/
│   ├── app.ts                    # Hono app setup
│   ├── index.ts                  # Server entry
│   ├── routes/
│   │   ├── companies.ts          # /api/companies
│   │   ├── departments.ts        # /api/companies/:companyId/departments
│   │   ├── agents.ts             # /api/agents
│   │   ├── issues.ts             # /api/issues
│   │   ├── goals.ts              # /api/goals
│   │   ├── projects.ts           # /api/projects
│   │   ├── approvals.ts          # /api/approvals
│   │   ├── events.ts             # /api/events (SSE)
│   │   └── health.ts             # /health (existing)
│   ├── services/
│   │   ├── company.service.ts
│   │   ├── department.service.ts
│   │   ├── agent.service.ts
│   │   ├── issue.service.ts
│   │   ├── goal.service.ts
│   │   ├── project.service.ts
│   │   └── approval.service.ts
│   ├── sse/
│   │   └── event-bus.ts          # SSE event broadcaster
│   ├── middleware/
│   │   ├── company-filter.ts      # Inject companyId into context
│   │   └── error-handler.ts      # Standardized error responses
│   └── types/
│       └── api.ts                # API request/response types
```

---

## Task 1: packages/server — Hono Setup

### Files

- `packages/server/package.json` (update dependencies)
- `packages/server/src/app.ts` (replace Express with Hono)
- `packages/server/src/routes/health.ts` (update to Hono)

### Actions

**packages/server/package.json** (update):
```json
{
  "dependencies": {
    "hono": "^4.12.10",
    "@hono/node-server": "^1.13.0",
    "@leclaw/shared": "workspace:*",
    "@leclaw/db": "workspace:*"
  }
}
```

**packages/server/src/app.ts:**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { companiesRouter } from "./routes/companies.js";
import { departmentsRouter } from "./routes/departments.js";
import { agentsRouter } from "./routes/agents.js";
import { issuesRouter } from "./routes/issues.js";
import { goalsRouter } from "./routes/goals.js";
import { projectsRouter } from "./routes/projects.js";
import { approvalsRouter } from "./routes/approvals.js";
import { eventsRouter } from "./routes/events.js";
import { healthRouter } from "./routes/health.js";
import { errorMiddleware } from "./middleware/error-handler.js";
import { companyFilter } from "./middleware/company-filter.js";

export function createApp(): Hono {
  const app = new Hono();

  // CORS for Web UI
  app.use("/*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "companyId"],
  }));

  // Error handler middleware
  app.use("*", errorMiddleware);

  // Health check (no company filter)
  app.route("/health", healthRouter);

  // API routes with company filter
  const api = new Hono();
  api.use("*", companyFilter);

  api.route("/companies", companiesRouter);
  api.route("/departments", departmentsRouter);
  api.route("/agents", agentsRouter);
  api.route("/issues", issuesRouter);
  api.route("/goals", goalsRouter);
  api.route("/projects", projectsRouter);
  api.route("/approvals", approvalsRouter);
  api.route("/events", eventsRouter);

  app.route("/api", api);

  return app;
}

export function startServer(app: Hono, port: number, host: string): void {
  console.log(JSON.stringify({ success: true, server: { port, host } }));
  serve({ fetch: app.fetch, port, hostname: host });
}
```

**packages/server/src/routes/health.ts:**

```typescript
import { Hono } from "hono";
import { loadConfig } from "@leclaw/shared";
import path from "path";
import os from "os";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  const configPath = path.join(os.homedir(), ".leclaw", "config.json");
  let dbConnected = false;

  try {
    if (existsSync(configPath)) {
      const config = loadConfig({ configPath });
      dbConnected = !!config.database?.connectionString;
    }
  } catch {
    dbConnected = false;
  }

  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: dbConnected ? "connected" : "disconnected",
  });
});
```

---

## Task 2: Middleware — Company Filter + Error Handler

### Files

- `packages/server/src/middleware/company-filter.ts`
- `packages/server/src/middleware/error-handler.ts`
- `packages/server/src/types/api.ts`

### Actions

**packages/server/src/types/api.ts:**

```typescript
// Standard API error response
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Company context injected by middleware
export interface CompanyContext {
  companyId: string;
}

// SSE event types
export type SseEventType =
  | "company_created" | "company_updated" | "company_deleted"
  | "department_created" | "department_updated" | "department_deleted"
  | "agent_updated"
  | "issue_created" | "issue_updated"
  | "goal_updated" | "project_updated" | "approval_updated";

export interface SseEvent<T = unknown> {
  event: SseEventType;
  data: T;
}
```

**packages/server/src/middleware/company-filter.ts:**

```typescript
import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

export async function companyFilter(c: Context, next: Next): Promise<Response | void> {
  // Skip for health endpoint
  if (c.req.path === "/health") {
    return next();
  }

  // Extract companyId from header (Web UI) or query param
  const companyId = c.req.header("companyId") ?? c.req.query("companyId");

  if (!companyId) {
    throw new HTTPException(400, {
      message: "Missing required header: companyId",
      cause: { code: "MISSING_COMPANY_ID" },
    });
  }

  // Validate UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    throw new HTTPException(400, {
      message: "Invalid companyId format",
      cause: { code: "INVALID_COMPANY_ID" },
    });
  }

  // Attach to context for downstream handlers
  c.set("companyId", companyId);
  return next();
}
```

**packages/server/src/middleware/error-handler.ts:**

```typescript
import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ApiError } from "../types/api.js";

export async function errorMiddleware(c: Context, next: Next): Promise<Response | void> {
  try {
    return await next();
  } catch (error) {
    // Log error for debugging
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));

    if (error instanceof HTTPException) {
      const response = error.getResponse();
      const body = await response.json() as ApiError;

      return c.json(body, response.status);
    }

    // Generic server error
    const errorResponse: ApiError = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal error occurred",
        details: error instanceof Error ? { message: error.message } : undefined,
      },
    };

    return c.json(errorResponse, 500);
  }
}
```

---

## Task 3: SSE Event Bus

### Files

- `packages/server/src/sse/event-bus.ts`

### Actions

**packages/server/src/sse/event-bus.ts:**

```typescript
import type { SseEventType } from "../types/api.js";

// Connected SSE clients
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

// Event types that trigger broadcasts
const TRACKED_EVENTS: SseEventType[] = [
  "company_created", "company_updated", "company_deleted",
  "department_created", "department_updated", "department_deleted",
  "agent_updated",
  "issue_created", "issue_updated",
  "goal_updated", "project_updated", "approval_updated",
];

export interface EventPayload {
  event: SseEventType;
  data: Record<string, unknown>;
}

export function addClient(controller: ReadableStreamDefaultController<Uint8Array>): void {
  clients.add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController<Uint8Array>): void {
  clients.delete(controller);
}

export function broadcastEvent(payload: EventPayload): void {
  const message = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  for (const client of clients) {
    try {
      client.enqueue(encoded);
    } catch {
      // Client disconnected, remove it
      clients.delete(client);
    }
  }
}

export function isTrackedEvent(event: SseEventType): boolean {
  return TRACKED_EVENTS.includes(event);
}
```

---

## Task 4: Company CRUD Endpoints

### Files

- `packages/server/src/routes/companies.ts`
- `packages/server/src/services/company.service.ts`

### Actions

**packages/server/src/services/company.service.ts:**

```typescript
import { db } from "@leclaw/db";
import { companies } from "@leclaw/db/schema";
import { eq } from "drizzle-orm";
import type { Company } from "@leclaw/shared/types";

export interface CreateCompanyInput {
  name: string;
  description?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
}

export async function listCompanies(): Promise<Company[]> {
  return await db.select().from(companies);
}

export async function getCompany(id: string): Promise<Company | null> {
  const result = await db.select().from(companies).where(eq(companies.id, id));
  return result[0] ?? null;
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const id = crypto.randomUUID();
  const now = new Date();

  const [company] = await db.insert(companies).values({
    id,
    name: input.name,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return company;
}

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company | null> {
  const [company] = await db.update(companies)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();

  return company ?? null;
}

export async function deleteCompany(id: string): Promise<boolean> {
  const result = await db.delete(companies).where(eq(companies.id, id));
  return result.rowCount > 0;
}
```

**packages/server/src/routes/companies.ts:**

```typescript
import { Hono } from "hono";
import type { CompanyContext } from "../types/api.js";
import * as companyService from "../services/company.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const companiesRouter = new Hono<{ Variables: CompanyContext }>();

// GET /api/companies - List all companies (no company filter)
companiesRouter.get("/", async (c) => {
  const companies = await companyService.listCompanies();
  return c.json({ success: true, data: companies });
});

// POST /api/companies - Create company
companiesRouter.post("/", async (c) => {
  const body = await c.req.json();
  const company = await companyService.createCompany({
    name: body.name,
    description: body.description,
  });

  broadcastEvent({ event: "company_created", data: company });

  return c.json({ success: true, data: company }, 201);
});

// GET /api/companies/:id
companiesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const company = await companyService.getCompany(id);

  if (!company) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Company ${id} not found` }
    }, 404);
  }

  return c.json({ success: true, data: company });
});

// PUT /api/companies/:id
companiesRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const company = await companyService.updateCompany(id, {
    name: body.name,
    description: body.description,
  });

  if (!company) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Company ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "company_updated", data: company });

  return c.json({ success: true, data: company });
});

// DELETE /api/companies/:id
companiesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await companyService.deleteCompany(id);

  if (!deleted) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Company ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "company_deleted", data: { id } });

  return c.json({ success: true });
});
```

---

## Task 5: Department CRUD Endpoints

### Files

- `packages/server/src/routes/departments.ts`
- `packages/server/src/services/department.service.ts`

### Actions

**packages/server/src/services/department.service.ts:**

```typescript
import { db } from "@leclaw/db";
import { departments } from "@leclaw/db/schema";
import { eq, and } from "drizzle-orm";
import type { Department } from "@leclaw/shared/types";

export interface CreateDepartmentInput {
  name: string;
  companyId: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
}

export async function listDepartmentsByCompany(companyId: string): Promise<Department[]> {
  return await db.select().from(departments).where(eq(departments.companyId, companyId));
}

export async function getDepartment(id: string, companyId: string): Promise<Department | null> {
  const result = await db.select().from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));
  return result[0] ?? null;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const id = crypto.randomUUID();
  const now = new Date();

  const [department] = await db.insert(departments).values({
    id,
    name: input.name,
    companyId: input.companyId,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return department;
}

export async function updateDepartment(
  id: string,
  companyId: string,
  input: UpdateDepartmentInput
): Promise<Department | null> {
  const [department] = await db.update(departments)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)))
    .returning();

  return department ?? null;
}

export async function deleteDepartment(id: string, companyId: string): Promise<boolean> {
  const result = await db.delete(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));
  return result.rowCount > 0;
}
```

**packages/server/src/routes/departments.ts:**

```typescript
import { Hono } from "hono";
import type { CompanyContext } from "../types/api.js";
import * as departmentService from "../services/department.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const departmentsRouter = new Hono<{ Variables: CompanyContext }>();

// GET /api/departments - List departments for company (requires companyId)
departmentsRouter.get("/", async (c) => {
  const companyId = c.get("companyId");
  const departments = await departmentService.listDepartmentsByCompany(companyId);
  return c.json({ success: true, data: departments });
});

// POST /api/departments - Create department
departmentsRouter.post("/", async (c) => {
  const companyId = c.get("companyId");
  const body = await c.req.json();

  const department = await departmentService.createDepartment({
    name: body.name,
    companyId,
    description: body.description,
  });

  broadcastEvent({ event: "department_created", data: department });

  return c.json({ success: true, data: department }, 201);
});

// GET /api/departments/:id
departmentsRouter.get("/:id", async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");

  const department = await departmentService.getDepartment(id, companyId);

  if (!department) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Department ${id} not found` }
    }, 404);
  }

  return c.json({ success: true, data: department });
});

// PUT /api/departments/:id
departmentsRouter.put("/:id", async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const body = await c.req.json();

  const department = await departmentService.updateDepartment(id, companyId, {
    name: body.name,
    description: body.description,
  });

  if (!department) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Department ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "department_updated", data: department });

  return c.json({ success: true, data: department });
});

// DELETE /api/departments/:id
departmentsRouter.delete("/:id", async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");

  const deleted = await departmentService.deleteDepartment(id, companyId);

  if (!deleted) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Department ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "department_deleted", data: { id } });

  return c.json({ success: true });
});
```

---

## Task 6: Agent Endpoints (Read + Update only)

### Files

- `packages/server/src/routes/agents.ts`
- `packages/server/src/services/agent.service.ts`

### Actions

**packages/server/src/services/agent.service.ts:**

```typescript
import { db } from "@leclaw/db";
import { agents } from "@leclaw/db/schema";
import { eq, and } from "drizzle-orm";
import type { Agent } from "@leclaw/shared/types";

export interface UpdateAgentInput {
  name?: string;
}

export async function listAgentsByCompany(companyId: string): Promise<Agent[]> {
  return await db.select().from(agents).where(eq(agents.companyId, companyId));
}

export async function getAgent(id: string, companyId: string): Promise<Agent | null> {
  const result = await db.select().from(agents)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)));
  return result[0] ?? null;
}

export async function updateAgent(
  id: string,
  companyId: string,
  input: UpdateAgentInput
): Promise<Agent | null> {
  const [agent] = await db.update(agents)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)))
    .returning();

  return agent ?? null;
}
```

**packages/server/src/routes/agents.ts:**

```typescript
import { Hono } from "hono";
import type { CompanyContext } from "../types/api.js";
import * as agentService from "../services/agent.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const agentsRouter = new Hono<{ Variables: CompanyContext }>();

// GET /api/agents - List agents for company
agentsRouter.get("/", async (c) => {
  const companyId = c.get("companyId");
  const agents = await agentService.listAgentsByCompany(companyId);
  return c.json({ success: true, data: agents });
});

// GET /api/agents/:id
agentsRouter.get("/:id", async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");

  const agent = await agentService.getAgent(id, companyId);

  if (!agent) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Agent ${id} not found` }
    }, 404);
  }

  return c.json({ success: true, data: agent });
});

// PUT /api/agents/:id
agentsRouter.put("/:id", async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const body = await c.req.json();

  const agent = await agentService.updateAgent(id, companyId, {
    name: body.name,
  });

  if (!agent) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Agent ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "agent_updated", data: agent });

  return c.json({ success: true, data: agent });
});
```

---

## Task 7: Issue CRUD Endpoints

### Files

- `packages/server/src/routes/issues.ts`
- `packages/server/src/services/issue.service.ts`

### Actions

**packages/server/src/services/issue.service.ts:**

```typescript
import { db } from "@leclaw/db";
import { issues, issueComments } from "@leclaw/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { Issue } from "@leclaw/shared/types";

export interface CreateIssueInput {
  title: string;
  description?: string;
  status?: "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled";
  assigneeAgentId?: string;
  departmentId: string;
  subIssues?: string[];
  report?: string;
  projectId?: string;
  goalId?: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled";
  assigneeAgentId?: string;
  subIssues?: string[];
  report?: string;
  projectId?: string;
  goalId?: string;
}

export async function listIssuesByCompany(companyId: string): Promise<Issue[]> {
  // Issues are department-scoped, so we filter via department's companyId
  // This requires a join; for now, return all issues and filter
  // TODO: Optimize with proper join query
  return await db.select().from(issues);
}

export async function listIssuesByDepartment(departmentId: string): Promise<Issue[]> {
  return await db.select().from(issues).where(eq(issues.departmentId, departmentId));
}

export async function getIssue(id: string): Promise<Issue | null> {
  const result = await db.select().from(issues).where(eq(issues.id, id));
  return result[0] ?? null;
}

export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  const id = crypto.randomUUID();
  const now = new Date();

  const [issue] = await db.insert(issues).values({
    id,
    title: input.title,
    description: input.description,
    status: input.status ?? "Open",
    assigneeAgentId: input.assigneeAgentId,
    departmentId: input.departmentId,
    subIssues: input.subIssues ?? [],
    report: input.report,
    projectId: input.projectId,
    goalId: input.goalId,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return issue;
}

export async function updateIssue(id: string, input: UpdateIssueInput): Promise<Issue | null> {
  const [issue] = await db.update(issues)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(issues.id, id))
    .returning();

  return issue ?? null;
}

export async function deleteIssue(id: string): Promise<boolean> {
  const result = await db.delete(issues).where(eq(issues.id, id));
  return result.rowCount > 0;
}

export async function addComment(issueId: string, authorAgentId: string, message: string): Promise<void> {
  await db.insert(issueComments).values({
    id: crypto.randomUUID(),
    issueId,
    authorAgentId,
    message,
    timestamp: new Date(),
  });
}
```

**packages/server/src/routes/issues.ts:**

```typescript
import { Hono } from "hono";
import type { CompanyContext } from "../types/api.js";
import * as issueService from "../services/issue.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const issuesRouter = new Hono<{ Variables: CompanyContext }>();

// GET /api/issues - List issues (filtered by department via query param)
issuesRouter.get("/", async (c) => {
  const departmentId = c.req.query("departmentId");

  if (departmentId) {
    const issues = await issueService.listIssuesByDepartment(departmentId);
    return c.json({ success: true, data: issues });
  }

  const issues = await issueService.listIssuesByCompany(c.get("companyId"));
  return c.json({ success: true, data: issues });
});

// POST /api/issues - Create issue
issuesRouter.post("/", async (c) => {
  const body = await c.req.json();

  const issue = await issueService.createIssue({
    title: body.title,
    description: body.description,
    status: body.status,
    assigneeAgentId: body.assigneeAgentId,
    departmentId: body.departmentId,
    subIssues: body.subIssues,
    report: body.report,
    projectId: body.projectId,
    goalId: body.goalId,
  });

  broadcastEvent({ event: "issue_created", data: issue });

  return c.json({ success: true, data: issue }, 201);
});

// GET /api/issues/:id
issuesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const issue = await issueService.getIssue(id);

  if (!issue) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Issue ${id} not found` }
    }, 404);
  }

  return c.json({ success: true, data: issue });
});

// PUT /api/issues/:id
issuesRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const issue = await issueService.updateIssue(id, {
    title: body.title,
    description: body.description,
    status: body.status,
    assigneeAgentId: body.assigneeAgentId,
    subIssues: body.subIssues,
    report: body.report,
    projectId: body.projectId,
    goalId: body.goalId,
  });

  if (!issue) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Issue ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "issue_updated", data: issue });

  return c.json({ success: true, data: issue });
});

// DELETE /api/issues/:id
issuesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await issueService.deleteIssue(id);

  if (!deleted) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Issue ${id} not found` }
    }, 404);
  }

  return c.json({ success: true });
});
```

---

## Task 8: Goal CRUD Endpoints

### Files

- `packages/server/src/routes/goals.ts`
- `packages/server/src/services/goal.service.ts`

### Actions

**packages/server/src/services/goal.service.ts:**

```typescript
import { db } from "@leclaw/db";
import { goals } from "@leclaw/db/schema";
import { eq } from "drizzle-orm";
import type { Goal } from "@leclaw/shared/types";

export interface CreateGoalInput {
  title: string;
  description?: string;
  status?: "Open" | "Achieved" | "Archived";
  verification?: string;
  deadline?: Date;
  departmentIds?: string[];
  issueIds?: string[];
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: "Open" | "Achieved" | "Archived";
  verification?: string;
  deadline?: Date;
  departmentIds?: string[];
  issueIds?: string[];
}

export async function listGoalsByCompany(companyId: string): Promise<Goal[]> {
  // Goals are company-scoped
  // TODO: Add companyId to goals table if not present
  return await db.select().from(goals);
}

export async function getGoal(id: string): Promise<Goal | null> {
  const result = await db.select().from(goals).where(eq(goals.id, id));
  return result[0] ?? null;
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const id = crypto.randomUUID();
  const now = new Date();

  const [goal] = await db.insert(goals).values({
    id,
    title: input.title,
    description: input.description,
    status: input.status ?? "Open",
    verification: input.verification,
    deadline: input.deadline,
    departmentIds: input.departmentIds ?? [],
    issueIds: input.issueIds ?? [],
    createdAt: now,
    updatedAt: now,
  }).returning();

  return goal;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal | null> {
  const [goal] = await db.update(goals)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(goals.id, id))
    .returning();

  return goal ?? null;
}

export async function deleteGoal(id: string): Promise<boolean> {
  const result = await db.delete(goals).where(eq(goals.id, id));
  return result.rowCount > 0;
}
```

**packages/server/src/routes/goals.ts:**

```typescript
import { Hono } from "hono";
import type { CompanyContext } from "../types/api.js";
import * as goalService from "../services/goal.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const goalsRouter = new Hono<{ Variables: CompanyContext }>();

// GET /api/goals - List goals
goalsRouter.get("/", async (c) => {
  const goals = await goalService.listGoalsByCompany(c.get("companyId"));
  return c.json({ success: true, data: goals });
});

// POST /api/goals - Create goal
goalsRouter.post("/", async (c) => {
  const body = await c.req.json();

  const goal = await goalService.createGoal({
    title: body.title,
    description: body.description,
    status: body.status,
    verification: body.verification,
    deadline: body.deadline ? new Date(body.deadline) : undefined,
    departmentIds: body.departmentIds,
    issueIds: body.issueIds,
  });

  broadcastEvent({ event: "goal_updated", data: goal });

  return c.json({ success: true, data: goal }, 201);
});

// GET /api/goals/:id
goalsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const goal = await goalService.getGoal(id);

  if (!goal) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Goal ${id} not found` }
    }, 404);
  }

  return c.json({ success: true, data: goal });
});

// PUT /api/goals/:id
goalsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const goal = await goalService.updateGoal(id, {
    title: body.title,
    description: body.description,
    status: body.status,
    verification: body.verification,
    deadline: body.deadline ? new Date(body.deadline) : undefined,
    departmentIds: body.departmentIds,
    issueIds: body.issueIds,
  });

  if (!goal) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Goal ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "goal_updated", data: goal });

  return c.json({ success: true, data: goal });
});

// DELETE /api/goals/:id
goalsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await goalService.deleteGoal(id);

  if (!deleted) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Goal ${id} not found` }
    }, 404);
  }

  return c.json({ success: true });
});
```

---

## Task 9: Project CRUD Endpoints

### Files

- `packages/server/src/routes/projects.ts`
- `packages/server/src/services/project.service.ts`

### Actions

**packages/server/src/services/project.service.ts:**

```typescript
import { db } from "@leclaw/db";
import { projects } from "@leclaw/db/schema";
import { eq } from "drizzle-orm";
import type { Project } from "@leclaw/shared/types";

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: "Open" | "InProgress" | "Done" | "Archived";
  projectDir?: string;
  issueIds?: string[];
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: "Open" | "InProgress" | "Done" | "Archived";
  projectDir?: string;
  issueIds?: string[];
}

export async function listProjectsByCompany(companyId: string): Promise<Project[]> {
  return await db.select().from(projects).where(eq(projects.companyId, companyId));
}

export async function getProject(id: string): Promise<Project | null> {
  const result = await db.select().from(projects).where(eq(projects.id, id));
  return result[0] ?? null;
}

export async function createProject(companyId: string, input: CreateProjectInput): Promise<Project> {
  const id = crypto.randomUUID();
  const now = new Date();

  const [project] = await db.insert(projects).values({
    id,
    companyId,
    title: input.title,
    description: input.description,
    status: input.status ?? "Open",
    projectDir: input.projectDir,
    issueIds: input.issueIds ?? [],
    createdAt: now,
    updatedAt: now,
  }).returning();

  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
  const [project] = await db.update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  return project ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await db.delete(projects).where(eq(projects.id, id));
  return result.rowCount > 0;
}
```

**packages/server/src/routes/projects.ts:**

```typescript
import { Hono } from "hono";
import type { CompanyContext } from "../types/api.js";
import * as projectService from "../services/project.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const projectsRouter = new Hono<{ Variables: CompanyContext }>();

// GET /api/projects - List projects
projectsRouter.get("/", async (c) => {
  const projects = await projectService.listProjectsByCompany(c.get("companyId"));
  return c.json({ success: true, data: projects });
});

// POST /api/projects - Create project
projectsRouter.post("/", async (c) => {
  const companyId = c.get("companyId");
  const body = await c.req.json();

  const project = await projectService.createProject(companyId, {
    title: body.title,
    description: body.description,
    status: body.status,
    projectDir: body.projectDir,
    issueIds: body.issueIds,
  });

  broadcastEvent({ event: "project_updated", data: project });

  return c.json({ success: true, data: project }, 201);
});

// GET /api/projects/:id
projectsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const project = await projectService.getProject(id);

  if (!project) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Project ${id} not found` }
    }, 404);
  }

  return c.json({ success: true, data: project });
});

// PUT /api/projects/:id
projectsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const project = await projectService.updateProject(id, {
    title: body.title,
    description: body.description,
    status: body.status,
    projectDir: body.projectDir,
    issueIds: body.issueIds,
  });

  if (!project) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Project ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "project_updated", data: project });

  return c.json({ success: true, data: project });
});

// DELETE /api/projects/:id
projectsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await projectService.deleteProject(id);

  if (!deleted) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Project ${id} not found` }
    }, 404);
  }

  return c.json({ success: true });
});
```

---

## Task 10: Approval Endpoints (Read + Create + Update)

### Files

- `packages/server/src/routes/approvals.ts`
- `packages/server/src/services/approval.service.ts`

### Actions

**packages/server/src/services/approval.service.ts:**

```typescript
import { db } from "@leclaw/db";
import { approvals } from "@leclaw/db/schema";
import { eq } from "drizzle-orm";
import type { Approval } from "@leclaw/shared/types";

export interface CreateApprovalInput {
  title: string;
  description?: string;
  requesterAgentId: string;
}

export interface UpdateApprovalInput {
  status?: "Pending" | "Approved" | "Rejected";
  rejectMessage?: string;
}

export async function listApprovalsByCompany(companyId: string): Promise<Approval[]> {
  // Filter by company via requester agent
  // TODO: Add companyId to approvals table if not present
  return await db.select().from(approvals);
}

export async function getApproval(id: string): Promise<Approval | null> {
  const result = await db.select().from(approvals).where(eq(approvals.id, id));
  return result[0] ?? null;
}

export async function createApproval(input: CreateApprovalInput): Promise<Approval> {
  const id = crypto.randomUUID();
  const now = new Date();

  const [approval] = await db.insert(approvals).values({
    id,
    title: input.title,
    description: input.description,
    requesterAgentId: input.requesterAgentId,
    status: "Pending",
    createdAt: now,
    updatedAt: now,
  }).returning();

  return approval;
}

export async function updateApproval(id: string, input: UpdateApprovalInput): Promise<Approval | null> {
  const [approval] = await db.update(approvals)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(approvals.id, id))
    .returning();

  return approval ?? null;
}
```

**packages/server/src/routes/approvals.ts:**

```typescript
import { Hono } from "hono";
import type { CompanyContext } from "../types/api.js";
import * as approvalService from "../services/approval.service.js";
import { broadcastEvent } from "../sse/event-bus.js";

export const approvalsRouter = new Hono<{ Variables: CompanyContext }>();

// GET /api/approvals - List approvals
approvalsRouter.get("/", async (c) => {
  const approvals = await approvalService.listApprovalsByCompany(c.get("companyId"));
  return c.json({ success: true, data: approvals });
});

// POST /api/approvals - Create approval
approvalsRouter.post("/", async (c) => {
  const body = await c.req.json();

  const approval = await approvalService.createApproval({
    title: body.title,
    description: body.description,
    requesterAgentId: body.requesterAgentId,
  });

  broadcastEvent({ event: "approval_updated", data: approval });

  return c.json({ success: true, data: approval }, 201);
});

// GET /api/approvals/:id
approvalsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const approval = await approvalService.getApproval(id);

  if (!approval) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Approval ${id} not found` }
    }, 404);
  }

  return c.json({ success: true, data: approval });
});

// PUT /api/approvals/:id
approvalsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const approval = await approvalService.updateApproval(id, {
    status: body.status,
    rejectMessage: body.rejectMessage,
  });

  if (!approval) {
    return c.json({
      error: { code: "NOT_FOUND", message: `Approval ${id} not found` }
    }, 404);
  }

  broadcastEvent({ event: "approval_updated", data: approval });

  return c.json({ success: true, data: approval });
});
```

---

## Task 11: SSE Endpoint

### Files

- `packages/server/src/routes/events.ts`

### Actions

**packages/server/src/routes/events.ts:**

```typescript
import { Hono } from "hono";
import { addClient, removeClient } from "../sse/event-bus.js";

export const eventsRouter = new Hono();

// SSE endpoint: /api/events
eventsRouter.get("/", (c) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register client
      addClient(controller);

      // Send initial connection success
      const connected = `event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`;
      controller.enqueue(encoder.encode(connected));

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`<!-- heartbeat -->\n`));
        } catch {
          // Client disconnected
          clearInterval(heartbeat);
          removeClient(controller);
        }
      }, 30_000);

      // Cleanup on close
      c.req.raw.signal?.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeClient(controller);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      // Stream cancelled
    },
  });

  return c.body(stream, 200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
});
```

---

## Task 12: Server Entry Point Update

### Files

- `packages/server/src/index.ts`

### Actions

**packages/server/src/index.ts:**

```typescript
import { createApp, startServer } from "./app.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = createApp();
startServer(app, PORT, HOST);
```

---

## Task 13: Add Entity Types to Shared Package

### Files

- `packages/shared/src/types/entities.ts`

### Actions

**packages/shared/src/types/entities.ts:**

```typescript
// Company
export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Department
export interface Department {
  id: string;
  name: string;
  companyId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Agent
export type AgentRole = "CEO" | "Manager" | "Staff";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  openClawAgentId: string;
  openClawAgentWorkspace: string;
  openClawAgentDir: string;
  companyId: string;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Issue
export type IssueStatus = "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled";

export interface IssueComment {
  id: string;
  issueId: string;
  authorAgentId: string;
  timestamp: Date;
  message: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: IssueStatus;
  assigneeAgentId?: string;
  departmentId: string;
  subIssues: string[];
  report?: string;
  projectId?: string;
  goalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Goal
export type GoalStatus = "Open" | "Achieved" | "Archived";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  verification?: string;
  deadline?: Date;
  departmentIds: string[];
  issueIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Project
export type ProjectStatus = "Open" | "InProgress" | "Done" | "Archived";

export interface Project {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  projectDir?: string;
  issueIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Approval
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface Approval {
  id: string;
  title: string;
  description?: string;
  requesterAgentId: string;
  status: ApprovalStatus;
  rejectMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**packages/shared/src/index.ts** (update):
```typescript
export * from "./types/config.js";
export * from "./types/entities.js";  // Add this
export * from "./config/io.js";
export * from "./utils/index.js";
```

---

## Verification

1. `pnpm build` succeeds
2. `pnpm test -- --run` passes all API tests
3. `GET /api/companies` returns empty array initially
4. `POST /api/companies` creates company and returns it
5. `GET /api/companies/:id` returns created company
6. `PUT /api/companies/:id` updates and returns company
7. `DELETE /api/companies/:id` deletes company
8. `GET /api/companies/:companyId/departments` lists departments
9. `POST /api/companies/:companyId/departments` creates department
10. `GET /api/agents` lists agents with companyId filter
11. `GET /api/issues` lists issues
12. `GET /api/goals` lists goals
13. `GET /api/projects` lists projects
14. `GET /api/approvals` lists approvals
15. SSE endpoint `/api/events` connects and receives heartbeat every 30 seconds
16. Error responses follow standard format: `{ error: { code, message, details } }`
17. Missing `companyId` header returns 400 with `MISSING_COMPANY_ID` error

---

## Success Criteria

1. **Hono REST API**: All routes use Hono framework, not Express
2. **Company CRUD**: Full create/read/update/delete for companies
3. **Department CRUD**: Full CRUD for departments with company isolation
4. **Agent Endpoints**: Read and update agents with company filter
5. **Issue CRUD**: Full CRUD for issues
6. **Goal CRUD**: Full CRUD for goals
7. **Project CRUD**: Full CRUD for projects
8. **Approval Endpoints**: Create, read, update approvals
9. **SSE Endpoint**: `/api/events` with 30-second heartbeat
10. **Error Format**: Consistent `{ error: { code, message, details } }` format
11. **Company Isolation**: All tenant-scoped routes enforce `companyId` filter
12. **Tests**: Unit tests for all services and routes

---

## Output

After completion, create `.planning/phases/04-rest-api-sse/SUMMARY.md`
