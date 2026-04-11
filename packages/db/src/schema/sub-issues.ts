// Sub-Issue entity - Child issue belonging to a parent Issue

import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { issues } from "./issues.js";
import { agents } from "./agents.js";

export const subIssues = pgTable(
  "sub_issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentIssueId: uuid("parent_issue_id").notNull().references(() => issues.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("Open"), // "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled"
    assigneeAgentId: uuid("assignee_agent_id").notNull().references(() => agents.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for querying sub-issues by parent
    parentIdx: index("sub_issues_parent_idx").on(table.parentIssueId),
    // Index for querying sub-issues by assignee
    assigneeIdx: index("sub_issues_assignee_idx").on(table.assigneeAgentId),
  }),
);