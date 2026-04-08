// E2E Test: Company CRUD
// Tests all Company CRUD operations via REST API
// Each test is fully independent

import { test, expect } from "@playwright/test";

test.describe("Company CRUD", () => {
  test("create company", async ({ page }) => {
    const companyName = `E2E-Company-${Date.now()}`;
    const res = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: companyName, description: "Test company for E2E" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toHaveProperty("name", companyName);
    expect(body.data).toHaveProperty("description", "Test company for E2E");
    expect(body.data).toHaveProperty("id");
  });

  test("list companies", async ({ page }) => {
    const res = await page.request.get("http://127.0.0.1:4396/api/companies");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toBeInstanceOf(Array);
  });

  test("get company by id", async ({ page }) => {
    // Create a company first
    const companyName = `E2E-Company-${Date.now()}`;
    const createRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: companyName, description: "Test company for E2E" },
    });
    const createBody = await createRes.json();
    const companyId = createBody.data.id;

    const res = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toHaveProperty("id", companyId);
    expect(body.data).toHaveProperty("name", companyName);
  });

  test("update company", async ({ page }) => {
    // Create a company first
    const companyName = `E2E-Company-${Date.now()}`;
    const createRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: companyName, description: "Test company for E2E" },
    });
    const createBody = await createRes.json();
    const companyId = createBody.data.id;

    const res = await page.request.put(`http://127.0.0.1:4396/api/companies/${companyId}`, {
      data: { description: "Updated description" },
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body.data).toHaveProperty("description", "Updated description");
  });

  test("delete company", async ({ page }) => {
    // Create a company first
    const companyName = `E2E-Company-${Date.now()}`;
    const createRes = await page.request.post("http://127.0.0.1:4396/api/companies", {
      data: { name: companyName, description: "Test company for E2E" },
    });
    const createBody = await createRes.json();
    const companyId = createBody.data.id;

    const res = await page.request.delete(`http://127.0.0.1:4396/api/companies/${companyId}`);
    expect(res.ok()).toBe(true);

    // Verify deletion
    const getRes = await page.request.get(`http://127.0.0.1:4396/api/companies/${companyId}`);
    expect(getRes.status()).toBe(404);
  });
});
