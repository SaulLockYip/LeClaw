// leclaw company create command - Create a new company

import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

async function createCompany(gatewayUrl: string, name: string, description?: string): Promise<Company> {
  const response = await fetch(`${gatewayUrl}/api/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create company: ${response.status} ${response.statusText}`);
  }
  const json = await response.json() as { data: Company };
  return json.data;
}

export function registerCompanyCreateCommand(program: Command): void {
  program
    .command("create")
    .description("Create a new company")
    .requiredOption("--name <name>", "Company name")
    .option("--description <description>", "Company description")
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

        const company = await createCompany(gatewayUrl, options.name, options.description);
        console.log(JSON.stringify({ success: true, data: company }, null, 2));
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ success: false, error }, null, 2));
        process.exit(1);
      }
    });
}
