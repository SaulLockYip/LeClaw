# Phase 2 Plan: Data Layer - Entity Models + DB

**Phase:** 02-data-layer-entity-models-db
**Status:** Planning
**Created:** 2026-04-07

## 1. Directory Structure

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── index.ts              # Barrel export for all schemas
│   │   ├── _common.ts            # Shared schema helpers (timestamps, etc.)
│   │   ├── companies.ts          # Company entity
│   │   ├── departments.ts         # Department entity
│   │   ├── agents.ts             # Agent entity
│   │   ├── issues.ts             # Issue entity
│   │   ├── issue_comments.ts     # IssueComment entity (separate table)
│   │   ├── goals.ts              # Goal entity
│   │   ├── projects.ts           # Project entity
│   │   └── approvals.ts          # Approval entity
│   ├── migrations/                # Drizzle migration output (generated)
│   └── index.ts                  # Package exports
├── drizzle.config.ts             # Drizzle Kit configuration
├── package.json
└── tsconfig.json
```

## 2. Company Schema

**File:** `packages/db/src/schema/companies.ts`

```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // PK only, no additional indexes needed for companies
  }),
);
```

**Indexes:** Primary key only (no compound indexes needed).

## 3. Department Schema

**File:** `packages/db/src/schema/departments.ts`

```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("departments_company_id_idx").on(table.companyId),
  }),
);
```

**Indexes:**
- `departments_company_id_idx` on `(companyId)` — company isolation boundary

**Note:** Manager Agent linkage via `Agent.departmentId` (not a field on Department).

## 4. Agent Schema

**File:** `packages/db/src/schema/agents.ts`

```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { departments } from "./departments.js";

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    departmentId: uuid("department_id").references(() => departments.id),
    name: text("name").notNull(),
    role: text("role").notNull().default("Staff"), // "CEO" | "Manager" | "Staff"
    openClawAgentId: text("openclaw_agent_id"),     // External OpenClaw agent ID
    openClawAgentWorkspace: text("openclaw_agent_workspace"), // OpenClaw workspace path
    openClawAgentDir: text("openclaw_agent_dir"),   // OpenClaw agent working directory
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyDepartmentIdx: index("agents_company_department_idx").on(table.companyId, table.departmentId),
    companyRoleIdx: index("agents_company_role_idx").on(table.companyId, table.role),
  }),
);
```

**Indexes:**
- `agents_company_department_idx` on `(companyId, departmentId)`
- `agents_company_role_idx` on `(companyId, role)`

**Fields:**
- `openClawAgentId` — External OpenClaw agent identifier
- `openClawAgentWorkspace` — OpenClaw workspace path
- `openClawAgentDir` — OpenClaw agent working directory

## 5. Issue Schema

**File:** `packages/db/src/schema/issues.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { departments } from "./departments.js";
import { agents } from "./agents.js";
import { projects } from "./projects.js";
import { goals } from "./goals.js";

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("Open"), // "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled"
    assigneeAgentId: uuid("assignee_agent_id").references(() => agents.id),
    departmentId: uuid("department_id").references(() => departments.id),
    subIssues: jsonb("sub_issues").$type<string[]>().notNull().default([]), // uuid[] - JSONB array
    report: text("report"), // Markdown text content
    projectId: uuid("project_id").references(() => projects.id),
    goalId: uuid("goal_id").references(() => goals.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("issues_company_status_idx").on(table.companyId, table.status),
    companyAssigneeStatusIdx: index("issues_company_assignee_status_idx").on(
      table.companyId,
      table.assigneeAgentId,
      table.status,
    ),
    departmentStatusIdx: index("issues_department_status_idx").on(table.departmentId, table.status),
  }),
);
```

**Indexes:**
- `issues_company_status_idx` on `(companyId, status)`
- `issues_company_assignee_status_idx` on `(companyId, assigneeAgentId, status)`
- `issues_department_status_idx` on `(departmentId, status)`

**Fields:**
- `subIssues` — JSONB array of uuid strings
- `report` — Markdown text (not separate table, stored directly)

## 6. IssueComment Schema (Separate Table)

**File:** `packages/db/src/schema/issue_comments.ts`

```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { issues } from "./issues.js";
import { agents } from "./agents.js";

export const issueComments = pgTable(
  "issue_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id),
    authorAgentId: uuid("author_agent_id").references(() => agents.id),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    message: text("message").notNull(),
  },
  (table) => ({
    issueIdx: index("issue_comments_issue_idx").on(table.issueId),
  }),
);
```

**Indexes:**
- `issue_comments_issue_idx` on `(issueId)`

**Note:** Separate table for comments (human-read-only, agent-write, likely to grow independently).

## 7. Goal Schema

**File:** `packages/db/src/schema/goals.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("Open"), // "Open" | "Achieved" | "Archived"
    verification: text("verification"), // Verification notes
    deadline: timestamp("deadline", { withTimezone: true }),
    departmentIds: jsonb("department_ids").$type<string[]>().notNull().default([]), // uuid[]
    issueIds: jsonb("issue_ids").$type<string[]>().notNull().default([]), // uuid[]
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("goals_company_status_idx").on(table.companyId, table.status),
  }),
);
```

**Indexes:**
- `goals_company_status_idx` on `(companyId, status)`

**Fields:**
- `departmentIds` — JSONB array of uuid strings
- `issueIds` — JSONB array of uuid strings

## 8. Project Schema

**File:** `packages/db/src/schema/projects.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("Open"), // "Open" | "InProgress" | "Done" | "Archived"
    projectDir: text("project_dir"), // Project directory path
    issueIds: jsonb("issue_ids").$type<string[]>().notNull().default([]), // uuid[]
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("projects_company_status_idx").on(table.companyId, table.status),
  }),
);
```

**Indexes:**
- `projects_company_status_idx` on `(companyId, status)`

**Fields:**
- `issueIds` — JSONB array of uuid strings

## 9. Approval Schema

**File:** `packages/db/src/schema/approvals.ts`

```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    title: text("title").notNull(),
    description: text("description"),
    requester: uuid("requester").references(() => agents.id), // Agent who requested
    status: text("status").notNull().default("Pending"), // "Pending" | "Approved" | "Rejected"
    rejectMessage: text("reject_message"), // Reason for rejection
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("approvals_company_status_idx").on(table.companyId, table.status),
    requesterStatusIdx: index("approvals_requester_status_idx").on(table.requester, table.status),
  }),
);
```

**Indexes:**
- `approvals_company_status_idx` on `(companyId, status)`
- `approvals_requester_status_idx` on `(requester, status)`

## 10. Index Design Summary

| Table | Index Name | Columns |
|-------|-----------|---------|
| companies | (PK only) | `id` |
| departments | `departments_company_id_idx` | `companyId` |
| agents | `agents_company_department_idx` | `companyId, departmentId` |
| agents | `agents_company_role_idx` | `companyId, role` |
| issues | `issues_company_status_idx` | `companyId, status` |
| issues | `issues_company_assignee_status_idx` | `companyId, assigneeAgentId, status` |
| issues | `issues_department_status_idx` | `departmentId, status` |
| issue_comments | `issue_comments_issue_idx` | `issueId` |
| goals | `goals_company_status_idx` | `companyId, status` |
| projects | `projects_company_status_idx` | `companyId, status` |
| approvals | `approvals_company_status_idx` | `companyId, status` |
| approvals | `approvals_requester_status_idx` | `requester, status` |

**Design Principles:**
- `companyId` always first in compound indexes (isolation boundary)
- Index naming: `#{table}_{columns}_idx`

## 11. Drizzle Config for Migrations

**File:** `packages/db/drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./dist/schema/*.js",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Note:** Schema path uses `.js` extension because Drizzle Kit compiles TypeScript before reading. Ensure `packages/db/package.json` has a `build` script that outputs to `dist/`.

## Implementation Tasks

### Task 1: Setup Package Structure
- [ ] Create `packages/db/` directory
- [ ] Initialize `package.json` with dependencies: `drizzle-orm`, `drizzle-kit`, `@types/pg`
- [ ] Create `tsconfig.json` (NodeNext module, ES2023 target)
- [ ] Create `src/index.ts` barrel export

### Task 2: Create Schema Files
- [ ] Create `src/schema/_common.ts` with timestamp helper
- [ ] Create `src/schema/companies.ts`
- [ ] Create `src/schema/departments.ts`
- [ ] Create `src/schema/agents.ts`
- [ ] Create `src/schema/issues.ts`
- [ ] Create `src/schema/issue_comments.ts`
- [ ] Create `src/schema/goals.ts`
- [ ] Create `src/schema/projects.ts`
- [ ] Create `src/schema/approvals.ts`
- [ ] Create `src/schema/index.ts` barrel export

### Task 3: Configure Drizzle
- [ ] Create `drizzle.config.ts`
- [ ] Add `build` script to `package.json` (tsc + tsx for schema compilation)
- [ ] Add `generate` script (drizzle-kit generate)
- [ ] Add `migrate` script (drizzle-kit migrate)

### Task 4: Verify
- [ ] Run `pnpm build` in packages/db
- [ ] Run `pnpm generate` to create initial migration
- [ ] Verify migration files in `src/migrations/`
- [ ] Run TypeScript type check

## Verification Criteria

1. All 8 entities compile without TypeScript errors
2. Drizzle migration generates successfully
3. Indexes correctly include `companyId` as first column
4. JSONB arrays for `subIssues`, `departmentIds`, `issueIds` are properly typed
5. `IssueComment` is a separate table from `Issue`
6. All schemas export from `packages/db/src/schema/index.ts`

## Dependencies

- **Phase 1 Complete:** CLI initialization, config management
- **Phase 3:** OpenClaw agent integration (agent.runtime.ts)
- **Phase 4:** REST API endpoints (server routes)
