// E2E Test: Department CRUD
// Tests Department CRUD operations via REST API with companyId isolation

import { test, expect } from "@playwright/test";

const DEPT_NAME = `E2E-Department-${Date.now()}`;

test.describe("Department CRUD", () => {
  let companyId: string;
  let departmentId: string;

  test.beforeEach(async ({ page }) => {
    // Create company first
    const res = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For dept test" },
    });
    const body = await res.json();
    companyId = body.data.id;
  });

  test("create department", async ({ page }) => {
    const res = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: DEPT_NAME, description: "Test department" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("name", DEPT_NAME);
    expect(body.data).toHaveProperty("companyId", companyId);
    departmentId = body.data.id;
  });

  test("list departments for company", async ({ page }) => {
    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/departments`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.some((d: { name: string }) => d.name === DEPT_NAME)).toBe(true);
  });

  test("get department by id", async ({ page }) => {
    const res = await page.request.get(
      `http://127.0.0.1:4396/api/companies/${companyId}/departments/${departmentId}`
    );
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("id", departmentId);
  });

  test("update department", async ({ page }) => {
    const res = await page.request.put(
      `http://127.0.0.1:4396/api/companies/${companyId}/departments/${departmentId}`,
      { data: { description: "Updated dept description" } }
    );
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("description", "Updated dept description");
  });

  test("delete department", async ({ page }) => {
    const res = await page.request.delete(
      `http://127.0.0.1:4396/api/companies/${companyId}/departments/${departmentId}`
    );
    expect(res.ok()).toBe(true);
  });
});
