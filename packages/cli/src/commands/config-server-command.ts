import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, isValidPort, type LeClawConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigServerCommand(program: Command): void {
  program
    .command("server")
    .description("Configure server settings")
    .option("--port <port>", "Server port", (value) => parseInt(value, 10))
    .action(async (opts) => {
      try {
        const config = loadConfig({ configPath: CONFIG_FILE });

        if (opts.port !== undefined) {
          if (!isValidPort(opts.port)) {
            console.error(
              JSON.stringify({
                success: false,
                error: `Invalid port: ${opts.port}`,
                code: "INVALID_PORT",
              })
            );
            process.exit(1);
          }
          config.server.port = opts.port;
        }

        await writeConfig({ configPath: CONFIG_FILE, config });

        console.log(
          JSON.stringify({
            success: true,
            server: { port: config.server.port },
          })
        );
        process.exit(0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "CONFIG_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
