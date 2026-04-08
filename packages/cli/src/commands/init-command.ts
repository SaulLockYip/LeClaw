import { Command } from "commander";
import * as clack from "@clack/prompts";
import path from "path";
import os from "os";
import fs from "fs";
import { initializeDb } from "@leclaw/db";
import { writeConfig, loadConfig, type LeClawConfig } from "@leclaw/shared";

const CONFIG_DIR = path.join(os.homedir(), ".leclaw");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const DEFAULT_DB_DIR = path.join(CONFIG_DIR, "db");
const DEFAULT_DB_PORT = 65432;

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize LeClaw configuration (interactive)")
    .option("--db-port <port>", "Embedded PostgreSQL port", String(DEFAULT_DB_PORT))
    .option("--db-path <path>", "Embedded PostgreSQL data directory", DEFAULT_DB_DIR)
    .action(async (opts) => {
      try {
        // Create directories
        if (!fs.existsSync(CONFIG_DIR)) {
          fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }

        // Check if already initialized
        let existingConfig: LeClawConfig | null = null;
        if (fs.existsSync(CONFIG_FILE)) {
          existingConfig = loadConfig({ configPath: CONFIG_FILE });
        }

        clack.intro("LeClaw Init");

        const openclawDir = (await clack.text({
          message: "OpenClaw directory:",
          defaultValue: existingConfig?.openclaw?.dir ?? "",
          placeholder: "/path/to/openclaw",
        })) as string;

        const gatewayUrl = (await clack.text({
          message: "Gateway WebSocket URL:",
          defaultValue: existingConfig?.openclaw?.gatewayUrl ?? "ws://127.0.0.1:18789",
          placeholder: "ws://127.0.0.1:18789",
        })) as string;

        const gatewayToken = (await clack.text({
          message: "Gateway API token:",
          defaultValue: existingConfig?.openclaw?.gatewayToken ?? "",
          placeholder: "your-api-token",
        })) as string;

        const serverPort = (await clack.text({
          message: "Server port:",
          defaultValue: String(existingConfig?.server?.port ?? 4396),
          placeholder: "4396",
        })) as string;

        clack.log.info("Initializing embedded PostgreSQL database...");

        // Initialize embedded PostgreSQL
        const dbPort = parseInt(opts.dbPort, 10) || DEFAULT_DB_PORT;
        const dbPath = opts.dbPath || DEFAULT_DB_DIR;
        let connectionString = existingConfig?.database?.connectionString ?? "";
        if (!connectionString) {
          const { connectionString: cs } = await initializeDb({ port: dbPort, dataDir: dbPath });
          connectionString = cs;
        }

        const config: LeClawConfig = {
          version: "1.0.0",
          openclaw: {
            dir: openclawDir,
            gatewayUrl,
            gatewayToken,
          },
          server: {
            port: parseInt(serverPort, 10) || 4396,
          },
          database: {
            connectionString,
            embeddedDataDir: dbPath,
            embeddedPort: dbPort,
          },
        };

        await writeConfig({ configPath: CONFIG_FILE, config });

        clack.log.success(`Configuration saved to ${CONFIG_FILE}`);

        console.log(
          JSON.stringify({
            success: true,
            configDir: CONFIG_DIR,
            configFile: CONFIG_FILE,
            dbInitialized: true,
          })
        );
        process.exit(0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "INIT_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
