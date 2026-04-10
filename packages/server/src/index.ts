import { createApp } from "./app.js";
import { configureDatabase } from "@leclaw/db/client";
import { runMigrations } from "@leclaw/db/migrate";
import { initializeDb } from "@leclaw/db/embedded-postgres";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_FILE = join(homedir(), ".leclaw", "config.json");
const PORT = parseInt(process.env.PORT ?? "4396", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

interface ServerConfig {
  database?: {
    embeddedDataDir?: string;
    embeddedPort?: number;
  };
}

function loadConfig(): ServerConfig | null {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content) as ServerConfig;
    }
  } catch {
    // Ignore config read errors
  }
  return null;
}

let dbConnection: { connectionString: string; stop: () => Promise<void> } | null = null;

// Configure database connection
if (DATABASE_URL) {
  configureDatabase({ connectionString: DATABASE_URL });
} else {
  // Initialize embedded postgres when DATABASE_URL is not provided
  try {
    const config = loadConfig();
    dbConnection = await initializeDb({
      dataDir: config?.database?.embeddedDataDir,
      port: config?.database?.embeddedPort,
    });
    configureDatabase({ connectionString: dbConnection.connectionString });
  } catch (err) {
    console.error("Failed to initialize embedded postgres:", err);
  }
}

const app = createApp();

// Start server and run migrations only at runtime, not during build
app.listen(PORT, HOST, async () => {
  // Run migrations when server starts (not during tsc --build)
  if (DATABASE_URL) {
    await runMigrations();
  }

  console.log(
    JSON.stringify({
      success: true,
      server: { port: PORT, host: HOST },
      database: DATABASE_URL ? "configured" : (dbConnection ? `embedded-postgres@${dbConnection.connectionString.split("@")[1]?.split("/")[0] || "unknown"}` : "not configured"),
    })
  );
});

// Graceful shutdown to stop embedded postgres
process.on("SIGINT", async () => {
  if (dbConnection) {
    await dbConnection.stop();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (dbConnection) {
    await dbConnection.stop();
  }
  process.exit(0);
});
