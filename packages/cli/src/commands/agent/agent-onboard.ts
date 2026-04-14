// leclaw agent onboard command
// Onboards an OpenClaw agent to LeClaw via invite key

import { Command } from "commander";
import { closeDb } from "@leclaw/db";
import { auditLog } from "../../helpers/audit-log.js";
import { registerAgentInviteCommand } from "./agent-invite.js";
import { registerWhoamiCommand } from "./whoami.js";
import { getLeClawServerUrl } from "../../helpers/api-client.js";

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
 * Claim an invite and onboard the agent via HTTP API
 */
export async function claimInviteAndOnboard(inviteKey: string): Promise<OnboardResult> {
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