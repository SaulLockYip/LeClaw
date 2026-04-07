import { existsSync, readFileSync, rmSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import os from "os";
import { allocatePort } from "./port-allocator.js";

type EmbeddedPostgresInstance = {
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
};

type EmbeddedPostgresCtor = new (opts: {
  databaseDir: string;
  user: string;
  password: string;
  port: number;
  persistent: boolean;
  initdbFlags?: string[];
  onLog?: (message: unknown) => void;
  onError?: (message: unknown) => void;
}) => EmbeddedPostgresInstance;

export interface DbConfig {
  dataDir?: string;
  user?: string;
  password?: string;
  port?: number;
}

export interface DbConnection {
  connectionString: string;
  source: string;
  stop: () => Promise<void>;
}

function readRunningPostmasterPid(postmasterPidFile: string): number | null {
  if (!existsSync(postmasterPidFile)) return null;
  try {
    const pid = Number(readFileSync(postmasterPidFile, "utf8").split("\n")[0]?.trim());
    if (!Number.isInteger(pid) || pid <= 0) return null;
    process.kill(pid, 0);
    return pid;
  } catch {
    return null;
  }
}

function readPidFilePort(postmasterPidFile: string): number | null {
  if (!existsSync(postmasterPidFile)) return null;
  try {
    const lines = readFileSync(postmasterPidFile, "utf8").split("\n");
    const port = Number(lines[3]?.trim());
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

function isDatabaseInitialized(dataDir: string): boolean {
  const pgVersionFile = path.resolve(dataDir, "PG_VERSION");
  const baseDir = path.resolve(dataDir, "base");

  // Must have PG_VERSION file and base directory (created by initdb)
  if (!existsSync(pgVersionFile) || !existsSync(baseDir)) {
    return false;
  }

  // Check that base directory is not empty (should contain database files)
  try {
    const baseFiles = readdirSync(baseDir);
    return baseFiles.length > 0;
  } catch {
    return false;
  }
}

async function loadEmbeddedPostgresCtor(): Promise<EmbeddedPostgresCtor> {
  try {
    const mod = await import("embedded-postgres");
    return mod.default as EmbeddedPostgresCtor;
  } catch {
    throw new Error(
      "Embedded PostgreSQL support requires dependency `embedded-postgres`. Reinstall dependencies and try again.",
    );
  }
}

export async function initializeDb(config?: DbConfig): Promise<DbConnection> {
  const dataDir = config?.dataDir ?? path.join(os.homedir(), ".leclaw", "db");
  const user = config?.user ?? "postgres";
  const password = config?.password ?? "postgres";
  const preferredPort = config?.port ?? 5432;

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const EmbeddedPostgres = await loadEmbeddedPostgresCtor();
  const selectedPort = await allocatePort(preferredPort);
  const postmasterPidFile = path.resolve(dataDir, "postmaster.pid");
  const runningPid = readRunningPostmasterPid(postmasterPidFile);
  const runningPort = readPidFilePort(postmasterPidFile);
  const logBuffer: string[] = [];

  // Reuse existing instance if running
  if (runningPid) {
    const port = runningPort ?? selectedPort;
    const connectionString = `postgres://${user}:${password}@127.0.0.1:${port}/leclaw`;
    return {
      connectionString,
      source: `embedded-postgres@${port}`,
      stop: async () => {},
    };
  }

  // Clean up stale postmaster.pid if exists (from previous crash/termination)
  if (existsSync(postmasterPidFile)) {
    rmSync(postmasterPidFile, { force: true });
  }

  // Start new instance
  const instance = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port: selectedPort,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-messages=C"],
    onLog: (msg) => logBuffer.push(String(msg)),
    onError: (msg) => logBuffer.push(String(msg)),
  });

  // Initialize database if not already done
  if (!isDatabaseInitialized(dataDir)) {
    try {
      await instance.initialise();
    } catch (err) {
      // Check if initialization actually succeeded despite the error
      // (initdb returns non-zero exit code when data directory already exists)
      if (!isDatabaseInitialized(dataDir)) {
        throw new Error(
          `Failed to initialize database: ${err}. Data directory: ${dataDir}`,
        );
      }
      // Database was initialized despite the error - log a warning
      console.warn(
        "Database initialization raised an error but the database appears to be initialized. Continuing...",
      );
    }
  }

  await instance.start();

  const connectionString = `postgres://${user}:${password}@127.0.0.1:${selectedPort}/leclaw`;

  return {
    connectionString,
    source: `embedded-postgres@${selectedPort}`,
    stop: async () => {
      await instance.stop();
    },
  };
}
