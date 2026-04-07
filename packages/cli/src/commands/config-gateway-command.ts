import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, type LeClawConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigGatewayCommand(program: Command): void {
  const gateway = program
    .command("gateway")
    .description("Configure Gateway settings (alternative to 'config openclaw')")
    .option("--url <url>", "Gateway WebSocket URL")
    .option("--token <token>", "Gateway API token")
    .option("--password <password>", "Gateway password (optional)");

  gateway.action(async (opts) => {
    try {
      const config = loadConfig({ configPath: CONFIG_FILE });

      if (opts.url !== undefined) config.openclaw.gatewayUrl = opts.url;
      if (opts.token !== undefined) config.openclaw.gatewayToken = opts.token;
      if (opts.password !== undefined) config.openclaw.gatewayPassword = opts.password;

      await writeConfig({ configPath: CONFIG_FILE, config });

      console.log(
        JSON.stringify({
          success: true,
          gateway: {
            url: config.openclaw.gatewayUrl,
            token: config.openclaw.gatewayToken ? "***" : undefined,
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
