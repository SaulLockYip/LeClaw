// Approval Commands - List and request approvals

import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

async function getServerUrl(): Promise<string> {
  const config = loadConfig({ configPath: CONFIG_FILE });
  const port = config.server?.port ?? 4396;
  return `http://localhost:${port}`;
}

export function registerApprovalCommand(program: Command): void {
  const approvalCommand = new Command("approval")
    .description("Manage approvals");

  // approval list
  approvalCommand
    .command("list")
    .description("List all approvals for a company")
    .requiredOption("--company-id <id>", "Company ID")
    .option("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { companyId, apiKey } = options;

      try {
        const serverUrl = await getServerUrl();
        const response = await fetch(`${serverUrl}/api/companies/${companyId}/approvals`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
        });

        const data = await response.json() as { error?: { message?: string; code?: string }; data?: unknown };

        if (!response.ok) {
          console.error(JSON.stringify({
            success: false,
            error: data.error?.message || `HTTP ${response.status}`,
            code: data.error?.code || "LIST_FAILED",
          }, null, 2));
          process.exit(1);
        }

        console.log(JSON.stringify({
          success: true,
          approvals: data.data,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
          code: "REQUEST_FAILED",
        }, null, 2));
        process.exit(1);
      }
    });

  // approval request
  approvalCommand
    .command("request")
    .description("Submit an approval request (for AI agents)")
    .requiredOption("--company-id <id>", "Company ID")
    .requiredOption("--title <title>", "Approval request title")
    .requiredOption("--description <desc>", "Approval request description")
    .option("--requester <agent-id>", "Requester agent ID")
    .option("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { companyId, title, description, requester, apiKey } = options;

      try {
        const serverUrl = await getServerUrl();

        const response = await fetch(`${serverUrl}/api/companies/${companyId}/approvals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            title,
            description,
            ...(requester ? { requester } : {}),
          }),
        });

        const data = await response.json() as { error?: { message?: string; code?: string }; data?: unknown };

        if (!response.ok) {
          console.error(JSON.stringify({
            success: false,
            error: data.error?.message || `HTTP ${response.status}`,
            code: data.error?.code || "REQUEST_FAILED",
          }, null, 2));
          process.exit(1);
        }

        console.log(JSON.stringify({
          success: true,
          approval: data.data,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
          code: "REQUEST_FAILED",
        }, null, 2));
        process.exit(1);
      }
    });

  program.addCommand(approvalCommand);
}
