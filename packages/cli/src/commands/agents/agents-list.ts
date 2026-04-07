// leclaw agents list command
// Discovers agents from openclaw.json and shows their binding status

import { Command } from "commander";
import { scanOpenClawAgents, type OpenClawAgent } from "@leclaw/shared/openclaw-scanner";
import { getAgentStatus, type AgentStatus } from "@leclaw/shared/agent-status";
import { db, agents, companies } from "@leclaw/db";
import { eq } from "drizzle-orm";

export interface AgentListEntry {
  id: string;
  name?: string;
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
 * Get all agents from the database (bound agents)
 */
async function getBoundAgents() {
  const boundAgents = await db.select({
    id: agents.id,
    openClawAgentId: agents.openClawAgentId,
    name: agents.name,
    role: agents.role,
    companyId: agents.companyId,
    departmentId: agents.departmentId,
  }).from(agents);

  return boundAgents;
}

/**
 * List all agents (discovered + bound)
 */
export async function listAgents(): Promise<AgentsListOutput> {
  const errors: string[] = [];
  const entries: AgentListEntry[] = [];

  // Scan openclaw.json for discovered agents
  const scanResult = scanOpenClawAgents();
  errors.push(...scanResult.errors);

  // Get bound agents from DB
  let boundAgentsList: Awaited<ReturnType<typeof getBoundAgents>> = [];
  try {
    boundAgentsList = await getBoundAgents();
  } catch {
    // DB not initialized - continue without bound agent info
  }
  const boundAgentMap = new Map(boundAgentsList.map(a => [a.openClawAgentId, a]));

  // Merge: add status and binding info
  for (const agent of scanResult.agents) {
    const boundAgent = boundAgentMap.get(agent.id);

    // Query status from Gateway
    let status: AgentStatus = "unknown";
    try {
      status = await getAgentStatus(agent.id);
    } catch {
      status = "offline";
    }

    entries.push({
      id: agent.id,
      name: agent.name,
      workspace: agent.workspace,
      status,
      bound: !!boundAgent,
      boundTo: boundAgent
        ? { companyId: boundAgent.companyId, role: boundAgent.role }
        : null,
    });
  }

  return { agents: entries, errors };
}

export function registerAgentsCommand(program: Command): void {
  program
    .command("agents list")
    .description("List all available OpenClaw agents")
    .action(async () => {
      const result = await listAgents();

      // Output as JSON
      console.log(JSON.stringify(result, null, 2));

      if (result.errors.length > 0) {
        console.error("Warnings:", result.errors.join("; "));
      }
    });
}
