// Agent Invite schema - Invitation flow for agent onboarding
// Format: 6-char alphanumeric (A-Z, 0-9) - one-time use invite keys

import { pgTable, uuid, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { departments } from "./departments.js";

export const agentInvites = pgTable(
  "agent_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inviteKey: text("invite_key").notNull(), // 6-char alphanumeric
    companyId: uuid("company_id").notNull().references(() => companies.id),
    departmentId: uuid("department_id").references(() => departments.id), // Optional for CEO
    name: text("name").notNull(), // Agent name
    role: text("role").notNull(), // "CEO" | "Manager" | "Staff"
    title: text("title").notNull(), // Job title
    status: text("status").notNull().default("pending"), // "pending" | "accepted" | "expired"
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 30 min after creation
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique index on inviteKey for fast lookup
    inviteKeyIdx: uniqueIndex("agent_invites_invite_key_idx").on(table.inviteKey),
    // Index for company queries
    companyIdx: index("agent_invites_company_idx").on(table.companyId),
    // Index for status + expiry cleanup queries
    statusExpiresIdx: index("agent_invites_status_expires_idx").on(table.status, table.expiresAt),
  }),
);

export type AgentInvite = typeof agentInvites.$inferSelect;
export type NewAgentInvite = typeof agentInvites.$inferInsert;
