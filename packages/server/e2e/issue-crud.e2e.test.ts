// E2E Test: Issue CRUD + SSE
// Tests Issue CRUD operations via REST API

import { test, expect } from "@playwright/test";

const ISSUE_TITLE = `E2E-Issue-${Date.now()}`;

test.describe("Issue CRUD", () => {
  let companyId: string;
  let departmentId: string;
  let issueId: string;

  test.beforeAll(async ({ page }) => {
    // Setup: create company and department
    const companyRes = await page.request.post("/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For issue test" },
    });
    const companyBody = await companyRes.json();
    companyId = companyBody.data.id;

    const deptRes = await page.request.post(`/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept for Issues", description: "Issue test department" },
    });
    const deptBody = await deptRes.json();
    departmentId = deptBody.data.id;
  });

  test("create issue", async ({ page }) => {
    const res = await page.request.post(`/api/companies/${companyId}/issues`, {
      data: {
        title: ISSUE_TITLE,
        description: "Test issue description",
        status: "Open",
        departmentId,
      },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("title", ISSUE_TITLE);
    expect(body.data).toHaveProperty("status", "Open");
    issueId = body.data.id;
  });

  test("list issues", async ({ page }) => {
    const res = await page.request.get(`/api/companies/${companyId}/issues`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.some((i: { title: string }) => i.title === ISSUE_TITLE)).toBe(true);
  });

  test("get issue by id", async ({ page }) => {
    const res = await page.request.get(`/api/companies/${companyId}/issues/${issueId}`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("id", issueId);
    expect(body.data).toHaveProperty("title", ISSUE_TITLE);
  });

  test("update issue status", async ({ page }) => {
    const res = await page.request.put(`/api/companies/${companyId}/issues/${issueId}`, {
      data: { status: "InProgress" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("status", "InProgress");
  });

  test("update issue fields", async ({ page }) => {
    const res = await page.request.put(`/api/companies/${companyId}/issues/${issueId}`, {
      data: {
        title: "Updated Issue Title",
        description: "Updated description",
      },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("title", "Updated Issue Title");
    expect(body.data).toHaveProperty("description", "Updated description");
  });

  test("delete issue", async ({ page }) => {
    const res = await page.request.delete(`/api/companies/${companyId}/issues/${issueId}`);
    expect(res.ok()).toBe(true);
  });
});