// Agent entity - Maps OpenClaw agents to LeClaw roles (CEO/Manager/Staff)

import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { departments } from "./departments.js";

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    departmentId: uuid("department_id").references(() => departments.id), // CEO agents have no department
    name: text("name").notNull(),
    role: text("role").notNull().default("Staff"), // "CEO" | "Manager" | "Staff"
    openClawAgentId: text("openclaw_agent_id"), // External OpenClaw agent identifier
    openClawAgentWorkspace: text("openclaw_agent_workspace"), // OpenClaw workspace path
    openClawAgentDir: text("openclaw_agent_dir"), // OpenClaw agent working directory
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Compound index for querying agents by company + department
    companyDepartmentIdx: index("agents_company_department_idx").on(table.companyId, table.departmentId),
    // Compound index for querying agents by company + role (e.g., find all CEOs in a company)
    companyRoleIdx: index("agents_company_role_idx").on(table.companyId, table.role),
  }),
);
