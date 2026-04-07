// E2E Test: Company CRUD
// Tests all Company CRUD operations via REST API

import { test, expect } from "@playwright/test";

const COMPANY_NAME = `E2E-Company-${Date.now()}`;

test.describe("Company CRUD", () => {
  let companyId: string;

  test("create company", async ({ page }) => {
    const res = await page.request.post("/api/companies", {
      data: { name: COMPANY_NAME, description: "Test company for E2E" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toHaveProperty("name", COMPANY_NAME);
    expect(body.data).toHaveProperty("description", "Test company for E2E");
    expect(body.data).toHaveProperty("id");
    companyId = body.data.id;
  });

  test("list companies", async ({ page }) => {
    const res = await page.request.get("/api/companies");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test("get company by id", async ({ page }) => {
    const res = await page.request.get(`/api/companies/${companyId}`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toHaveProperty("id", companyId);
    expect(body.data).toHaveProperty("name", COMPANY_NAME);
  });

  test("update company", async ({ page }) => {
    const res = await page.request.put(`/api/companies/${companyId}`, {
      data: { description: "Updated description" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toHaveProperty("description", "Updated description");
  });

  test("delete company", async ({ page }) => {
    const res = await page.request.delete(`/api/companies/${companyId}`);
    expect(res.ok()).toBe(true);

    // Verify deletion
    const getRes = await page.request.get(`/api/companies/${companyId}`);
    expect(getRes.status).toBe(404);
  });
});