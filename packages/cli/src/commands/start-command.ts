import { Command } from "commander";
import path from "path";
import os from "os";
import { fork } from "child_process";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { initializeDb } from "@leclaw/db";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

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

        // Fork server process - need to go up 3 levels: dist/commands -> dist -> cli -> repo root
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

        const serverProcess = fork(serverDistPath, {
          env: {
            ...process.env,
            PORT: port,
            HOST: host,
            DATABASE_URL: db.connectionString,
          },
          stdio: ["inherit", "pipe", "pipe", "ipc"],
        });

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
        };

        serverProcess.on("exit", async (code) => {
          if (db.started) {
            await db.stop();
          }
          process.exit(code ?? 1);
        });

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
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
