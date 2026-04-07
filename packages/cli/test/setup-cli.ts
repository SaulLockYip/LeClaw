// CLI Integration Test Setup
// Sets up test environment for CLI tests

import { rmSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Test home directory for isolated CLI tests
export const TEST_HOME_DIR = join(process.env.TMPDIR ?? "/tmp", `leclaw-cli-test-${process.pid}`);

export function setupTestHome(): string {
  const configDir = join(TEST_HOME_DIR, ".leclaw");
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  return configDir;
}

export function createTestConfig(config: Record<string, unknown>): void {
  const configDir = setupTestHome();
  const configPath = join(configDir, "config.json");
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function cleanupTestHome(): void {
  if (existsSync(TEST_HOME_DIR)) {
    try {
      rmSync(TEST_HOME_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
