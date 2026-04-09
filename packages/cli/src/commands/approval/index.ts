// Approval Commands - List, approve, or reject approvals

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

  // approval approve
  approvalCommand
    .command("approve")
    .description("Approve an approval request")
    .requiredOption("--company-id <id>", "Company ID")
    .requiredOption("--id <id>", "Approval ID")
    .option("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { companyId, id, apiKey } = options;

      try {
        const serverUrl = await getServerUrl();

        // Update the approval status to approved
        const response = await fetch(`${serverUrl}/api/companies/${companyId}/approvals/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            status: "approved",
          }),
        });

        const data = await response.json() as { error?: { message?: string; code?: string }; data?: unknown };

        if (!response.ok) {
          console.error(JSON.stringify({
            success: false,
            error: data.error?.message || `HTTP ${response.status}`,
            code: data.error?.code || "APPROVE_FAILED",
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

  // approval reject
  approvalCommand
    .command("reject")
    .description("Reject an approval request")
    .requiredOption("--company-id <id>", "Company ID")
    .requiredOption("--id <id>", "Approval ID")
    .requiredOption("--message <message>", "Rejection message")
    .option("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { companyId, id, message, apiKey } = options;

      try {
        const serverUrl = await getServerUrl();

        // Update the approval status to rejected
        const response = await fetch(`${serverUrl}/api/companies/${companyId}/approvals/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            status: "rejected",
            rejectMessage: message,
          }),
        });

        const data = await response.json() as { error?: { message?: string; code?: string }; data?: unknown };

        if (!response.ok) {
          console.error(JSON.stringify({
            success: false,
            error: data.error?.message || `HTTP ${response.status}`,
            code: data.error?.code || "REJECT_FAILED",
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
