# Phase 8: Integration + Testing — Implementation Plan

**Phase:** 08-integration-testing
**Status:** Ready for implementation
**Created:** 2026-04-07

---

## 1. Overview

Phase 8 validates all preceding phases through end-to-end integration tests. The test suite confirms:
- `leclaw start` launches server without errors
- `leclaw init` flow works correctly
- All CRUD operations work via REST API
- Agent onboard flow: Web UI binding + CLI onboard + API key returned
- SSE real-time updates reflect in Web UI
- Approval flow: create via CLI, approve/reject via Web UI
- Drizzle Kit migrations run automatically at startup

---

## 2. Test Infrastructure

### 2.1 Playwright E2E Configuration

**File:** `packages/server/e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.LECLAW_E2E_PORT ?? 8080);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.e2e.test.ts",
  timeout: 120_000,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  // webServer starts leclaw server before tests
  webServer: {
    command: `pnpm leclaw start`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  outputDir: "./test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "./playwright-report" }]],
});
```

### 2.2 Vitest E2E Configuration

**File:** `packages/server/e2e/vitest.e2e.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import baseConfig from "../../../vitest.config.ts";

export default defineConfig({
  ...baseConfig,
  test: {
    ...(baseConfig as { test?: Record<string, unknown> }).test,
    include: ["**/*.e2e.test.ts"],
    setupFiles: ["test/setup-e2e.ts"],
    globals: true,
  },
});
```

### 2.3 E2E Test Setup File

**File:** `packages/server/e2e/test/setup-e2e.ts`

- Global teardown: kill any stray `leclaw start` processes on port 8080
- BeforeAll: run `leclaw init` in non-interactive mode with test config
- BeforeEach: ensure database is clean (truncate tables)
- AfterAll: stop any spawned server processes

### 2.4 CLI Integration Test Setup

**File:** `packages/cli/test/setup-cli.ts`

- Mock `~/.leclaw/` config directory with test config
- Mock `~/.leclaw/db/` as temp directory

---

## 3. Test Suite Structure

### 3.1 Directory Layout

```
packages/server/e2e/
├── playwright.config.ts
├── vitest.e2e.config.ts
├── test/
│   └── setup-e2e.ts
├── init-flow.e2e.test.ts
├── server-start.e2e.test.ts
├── company-crud.e2e.test.ts
├── department-crud.e2e.test.ts
├── agent-onboard.e2e.test.ts
├── issue-crud.e2e.test.ts
├── sse-updates.e2e.test.ts
└── approval-flow.e2e.test.ts

packages/cli/test/
├── setup-cli.ts
├── cli-init.test.ts
└── cli-agent-onboard.test.ts
```

---

## 4. Drizzle Kit Migration at Startup

### 4.1 Migration Generation

**File:** `packages/server/src/db/migrate.ts`

```typescript
import { drizzle } from "drizzle-orm/...";
import { migrate } from "drizzle-orm/...";
import { join } from "node:path";
import { existsSync } from "node:fs";

export async function runMigrations() {
  const db = drizzle(/* connection */);
  const migrationsFolder = join(__dirname, "../../migrations");

  if (!existsSync(migrationsFolder)) {
    console.warn("No migrations folder found, skipping migrations");
    return;
  }

  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully");
}
```

### 4.2 Startup Integration

**File:** `packages/server/src/index.ts` (or `src/runtime.ts`)

- Call `runMigrations()` before starting HTTP server
- On migration failure: log error and exit with code 1
- Wrap in try/catch; do not silently ignore migration errors

### 4.3 Drizzle Kit Config

**File:** `packages/server/drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/leclaw",
  },
});
```

### 4.4 Generate Migrations Command

```bash
# Add to package.json scripts
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
```

---

## 5. Test Cases

### 5.1 leclaw init Flow Test

**File:** `packages/server/e2e/init-flow.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("leclaw init flow", () => {
  test("init creates ~/.leclaw/ directory and config.json", async ({ page }) => {
    // Run leclaw init in temp directory mode
    await page.goto("/"); // Redirects to init if no config

    // If no existing config, wizard should appear
    const wizardHeading = page.locator("h3", { hasText: "Name your company" });

    // Company name step
    const companyNameInput = page.locator('input[placeholder="Acme Corp"]');
    await companyNameInput.fill("Test Company");

    const nextButton = page.getByRole("button", { name: "Next" });
    await nextButton.click();

    // Verify API: company was created
    const res = await page.request.get("/api/companies");
    expect(res.ok()).toBe(true);
    const companies = await res.json();
    expect(companies.some((c: { name: string }) => c.name === "Test Company")).toBe(true);
  });
});
```

### 5.2 leclaw start Server Test

**File:** `packages/server/e2e/server-start.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";

test.describe("server start", () => {
  test("leclaw start launches without errors", async () => {
    const proc = spawn("pnpm", ["leclaw", "start"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Wait for server to be ready
    const maxWait = 30_000;
    const startTime = Date.now();
    let serverReady = false;

    proc.stdout?.on("data", (data) => {
      if (data.toString().includes("Server listening")) {
        serverReady = true;
      }
    });

    while (!serverReady && Date.now() - startTime < maxWait) {
      try {
        const res = await fetch("http://127.0.0.1:8080/api/health");
        if (res.ok) {
          serverReady = true;
          break;
        }
      } catch {
        // Not ready yet
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(serverReady).toBe(true);

    // Verify health endpoint
    const healthRes = await fetch("http://127.0.0.1:8080/api/health");
    expect(healthRes.ok()).toBe(true);

    // Verify companies endpoint (authenticated implicitly)
    const companiesRes = await fetch("http://127.0.0.1:8080/api/companies");
    expect(companiesRes.status).toBeGreaterThanOrEqual(200);

    proc.kill();
  });

  test("server responds to /api/health immediately", async ({ page }) => {
    const res = await page.request.get("/api/health");
    expect(res.ok()).toBe(true);
  });
});
```

### 5.3 Company CRUD E2E

**File:** `packages/server/e2e/company-crud.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";

const COMPANY_NAME = `E2E-Company-${Date.now()}`;

test.describe("Company CRUD", () => {
  let companyId: string;

  test("create company", async ({ page }) => {
    const res = await page.request.post("/api/companies", {
      data: { name: COMPANY_NAME, description: "Test company" },
    });
    expect(res.ok()).toBe(true);
    const company = await res.json();
    expect(company.name).toBe(COMPANY_NAME);
    expect(company.id).toBeTruthy();
    companyId = company.id;
  });

  test("list companies", async ({ page }) => {
    const res = await page.request.get("/api/companies");
    expect(res.ok()).toBe(true);
    const companies = await res.json();
    expect(Array.isArray(companies)).toBe(true);
  });

  test("get company by id", async ({ page }) => {
    const res = await page.request.get(`/api/companies/${companyId}`);
    expect(res.ok()).toBe(true);
    const company = await res.json();
    expect(company.id).toBe(companyId);
    expect(company.name).toBe(COMPANY_NAME);
  });

  test("update company", async ({ page }) => {
    const res = await page.request.patch(`/api/companies/${companyId}`, {
      data: { description: "Updated description" },
    });
    expect(res.ok()).toBe(true);
    const company = await res.json();
    expect(company.description).toBe("Updated description");
  });

  test("delete company", async ({ page }) => {
    const res = await page.request.delete(`/api/companies/${companyId}`);
    expect(res.ok()).toBe(true);

    // Verify deletion
    const getRes = await page.request.get(`/api/companies/${companyId}`);
    expect(getRes.status).toBe(404);
  });
});
```

### 5.4 Department CRUD E2E

**File:** `packages/server/e2e/department-crud.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Department CRUD", () => {
  let companyId: string;
  let departmentId: string;
  const DEPT_NAME = `E2E-Department-${Date.now()}`;

  test.beforeAll(async ({ page }) => {
    // Create company first
    const res = await page.request.post("/api/companies", {
      data: { name: `E2E-Company-${Date.now()}` },
    });
    const company = await res.json();
    companyId = company.id;
  });

  test("create department", async ({ page }) => {
    const res = await page.request.post(`/api/companies/${companyId}/departments`, {
      data: { name: DEPT_NAME, description: "Test department" },
    });
    expect(res.ok()).toBe(true);
    const dept = await res.json();
    expect(dept.name).toBe(DEPT_NAME);
    expect(dept.companyId).toBe(companyId);
    departmentId = dept.id;
  });

  test("list departments for company", async ({ page }) => {
    const res = await page.request.get(`/api/companies/${companyId}/departments`);
    expect(res.ok()).toBe(true);
    const depts = await res.json();
    expect(Array.isArray(depts)).toBe(true);
    expect(depts.some((d: { name: string }) => d.name === DEPT_NAME)).toBe(true);
  });

  test("get department by id", async ({ page }) => {
    const res = await page.request.get(
      `/api/companies/${companyId}/departments/${departmentId}`
    );
    expect(res.ok()).toBe(true);
    const dept = await res.json();
    expect(dept.id).toBe(departmentId);
  });

  test("update department", async ({ page }) => {
    const res = await page.request.patch(
      `/api/companies/${companyId}/departments/${departmentId}`,
      { data: { description: "Updated dept description" } }
    );
    expect(res.ok()).toBe(true);
    const dept = await res.json();
    expect(dept.description).toBe("Updated dept description");
  });

  test("delete department", async ({ page }) => {
    const res = await page.request.delete(
      `/api/companies/${companyId}/departments/${departmentId}`
    );
    expect(res.ok()).toBe(true);
  });
});
```

### 5.5 Agent Onboard Flow Test

**File:** `packages/server/e2e/agent-onboard.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

test.describe("Agent onboard flow", () => {
  let companyId: string;
  const TEST_AGENT_ID = `test-agent-${Date.now()}`;

  test.beforeAll(async ({ page }) => {
    // Create test company
    const res = await page.request.post("/api/companies", {
      data: { name: `E2E-Company-${Date.now()}` },
    });
    const company = await res.json();
    companyId = company.id;
  });

  test("onboard CEO agent via CLI and get API key", async () => {
    // 1. Setup mock openclaw.json in temp directory
    const tempDir = join("/tmp", `leclaw-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(join(tempDir, "agent-keys"), { recursive: true });

    const openclawConfig = {
      agents: [
        {
          id: TEST_AGENT_ID,
          name: "TestAgent",
          workspace: tempDir,
        },
      ],
    };
    writeFileSync(
      join(tempDir, "openclaw.json"),
      JSON.stringify(openclawConfig)
    );

    // 2. Set leclaw config to point to temp openclaw dir
    // Note: In real test, we'd use environment variables or test config

    // 3. Run onboard command
    const onboardProc = spawn("pnpm", [
      "leclaw",
      "agent",
      "onboard",
      "--company-id",
      companyId,
      "--agent-id",
      TEST_AGENT_ID,
      "--role",
      "CEO",
    ]);

    let stdout = "";
    let stderr = "";

    onboardProc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    onboardProc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    const exitCode = await new Promise<number>((resolve) => {
      onboardProc.on("close", (code) => resolve(code ?? 1));
    });

    expect(exitCode).toBe(0);
    // API key format: {agentId}:{secret}
    expect(stdout).toMatch(/test-agent-\d+:leclaw_[a-zA-Z0-9]+/);

    // 4. Verify agent binding in DB via API
    const agentsRes = await fetch(`http://127.0.0.1:8080/api/agents`);
    const agents = await agentsRes.json();
    const boundAgent = agents.find(
      (a: { openClawAgentId: string }) => a.openClawAgentId === TEST_AGENT_ID
    );
    expect(boundAgent).toBeTruthy();
    expect(boundAgent.role).toBe("CEO");
    expect(boundAgent.companyId).toBe(companyId);

    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("Web UI shows agent binding after onboard", async ({ page }) => {
    // Open agents page
    await page.goto("/agents");

    // Should see the onboarded agent
    const agentRow = page.locator("text=TestAgent");
    await expect(agentRow).toBeVisible();

    const roleBadge = page.locator('[data-testid="agent-role-badge"]');
    await expect(roleBadge).toHaveText("CEO");
  });
});
```

### 5.6 Issue CRUD + SSE E2E

**File:** `packages/server/e2e/issue-crud.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Issue CRUD + SSE", () => {
  let companyId: string;
  let departmentId: string;
  let issueId: string;
  const ISSUE_TITLE = `E2E-Issue-${Date.now()}`;

  test.beforeAll(async ({ page }) => {
    // Setup: create company and department
    const companyRes = await page.request.post("/api/companies", {
      data: { name: `E2E-Company-${Date.now()}` },
    });
    const company = await companyRes.json();
    companyId = company.id;

    const deptRes = await page.request.post(`/api/companies/${companyId}/departments`, {
      data: { name: "Test Dept" },
    });
    const dept = await deptRes.json();
    departmentId = dept.id;
  });

  test("create issue", async ({ page }) => {
    const res = await page.request.post("/api/issues", {
      data: {
        title: ISSUE_TITLE,
        description: "Test issue description",
        status: "Open",
        departmentId,
        companyId,
      },
    });
    expect(res.ok()).toBe(true);
    const issue = await res.json();
    expect(issue.title).toBe(ISSUE_TITLE);
    issueId = issue.id;
  });

  test("list issues", async ({ page }) => {
    const res = await page.request.get(`/api/issues?companyId=${companyId}`);
    expect(res.ok()).toBe(true);
    const issues = await res.json();
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.some((i: { title: string }) => i.title === ISSUE_TITLE)).toBe(true);
  });

  test("get issue by id", async ({ page }) => {
    const res = await page.request.get(`/api/issues/${issueId}`);
    expect(res.ok()).toBe(true);
    const issue = await res.json();
    expect(issue.id).toBe(issueId);
  });

  test("update issue status", async ({ page }) => {
    const res = await page.request.patch(`/api/issues/${issueId}`, {
      data: { status: "InProgress" },
    });
    expect(res.ok()).toBe(true);
    const issue = await res.json();
    expect(issue.status).toBe("InProgress");
  });

  test("SSE receives issue_updated event", async ({ page }) => {
    // Open SSE connection
    const sseEvents: string[] = [];
    const eventSource = new EventSource("/api/events");

    eventSource.addEventListener("issue_updated", (e) => {
      sseEvents.push(e.data);
    });

    // Wait for connection
    await page.waitForTimeout(1000);

    // Update issue
    await page.request.patch(`/api/issues/${issueId}`, {
      data: { status: "Done" },
    });

    // Wait for SSE event
    await page.waitForTimeout(2000);

    expect(sseEvents.length).toBeGreaterThan(0);
    const eventData = JSON.parse(sseEvents[sseEvents.length - 1]);
    expect(eventData.id).toBe(issueId);
    expect(eventData.status).toBe("Done");

    eventSource.close();
  });
});
```

### 5.7 Approval Flow Test

**File:** `packages/server/e2e/approval-flow.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Approval flow", () => {
  let companyId: string;
  let agentId: string;
  let approvalId: string;

  test.beforeAll(async ({ page }) => {
    // Setup: create company
    const companyRes = await page.request.post("/api/companies", {
      data: { name: `E2E-Company-${Date.now()}` },
    });
    const company = await companyRes.json();
    companyId = company.id;

    // Create agent for requester
    const agentRes = await page.request.post("/api/agents", {
      data: {
        name: "TestAgent",
        role: "CEO",
        companyId,
        openClawAgentId: `test-agent-${Date.now()}`,
      },
    });
    const agent = await agentRes.json();
    agentId = agent.id;
  });

  test("create approval via API (CLI flow)", async ({ page }) => {
    const res = await page.request.post("/api/approvals", {
      data: {
        title: "E2E Test Approval",
        description: "Please approve this test request",
        requester: agentId,
        status: "Pending",
        companyId,
      },
    });
    expect(res.ok()).toBe(true);
    const approval = await res.json();
    expect(approval.title).toBe("E2E Test Approval");
    expect(approval.status).toBe("Pending");
    approvalId = approval.id;
  });

  test("approve via Web UI", async ({ page }) => {
    await page.goto("/approvals");

    // Find the approval row
    const approvalRow = page.locator(`[data-approval-id="${approvalId}"]`);
    await expect(approvalRow).toBeVisible();

    // Click approve button
    const approveBtn = approvalRow.locator('button[data-action="approve"]');
    await approveBtn.click();

    // Confirmation dialog should appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("text=E2E Test Approval")).toBeVisible();

    // Confirm approve
    await dialog.locator('button:has-text("Approve")').click();

    // Verify status changed
    await page.waitForTimeout(1000);
    const res = await page.request.get(`/api/approvals/${approvalId}`);
    const approval = await res.json();
    expect(approval.status).toBe("Approved");
  });

  test("reject via Web UI", async ({ page }) => {
    // Create another approval for reject test
    const res = await page.request.post("/api/approvals", {
      data: {
        title: "E2E Reject Test",
        requester: agentId,
        status: "Pending",
        companyId,
      },
    });
    const approval = await res.json();

    await page.goto("/approvals");

    // Find and reject
    const approvalRow = page.locator(`[data-approval-id="${approval.id}"]`);
    await approvalRow.locator('button[data-action="reject"]').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill in reject reason
    await dialog.locator('textarea[name="reason"]').fill("Test rejection reason");

    // Confirm reject
    await dialog.locator('button:has-text("Reject")').click();

    // Verify status changed
    await page.waitForTimeout(1000);
    const getRes = await page.request.get(`/api/approvals/${approval.id}`);
    const updatedApproval = await getRes.json();
    expect(updatedApproval.status).toBe("Rejected");
    expect(updatedApproval.rejectMessage).toBe("Test rejection reason");
  });
});
```

### 5.8 SSE Real-time Updates E2E

**File:** `packages/server/e2e/sse-updates.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("SSE real-time updates", () => {
  let companyId: string;

  test.beforeAll(async ({ page }) => {
    const res = await page.request.post("/api/companies", {
      data: { name: `E2E-SSE-${Date.now()}` },
    });
    const company = await res.json();
    companyId = company.id;
  });

  test("SSE connection receives company_created event", async ({ page }) => {
    const receivedEvents: Record<string, boolean> = {};

    // We use page.evaluate to create EventSource since browser context is needed
    await page.goto("/dashboard");

    await page.evaluate(() => {
      (window as unknown as { sseEvents: string[] }).sseEvents = [];
      const es = new EventSource("/api/events");
      es.addEventListener("company_created", (e) => {
        (window as unknown as { sseEvents: string[] }).sseEvents.push("company_created");
      });
      (window as unknown as { eventSource: EventSource }).eventSource = es;
    });

    await page.waitForTimeout(500);

    // SSE should be connected (heartbeat will arrive)
    // Create company via API
    const res = await page.request.post("/api/companies", {
      data: { name: `SSE-Test-${Date.now()}` },
    });
    expect(res.ok()).toBe(true);

    // Wait for event
    await page.waitForTimeout(2000);

    const events: string[] = await page.evaluate(
      () => (window as unknown as { sseEvents: string[] }).sseEvents
    );
    expect(events).toContain("company_created");

    // Cleanup
    await page.evaluate(() => {
      (window as unknown as { eventSource: EventSource }).eventSource?.close();
    });
  });

  test("SSE includes heartbeat comments", async ({ page }) => {
    // Use raw fetch to check SSE stream for heartbeat comments
    const res = await page.request.get("/api/events", {
      headers: { Accept: "text/event-stream" },
    });

    expect(res.ok()).toBe(true);

    // Read chunks from SSE stream
    const body = res.body();
    expect(body).toBeTruthy();

    let heartbeatFound = false;
    const reader = body!.getReader();
    const decoder = new TextDecoder();

    while (!heartbeatFound) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.includes("<!-- heartbeat -->")) {
        heartbeatFound = true;
        break;
      }
    }

    expect(heartbeatFound).toBe(true);
  });
});
```

---

## 6. CLI Integration Tests

### 6.1 CLI Init Test

**File:** `packages/cli/test/cli-init.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("leclaw init", () => {
  const testHome = join("/tmp", `leclaw-cli-test-${Date.now()}`);

  beforeEach(() => {
    mkdirSync(testHome, { recursive: true });
  });

  afterEach(() => {
    rmSync(testHome, { recursive: true, force: true });
  });

  it("creates ~/.leclaw/config.json with defaults", async () => {
    const proc = spawn("pnpm", ["leclaw", "init"], {
      env: { ...process.env, HOME: testHome },
      input: "\n\n\n\n", // Enter for defaults
    });

    const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve) => {
      let out = "";
      let err = "";
      proc.stdout?.on("data", (d) => (out += d.toString()));
      proc.stderr?.on("data", (d) => (err += d.toString()));
      proc.on("close", () => resolve({ stdout: out, stderr: err }));
    });

    expect(proc.exitCode).toBe(0);

    const configPath = join(testHome, ".leclaw", "config.json");
    expect(existsSync(configPath)).toBe(true);
  });
});
```

### 6.2 CLI Agent Onboard Test

**File:** `packages/cli/test/cli-agent-onboard.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";

describe("leclaw agent onboard", () => {
  it("returns API key on successful onboard", async () => {
    // Note: This test requires a running server and pre-existing company
    // Use environment variables for test companyId
    const companyId = process.env.TEST_COMPANY_ID;
    if (!companyId) {
      // Skip if no test company
      return;
    }

    const proc = spawn("pnpm", [
      "leclaw",
      "agent",
      "onboard",
      "--company-id",
      companyId,
      "--agent-id",
      "test-agent",
      "--role",
      "CEO",
    ]);

    const stdout = await new Promise<string>((resolve) => {
      let out = "";
      proc.stdout?.on("data", (d) => (out += d.toString()));
      proc.on("close", () => resolve(out));
    });

    expect(proc.exitCode).toBe(0);
    // API key format
    expect(stdout).toMatch(/test-agent:leclaw_[a-zA-Z0-9]+/);
  });

  it("fails if company does not exist", async () => {
    const proc = spawn("pnpm", [
      "leclaw",
      "agent",
      "onboard",
      "--company-id",
      "nonexistent-id",
      "--agent-id",
      "test-agent",
      "--role",
      "CEO",
    ]);

    const exitCode = await new Promise<number>((resolve) => {
      proc.on("close", (code) => resolve(code ?? 1));
    });

    expect(exitCode).not.toBe(0);
  });
});
```

---

## 7. Drizzle Kit Migration Tests

### 7.1 Migration at Startup Test

**File:** `packages/server/e2e/migration.e2e.test.ts`

```typescript
import { test, expect } from "@playwright/test";
import { rmSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

test.describe("Drizzle Kit migration at startup", () => {
  const dbPath = join("/tmp", `leclaw-db-test-${Date.now()}`);

  test("server applies pending migrations on startup", async () => {
    // Create fresh db directory
    mkdirSync(dbPath, { recursive: true });

    // Start server (will apply migrations)
    const proc = spawn("pnpm", ["leclaw", "start"], {
      env: {
        ...process.env,
        DATABASE_URL: `sqlite://${dbPath}/leclaw.db`,
      },
    });

    let serverStarted = false;
    let migrationLog = "";

    proc.stdout?.on("data", (data) => {
      const str = data.toString();
      migrationLog += str;
      if (str.includes("Server listening") || str.includes("Migrations applied")) {
        serverStarted = true;
      }
    });

    // Wait for startup (max 30s)
    const maxWait = 30_000;
    const startTime = Date.now();
    while (!serverStarted && Date.now() - startTime < maxWait) {
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(serverStarted).toBe(true);
    expect(migrationLog).toMatch(/migrations? (applied|running)/i);

    proc.kill();

    // Verify db was created
    const dbFile = join(dbPath, "leclaw.db");
    expect(existsSync(dbFile)).toBe(true);

    rmSync(dbPath, { recursive: true, force: true });
  });
});
```

---

## 8. Test Execution

### 8.1 Run All E2E Tests

```bash
# Start server manually (webServer in playwright.config.ts handles this)
pnpm playwright test

# Or with vitest
pnpm vitest -c packages/server/e2e/vitest.e2e.config.ts
```

### 8.2 Run CLI Tests

```bash
pnpm vitest packages/cli/test
```

### 8.3 CI/CD Integration

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:cli": "vitest run packages/cli/test",
    "test:all": "pnpm test:cli && pnpm test:e2e"
  }
}
```

---

## 9. Success Criteria

1. **Playwright E2E setup** — `playwright.config.ts` exists and webServer starts leclaw server
2. **leclaw init flow** — E2E test passes showing init wizard creates company
3. **leclaw start server** — Server starts without errors, /api/health returns 200
4. **Company CRUD** — All operations (create, read, update, delete) work via REST API
5. **Department CRUD** — All operations work via REST API with companyId isolation
6. **Agent onboard** — CLI onboard command returns API key, agent binding appears in DB
7. **Issue CRUD + SSE** — Issues created via API trigger SSE events received by Web UI
8. **Approval flow** — Create via CLI, approve/reject via Web UI dialogs
9. **Drizzle Kit migration** — Migrations applied automatically on server startup

---

## 10. Dependencies on Previous Phases

| Phase | Dependency |
|-------|-----------|
| Phase 1 | `leclaw init`, `leclaw config`, `leclaw start` commands implemented |
| Phase 2 | Entity schemas exist in `packages/server/src/db/schema/` |
| Phase 3 | `leclaw agent onboard` command exists |
| Phase 4 | REST API endpoints at `/api/*` implemented, SSE at `/api/events` |
| Phase 5 | Web UI with shadcn/ui, React Router routes exist |
| Phase 6 | Approval pages with approve/reject dialogs exist |
| Phase 7 | Audit log table exists |

---

*Phase: 08-integration-testing*
*Plan created: 2026-04-07*
