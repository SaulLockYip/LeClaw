// Singleton db instance for synchronous use
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { agents, agentApiKeys, approvals, companies, departments, goals, issues, issueComments, projects, auditLogs, agentInvites } from "./schema/index.js";
import { applyPendingMigrations } from "./client.js";

// Use environment or defaults
const connectionString = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:65432/leclaw";

// Create singleton instances
const sql = postgres(connectionString);

// Run migrations on initialization
applyPendingMigrations(connectionString).catch((err) => {
  console.error("Failed to run migrations on startup:", err);
});

// Export db with explicit type annotation including all tables
export const db = drizzle(sql, { schema: { agents, agentApiKeys, approvals, companies, departments, goals, issues, issueComments, projects, auditLogs, agentInvites } }) as PostgresJsDatabase<{
  agents: typeof agents;
  agentApiKeys: typeof agentApiKeys;
  approvals: typeof approvals;
  companies: typeof companies;
  departments: typeof departments;
  goals: typeof goals;
  issues: typeof issues;
  issueComments: typeof issueComments;
  projects: typeof projects;
  auditLogs: typeof auditLogs;
  agentInvites: typeof agentInvites;
}>;
