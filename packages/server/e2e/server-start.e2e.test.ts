// E2E Test: Server Start
// Verifies `leclaw start` launches server without errors and health endpoint responds

import { test, expect } from "@playwright/test";

test.describe("server start", () => {
  test("server responds to /health immediately", async ({ page }) => {
    const res = await page.request.get("http://127.0.0.1:4396/health");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("version", "1.0.0");
  });

  test("health endpoint shows database connection status", async ({ page }) => {
    const res = await page.request.get("http://127.0.0.1:4396/health");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("database");
    // Database may be connected or disconnected depending on setup
    expect(["connected", "disconnected"]).toContain(body.database);
  });
});