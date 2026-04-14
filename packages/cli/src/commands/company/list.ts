// leclaw company list command - List all companies

import { Command } from "commander";
import { createApiClient } from "../../helpers/api-client.js";

interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function registerCompanyListCommand(program: Command): void {
  program
    .command("list")
    .description("List all companies")
    .requiredOption("--api-key <key>", "Agent API key for authentication")
    .action(async (options) => {
      const { apiKey } = options;

      try {
        const client = createApiClient({ apiKey });
        const companies = await client.get<Company[]>("/api/companies");

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
