import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { execSync } from "child_process";
import { fork } from "child_process";
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
    return false;
  }
}

async function stopServer(): Promise<boolean> {
  let stopped = false;

  // Try PID file first
  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10);
      if (!isNaN(pid) && pid > 0) {
        stopped = killProcessByPid(pid);
      }
    } catch {
      // Ignore
    }
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      // Ignore cleanup errors
    }
  }

  // Fallback to port-based kill
  if (!stopped) {
    const configPath = path.join(os.homedir(), ".leclaw", "config.json");
    if (fs.existsSync(configPath)) {
      const config = loadConfig({ configPath });
      const port = getServerPort(config);
      stopped = killProcessOnPort(port);
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
      }
    } catch {
      // Postgres may not be running
    }
  }

  return stopped;
}

export function registerRestartCommand(program: Command): void {
  program
    .command("restart")
    .description("Restart LeClaw server")
    .option("--port <port>", "Server port")
    .option("--host <host>", "Server host", "0.0.0.0")
    .action(async (opts) => {
      try {
        const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

        // First stop the server
        console.log("Stopping server...");
        await stopServer();

        // Wait for clean shutdown
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!fs.existsSync(CONFIG_FILE)) {
          console.error(
            JSON.stringify({
              success: false,
              error: "Config not found. Run 'leclaw init' first.",
              code: "NOT_INITIALIZED",
            })
          );
          process.exit(1);
        }

        const config = loadConfig({ configPath: CONFIG_FILE });
        const port = opts.port ?? String(config.server?.port ?? 4396);
        const host = opts.host;

        // Start embedded postgres
        console.log("Starting embedded postgres...");
        const db = await initializeDb({
          dataDir: config.database?.embeddedDataDir,
          port: config.database?.embeddedPort,
        });
        console.log(`Embedded postgres started on ${db.source} (started=${db.started})`);

        // Fork server process
        const serverDistPath = path.resolve(import.meta.dirname, "..", "..", "..", "server", "dist", "index.js");

        if (!fs.existsSync(serverDistPath)) {
          console.error(
            JSON.stringify({
              success: false,
              error: `Server not found at ${serverDistPath}. Run 'pnpm build' first.`,
              code: "SERVER_NOT_BUILT",
            })
          );
          process.exit(1);
        }

        // Write PID file
        const serverProcess = fork(serverDistPath, {
          env: {
            ...process.env,
            PORT: port,
            HOST: host,
            DATABASE_URL: db.connectionString,
          },
          stdio: ["inherit", "pipe", "pipe", "ipc"],
        });

        // Write PID to file
        fs.writeFileSync(PID_FILE, String(serverProcess.pid));

        serverProcess.stdout?.on("data", (data) => process.stdout.write(data));
        serverProcess.stderr?.on("data", (data) => process.stderr.write(data));

        let shuttingDown = false;
        const shutdown = async () => {
          if (shuttingDown) return;
          shuttingDown = true;
          serverProcess.kill("SIGINT");
          if (db.started) {
            await db.stop();
          }
          try {
            fs.unlinkSync(PID_FILE);
          } catch {
            // Ignore cleanup errors
          }
        };

        serverProcess.on("exit", async (code) => {
          if (db.started) {
            await db.stop();
          }
          try {
            fs.unlinkSync(PID_FILE);
          } catch {
            // Ignore cleanup errors
          }
          process.exit(code ?? 1);
        });

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        console.log(JSON.stringify({ success: true, message: `Server restarted on ${host}:${port}` }));
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "RESTART_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
