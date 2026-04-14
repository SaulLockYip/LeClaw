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

  // leclaw config set <path> <value>
  const setCommand = config
    .command("set")
    .description("Set a config value")
    .requiredOption("--path <path>", "Config path (e.g., 'openclaw.dir')")
    .requiredOption("--value <value>", "Config value")
    .action(async (opts) => {
      try {
        const cfg = loadConfig({ configPath: CONFIG_FILE });
        const { path: configPath, value } = opts;

        // Parse nested path (e.g., "openclaw.dir")
        const parts = configPath.split(".");
        let current: any = cfg;

        // Navigate to the parent of the target key
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!(part in current)) {
            // Create intermediate objects if they don't exist
            current[part] = {};
          }
          current = current[part];
        }

        const finalKey = parts[parts.length - 1];

        // Parse value - try boolean first, then number, then string
        let parsedValue: any = value;
        if (value === "true") parsedValue = true;
        else if (value === "false") parsedValue = false;
        else if (!isNaN(Number(value)) && value !== "") parsedValue = Number(value);

        current[finalKey] = parsedValue;

        await writeConfig({ configPath: CONFIG_FILE, config: cfg });

        console.log(
          JSON.stringify({
            success: true,
            message: `Set ${configPath} = ${parsedValue}`,
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

  registerConfigOpenClawCommand(config);
  registerConfigGatewayCommand(config);
  registerConfigServerCommand(config);
}
