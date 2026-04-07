import JSON5 from "json5";
import { atomicWriteFile } from "./atomic-write.js";
import { DEFAULT_CONFIG, type LeClawConfig } from "../types/config.js";
import fs from "node:fs";
import path from "node:path";

export interface ConfigLoadOptions {
  configPath: string;
  fsModule?: typeof fs;
}

export function loadConfig(options: ConfigLoadOptions): LeClawConfig {
  const { configPath, fsModule = fs } = options;
  const defaults = { ...DEFAULT_CONFIG };

  if (!fsModule.existsSync(configPath)) {
    return { ...defaults } as LeClawConfig;
  }

  try {
    const raw = fsModule.readFileSync(configPath, "utf-8");
    const parsed = JSON5.parse(raw);
    return { ...defaults, ...parsed } as LeClawConfig;
  } catch {
    return { ...defaults } as LeClawConfig;
  }
}

export interface ConfigWriteOptions {
  configPath: string;
  config: LeClawConfig;
  fsModule?: typeof fs;
}

export async function writeConfig(options: ConfigWriteOptions): Promise<void> {
  const { configPath, config, fsModule = fs } = options;
  const dir = path.dirname(configPath);

  if (!fsModule.existsSync(dir)) {
    fsModule.mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(config, null, 2);
  await atomicWriteFile({ filePath: configPath, content: json, fsModule });
}
