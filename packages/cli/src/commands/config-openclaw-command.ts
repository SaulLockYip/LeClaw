import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, type LeClawConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigOpenClawCommand(program: Command): void {
  program
    .command("openclaw")
    .description("Configure OpenClaw settings")
    .option("--dir <path>", "OpenClaw directory path")
    .option("--gateway-url <url>", "Gateway WebSocket URL")
    .option("--gateway-token <token>", "Gateway API token")
    .option("--gateway-password <password>", "Gateway password (optional)")
    .action(async (opts) => {
      try {
        const config = loadConfig({ configPath: CONFIG_FILE });

        if (opts.dir !== undefined) config.openclaw.dir = opts.dir;
        if (opts.gatewayUrl !== undefined) config.openclaw.gatewayUrl = opts.gatewayUrl;
        if (opts.gatewayToken !== undefined) config.openclaw.gatewayToken = opts.gatewayToken;
        if (opts.gatewayPassword !== undefined) config.openclaw.gatewayPassword = opts.gatewayPassword;

        await writeConfig({ configPath: CONFIG_FILE, config });

        console.log(
          JSON.stringify({
            success: true,
            openclaw: {
              dir: config.openclaw.dir,
              gatewayUrl: config.openclaw.gatewayUrl,
              gatewayToken: config.openclaw.gatewayToken ? "***" : undefined,
            },
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
