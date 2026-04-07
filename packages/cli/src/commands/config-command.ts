import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, type LeClawConfig } from "@leclaw/shared";
import { registerConfigOpenClawCommand } from "./config-openclaw-command.js";
import { registerConfigGatewayCommand } from "./config-gateway-command.js";
import { registerConfigServerCommand } from "./config-server-command.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("Manage LeClaw configuration");

  // leclaw config (show current)
  config.action(async () => {
    const cfg = loadConfig({ configPath: CONFIG_FILE });
    console.log(JSON.stringify({ success: true, config: cfg }, null, 2));
    process.exit(0);
  });

  registerConfigOpenClawCommand(config);
  registerConfigGatewayCommand(config);
  registerConfigServerCommand(config);
}
