// leclaw agent whoami command
// Display the current authenticated agent's information

import { Command } from "commander";
import path from "path";
import os from "os";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { getCurrentAgent } from "../../helpers/api-client.js";
import { loadConfig } from "@leclaw/shared";
import { db, agents } from "@leclaw/db";
import { eq } from "drizzle-orm";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

/**
 * Get the name of an agent from the database
 */
async function getAgentName(agentId: string): Promise<string | null> {
  const database = await db;
  const [agent] = await database
    .select({ name: agents.name })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);
  return agent?.name ?? null;
}

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
 * Get the current authenticated agent's information
 * When useHttp is true, uses the HTTP API (requires server running)
 * When useHttp is false, uses direct DB access
 */
export async function getWhoamiInfo(apiKey: string, useHttp: boolean = false): Promise<WhoamiResult> {
  try {
    if (useHttp) {
      // Use HTTP API - fully respects httpMigration flag
      const agentInfo = await getCurrentAgent(apiKey);
      return {
        success: true,
        agentId: agentInfo.agentId,
        name: agentInfo.name,
        role: agentInfo.role,
        companyId: agentInfo.companyId,
        departmentId: agentInfo.departmentId,
      };
    }

    // Use direct DB (default behavior)
    const agentInfo = await getAgentInfoFromApiKey(apiKey);
    const name = await getAgentName(agentInfo.agentId);

    return {
      success: true,
      agentId: agentInfo.agentId,
      name: name,
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

      const config = loadConfig({ configPath: CONFIG_FILE });
      const useHttp = config.features?.httpMigration ?? false;

      const result = await getWhoamiInfo(apiKey, useHttp);

      if (result.success) {
        console.log(JSON.stringify({
          agentId: result.agentId,
          name: result.name,
          role: result.role,
          companyId: result.companyId,
          departmentId: result.departmentId,
        }, null, 2));
      } else {
        console.error(JSON.stringify({
          error: result.error,
        }, null, 2));
        process.exit(1);
      }
    });
}
