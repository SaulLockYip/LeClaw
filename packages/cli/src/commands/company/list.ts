// leclaw company list command - List all companies

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

async function listCompanies(gatewayUrl: string): Promise<Company[]> {
  const response = await fetch(`${gatewayUrl}/api/companies`);
  if (!response.ok) {
    throw new Error(`Failed to list companies: ${response.status} ${response.statusText}`);
  }
  const json = await response.json() as { data: Company[] };
  return json.data;
}

export function registerCompanyListCommand(program: Command): void {
  program
    .command("list")
    .description("List all companies")
    .action(async () => {
      try {
        let gatewayUrl = "http://localhost:4396";

        if (fs.existsSync(CONFIG_FILE)) {
          const config = loadConfig({ configPath: CONFIG_FILE });
          if (config.openclaw?.gatewayUrl) {
            // Normalize ws:// or wss:// to http://
            gatewayUrl = config.openclaw.gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
          }
        }

        const companies = await listCompanies(gatewayUrl);

        if (companies.length === 0) {
          console.log(JSON.stringify({ success: true, data: [], message: "No companies found" }, null, 2));
        } else {
          console.log(JSON.stringify({ success: true, data: companies }, null, 2));
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ success: false, error }, null, 2));
        process.exit(1);
      }
    });
}
