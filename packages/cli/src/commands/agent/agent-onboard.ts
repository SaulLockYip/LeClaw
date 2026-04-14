// leclaw agent onboard command
// Onboards an OpenClaw agent to LeClaw via invite key

import { Command } from "commander";
import path from "path";
import os from "os";
import { db, agentInvites, agents, closeDb } from "@leclaw/db";
import { eq } from "drizzle-orm";
import { generateApiKey } from "@leclaw/shared/api-key";
import { auditLog } from "../../helpers/audit-log.js";
import { registerAgentInviteCommand } from "./agent-invite.js";
import { registerWhoamiCommand } from "./whoami.js";
import { getLeClawServerUrl } from "../../helpers/api-client.js";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export interface OnboardResult {
  success: boolean;
  agentId?: string;
  apiKey?: string;
  error?: string;
  validationErrors?: string[];
}

interface ClaimApiResponse {
  success: boolean;
  data?: {
    agentId?: string;
    apiKey?: string;
  };
  error?: {
    message?: string;
  };
}

/**
 * Claim an invite and onboard the agent
 * Uses the pre-stored openClawAgentId, workspace, and dir from invite creation
 */
export async function claimInviteAndOnboard(inviteKey: string): Promise<OnboardResult> {
  const config = loadConfig({ configPath: CONFIG_FILE });
  const useHttp = config.features?.httpMigration ?? false;

  if (useHttp) {
    // Use HTTP API to claim invite
    const serverUrl = getLeClawServerUrl();
    const response = await fetch(`${serverUrl}/api/agent-invites/claim/${inviteKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();
    if (!text) {
      return {
        success: false,
        error: `HTTP ${response.status}: Empty response`,
      };
    }

    const result: ClaimApiResponse = JSON.parse(text);

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message ?? "Failed to claim invite via API",
      };
    }

    return {
      success: true,
      agentId: result.data?.agentId,
      apiKey: result.data?.apiKey,
    };
  }

  // Direct DB access (original behavior)
  // Unwrap db promise to get the actual drizzle instance for method chaining
  const database = await db;

  // Find the invite
  const [invite] = await database.select().from(agentInvites)
    .where(eq(agentInvites.inviteKey, inviteKey))
    .limit(1);

  if (!invite) {
    return { success: false, error: "Invalid invite key" };
  }

  // Check if already accepted
  if (invite.status === "accepted") {
    return { success: false, error: "Invite has already been used" };
  }

  // Check if expired
  if (invite.status === "expired" || new Date() > invite.expiresAt) {
    return { success: false, error: "Invite has expired" };
  }

  // Use the pre-stored OpenClaw agent info from invite
  const { openClawAgentId, openClawAgentWorkspace, openClawAgentDir } = invite;

  if (!openClawAgentId) {
    return { success: false, error: "Invite does not have an OpenClaw agent assigned. Please recreate the invite with an agent selected." };
  }

  try {
    const now = new Date();

    // Create the agent record
    const [newAgent] = await database.insert(agents).values({
      companyId: invite.companyId,
      departmentId: invite.departmentId ?? null,
      name: invite.name,
      role: invite.role,
      title: invite.title ?? null,
      openClawAgentId: openClawAgentId ?? null,
      openClawAgentWorkspace: openClawAgentWorkspace ?? null,
      openClawAgentDir: openClawAgentDir ?? null,
      createdAt: now,
      updatedAt: now,
    } as any).returning();

    // Generate API key
    const apiKey = generateApiKey(newAgent.id);

    // Store API key on the agent record
    await database.update(agents)
      .set({ agentApiKey: apiKey.fullKey } as any)
      .where(eq(agents.id, newAgent.id));

    // Mark invite as accepted
    await database.update(agentInvites)
      .set({ status: "accepted" } as any)
      .where(eq(agentInvites.inviteKey, inviteKey));

    return {
      success: true,
      agentId: newAgent.id,
      apiKey: apiKey.fullKey,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

function registerOnboardCommand(agentCommand: Command): void {
  agentCommand
    .command("onboard")
    .description("Onboard an OpenClaw agent to LeClaw via invite key")
    .requiredOption("--invite-key <key>", "6-char invite key (e.g. A3B7K9)")
    .action(async (options) => {
      const { inviteKey } = options;

      const result = await claimInviteAndOnboard(inviteKey);

      const auditArgs = { inviteKey };
      if (result.success) {
        await auditLog({
          agentId: result.agentId ?? "unknown",
          command: "agent onboard",
          args: auditArgs,
          result: "success",
          output: `Agent onboarded via invite: ${inviteKey}`,
        });

        console.log(JSON.stringify({
          success: true,
          apiKey: result.apiKey,
          message: "Agent onboarded successfully. Store the API key securely - it cannot be recovered.",
        }, null, 2));
        await closeDb();
        process.exit(0);
      } else {
        await auditLog({
          agentId: "unknown",
          command: "agent onboard",
          args: auditArgs,
          result: "failure",
          output: result.error ?? result.validationErrors?.join("; ") ?? "Unknown error",
        });

        console.error(JSON.stringify({
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        }, null, 2));
        await closeDb();
        process.exit(1);
      }
    });
}

export function registerAgentCommand(program: Command): void {
  const agentCommand = new Command("agent")
    .description("Manage agents");

  registerOnboardCommand(agentCommand);
  registerAgentInviteCommand(agentCommand);
  registerWhoamiCommand(agentCommand);

  program.addCommand(agentCommand);
}
