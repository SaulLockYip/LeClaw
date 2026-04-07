import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { isPortInUse } from "@leclaw/db";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");
const CONFIG_DIR = path.join(os.homedir(), ".leclaw");
const DB_DIR = path.join(CONFIG_DIR, "db");

interface DoctorCheck {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  details: string;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Run diagnostic checks")
    .action(async () => {
      const checks: DoctorCheck[] = [];

      // 1. Config file exists
      const configExists = fs.existsSync(CONFIG_FILE);
      checks.push({
        name: "config_exists",
        status: configExists ? "PASS" : "FAIL",
        details: configExists ? CONFIG_FILE : `Config file not found at ${CONFIG_FILE}`,
      });

      // 2. Config JSON valid
      if (configExists) {
        try {
          const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
          JSON.parse(raw);
          checks.push({ name: "config_valid_json", status: "PASS", details: "Config file is valid JSON" });
        } catch (err) {
          checks.push({
            name: "config_valid_json",
            status: "FAIL",
            details: `Config file is invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      // 3. OpenClaw directory
      if (configExists) {
        const config = loadConfig({ configPath: CONFIG_FILE });
        if (config.openclaw?.dir) {
          const dirExists = fs.existsSync(config.openclaw.dir);
          checks.push({
            name: "openclaw_dir",
            status: dirExists ? "PASS" : "FAIL",
            details: dirExists ? `OpenClaw directory exists: ${config.openclaw.dir}` : `OpenClaw directory not found: ${config.openclaw.dir}`,
          });
        } else {
          checks.push({ name: "openclaw_dir", status: "WARN", details: "OpenClaw directory not configured" });
        }
      }

      // 4. Gateway connectivity
      if (configExists) {
        const config = loadConfig({ configPath: CONFIG_FILE });
        if (config.openclaw?.gatewayUrl) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(config.openclaw.gatewayUrl, { method: "HEAD", signal: controller.signal });
            clearTimeout(timeout);
            checks.push({
              name: "gateway_reachable",
              status: response.ok ? "PASS" : "FAIL",
              details: `Gateway responded with status ${response.status}`,
            });
          } catch (err) {
            checks.push({
              name: "gateway_reachable",
              status: "FAIL",
              details: `Gateway unreachable: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        } else {
          checks.push({ name: "gateway_reachable", status: "WARN", details: "Gateway URL not configured" });
        }
      }

      // 5. Database directory
      const dbDirExists = fs.existsSync(DB_DIR);
      checks.push({
        name: "db_dir",
        status: dbDirExists ? "PASS" : "WARN",
        details: dbDirExists ? `Database directory exists: ${DB_DIR}` : `Database directory not found: ${DB_DIR}`,
      });

      // 6. Port availability
      if (configExists) {
        const config = loadConfig({ configPath: CONFIG_FILE });
        const port = config.server?.port ?? 8080;
        const portAvailable = !(await isPortInUse(port));
        checks.push({
          name: "port_available",
          status: portAvailable ? "PASS" : "FAIL",
          details: portAvailable ? `Port ${port} is available` : `Port ${port} is already in use`,
        });
      }

      const passed = checks.filter((c) => c.status === "PASS").length;
      const failed = checks.filter((c) => c.status === "FAIL").length;
      const warnings = checks.filter((c) => c.status === "WARN").length;

      console.log(
        JSON.stringify({
          success: true,
          checks,
          summary: { passed, failed, warnings, total: checks.length },
        }, null, 2)
      );

      process.exit(failed > 0 ? 1 : 0);
    });
}
