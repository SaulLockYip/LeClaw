// Lazy db instance - only initialized when first accessed
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { agents, agentApiKeys, approvals, companies, departments, goals, issues, issueComments, projects, auditLogs, agentInvites, subIssues } from "./schema/index.js";
import { getDb } from "./client.js";

// Re-export schema tables for convenience
export { agents, agentApiKeys, approvals, companies, departments, goals, issues, issueComments, projects, auditLogs, agentInvites, subIssues };

// Type for the database with all our tables
export type LeClawDb = PostgresJsDatabase<{
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
  subIssues: typeof subIssues;
}>;

// Lazy db - a thenable that can be awaited OR used directly for method calls
// This defers the actual connection until configureDatabase() has been called
// and DB_PORT/DATABASE_URL env vars have been read
const dbPromise = getDb() as Promise<LeClawDb>;

// Create a thenable that also forwards method calls to the resolved db
// This allows both: await db  AND  db.select()  patterns to work
export const db: LeClawDb & Promise<LeClawDb> = new Proxy({} as LeClawDb & Promise<LeClawDb>, {
  get(_target, prop) {
    // Forward 'then' to the promise for await compatibility
    if (prop === "then") {
      return dbPromise.then.bind(dbPromise);
    }
    // Forward 'select', 'insert', 'update', etc. to the resolved db
    return async (...args: unknown[]) => {
      const resolvedDb = await dbPromise;
      const method = (resolvedDb as unknown as Record<string, unknown>)[prop as string];
      if (typeof method === "function") {
        return (method as (...args: unknown[]) => unknown).call(resolvedDb, ...args);
      }
      return method;
    };
  },
});
