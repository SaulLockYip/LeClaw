// leclaw agent invite command
// List available OpenClaw agents and create invites for them

import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig } from "@leclaw/shared";
import { scanOpenClawAgents, type OpenClawAgent } from "@leclaw/shared/openclaw-scanner";
import { db, agents, agentInvites } from "@leclaw/db";
import { eq, and, ne } from "drizzle-orm";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

async function getServerUrl(): Promise<string> {
  const config = loadConfig({ configPath: CONFIG_FILE });
  const port = config.server?.port ?? 4396;
  return `http://localhost:${port}`;
}

export interface OpenClawAgentAvailability {
  id: string;
  name?: string;
  workspace: string;
  status: "available" | "already_onboarded";
  onboardedAgentId?: string;
  onboardedAgentRole?: string;
}

/**
 * List all OpenClaw agents with their availability status.
 * An agent is "already_onboarded" if they have an accepted agent record.
 * Pending invites do NOT count as占用.
 */
async function listAvailableAgents(): Promise<OpenClawAgentAvailability[]> {
  // Scan OpenClaw agents from config
  const scanResult = scanOpenClawAgents();

  // Get all onboarded agents (those with accepted status - openClawAgentId is set)
  const database = await db;
  const onboardedAgents = await database
    .select({
      openClawAgentId: agents.openClawAgentId,
      id: agents.id,
      role: agents.role,
    })
    .from(agents)
    .where(ne(agents.openClawAgentId, null));

  const onboardedMap = new Map(onboardedAgents.map(a => [a.openClawAgentId, a]));

  // Build availability list
  const availabilityList: OpenClawAgentAvailability[] = [];

  for (const agent of scanResult.agents) {
    const onboarded = onboardedMap.get(agent.id);
    availabilityList.push({
      id: agent.id,
      name: agent.name,
      workspace: agent.workspace,
      status: onboarded ? "already_onboarded" : "available",
      onboardedAgentId: onboarded?.id,
      onboardedAgentRole: onboarded?.role,
    });
  }

  return availabilityList;
}

/**
 * Create an agent invite with the OpenClaw agent pre-selected.
 * Requires CEO or Manager role.
 */
async function createAgentInvite(options: {
  apiKey: string;
  openClawAgentId: string;
  name: string;
  title: string;
  role: "CEO" | "Manager" | "Staff";
  departmentId?: string;
}): Promise<{ success: boolean; inviteKey?: string; prompt?: string; expiresAt?: Date; error?: string }> {
  const { apiKey, openClawAgentId, name, title, role, departmentId } = options;

  // Validate role - only CEO or Manager can create invites
  const agentInfo = await getAgentInfoFromApiKey(apiKey);
  if (agentInfo.role !== "CEO" && agentInfo.role !== "Manager") {
    return { success: false, error: "Only CEO or Manager can create agent invites" };
  }

  // For Staff role, departmentId is required
  if (role === "Staff" && !departmentId) {
    return { success: false, error: "Staff role requires departmentId" };
  }

  // Get OpenClaw agent workspace info
  const scanResult = scanOpenClawAgents();
  const openClawAgent = scanResult.agents.find(a => a.id === openClawAgentId);
  if (!openClawAgent) {
    return { success: false, error: `OpenClaw agent not found: ${openClawAgentId}` };
  }

  // Check if agent is already onboarded
  const database = await db;
  const existingAgent = await database
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.openClawAgentId, openClawAgentId))
    .limit(1);

  if (existingAgent.length > 0) {
    return { success: false, error: "Agent is already onboarded" };
  }

  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/api/companies/${agentInfo.companyId}/agent-invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name,
        title,
        role,
        departmentId: departmentId ?? null,
        openClawAgentId,
        openClawAgentWorkspace: openClawAgent.workspace,
        openClawAgentDir: null, // Will be set during onboard
      }),
    });

    const data = await response.json() as {
      error?: { message?: string; code?: string };
      data?: { inviteKey?: string; expiresAt?: string; prompt?: string };
    };

    if (!response.ok) {
      return { success: false, error: data.error?.message || `HTTP ${response.status}` };
    }

    return {
      success: true,
      inviteKey: data.data?.inviteKey,
      prompt: data.data?.prompt,
      expiresAt: data.data?.expiresAt ? new Date(data.data.expiresAt) : undefined,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function registerAgentInviteCommand(program: Command): void {
  const inviteCommand = new Command("invite")
    .description("Manage agent invites");

  // leclaw agent invite --list-available
  inviteCommand
    .command("list-available")
    .description("List all OpenClaw agents with their availability status")
    .action(async () => {
      try {
        const availability = await listAvailableAgents();
        console.log(JSON.stringify({
          success: true,
          agents: availability,
          errors: scanOpenClawAgents().errors,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });

  // leclaw agent invite --create
  inviteCommand
    .command("create")
    .description("Create an invite for an OpenClaw agent (CEO/Manager only)")
    .requiredOption("--api-key <key>", "Agent API key (must be CEO or Manager)")
    .requiredOption("--openclaw-agent-id <id>", "OpenClaw agent ID")
    .requiredOption("--name <name>", "Agent name")
    .requiredOption("--title <title>", "Agent title")
    .requiredOption("--role <role>", "Agent role (CEO | Manager | Staff)")
    .option("--department-id <uuid>", "Department ID (required for Staff role)")
    .action(async (options) => {
      const { apiKey, openclawAgentId, name, title, role, departmentId } = options;

      // Validate role
      if (role !== "CEO" && role !== "Manager" && role !== "Staff") {
        console.error(JSON.stringify({
          success: false,
          error: `Invalid role '${role}'. Must be one of: CEO, Manager, Staff`,
        }, null, 2));
        process.exit(1);
      }

      const result = await createAgentInvite({
        apiKey,
        openClawAgentId: openclawAgentId,
        name,
        title,
        role: role as "CEO" | "Manager" | "Staff",
        departmentId,
      });

      if (result.success) {
        console.log(JSON.stringify({
          success: true,
          inviteKey: result.inviteKey,
          prompt: result.prompt,
          expiresAt: result.expiresAt?.toISOString(),
        }, null, 2));
      } else {
        console.error(JSON.stringify({
          success: false,
          error: result.error,
        }, null, 2));
        process.exit(1);
      }
    });

  // Make --list-available the default action when just 'agent invite' is called
  inviteCommand.action(async () => {
    // Default to list-available when just 'agent invite' is called without subcommand
    try {
      const availability = await listAvailableAgents();
      console.log(JSON.stringify({
        success: true,
        agents: availability,
        errors: scanOpenClawAgents().errors,
      }, null, 2));
    } catch (err) {
      console.error(JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }, null, 2));
      process.exit(1);
    }
  });

  program.addCommand(inviteCommand);
}
