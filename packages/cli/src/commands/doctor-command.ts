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

// ANSI color codes for terminal output
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const sym = {
  pass: "\u2705",
  fail: "\u274C",
  warn: "\u26A0",
  info: "\u2139",
};

interface DoctorCheck {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  details: string;
  suggestion?: string;
  fixAction?: () => Promise<void>;
  category: "OpenClaw" | "Database" | "Gateway";
}

interface GroupedChecks {
  category: "OpenClaw" | "Database" | "Gateway";
  checks: DoctorCheck[];
  overallStatus: "PASS" | "FAIL" | "WARN";
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

function getStatusIcon(status: "PASS" | "FAIL" | "WARN"): { symbol: string; color: string } {
  switch (status) {
    case "PASS":
      return { symbol: sym.pass, color: c.green };
    case "FAIL":
      return { symbol: sym.fail, color: c.red };
    case "WARN":
      return { symbol: sym.warn, color: c.yellow };
  }
}

function printHeader(passed: number, failed: number, warnings: number): void {
  console.log("");
  console.log(`${c.bold}${c.white}LeClaw Doctor${c.reset}`);
  console.log("");

  if (failed > 0) {
    console.log(`${c.red}${sym.fail} ${c.bold}${failed} failure${failed > 1 ? "s" : ""} found${c.reset}`);
  } else if (warnings > 0) {
    console.log(`${c.yellow}${sym.warn} ${c.bold}${warnings} warning${warnings > 1 ? "s" : ""} found${c.reset}`);
  } else {
    console.log(`${c.green}${sym.pass} ${c.bold}All checks passed${c.reset}`);
  }
  console.log("");
}

function printGroupedChecks(groups: GroupedChecks[]): void {
  for (const group of groups) {
    const { symbol, color } = getStatusIcon(group.overallStatus);
    const categoryLabel = group.category;

    // Category header with overall status
    console.log(`${color}${symbol} ${c.bold}${categoryLabel}:${c.reset}`);

    // Print each check in the group
    for (const check of group.checks) {
      const { symbol: checkSymbol, color: checkColor } = getStatusIcon(check.status);
      const checkName = check.name.replace(/_/g, " ");

      if (check.status === "PASS") {
        console.log(`  ${checkColor}${checkSymbol}${c.reset} ${checkName}`);
      } else {
        console.log(`  ${checkColor}${checkSymbol}${c.reset} ${checkName}`);
        console.log(`    ${c.dim}${check.details}${c.reset}`);

        if (check.suggestion) {
          console.log(`    ${c.cyan}Fix: ${check.suggestion}${c.reset}`);
        }
      }
    }
    console.log("");
  }
}

function printSuggestions(checks: DoctorCheck[]): void {
  const suggestions = checks
    .filter((check) => check.suggestion && check.status !== "PASS")
    .map((check) => ({ check, suggestion: check.suggestion! }));

  if (suggestions.length === 0) {
    return;
  }

  console.log(`${c.bold}Suggestions:${c.reset}`);
  for (const { check, suggestion } of suggestions) {
    const checkName = check.name.replace(/_/g, " ");
    console.log(`  ${c.yellow}${sym.warn}${c.reset} ${c.bold}${checkName}${c.reset}`);
    console.log(`    ${c.cyan}${suggestion}${c.reset}`);
  }
  console.log("");
}

function groupChecksByCategory(checks: DoctorCheck[]): GroupedChecks[] {
  const groups: Record<string, GroupedChecks> = {
    OpenClaw: { category: "OpenClaw", checks: [], overallStatus: "PASS" },
    Database: { category: "Database", checks: [], overallStatus: "PASS" },
    Gateway: { category: "Gateway", checks: [], overallStatus: "PASS" },
  };

  for (const check of checks) {
    groups[check.category].checks.push(check);
  }

  for (const group of Object.values(groups)) {
    if (group.checks.length === 0) {
      group.overallStatus = "WARN";
    } else if (group.checks.some((c) => c.status === "FAIL")) {
      group.overallStatus = "FAIL";
    } else if (group.checks.some((c) => c.status === "WARN")) {
      group.overallStatus = "WARN";
    } else {
      group.overallStatus = "PASS";
    }
  }

  return Object.values(groups);
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
      } catch {
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
        category: "OpenClaw",
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
        category: "OpenClaw",
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
            category: "OpenClaw",
          });
        } catch (err) {
          checks.push({
            name: "config_valid_json",
            status: "FAIL",
            details: `Config file contains invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
            suggestion: `Open ${CONFIG_FILE} and fix the JSON syntax error`,
            category: "OpenClaw",
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
            category: "OpenClaw",
          });
        } else {
          checks.push({
            name: "openclaw_dir",
            status: "WARN",
            details: "OpenClaw directory not configured in config file",
            category: "OpenClaw",
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
        category: "Database",
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
          category: "Database",
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
        category: "Database",
      });

      // 8. Database initialization status
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
          const dbPort = config?.database?.embeddedPort ?? DEFAULT_DB_PORT;
          console.log(`Removing database directory ${dbDataDir} and reinitializing...`);
          if (fs.existsSync(dbDataDir)) {
            fs.rmSync(dbDataDir, { recursive: true, force: true });
          }
          await initializeDb({ port: dbPort, dataDir: dbDataDir });
        },
        category: "Database",
      });

      // 9. Database port availability (use config.database.embeddedPort)
      // Note: If dbInitialized is true, we already know the port works because initializeDb
      // internally calls allocatePort which would fail if the port was truly in use.
      // We skip this check when dbInitialized is true to avoid false positives from TIME_WAIT.
      if (config && !dbInitialized) {
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
          category: "Database",
        });
      } else if (dbInitialized) {
        // Port was already proven available by initializeDb succeeding
        checks.push({
          name: "db_port_available",
          status: "PASS",
          details: `Port ${config?.database?.embeddedPort ?? DEFAULT_DB_PORT} is available (verified by database initialization)`,
          category: "Database",
        });
      }

      // 10. Gateway connectivity
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
            category: "Gateway",
          });
        } catch (err) {
          checks.push({
            name: "gateway_reachable",
            status: "FAIL",
            details: `Gateway unreachable: ${err instanceof Error ? err.message : String(err)}`,
            suggestion: "Verify the gateway URL in config and ensure the gateway service is accessible",
            category: "Gateway",
          });
        }
      } else {
        checks.push({
          name: "gateway_reachable",
          status: "WARN",
          details: "Gateway URL not configured in config file",
          category: "Gateway",
        });
      }

      const passed = checks.filter((c) => c.status === "PASS").length;
      const failed = checks.filter((c) => c.status === "FAIL").length;
      const warnings = checks.filter((c) => c.status === "WARN").length;
      const fixableFailures = checks.filter((c) => c.status === "FAIL" && c.fixAction);

      // Auto-fix if --fix flag is provided and there are fixable failures
      if (opts.fix && fixableFailures.length > 0) {
        console.log(`\n${c.yellow}Attempting to fix ${fixableFailures.length} issue(s)...${c.reset}\n`);
        for (const check of fixableFailures) {
          if (check.fixAction) {
            try {
              await check.fixAction();
              console.log(`${c.green}${sym.pass} Fixed: ${check.name}${c.reset}`);
            } catch (err) {
              console.error(`${c.red}${sym.fail} Failed to fix ${check.name}: ${err instanceof Error ? err.message : String(err)}${c.reset}`);
            }
          }
        }
        console.log(`\n${c.yellow}Re-running diagnostics after fix...${c.reset}\n`);
        console.log(
          JSON.stringify({
            success: false,
            message: "Fix attempted. Run 'leclaw doctor' again to verify.",
            summary: { passed, failed, warnings, total: checks.length },
          }, null, 2)
        );
        process.exit(1);
      }

      // Print formatted output
      const groups = groupChecksByCategory(checks);
      printHeader(passed, failed, warnings);
      printGroupedChecks(groups);
      printSuggestions(checks);

      // Footer with summary
      console.log(`${c.dim}Summary: ${passed} passed, ${failed} failed, ${warnings} warnings${c.reset}`);
      if (failed > 0 && fixableFailures.length > 0) {
        console.log(`${c.dim}Run 'leclaw doctor --fix' to attempt automatic repairs.${c.reset}`);
      }
      console.log("");

      // Exit codes: 0 = all passed, 1 = failures, 2 = warnings only
      process.exit(failed > 0 ? 1 : warnings > 0 ? 2 : 0);
    });
}
