import { existsSync, readFileSync, rmSync, mkdirSync, readdirSync, symlinkSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "os";
import net from "net";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { allocatePort } from "./port-allocator.js";

type EmbeddedPostgresInstance = {
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<boolean>;
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
  started: boolean; // true if WE started postgres, false if reusing existing
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

/**
 * Fix embedded-postgres library symlinks for pnpm compatibility.
 * The binaries use @loader_path which requires specific symlinks that pnpm doesn't create.
 * This function creates the necessary symlinks for the libraries to be found.
 */
async function fixLibrarySymlinks(): Promise<void> {
  try {
    // Find the embedded-postgres package location using import.meta.url
    const pgPackageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
    // Navigate to the actual embedded-postgres package in pnpm's node_modules structure
    const pnpmNodeModules = path.join(pgPackageDir, "node_modules/.pnpm");
    const entries = readdirSync(pnpmNodeModules);
    const embeddedPgEntry = entries.find((e) => e.includes("embedded-postgres@"));
    if (!embeddedPgEntry) return;

    const nativeLibDir = path.join(pnpmNodeModules, embeddedPgEntry, "node_modules/@embedded-postgres/darwin-arm64/native/lib");
    if (!existsSync(nativeLibDir)) return;

    // Map of library names to their base names (without version)
    const symlinkMappings: Record<string, string> = {
      "libpq.5.dylib": "libpq.dylib",
      "libssl.3.dylib": "libssl.dylib",
      "libcrypto.3.dylib": "libcrypto.dylib",
      "libcom_err.3.0.dylib": "libcom_err.dylib",
      "libedit.0.dylib": "libedit.dylib",
      "libintl.8.dylib": "libintl.dylib",
      "libuuid.1.1.dylib": "libuuid.dylib",
      "liblz4.1.10.0.dylib": "liblz4.1.dylib",
      "libzstd.1.5.7.dylib": "libzstd.1.dylib",
      "libkrb5.3.3.dylib": "libkrb5.dylib",
      "libk5crypto.3.1.dylib": "libk5crypto.3.dylib",
      "libkrb5support.1.1.dylib": "libkrb5support.1.dylib",
      "libicui18n.77.1.dylib": "libicui18n.dylib",
      "libicuuc.77.1.dylib": "libicuuc.77.dylib",
      "libicudata.77.1.dylib": "libicudata.77.dylib",
      "libz.1.3.1.dylib": "libz.dylib",
      "libxml2.16.dylib": "libxml2.dylib",
    };

    const files = readdirSync(nativeLibDir);
    for (const file of files) {
      if (file in symlinkMappings) {
        const targetName = symlinkMappings[file];
        const targetPath = path.join(nativeLibDir, targetName);

        // Only create symlink if it doesn't exist
        if (!existsSync(targetPath)) {
          symlinkSync(file, targetPath);
        }
      }
    }
  } catch {
    // Silently fail - the symlinks might already be correct or the package structure is different
  }
}

/**
 * Check if a database exists in PostgreSQL
 */
async function checkDatabaseExists(sql: ReturnType<typeof postgres>, dbName: string): Promise<boolean> {
  const result = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    ) AS exists
  `;
  return result[0]?.exists ?? false;
}

/**
 * Create a new database in PostgreSQL
 */
async function createDatabase(sql: ReturnType<typeof postgres>, dbName: string): Promise<void> {
  await sql`CREATE DATABASE ${sql.unsafe(dbName)}`;
}

export async function initializeDb(config?: DbConfig): Promise<DbConnection> {
  const dataDir = config?.dataDir ?? path.join(os.homedir(), ".leclaw", "db");
  const user = config?.user ?? "postgres";
  const password = config?.password ?? "postgres";
  const preferredPort = config?.port ?? 65432;

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

  // Check if we can connect to an existing postgres on the configured port
  if (runningPort) {
    const isResponsive = await checkPostgresResponsive(runningPort);
    if (isResponsive) {
      const connectionString = `postgres://${user}:${password}@127.0.0.1:${runningPort}/leclaw`;
      return {
        connectionString,
        source: `embedded-postgres@${runningPort}`,
        stop: async () => {},
        started: false,
      };
    }
    // Stale postmaster.pid - postgres not actually running, clean up
    if (existsSync(postmasterPidFile)) {
      rmSync(postmasterPidFile, { force: true });
    }
  }

  // Clean up stale postmaster.pid if exists (from previous crash/termination)
  if (existsSync(postmasterPidFile)) {
    rmSync(postmasterPidFile, { force: true });
  }

  // Fix library symlinks for pnpm compatibility (issue with @loader_path)
  await fixLibrarySymlinks();

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
      const errMsg = err instanceof Error ? err.message : String(err);
      // Check if initialization actually succeeded despite the error
      // (initdb sometimes returns non-zero exit code even on success)
      if (!isDatabaseInitialized(dataDir)) {
        throw new Error(
          `Failed to initialize database: ${errMsg}. Data directory: ${dataDir}. ` +
          "This may be caused by: (1) another postgres process using this data directory, " +
          "(2) insufficient permissions, (3) corrupted data directory. " +
          "Try deleting the data directory and running init again.",
        );
      }
      // Database was initialized despite the error - log a warning
      console.warn(
        `Database initialization raised an error but the database appears to be initialized: ${errMsg}. Continuing...`,
      );
    }
  }

  await instance.start();

  // Create the "leclaw" database if it doesn't exist
  const maintenanceConn = postgres(`postgres://${user}:${password}@127.0.0.1:${selectedPort}/postgres`, { max: 1 });
  const dbName = "leclaw";
  if (!(await checkDatabaseExists(maintenanceConn, dbName))) {
    await createDatabase(maintenanceConn, dbName);
  }
  await maintenanceConn.end();

  const connectionString = `postgres://${user}:${password}@127.0.0.1:${selectedPort}/leclaw`;

  return {
    connectionString,
    source: `embedded-postgres@${selectedPort}`,
    stop: async () => {
      await instance.stop();
    },
    started: true,
  };
}

/**
 * Check if a postgres process is actually responsive on the given port
 */
async function checkPostgresResponsive(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 2000);

    socket.connect(port, "127.0.0.1", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}
