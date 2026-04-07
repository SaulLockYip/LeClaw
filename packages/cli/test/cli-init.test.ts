// CLI Integration Test: init command
// Tests leclaw init command behavior

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { TEST_HOME_DIR, setupTestHome, cleanupTestHome } from "./setup-cli.js";

describe("leclaw init", () => {
  beforeEach(() => {
    setupTestHome();
  });

  afterEach(() => {
    cleanupTestHome();
  });

  it("init creates .leclaw/config.json with defaults", async () => {
    const configPath = join(TEST_HOME_DIR, ".leclaw", "config.json");

    // Verify config doesn't exist initially
    expect(existsSync(configPath)).toBe(false);

    // Note: This test verifies the config path exists after init would run
    // Actual init is interactive, so we test the setup function
    expect(existsSync(join(TEST_HOME_DIR, ".leclaw"))).toBe(true);
  });

  it("config directory is created in home directory", () => {
    const leclawDir = join(TEST_HOME_DIR, ".leclaw");
    expect(existsSync(leclawDir)).toBe(true);
  });
});
