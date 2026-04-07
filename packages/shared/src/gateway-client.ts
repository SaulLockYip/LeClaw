// OpenClaw Gateway Client
// Handles WebSocket connection and agent status queries

import { join } from "node:path";
import { loadConfig } from "./config/io.js";

export type AgentStatus = "online" | "busy" | "offline" | "unknown";

export interface GatewayClientOptions {
  url?: string;
  token?: string;
  timeoutMs?: number;
}

export interface GatewayStatusResponse {
  status: AgentStatus;
}

/**
 * Query agent status from OpenClaw Gateway
 * Returns "offline" if Gateway is unreachable (graceful degradation)
 */
export async function queryAgentStatus(
  agentId: string,
  options?: GatewayClientOptions,
): Promise<AgentStatus> {
  const config = loadConfig({ configPath: getDefaultConfigPath() });
  const gatewayUrl = options?.url ?? config.openclaw?.gatewayUrl ?? "ws://127.0.0.1:18789";
  const token = options?.token ?? config.openclaw?.gatewayToken;

  try {
    const status = await queryStatusHttp(agentId, gatewayUrl, token, options?.timeoutMs ?? 5000);
    return status;
  } catch {
    return "offline";
  }
}

async function queryStatusHttp(
  agentId: string,
  gatewayUrl: string,
  token?: string,
  timeoutMs?: number,
): Promise<AgentStatus> {
  // Convert ws:// to http:// for REST API call
  const httpUrl = gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
  const statusUrl = `${httpUrl}/api/agents/${encodeURIComponent(agentId)}/status`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? 5000);

  try {
    const response = await fetch(statusUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return "offline";
    }

    const data = await response.json() as { status?: string };
    const status = data.status?.toLowerCase();

    if (status === "online" || status === "busy" || status === "offline") {
      return status;
    }

    return "unknown";
  } catch {
    clearTimeout(timeout);
    return "offline";
  }
}

function getDefaultConfigPath(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  return join(home, ".leclaw", "config.json");
}
