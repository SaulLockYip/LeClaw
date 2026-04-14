// leclaw agents list command
// Lists agents from DB with optional refresh from OpenClaw local files

import { Command } from "commander";
import { scanOpenClawAgents } from "@leclaw/shared/openclaw-scanner";
import { db, agents, companies } from "@leclaw/db";
import { eq } from "drizzle-orm";
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
 * Get all agents from the database (bound agents)
 */
async function getBoundAgents() {
  const database = await db;
  const boundAgents = await database.select({
    id: agents.id,
    openClawAgentId: agents.openClawAgentId,
    name: agents.name,
    role: agents.role,
    companyId: agents.companyId,
    departmentId: agents.departmentId,
    status: agents.status,
    statusLastUpdated: agents.statusLastUpdated,
    lastHeartbeatAt: agents.lastHeartbeatAt,
  }).from(agents);

  return boundAgents;
}

/**
 * Sync status from local files for a specific agent
 */
async function syncAgentStatusFromFiles(openClawAgentId: string): Promise<AgentStatus> {
  try {
    const { status } = await getAgentStatusFromFiles(openClawAgentId);
    return status;
  } catch {
    return "unknown";
  }
}

/**
 * List all agents from DB
 */
export async function listAgentsFromDb(): Promise<AgentsListOutput> {
  const errors: string[] = [];
  const entries: AgentListEntry[] = [];

  // Get bound agents from DB
  let boundAgentsList: Awaited<ReturnType<typeof getBoundAgents>> = [];
  try {
    boundAgentsList = await getBoundAgents();
  } catch (err) {
    errors.push(`Database error: ${err instanceof Error ? err.message : String(err)}`);
    return { agents: entries, errors };
  }

  // Scan openclaw.json for discovered agents (to get workspace info)
  const scanResult = scanOpenClawAgents();
  const workspaceMap = new Map(scanResult.agents.map(a => [a.id, a.workspace]));

  // Build entries from bound agents
  for (const agent of boundAgentsList) {
    const workspace = agent.openClawAgentId
      ? workspaceMap.get(agent.openClawAgentId) ?? ""
      : "";

    entries.push({
      id: agent.id,
      name: agent.name,
      openClawAgentId: agent.openClawAgentId,
      workspace,
      status: (agent.status as AgentStatus) ?? "unknown",
      bound: true,
      boundTo: { companyId: agent.companyId, role: agent.role },
    });
  }

  return { agents: entries, errors };
}

/**
 * List all agents with fresh status from local files (--refresh mode)
 */
export async function listAgentsWithFreshStatus(): Promise<AgentsListOutput> {
  const errors: string[] = [];
  const entries: AgentListEntry[] = [];

  // Get bound agents from DB
  let boundAgentsList: Awaited<ReturnType<typeof getBoundAgents>> = [];
  try {
    boundAgentsList = await getBoundAgents();
  } catch (err) {
    errors.push(`Database error: ${err instanceof Error ? err.message : String(err)}`);
    return { agents: entries, errors };
  }

  // Scan openclaw.json for discovered agents
  const scanResult = scanOpenClawAgents();
  errors.push(...scanResult.errors);
  const workspaceMap = new Map(scanResult.agents.map(a => [a.id, a.workspace]));

  // Build entries with fresh status from local files
  for (const agent of boundAgentsList) {
    const workspace = agent.openClawAgentId
      ? workspaceMap.get(agent.openClawAgentId) ?? ""
      : "";

    // Get fresh status from local files
    let status: AgentStatus = (agent.status as AgentStatus) ?? "unknown";
    if (agent.openClawAgentId) {
      try {
        const freshResult = await getAgentStatusFromFiles(agent.openClawAgentId);
        status = freshResult.status;
      } catch {
        // Keep existing status
      }
    }

    entries.push({
      id: agent.id,
      name: agent.name,
      openClawAgentId: agent.openClawAgentId,
      workspace,
      status,
      bound: true,
      boundTo: { companyId: agent.companyId, role: agent.role },
    });
  }

  return { agents: entries, errors };
}

export function registerAgentsCommand(program: Command): void {
  program
    .command("agents list")
    .description("List all bound agents (reads from DB)")
    .option("--refresh", "Force fresh status sync from OpenClaw local files before listing")
    .action(async (options) => {
      const result = options.refresh
        ? await listAgentsWithFreshStatus()
        : await listAgentsFromDb();

      // Output as JSON
      console.log(JSON.stringify(result, null, 2));

      if (result.errors.length > 0) {
        console.error("Warnings:", result.errors.join("; "));
      }
    });
}
