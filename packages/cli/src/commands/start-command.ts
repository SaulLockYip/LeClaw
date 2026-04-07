import { Command } from "commander";
import path from "path";
import os from "os";
import { fork } from "child_process";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

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

        // Fork server process
        const serverDistPath = path.resolve(import.meta.dirname, "..", "..", "server", "dist", "index.js");

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
            DATABASE_URL: config.database?.connectionString ?? "",
          },
          stdio: ["inherit", "pipe", "pipe", "ipc"],
        });

        serverProcess.stdout?.on("data", (data) => process.stdout.write(data));
        serverProcess.stderr?.on("data", (data) => process.stderr.write(data));

        serverProcess.on("exit", (code) => process.exit(code ?? 1));

        process.on("SIGINT", () => {
          serverProcess.kill("SIGINT");
        });
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
