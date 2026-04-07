// Agent Status Query
// On-demand query of agent status from OpenClaw Gateway (no caching)

import { queryAgentStatus, type AgentStatus } from "./gateway-client.js";

export { type AgentStatus } from "./gateway-client.js";

/**
 * Get agent status on-demand from OpenClaw Gateway
 * No caching - fresh query every time
 * Gateway unreachable returns "offline" (not "unknown" per spec)
 */
export async function getAgentStatus(agentId: string): Promise<AgentStatus> {
  return queryAgentStatus(agentId);
}
