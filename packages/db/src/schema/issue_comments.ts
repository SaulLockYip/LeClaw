// IssueComment entity - Separate table for issue comments (grows independently)

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
    // Index for fetching comments by issue (ordered by timestamp)
    issueIdx: index("issue_comments_issue_idx").on(table.issueId),
  }),
);

export type IssueComment = typeof issueComments.$inferSelect;
export type NewIssueComment = typeof issueComments.$inferInsert;
