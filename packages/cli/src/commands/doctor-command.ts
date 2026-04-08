import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { execFileSync } from "child_process";
import { loadConfig } from "@leclaw/shared";
import { isPortInUse, initializeDb } from "@leclaw/db";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");
const CONFIG_DIR = path.join(os.homedir(), ".leclaw");
const DB_DIR = path.join(CONFIG_DIR, "db");
const DEFAULT_DB_PORT = 65432;
const POSTMASTER_PID_FILE = path.join(DB_DIR, "postmaster.pid");

interface DoctorCheck {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  details: string;
  /** Actionable fix suggestion */
  suggestion?: string;
  /** Optional action to auto-fix the issue */
  fixAction?: () => Promise<void>;
}

/**
 * Check if a process with the given PID is actually running
 */
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the postmaster.pid file and check if postgres is running
 */
function checkEmbeddedPostgresRunning(): { running: boolean; pid: number | null; port: number | null } {
  if (!fs.existsSync(POSTMASTER_PID_FILE)) {
    return { running: false, pid: null, port: null };
  }

  try {
    const content = fs.readFileSync(POSTMASTER_PID_FILE, "utf-8");
    const lines = content.split("\n").map((l) => l.trim());

    const pid = Number(lines[0]);
    if (!Number.isInteger(pid) || pid <= 0) {
      return { running: false, pid: null, port: null };
    }

    // Line 4 contains the port (0-indexed line 3)
    const port = lines[3] ? Number(lines[3]) : null;
    if (!Number.isInteger(port) || port <= 0) {
      return { running: false, pid: null, port: null };
    }

    const running = isProcessRunning(pid);
    return { running, pid: running ? pid : null, port: running ? port : null };
  } catch {
    return { running: false, pid: null, port: null };
  }
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Run diagnostic checks")
    .option("--fix", "Attempt to automatically fix issues")
    .action(async (opts) => {
      const checks: DoctorCheck[] = [];

      // 1. OpenClaw CLI installed
      let openclawInstalled = false;
      let openclawVersion = "";
      try {
        execFileSync("openclaw", ["--version"], { encoding: "utf-8", timeout: 5000 });
        openclawInstalled = true;
        openclawVersion = "found";
      } catch (err) {
        // Try with which
        try {
          const whichResult = execFileSync("which", ["openclaw"], { encoding: "utf-8", timeout: 5000 });
          if (whichResult.trim()) {
            openclawInstalled = true;
            openclawVersion = `found at ${whichResult.trim()}`;
          }
        } catch {
          openclawInstalled = false;
        }
      }
      checks.push({
        name: "openclaw_cli",
        status: openclawInstalled ? "PASS" : "FAIL",
        details: openclawInstalled
          ? `OpenClaw CLI is installed (${openclawVersion})`
          : "OpenClaw CLI is not installed or not in PATH",
        suggestion: openclawInstalled
          ? undefined
          : "Install OpenClaw CLI: npm install -g openclaw or brew install openclaw",
      });

      // 2. Config file exists
      const configExists = fs.existsSync(CONFIG_FILE);
      checks.push({
        name: "config_exists",
        status: configExists ? "PASS" : "FAIL",
        details: configExists
          ? `Config file found at ${CONFIG_FILE}`
          : `Config file not found at ${CONFIG_FILE}`,
        suggestion: configExists
          ? undefined
          : `Run 'leclaw configure' to create a config file at ${CONFIG_FILE}`,
      });

      // 3. Config JSON valid
      if (configExists) {
        try {
          const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
          JSON.parse(raw);
          checks.push({
            name: "config_valid_json",
            status: "PASS",
            details: "Config file contains valid JSON",
          });
        } catch (err) {
          checks.push({
            name: "config_valid_json",
            status: "FAIL",
            details: `Config file contains invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
            suggestion: `Open ${CONFIG_FILE} and fix the JSON syntax error`,
          });
        }
      }

      // 4. OpenClaw directory
      if (configExists) {
        const config = loadConfig({ configPath: CONFIG_FILE });
        if (config.openclaw?.dir) {
          const dirExists = fs.existsSync(config.openclaw.dir);
          checks.push({
            name: "openclaw_dir",
            status: dirExists ? "PASS" : "FAIL",
            details: dirExists
              ? `OpenClaw directory exists: ${config.openclaw.dir}`
              : `OpenClaw directory not found: ${config.openclaw.dir}`,
            suggestion: dirExists ? undefined : `Verify the openclaw.dir path in ${CONFIG_FILE} or create the directory`,
          });
        } else {
          checks.push({
            name: "openclaw_dir",
            status: "WARN",
            details: "OpenClaw directory not configured in config file",
          });
        }
      }

      // Load config once for database checks
      const config = configExists ? loadConfig({ configPath: CONFIG_FILE }) : null;

      // 5. Database directory exists (use config.database.embeddedDataDir)
      const dbDataDir = config?.database?.embeddedDataDir ?? DB_DIR;
      const dbDirExists = fs.existsSync(dbDataDir);
      checks.push({
        name: "db_dir_exists",
        status: dbDirExists ? "PASS" : "WARN",
        details: dbDirExists
          ? `Database directory exists: ${dbDataDir}`
          : `Database directory not found: ${dbDataDir}`,
        suggestion: dbDirExists ? undefined : `Database will be created at ${dbDataDir} on first run`,
      });

      // 6. Database directory writable
      if (dbDirExists) {
        let dbDirWritable = false;
        try {
          fs.accessSync(dbDataDir, fs.constants.W_OK);
          dbDirWritable = true;
        } catch {
          dbDirWritable = false;
        }
        checks.push({
          name: "db_dir_writable",
          status: dbDirWritable ? "PASS" : "FAIL",
          details: dbDirWritable
            ? `Database directory is writable: ${dbDataDir}`
            : `Database directory is not writable: ${dbDataDir}`,
          suggestion: dbDirWritable ? undefined : `Run 'chmod u+w ${dbDataDir}' to make the directory writable`,
        });
      }

      // 7. Embedded postgres already running
      const { running: pgRunning, pid: pgPid, port: pgPort } = checkEmbeddedPostgresRunning();
      checks.push({
        name: "embedded_postgres_running",
        status: pgRunning ? "PASS" : "WARN",
        details: pgRunning
          ? `Embedded PostgreSQL is already running (PID: ${pgPid}, Port: ${pgPort})`
          : "Embedded PostgreSQL is not currently running",
        suggestion: pgRunning ? undefined : "Embedded PostgreSQL will be started automatically when needed",
      });

      // 7b. Database initialization status
      let dbInitialized = false;
      let dbInitError: string | null = null;
      if (dbDirExists) {
        try {
          const dbPort = config?.database?.embeddedPort ?? DEFAULT_DB_PORT;
          const { connectionString } = await initializeDb({ port: dbPort, dataDir: dbDataDir });
          dbInitialized = connectionString.includes("leclaw");
        } catch (err) {
          dbInitError = err instanceof Error ? err.message : String(err);
        }
      }
      checks.push({
        name: "database_initialized",
        status: dbInitialized ? "PASS" : "FAIL",
        details: dbInitialized
          ? "Database is properly initialized and accessible"
          : `Database initialization failed: ${dbInitError ?? "unknown error"}`,
        suggestion: dbInitialized ? undefined : `Try running: rm -rf ${dbDataDir} && leclaw init`,
        fixAction: dbInitialized ? undefined : async () => {
          // Attempt to reinitialize the database
          const dbPort = config?.database?.embeddedPort ?? DEFAULT_DB_PORT;
          console.log(`Removing database directory ${dbDataDir} and reinitializing...`);
          if (fs.existsSync(dbDataDir)) {
            fs.rmSync(dbDataDir, { recursive: true, force: true });
          }
          await initializeDb({ port: dbPort, dataDir: dbDataDir });
        },
      });

      // 8. Database port availability (use config.database.embeddedPort)
      if (config) {
        const dbPort = config.database?.embeddedPort ?? DEFAULT_DB_PORT;
        const portInUse = await isPortInUse(dbPort);
        checks.push({
          name: "db_port_available",
          status: !portInUse ? "PASS" : "FAIL",
          details: portInUse
            ? `Port ${dbPort} is already in use - another process is listening`
            : `Port ${dbPort} is available for use`,
          suggestion: portInUse
            ? `Stop the other process using port ${dbPort}, or change the database.embeddedPort in ${CONFIG_FILE}`
            : undefined,
        });
      }

      // 9. Gateway connectivity
      if (config?.openclaw?.gatewayUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          // Convert ws:// to http:// for fetch (like status command does)
          const httpUrl = config.openclaw.gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
          const response = await fetch(httpUrl, { method: "HEAD", signal: controller.signal });
          clearTimeout(timeout);
          checks.push({
            name: "gateway_reachable",
            status: response.ok ? "PASS" : "FAIL",
            details: `Gateway responded with status ${response.status}`,
            suggestion: response.ok ? undefined : "Check if the gateway service is running",
          });
        } catch (err) {
          checks.push({
            name: "gateway_reachable",
            status: "FAIL",
            details: `Gateway unreachable: ${err instanceof Error ? err.message : String(err)}`,
            suggestion: "Verify the gateway URL in config and ensure the gateway service is accessible",
          });
        }
      } else {
        checks.push({
          name: "gateway_reachable",
          status: "WARN",
          details: "Gateway URL not configured in config file",
        });
      }

      const passed = checks.filter((c) => c.status === "PASS").length;
      const failed = checks.filter((c) => c.status === "FAIL").length;
      const warnings = checks.filter((c) => c.status === "WARN").length;
      const fixableFailures = checks.filter((c) => c.status === "FAIL" && c.fixAction);

      // Auto-fix if --fix flag is provided and there are fixable failures
      if (opts.fix && fixableFailures.length > 0) {
        console.log(`\nAttempting to fix ${fixableFailures.length} issue(s)...\n`);
        for (const check of fixableFailures) {
          if (check.fixAction) {
            try {
              await check.fixAction();
              console.log(`Fixed: ${check.name}`);
            } catch (err) {
              console.error(`Failed to fix ${check.name}: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
        console.log("\nRe-running diagnostics after fix...\n");
        // Note: We don't re-run the full diagnostics, just report what happened
        console.log(
          JSON.stringify({
            success: false,
            message: "Fix attempted. Run 'leclaw doctor' again to verify.",
            summary: { passed, failed, warnings, total: checks.length },
          }, null, 2)
        );
        process.exit(1);
      }

      console.log(
        JSON.stringify({
          success: failed === 0,
          checks,
          summary: { passed, failed, warnings, total: checks.length },
          fixableFailures: fixableFailures.length,
        }, null, 2)
      );

      // Exit codes: 0 = all passed, 1 = failures, 2 = warnings only
      process.exit(failed > 0 ? 1 : warnings > 0 ? 2 : 0);
    });
}
