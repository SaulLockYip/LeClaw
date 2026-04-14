// Agent entity - Maps OpenClaw agents to LeClaw roles (CEO/Manager/Staff)

import { pgTable, uuid, text, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies.js";
import { departments } from "./departments.js";

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    departmentId: uuid("department_id").references(() => departments.id), // CEO agents have no department
    name: text("name").notNull(),
    title: text("title"), // Optional title/position for the agent
    role: text("role").notNull().default("Staff"), // "CEO" | "Manager" | "Staff"
    openClawAgentId: text("openclaw_agent_id"), // External OpenClaw agent identifier
    openClawAgentWorkspace: text("openclaw_agent_workspace"), // OpenClaw workspace path
    openClawAgentDir: text("openclaw_agent_dir"), // OpenClaw agent working directory
    agentApiKey: text("agent_api_key"), // Plaintext API key for agent authentication
    // Agent status tracking fields (synced from OpenClaw local files)
    status: text("status").notNull().default("unknown"), // "online" | "busy" | "offline" | "unknown"
    statusLastUpdated: timestamp("status_last_updated", { withTimezone: true }),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
    heartbeatEnabled: boolean("heartbeat_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Compound index for querying agents by company + department
    companyDepartmentIdx: index("agents_company_department_idx").on(table.companyId, table.departmentId),
    // Compound index for querying agents by company + role (e.g., find all CEOs in a company)
    companyRoleIdx: index("agents_company_role_idx").on(table.companyId, table.role),
    // Partial index for fast lookup by agent API key - only index non-null values
    // Drizzle supports partial indexes via .where() clause (PostgreSQL feature)
    agentApiKeyIdx: index("agents_agent_api_key_idx").on(table.agentApiKey).where(sql`${table.agentApiKey} IS NOT NULL`),
    // Index for status-based queries
    statusIdx: index("agents_status_idx").on(table.status),
  }),
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
