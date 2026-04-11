import { inspectMigrations, applyPendingMigrations } from "./client.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { initializeDb, type DbConnection } from "./index.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

interface DatabaseConfig {
  connectionString?: string;
  embeddedDataDir?: string;
  embeddedPort?: number;
}

interface Config {
  database?: DatabaseConfig;
}

function loadConfig(configPath: string): Config {
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function getDatabaseUrl(): Promise<string | null> {
  // First check if DATABASE_URL is already set
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Try to load config and initialize embedded postgres
  try {
    const config = loadConfig(CONFIG_FILE);

    if (config.database?.connectionString) {
      // Use connection string from config if available
      return config.database.connectionString;
    }

    // Initialize embedded postgres using config settings
    if (config.database?.embeddedDataDir || config.database?.embeddedPort) {
      const db = await initializeDb({
        dataDir: config.database.embeddedDataDir,
        port: config.database.embeddedPort,
      });
      return db.connectionString;
    }
  } catch {
    // Config file doesn't exist or embedded postgres initialization failed
  }

  return null;
}

export async function runMigrations(db?: DbConnection): Promise<void> {
  let databaseUrl: string | null;

  // If db connection is provided (e.g., from start-command), use it directly
  if (db) {
    databaseUrl = db.connectionString;
  } else {
    databaseUrl = await getDatabaseUrl();
  }

  if (!databaseUrl) {
    console.log("No DATABASE_URL configured and no embedded postgres config found, skipping migrations");
    return;
  }

  // Set DATABASE_URL for any downstream code that might need it
  process.env.DATABASE_URL = databaseUrl;

  console.log(`Inspecting migrations for: ${databaseUrl.split("@")[1] ?? "localhost"}`);

  const before = await inspectMigrations(databaseUrl);
  if (before.status === "upToDate") {
    console.log("Database is up to date");
    return;
  }

  console.log(`Applying ${before.pendingMigrations.length} pending migration(s)...`);
  await applyPendingMigrations(databaseUrl);

  const after = await inspectMigrations(databaseUrl);
  if (after.status !== "upToDate") {
    throw new Error(`Migrations incomplete: ${after.pendingMigrations.join(", ")}`);
  }
  console.log("Migrations complete");
}

// CLI runner
async function main(): Promise<void> {
  try {
    await runMigrations();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

await main();
