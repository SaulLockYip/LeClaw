// leclaw agent onboard command
// Onboards an OpenClaw agent to LeClaw via invite key

import { Command } from "commander";
import { db, agentInvites, agents, agentApiKeys } from "@leclaw/db";
import { eq, isNotNull } from "drizzle-orm";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { generateApiKey } from "@leclaw/shared/api-key";
import { scanOpenClawAgents } from "@leclaw/shared/openclaw-scanner";
import { auditLog } from "../../helpers/audit-log.js";

export interface OnboardResult {
  success: boolean;
  agentId?: string;
  apiKey?: string;
  error?: string;
  validationErrors?: string[];
}

/**
 * Claim an invite and onboard the agent
 */
export async function claimInviteAndOnboard(inviteKey: string): Promise<OnboardResult> {
  // Find the invite
  const [invite] = await db.select().from(agentInvites)
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

  // Get available OpenClaw agents
  const scanResult = scanOpenClawAgents();
  if (scanResult.agents.length === 0) {
    return { success: false, error: "No OpenClaw agents found. Please ensure OpenClaw is running." };
  }

  // Find an unbound agent
  const boundAgentIds = await db.select({ openClawAgentId: agents.openClawAgentId })
    .from(agents)
    .where(isNotNull(agents.openClawAgentId));

  const boundIds = new Set(boundAgentIds.map(a => a.openClawAgentId));
  const availableAgent = scanResult.agents.find(a => !boundIds.has(a.id));

  if (!availableAgent) {
    return { success: false, error: "No available OpenClaw agents found. All agents are already bound to a company." };
  }

  const openClawAgentId = availableAgent.id;
  const openClawAgent = scanResult.agents.find(a => a.id === openClawAgentId);

  try {
    const now = new Date();

    // Create the agent record
    await db.insert(agents as any).values({
      companyId: invite.companyId,
      departmentId: invite.departmentId,
      name: invite.name,
      role: invite.role,
      openClawAgentId,
      openClawAgentWorkspace: openClawAgent?.workspace ?? "",
      openClawAgentDir: openClawAgent?.workspace ?? "",
      createdAt: now,
      updatedAt: now,
    });

    // Generate API key
    const apiKey = generateApiKey(openClawAgentId);

    // Create the API key record
    await db.insert(agentApiKeys as any).values({
      agentId: openClawAgentId,
      companyId: invite.companyId,
      name: invite.name,
      key: apiKey.fullKey,
      keyHash: apiKey.keyHash,
      createdAt: now,
    });

    // Mark invite as accepted
    await db.update(agentInvites as any)
      .set({ status: "accepted" } as any)
      .where(eq(agentInvites.inviteKey, inviteKey));

    // Write key to agent local storage
    const agentKeysDir = join(homedir(), ".leclaw", "agent-keys");
    if (!existsSync(agentKeysDir)) {
      mkdirSync(agentKeysDir, { recursive: true });
    }
    const keyFile = join(agentKeysDir, openClawAgentId);
    writeFileSync(keyFile, apiKey.fullKey, { mode: 0o600 });

    return {
      success: true,
      agentId: openClawAgentId,
      apiKey: apiKey.fullKey,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export function registerAgentCommand(program: Command): void {
  program
    .command("agent onboard")
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
          agentId: result.agentId,
          apiKey: result.apiKey,
          message: "Agent onboarded successfully via invite. Store the API key securely.",
        }, null, 2));
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
        process.exit(1);
      }
    });
}
