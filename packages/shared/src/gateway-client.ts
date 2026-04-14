// OpenClaw Gateway Client
// Handles WebSocket connection to OpenClaw Gateway
// NOTE: Agent status is now read from local files via agent-status.ts
// This module is kept for WebSocket connections if needed in the future

import { loadConfig } from "./config/io.js";
import type { AgentStatus } from "./agent-status.js";

export type { AgentStatus };

export interface GatewayClientOptions {
  url?: string;
  token?: string;
  timeoutMs?: number;
}

/**
 * @deprecated Use getAgentStatusFromFiles() from agent-status.ts instead
 * This function is kept for backward compatibility but returns "unknown" always
 */
export async function queryAgentStatus(
  _agentId: string,
  _options?: GatewayClientOptions,
): Promise<AgentStatus> {
  // Agent status is now read from local files via agent-status.ts
  // This HTTP-based approach to the gateway is deprecated
  return "unknown";
}
