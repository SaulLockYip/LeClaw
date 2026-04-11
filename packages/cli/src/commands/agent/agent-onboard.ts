// leclaw agent onboard command
// Onboards an OpenClaw agent to LeClaw via invite key

import { Command } from "commander";
import { db, agentInvites, agents, agentApiKeys, closeDb } from "@leclaw/db";
import { eq } from "drizzle-orm";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { generateApiKey } from "@leclaw/shared/api-key";
import { auditLog } from "../../helpers/audit-log.js";
import { registerAgentInviteCommand } from "./agent-invite.js";

export interface OnboardResult {
  success: boolean;
  agentId?: string;
  apiKey?: string;
  error?: string;
  validationErrors?: string[];
}

/**
 * Claim an invite and onboard the agent
 * Uses the pre-stored openClawAgentId, workspace, and dir from invite creation
 */
export async function claimInviteAndOnboard(inviteKey: string): Promise<OnboardResult> {
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
    const [newAgent] = await database.insert(agents as any).values({
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
    }).returning();

    // Generate API key
    const apiKey = generateApiKey(newAgent.id);

    // Create the API key record
    await database.insert(agentApiKeys as any).values({
      agentId: newAgent.id,
      companyId: invite.companyId,
      name: invite.name,
      key: apiKey.fullKey,
      keyHash: apiKey.keyHash,
      createdAt: now,
    });

    // Mark invite as accepted
    await database.update(agentInvites as any)
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
          message: "Agent onboarded successfully via invite. Store the API key securely.",
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

  program.addCommand(agentCommand);
}