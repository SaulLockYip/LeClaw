// E2E Test: Issue CRUD + SSE
// Tests Issue CRUD operations via REST API
// Each test is fully independent - creates its own company, department, and issue

import { test, expect } from "@playwright/test";

test.describe("Issue CRUD", () => {
  test("create issue", async ({ page }) => {
    // Setup: create company and department
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For issue test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept for Issues", description: "Issue test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const issueTitle = `E2E-Issue-${Date.now()}`;
    const res = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/issues`, {
      data: {
        title: issueTitle,
        description: "Test issue description",
        status: "Open",
        departmentId,
      },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("title", issueTitle);
    expect(body.data).toHaveProperty("status", "Open");
  });

  test("list issues", async ({ page }) => {
    // Setup: create company, department, and issue
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For issue test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept for Issues", description: "Issue test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const issueTitle = `E2E-Issue-${Date.now()}`;
    await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/issues`, {
      data: {
        title: issueTitle,
        description: "Test issue description",
        status: "Open",
        departmentId,
      },
    });

    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/issues`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.some((i: { title: string }) => i.title === issueTitle)).toBe(true);
  });

  test("get issue by id", async ({ page }) => {
    // Setup: create company, department, and issue
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For issue test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept for Issues", description: "Issue test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const issueTitle = `E2E-Issue-${Date.now()}`;
    const issueRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/issues`, {
      data: {
        title: issueTitle,
        description: "Test issue description",
        status: "Open",
        departmentId,
      },
    });
    const issueBody = await issueRes.json();
    const issueId = issueBody.data.id;

    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/issues/${issueId}`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("id", issueId);
    expect(body.data).toHaveProperty("title", issueTitle);
  });

  test("update issue status", async ({ page }) => {
    // Setup: create company, department, and issue
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For issue test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept for Issues", description: "Issue test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const issueRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/issues`, {
      data: {
        title: `E2E-Issue-${Date.now()}`,
        description: "Test issue description",
        status: "Open",
        departmentId,
      },
    });
    const issueBody = await issueRes.json();
    const issueId = issueBody.data.id;

    const res = await page.request.put(`http://127.0.0.1:4396/api/companies/${companyId}/issues/${issueId}`, {
      data: { status: "InProgress" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("status", "InProgress");
  });

  test("update issue fields", async ({ page }) => {
    // Setup: create company, department, and issue
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For issue test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept for Issues", description: "Issue test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const issueRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/issues`, {
      data: {
        title: `E2E-Issue-${Date.now()}`,
        description: "Test issue description",
        status: "Open",
        departmentId,
      },
    });
    const issueBody = await issueRes.json();
    const issueId = issueBody.data.id;

    const res = await page.request.put(`http://127.0.0.1:4396/api/companies/${companyId}/issues/${issueId}`, {
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
    // Setup: create company, department, and issue
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For issue test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept for Issues", description: "Issue test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const issueRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/issues`, {
      data: {
        title: `E2E-Issue-${Date.now()}`,
        description: "Test issue description",
        status: "Open",
        departmentId,
      },
    });
    const issueBody = await issueRes.json();
    const issueId = issueBody.data.id;

    const res = await page.request.delete(`http://127.0.0.1:4396/api/companies/${companyId}/issues/${issueId}`);
    expect(res.ok()).toBe(true);
  });
});
