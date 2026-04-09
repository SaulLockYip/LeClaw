// Agent Invite Service - Handles invite creation and claiming

import { randomBytes } from "node:crypto";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { agentInvites, agents, agentApiKeys, companies, departments } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { generateApiKey } from "@leclaw/shared/api-key";
import { scanOpenClawAgents } from "@leclaw/shared/openclaw-scanner";
import type { AgentRole } from "@leclaw/shared";

const INVITE_EXPIRY_MINUTES = 30;

/**
 * Generate a unique invite key: 6 uppercase alphanumeric chars (A-Z, 0-9)
 */
function generateInviteKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 6; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export interface CreateInviteInput {
  companyId: string;
  departmentId?: string;
  name: string;
  role: "CEO" | "Manager" | "Staff";
  title?: string;
}

export interface CreateInviteResult {
  success: boolean;
  inviteKey?: string;
  prompt?: string;
  expiresAt?: Date;
  error?: string;
  validationErrors?: string[];
}

export interface ClaimInviteResult {
  success: boolean;
  agent?: {
    id: string;
    companyId: string;
    departmentId: string | null;
    name: string;
    role: string;
  };
  apiKey?: string;
  error?: string;
  validationErrors?: string[];
}

/**
 * Validate invite creation request
 */
export async function validateCreateInvite(
  companyId: string,
  role: "CEO" | "Manager" | "Staff",
  departmentId?: string,
): Promise<string[]> {
  const errors: string[] = [];
  const db = await getDb();

  // DEBUG: Log the incoming role for debugging
  console.log(`[DEBUG validateCreateInvite] companyId=${companyId}, role=${role}, departmentId=${departmentId}`);
  console.log(`[DEBUG validateCreateInvite] role type=${typeof role}, role repr=${JSON.stringify(role)}`);

  // Validate role is one of the expected values (defensive check)
  const validRoles = ["CEO", "Manager", "Staff"] as const;
  if (!validRoles.includes(role)) {
    errors.push(`Invalid role '${role}'. Must be one of: ${validRoles.join(", ")}`);
    return errors;
  }

  // Rule 1: Company must exist
  const company = await db.select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (company.length === 0) {
    errors.push(`Company with id '${companyId}' does not exist`);
    return errors;
  }

  // Rule 2: If role = Manager or Staff, departmentId must exist AND belong to companyId
  if (role === "Manager" || role === "Staff") {
    if (!departmentId) {
      errors.push(`Role '${role}' requires departmentId`);
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
  // Only check CEO EXPLICITLY - not for Manager or Staff
  console.log(`[DEBUG validateCreateInvite] About to check CEO condition: role === "CEO" is ${role === "CEO"}`);
  if (role === "CEO") {
    console.log(`[DEBUG validateCreateInvite] CEO check running for companyId=${companyId}`);
    const existingCeo = await db.select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.companyId, companyId),
        eq(agents.role, "CEO")
      ))
      .limit(1);

    if (existingCeo.length > 0) {
      console.log(`[DEBUG validateCreateInvite] Found existing CEO for companyId=${companyId}`);
      errors.push(`Company '${companyId}' already has a CEO`);
    }
  }

  return errors;
}

/**
 * Create an agent invite
 */
export async function createInvite(input: CreateInviteInput): Promise<CreateInviteResult> {
  const { companyId, departmentId, name, role, title } = input;

  // Validate first
  const validationErrors = await validateCreateInvite(companyId, role, departmentId);
  if (validationErrors.length > 0) {
    return { success: false, validationErrors };
  }

  try {
    const db = await getDb();
    const inviteKey = generateInviteKey();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(agentInvites as any).values({
      inviteKey,
      companyId,
      departmentId: role === "CEO" ? null : departmentId,
      name,
      role,
      title,
      status: "pending",
      expiresAt,
      createdAt: now,
    } as any);

    const prompt = `Run this command to join the company:\nleclaw agent onboard --invite-key ${inviteKey}`;

    return {
      success: true,
      inviteKey,
      prompt,
      expiresAt,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Validate that an invite can be claimed
 */
export async function validateClaimInvite(inviteKey: string): Promise<{ valid: boolean; error?: string }> {
  const db = await getDb();

  // Find the invite
  const invite = await db.select().from(agentInvites)
    .where(eq(agentInvites.inviteKey, inviteKey))
    .limit(1);

  if (invite.length === 0) {
    return { valid: false, error: "Invalid invite key" };
  }

  const inviteRecord = invite[0];

  // Check if already accepted
  if (inviteRecord.status === "accepted") {
    return { valid: false, error: "Invite has already been used" };
  }

  // Check if expired
  if (inviteRecord.status === "expired" || new Date() > inviteRecord.expiresAt) {
    return { valid: false, error: "Invite has expired" };
  }

  return { valid: true };
}

/**
 * Claim an invite and create the agent
 */
export async function claimInvite(inviteKey: string): Promise<ClaimInviteResult> {
  // Validate the invite first
  const validation = await validateClaimInvite(inviteKey);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const db = await getDb();

  // Get the invite record
  const [invite] = await db.select().from(agentInvites)
    .where(eq(agentInvites.inviteKey, inviteKey))
    .limit(1);

  // Get available OpenClaw agents
  const scanResult = scanOpenClawAgents();
  if (scanResult.agents.length === 0) {
    return { success: false, error: "No OpenClaw agents found. Please ensure OpenClaw is running." };
  }

  // For invite-based onboarding, we need to find an unbound agent
  // The user will specify which agent to use during claim
  // For now, we'll use the first available unbound agent
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
    const [agent] = await db.insert(agents as any).values({
      companyId: invite.companyId,
      departmentId: invite.departmentId,
      name: invite.name,
      role: invite.role as AgentRole,
      title: invite.title,
      openClawAgentId,
      openClawAgentWorkspace: openClawAgent?.workspace ?? "",
      openClawAgentDir: openClawAgent?.workspace ?? "",
      createdAt: now,
      updatedAt: now,
    } as any).returning();

    // Generate API key
    const apiKey = generateApiKey(agent.id);

    // Create the API key record
    await db.insert(agentApiKeys as any).values({
      agentId: agent.id,
      companyId: invite.companyId,
      name: invite.name,
      key: apiKey.fullKey,
      keyHash: apiKey.keyHash,
      createdAt: now,
    } as any);

    // Mark invite as accepted
    await db.update(agentInvites as any)
      .set({ status: "accepted" } as any)
      .where(eq(agentInvites.inviteKey, inviteKey));

    return {
      success: true,
      agent: {
        id: agent.id,
        companyId: agent.companyId,
        departmentId: agent.departmentId,
        name: agent.name,
        role: agent.role,
      },
      apiKey: apiKey.fullKey,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Expire old invites (called by background job or on claim attempt)
 */
export async function expireOldInvites(): Promise<number> {
  const db = await getDb();
  const now = new Date();

  await (db as any).update(agentInvites)
    .set({ status: "expired" } as any)
    .where(and(
      eq(agentInvites.status, "pending"),
      lt(agentInvites.expiresAt, now)
    ));

  return 0; // Drizzle doesn't return count, this is an approximation
}
