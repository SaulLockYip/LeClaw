// leclaw department list command - List departments for a company

import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

interface Department {
  id: string;
  name: string;
  companyId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

async function listDepartments(gatewayUrl: string, companyId: string): Promise<Department[]> {
  const response = await fetch(`${gatewayUrl}/api/companies/${companyId}/departments`);
  if (!response.ok) {
    throw new Error(`Failed to list departments: ${response.status} ${response.statusText}`);
  }
  const json = await response.json() as { data: Department[] };
  return json.data;
}

export function registerDepartmentListCommand(program: Command): void {
  program
    .command("list")
    .description("List departments for a company")
    .requiredOption("--company-id <id>", "Company ID")
    .action(async (options) => {
      try {
        let gatewayUrl = "http://localhost:4396";

        if (fs.existsSync(CONFIG_FILE)) {
          const config = loadConfig({ configPath: CONFIG_FILE });
          if (config.openclaw?.gatewayUrl) {
            // Normalize ws:// or wss:// to http://
            gatewayUrl = config.openclaw.gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
          }
        }

        const departments = await listDepartments(gatewayUrl, options.companyId);

        if (departments.length === 0) {
          console.log(JSON.stringify({ success: true, data: [], message: "No departments found" }, null, 2));
        } else {
          console.log(JSON.stringify({ success: true, data: departments }, null, 2));
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ success: false, error }, null, 2));
        process.exit(1);
      }
    });
}
