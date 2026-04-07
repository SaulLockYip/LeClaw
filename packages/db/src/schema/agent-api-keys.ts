// Agent API Keys table
// Stores bcrypt hashes of API keys for agent authentication

import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const agentApiKeys = pgTable(
  "agent_api_keys",
  {
    agentId: text("agent_id").primaryKey(), // One key per agent (unique)
    keyHash: text("key_hash").notNull(), // bcrypt hash of the full API key
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique index on agentId (enforced at DB level)
    agentIdIdx: uniqueIndex("agent_api_keys_agent_id_idx").on(table.agentId),
  }),
);

export type AgentApiKey = typeof agentApiKeys.$inferSelect;
export type NewAgentApiKey = typeof agentApiKeys.$inferInsert;
