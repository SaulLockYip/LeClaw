// API Key Generation and Management
// Format: {agentId}:{randomSecret}
// Secret: 12 char alphanumeric

import { randomBytes } from "node:crypto";

const SECRET_LENGTH = 12;
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export interface ApiKey {
  fullKey: string; // Plaintext key to return to agent
  agentId: string;
  secret: string;
}

/**
 * Generate a new API key for an agent
 * Format: {agentId}:{12-char-alphanumeric-secret}
 */
export function generateApiKey(agentId: string): ApiKey {
  const secret = generateSecret(SECRET_LENGTH);
  return {
    fullKey: `${agentId}:${secret}`,
    agentId,
    secret,
  };
}

/**
 * Extract agentId and secret from a full API key
 */
export function parseApiKey(fullKey: string): { agentId: string; secret: string } | null {
  const parts = fullKey.split(":");
  if (parts.length !== 2) {
    return null;
  }
  const [agentId, secret] = parts;
  if (!agentId || !secret) {
    return null;
  }
  return { agentId, secret };
}

/**
 * Generate a random alphanumeric secret
 */
function generateSecret(length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return result;
}
