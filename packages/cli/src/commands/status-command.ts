import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("View connection status to OpenClaw and Gateway")
    .action(async () => {
      try {
        const result: Record<string, unknown> = {
          config: null,
          openclaw: { configured: false, dir: "", exists: false, accessible: false },
          gateway: { configured: false, url: "", reachable: null },
          database: { configured: false, connectionString: "" },
          overall: "ok",
        };

        if (!fs.existsSync(CONFIG_FILE)) {
          result.overall = "error";
          console.log(JSON.stringify({ success: false, ...result }));
          process.exit(1);
        }

        const config = loadConfig({ configPath: CONFIG_FILE });
        result.config = config;

        // Check OpenClaw directory
        if (config.openclaw?.dir) {
          result.openclaw = { configured: true, dir: config.openclaw.dir, exists: false, accessible: false };
          result.openclaw = { ...result.openclaw as Record<string, unknown>, exists: fs.existsSync(config.openclaw.dir) };
          if ((result.openclaw as Record<string, unknown>).exists) {
            try {
              fs.accessSync(config.openclaw.dir, fs.constants.R_OK);
              result.openclaw = { ...result.openclaw as Record<string, unknown>, accessible: true };
            } catch {
              result.openclaw = { ...result.openclaw as Record<string, unknown>, accessible: false };
            }
          }
        }

        // Check Gateway connectivity
        if (config.openclaw?.gatewayUrl) {
          result.gateway = { configured: true, url: config.openclaw.gatewayUrl, reachable: null };
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(config.openclaw.gatewayUrl, {
              method: "HEAD",
              signal: controller.signal,
            });
            clearTimeout(timeout);
            result.gateway = { ...result.gateway as Record<string, unknown>, reachable: response.ok };
          } catch {
            result.gateway = { ...result.gateway as Record<string, unknown>, reachable: false };
          }
        }

        // Check Database
        if (config.database?.connectionString) {
          result.database = {
            configured: true,
            connectionString: config.database.connectionString.replace(/:[^:@]+@/, ":***@"),
          };
        }

        // Determine overall status
        if (!(result.database as Record<string, unknown>).configured) {
          result.overall = "error";
        } else if (!(result.openclaw as Record<string, unknown>).configured || !(result.gateway as Record<string, unknown>).configured) {
          result.overall = "warning";
        } else if (!(result.openclaw as Record<string, unknown>).exists || (result.gateway as Record<string, unknown>).reachable === false) {
          result.overall = "warning";
        }

        console.log(JSON.stringify({ success: true, ...result }));
        process.exit(result.overall === "error" ? 1 : 0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "STATUS_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
