import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

let dbPromise: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlPromise: ReturnType<typeof postgres> | null = null;

export interface DbConnectionConfig {
  connectionString?: string;
}

let connectionConfig: DbConnectionConfig = {};

export function configureDatabase(config: DbConnectionConfig): void {
  connectionConfig = config;
}

async function getConnectionString(): Promise<string> {
  // Check environment variable first
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Check configured connection
  if (connectionConfig.connectionString) {
    return connectionConfig.connectionString;
  }

  // Fallback to embedded postgres defaults
  const user = process.env.DB_USER ?? "postgres";
  const password = process.env.DB_PASSWORD ?? "postgres";
  const host = process.env.DB_HOST ?? "127.0.0.1";
  const port = process.env.DB_PORT ?? "5432";
  return `postgres://${user}:${password}@${host}:${port}/leclaw`;
}

export async function getDb(): Promise<ReturnType<typeof drizzle<typeof schema>>> {
  if (dbPromise) {
    return dbPromise;
  }

  const connectionString = await getConnectionString();
  sqlPromise = postgres(connectionString);
  dbPromise = drizzle(sqlPromise, { schema });
  return dbPromise;
}

export async function closeDb(): Promise<void> {
  if (sqlPromise) {
    await sqlPromise.end();
    sqlPromise = null;
    dbPromise = null;
  }
}