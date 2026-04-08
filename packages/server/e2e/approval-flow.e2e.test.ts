// E2E Test: Approval Flow
// Tests Approval creation and status updates via REST API

import { test, expect } from "@playwright/test";

test.describe("Approval flow", () => {
  let companyId: string;
  let agentId: string;
  let approvalId: string;

  test.beforeEach(async ({ page }) => {
    // Setup: create company
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For approval test" },
    });
    const companyBody = await companyRes.json();
    companyId = companyBody.data.id;

    // Create agent for requester
    const agentRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/agents`, {
      data: {
        name: "TestAgent",
        role: "CEO",
        openClawAgentId: `test-agent-${Date.now()}`,
      },
    });
    if (agentRes.ok()) {
      const agentBody = await agentRes.json();
      agentId = agentBody.data.id;
    }
  });

  test("create approval via API", async ({ page }) => {
    const res = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/approvals`, {
      data: {
        title: "E2E Test Approval",
        description: "Please approve this test request",
        status: "Pending",
        requester: agentId,
      },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("title", "E2E Test Approval");
    expect(body.data).toHaveProperty("status", "Pending");
    approvalId = body.data.id;
  });

  test("list approvals", async ({ page }) => {
    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/approvals`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
  });

  test("get approval by id", async ({ page }) => {
    const res = await page.request.get(
      `http://127.0.0.1:4396/api/companies/${companyId}/approvals/${approvalId}`
    );
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("id", approvalId);
    expect(body.data).toHaveProperty("title", "E2E Test Approval");
  });

  test("approve approval via PUT", async ({ page }) => {
    const res = await page.request.put(
      `http://127.0.0.1:4396/api/companies/${companyId}/approvals/${approvalId}`,
      {
        data: { status: "Approved" },
      }
    );
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("status", "Approved");
  });

  test("reject approval via PUT with reason", async ({ page }) => {
    // Create another approval for reject test
    const res = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/approvals`, {
      data: {
        title: "E2E Reject Test",
        description: "This should be rejected",
        status: "Pending",
        requester: agentId,
      },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    const rejectApprovalId = body.data.id;

    const rejectRes = await page.request.put(
      `http://127.0.0.1:4396/api/companies/${companyId}/approvals/${rejectApprovalId}`,
      {
        data: {
          status: "Rejected",
          rejectMessage: "Test rejection reason",
        },
      }
    );
    expect(rejectRes.ok()).toBe(true);

    const rejectBody = await rejectRes.json();
    expect(rejectBody.data).toHaveProperty("status", "Rejected");
    expect(rejectBody.data).toHaveProperty("rejectMessage", "Test rejection reason");
  });
});