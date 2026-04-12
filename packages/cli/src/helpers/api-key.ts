// API Key Helper - Extract agentId from API key
// Format: sk-{32-hex-chars}
// Looks up the key directly from agents.agentApiKey

import { agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import type { AgentRole } from "@leclaw/shared";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

export interface AgentInfo {
  agentId: string;
  companyId: string;
  role: AgentRole;
  departmentId: string;
}

const AGENT_API_KEY_FILE = path.join(homedir(), ".leclaw", "agent-api-key");

/**
 * Get the stored agent API key from ~/.leclaw/agent-api-key
 * Returns undefined if the file doesn't exist
 */
export function getStoredApiKey(): string | undefined {
  try {
    if (fs.existsSync(AGENT_API_KEY_FILE)) {
      return fs.readFileSync(AGENT_API_KEY_FILE, "utf-8").trim();
    }
  } catch {
    // Ignore errors reading the file
  }
  return undefined;
}

/**
 * Store the agent API key to ~/.leclaw/agent-api-key
 */
export function storeApiKey(apiKey: string): void {
  const dir = path.dirname(AGENT_API_KEY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(AGENT_API_KEY_FILE, apiKey, "utf-8");
}

/**
 * Get agentId from an API key
 * Throws error if the key is invalid or not found
 */
export async function getAgentIdFromApiKey(apiKey: string): Promise<string> {
  const info = await getAgentInfoFromApiKey(apiKey);
  return info.agentId;
}

/**
 * Get full agent info from an API key (id, companyId, role)
 * Throws error if the key is invalid or not found
 */
export async function getAgentInfoFromApiKey(apiKey: string): Promise<AgentInfo> {
  const db = await getDb();

  // Look up by agentApiKey directly
  const [agentRecord] = await db
    .select({ id: agents.id, companyId: agents.companyId, role: agents.role, departmentId: agents.departmentId })
    .from(agents)
    .where(eq(agents.agentApiKey, apiKey))
    .limit(1);

  if (!agentRecord) {
    throw new Error("Invalid API key");
  }

  return {
    agentId: agentRecord.id,
    companyId: agentRecord.companyId,
    role: agentRecord.role as AgentRole,
    departmentId: agentRecord.departmentId,
  };
}
