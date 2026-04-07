// OpenClaw Agent Scanner
// Reads openclaw.json from configured openclaw.dir to discover available agents

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "./config/io.js";

export interface OpenClawAgent {
  id: string;
  name?: string;
  workspace: string;
}

export interface OpenClawConfig {
  agents?: Array<{
    id: string;
    name?: string;
    workspace: string;
  }>;
}

export interface ScanResult {
  agents: OpenClawAgent[];
  errors: string[];
}

/**
 * Scan the configured openclaw.dir for openclaw.json and return available agents
 */
export function scanOpenClawAgents(configPath?: string): ScanResult {
  const errors: string[] = [];
  const agents: OpenClawAgent[] = [];

  const config = loadConfig({ configPath: configPath ?? getDefaultConfigPath() });
  const openclawDir = config.openclaw?.dir;

  if (!openclawDir) {
    errors.push("openclaw.dir not configured");
    return { agents, errors };
  }

  const configFile = join(openclawDir, "openclaw.json");

  try {
    const raw = readFileSync(configFile, "utf-8");
    const parsed = JSON.parse(raw) as OpenClawConfig;

    if (!parsed.agents || !Array.isArray(parsed.agents)) {
      errors.push("openclaw.json does not contain an agents array");
      return { agents, errors };
    }

    for (const agent of parsed.agents) {
      if (!agent.id) {
        errors.push(`Agent missing required field 'id': ${JSON.stringify(agent)}`);
        continue;
      }

      agents.push({
        id: agent.id,
        name: agent.name,
        workspace: agent.workspace ?? "",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ENOENT")) {
      errors.push(`openclaw.json not found at ${configFile}`);
    } else {
      errors.push(`Failed to read openclaw.json: ${message}`);
    }
  }

  return { agents, errors };
}

function getDefaultConfigPath(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  return join(home, ".leclaw", "config.json");
}
