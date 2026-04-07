// Audit Log entity - Records every CLI write operation for traceability

import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id").notNull(),           // Extracted from API key
    command: text("command").notNull(),            // e.g., "issue create", "goal update"
    args: jsonb("args").$type<Record<string, unknown>>().notNull().default({}),
    result: text("result").notNull(),              // "success" | "failure"
    output: text("output"),                        // Command output or error message
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for querying audit logs by agent + timestamp
    agentTimestampIdx: index("audit_logs_agent_timestamp_idx").on(table.agentId, table.createdAt),
    // Index for querying audit logs by command + timestamp
    commandTimestampIdx: index("audit_logs_command_timestamp_idx").on(table.command, table.createdAt),
  }),
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
