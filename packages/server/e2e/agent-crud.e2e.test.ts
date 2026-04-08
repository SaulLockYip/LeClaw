// E2E Test: Agent CRUD
// Tests Agent creation and retrieval via REST API

import { test, expect } from "@playwright/test";

const TEST_AGENT_NAME = `TestAgent-${Date.now()}`;

test.describe("Agent CRUD", () => {
  let companyId: string;
  let agentId: string;

  test.beforeEach(async ({ page }) => {
    // Create company first
    const res = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Agent-Company-${Date.now()}`, description: "For agent test" },
    });
    const body = await res.json();
    companyId = body.data.id;
  });

  test("create agent", async ({ page }) => {
    const res = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/agents`, {
      data: {
        name: TEST_AGENT_NAME,
        role: "CEO",
        openClawAgentId: `openclaw-agent-${Date.now()}`,
      },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("name", TEST_AGENT_NAME);
    expect(body.data).toHaveProperty("role", "CEO");
    agentId = body.data.id;
  });

  test("list agents for company", async ({ page }) => {
    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/agents`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.some((a: { name: string }) => a.name === TEST_AGENT_NAME)).toBe(true);
  });

  test("get agent by id", async ({ page }) => {
    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/agents/${agentId}`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("id", agentId);
    expect(body.data).toHaveProperty("name", TEST_AGENT_NAME);
  });

  test("update agent", async ({ page }) => {
    const res = await page.request.put(`http://127.0.0.1:4396/api/companies/${companyId}/agents/${agentId}`, {
      data: { name: "UpdatedAgentName" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("name", "UpdatedAgentName");
  });
});
