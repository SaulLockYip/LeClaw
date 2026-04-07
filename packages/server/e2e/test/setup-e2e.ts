// E2E Test Setup - runs before all E2E tests
// Sets up test environment and cleans up after

import { rmSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Test database path
const TEST_DB_DIR = join(process.env.TMPDIR ?? "/tmp", `leclaw-e2e-test-${process.pid}`);

export async function setup(): Promise<void> {
  // Create test db directory
  if (!existsSync(TEST_DB_DIR)) {
    mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  // Set environment for test
  process.env.LECLAW_E2E_TEST = "true";
}

export async function teardown(): Promise<void> {
  // Cleanup test db directory
  if (existsSync(TEST_DB_DIR)) {
    try {
      rmSync(TEST_DB_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

export { TEST_DB_DIR };