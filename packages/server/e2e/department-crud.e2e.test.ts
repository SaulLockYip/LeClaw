// E2E Test: Department CRUD
// Tests Department CRUD operations via REST API
// Each test is fully independent - creates its own company and department

import { test, expect } from "@playwright/test";

test.describe("Department CRUD", () => {
  test("create department", async ({ page }) => {
    // Create company first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For dept test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptName = `E2E-Department-${Date.now()}`;
    const res = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: deptName, description: "Test department" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("name", deptName);
    expect(body.data).toHaveProperty("companyId", companyId);
  });

  test("list departments for company", async ({ page }) => {
    // Create company and department first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For dept test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptName = `E2E-Department-${Date.now()}`;
    await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: deptName, description: "Test department" },
    });

    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}/departments`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.some((d: { name: string }) => d.name === deptName)).toBe(true);
  });

  test("get department by id", async ({ page }) => {
    // Create company and department first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For dept test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: `E2E-Department-${Date.now()}`, description: "Test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const res = await page.request.get(
      `http://127.0.0.1:4396/api/companies/${companyId}/departments/${departmentId}`
    );
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("id", departmentId);
  });

  test("update department", async ({ page }) => {
    // Create company and department first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For dept test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: `E2E-Department-${Date.now()}`, description: "Test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const res = await page.request.put(
      `http://127.0.0.1:4396/api/companies/${companyId}/departments/${departmentId}`,
      { data: { description: "Updated dept description" } }
    );
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.data).toHaveProperty("description", "Updated dept description");
  });

  test("delete department", async ({ page }) => {
    // Create company and department first
    const companyRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: `E2E-Company-${Date.now()}`, description: "For dept test" },
    });
    const companyBody = await companyRes.json();
    const companyId = companyBody.data.id;

    const deptRes = await page.request.post(`http://127.0.0.1:4396/api/companies/${companyId}/departments`, {
      data: { name: `E2E-Department-${Date.now()}`, description: "Test department" },
    });
    const deptBody = await deptRes.json();
    const departmentId = deptBody.data.id;

    const res = await page.request.delete(
      `http://127.0.0.1:4396/api/companies/${companyId}/departments/${departmentId}`
    );
    expect(res.ok()).toBe(true);
  });
});
