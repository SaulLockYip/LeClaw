// leclaw agent whoami command
// Display the current authenticated agent's information

import { Command } from "commander";
import { getCurrentAgent } from "../../helpers/api-client.js";

export interface WhoamiResult {
  success: boolean;
  agentId?: string;
  name?: string | null;
  role?: string;
  companyId?: string;
  departmentId?: string | null;
  error?: string;
}

/**
 * Get the current authenticated agent's information via HTTP API
 */
export async function getWhoamiInfo(apiKey: string): Promise<WhoamiResult> {
  try {
    const agentInfo = await getCurrentAgent(apiKey);
    return {
      success: true,
      agentId: agentInfo.agentId,
      name: agentInfo.name,
      role: agentInfo.role,
      companyId: agentInfo.companyId,
      departmentId: agentInfo.departmentId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function registerWhoamiCommand(agentCommand: Command): void {
  agentCommand
    .command("whoami")
    .description("Display the current authenticated agent's information")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const apiKey = options.apiKey;

      if (!apiKey) {
        console.error(JSON.stringify({
          error: "Not authenticated. Please run 'leclaw agent onboard --invite-key <key>' first.",
        }, null, 2));
        process.exit(1);
      }

      const result = await getWhoamiInfo(apiKey);

      if (result.success) {
        console.log(JSON.stringify({
          agentId: result.agentId,
          name: result.name,
          role: result.role,
          companyId: result.companyId,
          departmentId: result.departmentId,
        }, null, 2));
        process.exit(0);
      } else {
        console.error(JSON.stringify({
          error: result.error,
        }, null, 2));
        process.exit(1);
      }
    });
}
