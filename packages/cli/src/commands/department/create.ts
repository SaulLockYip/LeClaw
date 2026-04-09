// leclaw department create command - Create a new department

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

async function createDepartment(gatewayUrl: string, companyId: string, name: string, description?: string): Promise<Department> {
  const response = await fetch(`${gatewayUrl}/api/companies/${companyId}/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create department: ${response.status} ${response.statusText}`);
  }
  const json = await response.json() as { data: Department };
  return json.data;
}

export function registerDepartmentCreateCommand(program: Command): void {
  program
    .command("create")
    .description("Create a new department")
    .requiredOption("--company-id <id>", "Company ID")
    .requiredOption("--name <name>", "Department name")
    .option("--description <description>", "Department description")
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

        const department = await createDepartment(gatewayUrl, options.companyId, options.name, options.description);
        console.log(JSON.stringify({ success: true, data: department }, null, 2));
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ success: false, error }, null, 2));
        process.exit(1);
      }
    });
}
