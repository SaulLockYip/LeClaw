import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { execSync } from "child_process";
import { loadConfig, type LeClawConfig } from "@leclaw/shared";
import { initializeDb } from "@leclaw/db";

const PID_FILE = path.join(os.homedir(), ".leclaw", "server.pid");

function getServerPort(config: LeClawConfig): number {
  return config.server?.port ?? 4396;
}

function killProcessByPid(pid: number): boolean {
  try {
    process.kill(pid, "SIGINT");
    return true;
  } catch {
    return false;
  }
}

function killProcessOnPort(port: number): boolean {
  try {
    // Use lsof to find process on the port (macOS/Linux compatible)
    const output = execSync(`lsof -ti:${port}`, { encoding: "utf-8" }).trim();
    if (!output) return false;

    const pids = output.split("\n").filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(parseInt(pid, 10), "SIGINT");
      } catch {
        // Process may have already exited
      }
    }
    return true;
  } catch {
    // No process found on port
    return false;
  }
}

export function registerStopCommand(program: Command): void {
  program
    .command("stop")
    .description("Stop LeClaw server")
    .action(async () => {
      try {
        let stopped = false;
        let usedFallback = false;

        // Try to read PID file first
        if (fs.existsSync(PID_FILE)) {
          try {
            const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10);
            if (!isNaN(pid) && pid > 0) {
              stopped = killProcessByPid(pid);
              if (stopped) {
                console.log(`Stopped server process (PID: ${pid})`);
              }
            }
          } catch {
            // PID file read failed, will try fallback
          }
          // Clean up PID file regardless
          try {
            fs.unlinkSync(PID_FILE);
          } catch {
            // Ignore cleanup errors
          }
        }

        // If PID file approach didn't work, try port-based fallback
        if (!stopped) {
          const configPath = path.join(os.homedir(), ".leclaw", "config.json");
          if (fs.existsSync(configPath)) {
            const config = loadConfig({ configPath });
            const port = getServerPort(config);
            stopped = killProcessOnPort(port);
            if (stopped) {
              console.log(`Stopped server process on port ${port}`);
              usedFallback = true;
            }
          }
        }

        // Stop embedded postgres
        const dbConfigPath = path.join(os.homedir(), ".leclaw", "config.json");
        if (fs.existsSync(dbConfigPath)) {
          const config = loadConfig({ configPath: dbConfigPath });
          try {
            const db = await initializeDb({
              dataDir: config.database?.embeddedDataDir,
              port: config.database?.embeddedPort,
            });
            if (db.started) {
              await db.stop();
              console.log("Stopped embedded postgres");
            }
          } catch {
            // Postgres may not be running
          }
        }

        if (stopped || usedFallback) {
          console.log(JSON.stringify({ success: true, message: "Server stopped" }));
          process.exit(0);
        } else {
          console.log(JSON.stringify({ success: false, message: "Server was not running" }));
          process.exit(0);
        }
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "STOP_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
