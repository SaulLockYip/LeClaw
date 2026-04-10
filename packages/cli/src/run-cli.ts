import { buildProgram } from "./program/build-program.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface LeClawConfig {
  database?: {
    port?: number;
    path?: string;
  };
  server?: {
    port?: number;
  };
}

const CONFIG_FILE = join(homedir(), ".leclaw", "config.json");

function loadConfig(): LeClawConfig | null {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content) as LeClawConfig;
    }
  } catch {
    // Ignore config read errors
  }
  return null;
}

function applyConfigToEnv(): void {
  const config = loadConfig();
  if (!config) return;

  // Set database port from config
  if (config.database?.port) {
    process.env.DB_PORT = String(config.database.port);
  }
  if (config.database?.path) {
    process.env.DB_PATH = config.database.path;
  }
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  // Load config and set env vars before any db operations
  applyConfigToEnv();

  const program = buildProgram();
  await program.parseAsync(argv);
}
