// Approval entity - Human-agent interaction for sensitive operations

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
    requester: uuid("requester").references(() => agents.id), // Agent who initiated the approval request
    type: text("type").notNull().default("human_approve"), // "human_approve" | "agent_approve"
    approverId: uuid("approver_id").references(() => agents.id), // Actual approver (for agent_approve type)
    status: text("status").notNull().default("Pending"), // "Pending" | "Approved" | "Rejected"
    rejectMessage: text("reject_message"), // Reason for rejection (filled when rejected)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Compound index for querying approvals by company + status
    companyStatusIdx: index("approvals_company_status_idx").on(table.companyId, table.status),
    // Compound index for querying approvals by requester + status
    requesterStatusIdx: index("approvals_requester_status_idx").on(table.requester, table.status),
  }),
);

export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;
