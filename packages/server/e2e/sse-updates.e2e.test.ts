// E2E Test: SSE Real-time Updates
// Tests SSE endpoint and real-time event broadcasting
// Note: SSE is a persistent connection that never "completes" in the traditional sense.
// We use HEAD requests to verify the endpoint exists and returns correct headers.

import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

test.describe("SSE real-time updates", () => {
  test("SSE endpoint is accessible via HEAD request", async ({ page }) => {
    // HEAD requests don't have a body and complete immediately
    // This verifies the endpoint exists and returns correct headers
    const response = await page.request.fetch("http://127.0.0.1:4396/api/events", {
      method: "HEAD",
      headers: { Accept: "text/event-stream" },
    });

    // Should return 200 with text/event-stream content type
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/event-stream");
  });

  test("SSE endpoint returns event-stream content type", async () => {
    // Use curl via Bash to test SSE endpoint - it handles streaming properly
    // Make request and get headers only
    const output = execSync(
      `curl -s -I -X GET "http://127.0.0.1:4396/api/events" -H "Accept: text/event-stream" 2>/dev/null`,
      { encoding: 'utf8' }
    );

    // Verify the response contains expected SSE headers
    expect(output).toContain("HTTP/1.1 200 OK");
    expect(output).toContain("Content-Type: text/event-stream");
  });
});
