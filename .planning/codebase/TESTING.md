# Testing Patterns

**Analysis Date:** 2026-04-05

## Test Framework

**Runner:** Vitest 4.x with V8 coverage provider

**Key Dependencies (package.json:1269-1281):**
```json
"devDependencies": {
  "@vitest/coverage-v8": "^4.1.2",
  "vitest": "^4.1.2",
  "jsdom": "^29.0.1"
}
```

**Coverage Requirements:**
- Lines: 70%
- Functions: 70%
- Branches: 55%
- Statements: 70%

**Run Commands:**
```bash
pnpm test                  # Run all tests (vitest run)
pnpm test:coverage        # Run with coverage
pnpm test:watch           # Watch mode
pnpm test:fast            # Unit tests only
pnpm test:changed         # Tests for changed files
pnpm test:max             # Max workers (8)
pnpm test:serial          # Single worker
```

## Test File Organization

**Location:** Co-located with source files

**Pattern:**
```
src/
  utils.ts
  utils.test.ts       # Co-located test
  infra/
    home-dir.ts
    home-dir.test.ts
extensions/
  acpx/
    src/
      config.ts
      config.test.ts
```

**Naming:**
- Unit tests: `*.test.ts`
- E2E tests: `*.e2e.test.ts`
- Live tests (real APIs): `*.live.test.ts`
- Boundary tests: `vitest.boundary.config.ts` projects

## Test Structure

**Vitest Config Projects:**
- `vitest.unit.config.ts` - Standard unit tests
- `vitest.boundary.config.ts` - Module boundary tests
- `vitest.contracts.config.ts` - Plugin/channel contracts
- `vitest.e2e.config.ts` - End-to-end tests
- `vitest.gateway.config.ts` - Gateway-specific tests

**Standard Test Pattern:**
```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("feature name", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it("should do something specific", () => {
    const result = someFunction(input);
    expect(result).toBe(expected);
  });

  it("should handle edge case", async () => {
    await expect(asyncFunction()).resolves.toBeDefined();
  });
});
```

## Test Setup Files

**Setup Chain:**
1. `test/setup.ts` - Imports `setup.shared.js`
2. `test/setup.shared.js` - Global mocks, environment setup
3. `test/setup-openclaw-runtime.ts` - OpenClaw-specific runtime setup
4. `test/setup.extensions.ts` - Extension setup

**Shared Setup (test/setup.shared.ts:1-63):**
```typescript
import { vi } from "vitest";

vi.mock("@mariozechner/pi-ai", async () => {
  const original = await vi.importActual<typeof import("@mariozechner/pi-ai")>(
    "@mariozechner/pi-ai"
  );
  return {
    ...original,
    getOAuthApiKey: () => undefined,
    getOAuthProviders: () => [],
    loginOpenAICodex: vi.fn(),
  };
});

// Set VITEST environment flag
process.env.VITEST = "true";
```

## Mocking Patterns

**Vi.fn() Creation:**
```typescript
const mockFn = vi.fn();
const mockFnWithImpl = vi.fn((arg) => arg * 2);
```

**Mocking Modules:**
```typescript
vi.mock("./some-module.js", async () => {
  const actual = await vi.importActual<typeof import("./some-module.js")>(
    "./some-module.js"
  );
  return {
    ...actual,
    namedExport: vi.fn(),
  };
});
```

**Hoisted Mocks (for module-level mocking):**
```typescript
const loadBundledPluginPublicSurfaceModuleSync = vi.hoisted(() => vi.fn());

vi.mock("./plugin-sdk/facade-runtime.js", async () => {
  const actual = await vi.importActual<typeof import("./plugin-sdk/facade-runtime.js")>(
    "./plugin-sdk/facade-runtime.js"
  );
  return {
    ...actual,
    loadBundledPluginPublicSurfaceModuleSync,
  };
});
```

**Mocking Globals:**
```typescript
// Fake timers
vi.useFakeTimers();
// Later...
vi.useRealTimers();

// Stub env
vi.stubEnv("OPENCLAW_HOME", "/srv/test-home");
// Later...
vi.unstubAllEnvs();

// Spy on methods
const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
try {
  // test code
} finally {
  randomSpy.mockRestore();
}
```

## Test Utilities

**Location:** `src/test-utils/`

**Key Utilities:**

**`src/test-utils/env.ts`** - Environment manipulation:
```typescript
import { captureEnv, withEnv, withEnvAsync } from "./test-utils/env.js";

// Capture and restore env
const snapshot = captureEnv(["HOME", "OPENCLAW_HOME"]);
// ... modify env ...
snapshot.restore();

// Or use helper
withEnv({ HOME: "/tmp/test" }, () => {
  // code runs with modified env
});
```

**`src/test-utils/temp-home.ts`** - Isolated HOME directory:
```typescript
import { createTempHomeEnv } from "./test-utils/temp-home.js";

const { home, restore } = await createTempHomeEnv("openclaw-test-");
// ... tests ...
await restore();
```

**`src/test-utils/vitest-mock-fn.ts`** - Type-safe mock types:
```typescript
import type { MockFn } from "./test-utils/vitest-mock-fn.ts";
const mockFn: MockFn<(input: string) => Promise<string>> = vi.fn();
```

**`src/test-utils/fixture-suite.ts`** - Temp fixture management:
```typescript
import { createFixtureSuite } from "./test-utils/fixture-suite.js";

const suite = createFixtureSuite("openclaw-fixtures-");
await suite.setup();
// ...
const caseDir = await suite.createCaseDir("test-case");
// ...
await suite.cleanup();
```

## Async Testing

**Promise Assertions:**
```typescript
// Resolves
await expect(asyncFunction()).resolves.toBe(expected);

// Rejects
await expect(asyncFunction()).rejects.toThrow("error message");
await expect(asyncFunction()).rejects.toMatchObject({
  message: "aborted",
  cause: expect.anything(),
});
```

**Fake Timers:**
```typescript
it("resolves after delay using fake timers", async () => {
  vi.useFakeTimers();
  const promise = sleep(1000);
  vi.advanceTimersByTime(1000);
  await expect(promise).resolves.toBeUndefined();
  vi.useRealTimers();
});
```

## Cleanup Patterns

**Per-Test Cleanup (afterEach):**
```typescript
afterEach(() => {
  resetLogger();
  setLoggerOverride(null);
  setVerbose(false);
  setYes(false);
  vi.restoreAllMocks();
});
```

**Global Cleanup (test/setup-openclaw-runtime.ts:371-400):**
```typescript
afterEach(async () => {
  // Drain queues
  await drainSessionStoreLockQueuesForTest();
  clearSessionStoreCaches();
  await drainFileLockStateForTest();
  await drainSessionWriteLockStateForTest();
  resetFileLockStateForTest();
  resetContextWindowCacheForTest();
  resetModelsJsonReadyCacheForTest();
  resetSessionWriteLockStateForTest();
  installDefaultPluginRegistry();
});
```

**Temp Directory Cleanup:**
```typescript
async function withTempDir<T>(
  prefix: string,
  run: (dir: string) => T | Promise<T>,
): Promise<Awaited<T>> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    return await run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
```

## Test Isolation

**Performance Guidelines:**
- Do NOT use `vi.resetModules()` + `await import(...)` in `beforeEach` loops
- Prefer static imports or one-time `beforeAll` imports
- Reset mocks/runtime state directly in `beforeEach`

```typescript
// BAD - slow
beforeEach(async () => {
  vi.resetModules();
  module = await import("./heavy-module.js");
});

// GOOD - fast
let module: typeof import("./heavy-module.js");
beforeAll(async () => {
  module = await import("./heavy-module.js");
});
beforeEach(() => {
  module.someFunction.mockReset();
});
```

**Pool Configuration:**
- Default: `threads` pool
- Gateway/agents/commands: `forks` pool (via `vitest.gateway.config.ts` etc.)

## Coverage

**Threshold Configuration (vitest.shared.config.ts:329-338):**
```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "lcov"],
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 55,
    statements: 70,
  },
}
```

**Excluded from Coverage:**
- CLI commands (`src/cli/**`)
- Daemon (`src/daemon/**`)
- Hooks (`src/hooks/**`)
- Gateway protocol (`src/gateway/protocol/**`)
- Entry points (`src/entry.ts`, `src/index.ts`, `src/runtime.ts`)

## Live Tests

**Pattern:** `*.live.test.ts`

**Running Live Tests:**
```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live          # OpenClaw-only
LIVE=1 pnpm test:live                         # Includes provider tests
```

**Environment:**
- Real API keys may be required
- Check `~/.profile` for environment loading (`test/test-env.ts`)

## Boundary Tests

**Purpose:** Verify module boundaries are not violated

**Configuration:** `vitest.boundary.config.ts`

**Examples (src/plugin-activation-boundary.test.ts:1-197):**
- Verify bundled plugins NOT loaded for config helpers
- Verify channel plugins NOT loaded for static helpers
- Verify extension imports stay within allowed boundaries

## E2E Tests

**Location:** `test/*.e2e.test.ts`

**Pattern:**
```typescript
import { describe, expect, it } from "vitest";

describe("e2e scenario", () => {
  it("should complete full workflow", async () => {
    // End-to-end test with real components
  });
});
```

---

*Testing analysis: 2026-04-05*
