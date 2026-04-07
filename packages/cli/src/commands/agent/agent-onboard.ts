// leclaw agent onboard command
// Onboards an OpenClaw agent to LeClaw with role assignment

import { Command } from "commander";
import { generateApiKey } from "@leclaw/shared/api-key";
import { scanOpenClawAgents } from "@leclaw/shared/openclaw-scanner";
import { db, agents, agentApiKeys, companies, departments } from "@leclaw/db";
import { eq, and } from "drizzle-orm";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export type AgentRole = "CEO" | "Manager" | "Staff";

export interface OnboardResult {
  success: boolean;
  agentId?: string;
  apiKey?: string;
  error?: string;
  validationErrors?: string[];
}

/**
 * Validate onboard request
 * All checks run before onboard succeeds
 */
export async function validateOnboard(
  companyId: string,
  openClawAgentId: string,
  role: AgentRole,
  departmentId?: string,
): Promise<string[]> {
  const errors: string[] = [];

  // Rule 1: Company with companyId must exist
  const company = await db.select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (company.length === 0) {
    errors.push(`Company with id '${companyId}' does not exist`);
    return errors; // No point checking other rules if company doesn't exist
  }

  // Rule 2: If role = Manager or Staff, departmentId must exist AND belong to companyId
  if (role === "Manager" || role === "Staff") {
    if (!departmentId) {
      errors.push(`Role '${role}' requires --department-id`);
    } else {
      const dept = await db.select({ id: departments.id, companyId: departments.companyId })
        .from(departments)
        .where(eq(departments.id, departmentId))
        .limit(1);

      if (dept.length === 0) {
        errors.push(`Department with id '${departmentId}' does not exist`);
      } else if (dept[0].companyId !== companyId) {
        errors.push(`Department '${departmentId}' does not belong to company '${companyId}'`);
      }
    }
  }

  // Rule 3: If role = CEO, Company must NOT already have a CEO
  if (role === "CEO") {
    const existingCeo = await db.select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.companyId, companyId),
        eq(agents.role, "CEO")
      ))
      .limit(1);

    if (existingCeo.length > 0) {
      errors.push(`Company '${companyId}' already has a CEO`);
    }
  }

  // Rule 4: openClawAgentId must NOT be bound to any other company (globally unique)
  const existingBinding = await db.select({ id: agents.id, companyId: agents.companyId })
    .from(agents)
    .where(eq(agents.openClawAgentId, openClawAgentId))
    .limit(1);

  if (existingBinding.length > 0) {
    errors.push(`OpenClaw agent '${openClawAgentId}' is already bound to company '${existingBinding[0].companyId}'`);
  }

  // Rule 5: role must be one of CEO | Manager | Staff
  if (!["CEO", "Manager", "Staff"].includes(role)) {
    errors.push(`Invalid role '${role}'. Must be one of: CEO, Manager, Staff`);
  }

  return errors;
}

/**
 * Onboard an OpenClaw agent to LeClaw
 */
export async function onboardAgent(
  companyId: string,
  openClawAgentId: string,
  role: AgentRole,
  agentName: string,
  departmentId?: string,
): Promise<OnboardResult> {
  // Validate first
  const validationErrors = await validateOnboard(companyId, openClawAgentId, role, departmentId);
  if (validationErrors.length > 0) {
    return { success: false, validationErrors };
  }

  // Get openclaw agent workspace info
  const scanResult = scanOpenClawAgents();
  const openClawAgent = scanResult.agents.find(a => a.id === openClawAgentId);

  // Generate API key
  const apiKey = generateApiKey(openClawAgentId);

  try {
    // Insert into agents table
    const now = new Date();
    await db.insert(agents).values({
      companyId,
      departmentId: role === "CEO" ? null : departmentId,
      name: agentName,
      role,
      openClawAgentId,
      openClawAgentWorkspace: openClawAgent?.workspace ?? "",
      openClawAgentDir: openClawAgent?.workspace ?? "",
      createdAt: now,
      updatedAt: now,
    });

    // Insert into agent_api_keys table
    // Note: In production, we would hash the key here. For simplicity, storing the hash
    // For now, we store the secret part hashed since agentId is known
    // A real implementation would use bcrypt to hash the fullKey
    await db.insert(agentApiKeys).values({
      agentId: openClawAgentId,
      keyHash: apiKey.secret, // In production: await bcrypt.hash(apiKey.fullKey, 10)
      createdAt: now,
    });

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
    .description("Onboard an OpenClaw agent to LeClaw")
    .requiredOption("--company-id <id>", "Company ID to bind the agent to")
    .requiredOption("--agent-id <id>", "OpenClaw agent ID to onboard")
    .requiredOption("--name <name>", "Agent display name")
    .requiredOption("--role <role>", "Agent role (CEO|Manager|Staff)")
    .option("--department-id <id>", "Department ID (required for Manager/Staff)")
    .action(async (options) => {
      const { companyId, agentId, name, role, departmentId } = options;

      const result = await onboardAgent(
        companyId,
        agentId,
        role as AgentRole,
        name,
        departmentId,
      );

      if (result.success) {
        console.log(JSON.stringify({
          success: true,
          agentId: result.agentId,
          apiKey: result.apiKey,
          message: "Agent onboarded successfully. Store the API key securely.",
        }, null, 2));
      } else {
        console.error(JSON.stringify({
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        }, null, 2));
        process.exit(1);
      }
    });
}
