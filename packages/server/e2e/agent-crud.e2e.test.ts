// E2E Test: Agent CRUD
// Tests Agent creation and retrieval via REST API
// Each test is fully independent - creates its own company and agent

import { test, expect } from "@playwright/test";

test.describe("Agent CRUD", () => {
  test("create agent", async ({ page }) => {
    // Create company first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Agent-Company-${Date.now()}`, description: "For agent test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const agentName = `TestAgent-${Date.now()}`;
    const res = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/agents`, {
      data: {
        name: agentName,
        role: "CEO",
        openClawAgentId: `openclaw-agent-${Date.now()}`,
      },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("name", agentName);
    expect(body.data).toHaveProperty("role", "CEO");
  });

  test("list agents for company", async ({ page }) => {
    // Create company and agent first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Agent-Company-${Date.now()}`, description: "For agent test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const agentName = `TestAgent-${Date.now()}`;
    await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/agents`, {
      data: {
        name: agentName,
        role: "CEO",
        openClawAgentId: `openclaw-agent-${Date.now()}`,
      },
    });

    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/agents`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.some((a: { name: string }) => a.name === agentName)).toBe(true);
  });

  test("get agent by id", async ({ page }) => {
    // Create company and agent first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Agent-Company-${Date.now()}`, description: "For agent test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const agentName = `TestAgent-${Date.now()}`;
    const agentRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/agents`, {
      data: {
        name: agentName,
        role: "CEO",
        openClawAgentId: `openclaw-agent-${Date.now()}`,
      },
    });
    const agentBody = await agentRes.json();
    const agentId = agentBody.data.id;

    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/agents/${agentId}`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("id", agentId);
    expect(body.data).toHaveProperty("name", agentName);
  });

  test("update agent", async ({ page }) => {
    // Create company and agent first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Agent-Company-${Date.now()}`, description: "For agent test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const agentRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/agents`, {
      data: {
        name: `TestAgent-${Date.now()}`,
        role: "CEO",
        openClawAgentId: `openclaw-agent-${Date.now()}`,
      },
    });
    const agentBody = await agentRes.json();
    const agentId = agentBody.data.id;

    const res = await page.request.put(`http://127.0.0.1:4396/api/companies/${companyId}/agents/${agentId}`, {
      data: { name: "UpdatedAgentName" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("name", "UpdatedAgentName");
  });
});
