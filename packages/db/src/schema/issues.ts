// Issue entity - Core work unit in LeClaw, belongs to a Department

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
    subIssues: jsonb("sub_issues").$type<string[]>().notNull().default([]), // JSONB array of Issue UUIDs
    report: text("report"), // Markdown text content (agent-defined format)
    projectId: uuid("project_id").references(() => projects.id),
    goalId: uuid("goal_id").references(() => goals.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Compound index for querying issues by company + status
    companyStatusIdx: index("issues_company_status_idx").on(table.companyId, table.status),
    // Compound index for querying issues by company + assignee + status
    companyAssigneeStatusIdx: index("issues_company_assignee_status_idx").on(
      table.companyId,
      table.assigneeAgentId,
      table.status,
    ),
    // Compound index for querying issues by department + status
    departmentStatusIdx: index("issues_department_status_idx").on(table.departmentId, table.status),
  }),
);
