import { Command } from "commander";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { initializeDb } from "@leclaw/db";
import { runMigrations } from "@leclaw/db/migrate";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");
const PID_FILE = path.join(os.homedir(), ".leclaw", "server.pid");

export function registerStartCommand(program: Command): void {
  program
    .command("start")
    .description("Start LeClaw server")
    .option("--port <port>", "Server port")
    .option("--host <host>", "Server host", "0.0.0.0")
    .action(async (opts) => {
      try {
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

        // Start embedded postgres FIRST, then run migrations, then start server
        console.log("Starting embedded postgres...");
        const db = await initializeDb({
          dataDir: config.database?.embeddedDataDir,
          port: config.database?.embeddedPort,
        });
        console.log(`Embedded postgres started on ${db.source} (started=${db.started})`);

        // Run migrations before starting server
        process.env.DATABASE_URL = db.connectionString;
        await runMigrations();

        // Server process - need to go up 3 levels: dist/commands -> dist -> cli -> repo root
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

        // Spawn detached server process - it will run independently
        const serverProcess = spawn(process.execPath, [serverDistPath], {
          env: {
            ...process.env,
            PORT: port,
            HOST: host,
            DATABASE_URL: db.connectionString,
          },
          detached: true,
          stdio: ["ignore", "ignore", "ignore"],
        });

        // Write PID file
        fs.writeFileSync(PID_FILE, String(serverProcess.pid));

        // Unref so parent can exit immediately
        serverProcess.unref();

        console.log(JSON.stringify({ success: true, pid: serverProcess.pid, message: "Server started in background" }));
        process.exit(0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "START_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
