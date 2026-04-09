// Agent API Keys table
// Stores API keys for agent authentication
// Format: sk-{32-hex-chars}
// The full key is returned once on creation and cannot be recovered.
// Only the hash (SHA256, first 16 chars) is stored for verification.

import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const agentApiKeys = pgTable(
  "agent_api_keys",
  {
    agentId: text("agent_id").primaryKey(), // One key per agent (unique)
    companyId: uuid("company_id").notNull().references(() => companies.id),
    name: text("name").notNull(), // Human-readable name for this API key
    key: text("key").notNull(), // The sk- prefixed API key (plaintext, for reference)
    keyHash: text("key_hash").notNull(), // SHA256 hash (first 16 chars) of the full API key
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }), // Track last API usage
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique index on agentId (enforced at DB level)
    agentIdIdx: uniqueIndex("agent_api_keys_agent_id_idx").on(table.agentId),
  }),
);

export type AgentApiKey = typeof agentApiKeys.$inferSelect;
export type NewAgentApiKey = typeof agentApiKeys.$inferInsert;
