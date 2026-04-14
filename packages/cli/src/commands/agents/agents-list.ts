// leclaw agents list command
// Lists agents via LeClaw server API

import { Command } from "commander";
import { createApiClient } from "../../helpers/api-client.js";
import { getAgentStatusFromFiles, type AgentStatus } from "@leclaw/shared/agent-status";

export interface AgentListEntry {
  id: string;
  name?: string;
  openClawAgentId?: string;
  workspace: string;
  status: AgentStatus;
  bound: boolean;
  boundTo: { companyId: string; role: string } | null;
}

export interface AgentsListOutput {
  agents: AgentListEntry[];
  errors: string[];
}

/**
 * Get all agents from the API
 */
async function getAgentsFromApi(apiKey: string): Promise<AgentListEntry[]> {
  const apiClient = createApiClient({ apiKey });
  const agents = await apiClient.getAgents();
  return agents as AgentListEntry[];
}

/**
 * List all agents from API
 */
export async function listAgentsFromApi(apiKey: string): Promise<AgentsListOutput> {
  const errors: string[] = [];
  const entries: AgentListEntry[] = [];

  try {
    const agentsList = await getAgentsFromApi(apiKey);
    return { agents: agentsList, errors };
  } catch (err) {
    errors.push(`API error: ${err instanceof Error ? err.message : String(err)}`);
    return { agents: entries, errors };
  }
}

/**
 * List all agents with fresh status from local files (--refresh mode)
 */
export async function listAgentsWithFreshStatus(apiKey: string): Promise<AgentsListOutput> {
  const errors: string[] = [];
  const entries: AgentListEntry[] = [];

  // Get agents from API
  let agentsList: AgentListEntry[] = [];
  try {
    agentsList = await getAgentsFromApi(apiKey);
  } catch (err) {
    errors.push(`API error: ${err instanceof Error ? err.message : String(err)}`);
    return { agents: entries, errors };
  }

  // Update status from local files for each agent
  for (const agent of agentsList) {
    if (agent.openClawAgentId) {
      try {
        const { status } = await getAgentStatusFromFiles(agent.openClawAgentId);
        agent.status = status;
      } catch {
        // Keep existing status
      }
    }
  }

  return { agents: agentsList, errors };
}

export function registerAgentsCommand(program: Command): void {
  const agentsCommand = new Command("agents")
    .description("Manage agents");

  agentsCommand
    .command("list")
    .description("List all agents (via API)")
    .requiredOption("--api-key <key>", "Agent API key")
    .option("--refresh", "Force fresh status sync from OpenClaw local files before listing")
    .action(async (options) => {
      try {
        const result = options.refresh
          ? await listAgentsWithFreshStatus(options.apiKey)
          : await listAgentsFromApi(options.apiKey);

        // Output as JSON
        console.log(JSON.stringify(result, null, 2));

        if (result.errors.length > 0) {
          console.error("Warnings:", result.errors.join("; "));
        }

        process.exit(0);
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });

  program.addCommand(agentsCommand);
}
