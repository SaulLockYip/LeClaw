// API Key Helper - Extract agentId from API key
// Format: {agentId}:{randomSecret}

import { agentApiKeys } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { parseApiKey } from "@leclaw/shared/api-key";

/**
 * Get agentId from an API key
 * Throws error if the key is invalid or not found
 */
export async function getAgentIdFromApiKey(apiKey: string): Promise<string> {
  const parsed = parseApiKey(apiKey);

  if (!parsed) {
    throw new Error("Invalid API key format");
  }

  const db = await getDb();

  // Check if the key exists in the database
  const [keyRecord] = await db
    .select({ agentId: agentApiKeys.agentId })
    .from(agentApiKeys)
    .where(eq(agentApiKeys.agentId, parsed.agentId))
    .limit(1);

  if (!keyRecord) {
    throw new Error("Invalid API key");
  }

  return keyRecord.agentId;
}
