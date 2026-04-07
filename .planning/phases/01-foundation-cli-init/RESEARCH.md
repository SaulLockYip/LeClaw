# Phase 1 Research: Foundation + CLI Init

**Domain:** Agent management platform CLI with embedded database
**Researched:** 2026-04-05
**Confidence:** MEDIUM-HIGH (based on established reference implementations)

## Executive Summary

This phase establishes the foundation for LeClaw: a pnpm monorepo with packages for CLI, server, and shared code; an embedded PostgreSQL initialization pattern; and a Commander.js-based CLI structure with JSON config management. The research draws from Paperclip's `@paperclipai/db` package for embedded PostgreSQL and OpenClaw's CLI architecture.

## Key Findings

1. **Embedded PostgreSQL** uses the `embedded-postgres` npm package wrapped by `@paperclipai/db` - not true embedded PostgreSQL but a spawned process with temp directory
2. **CLI organization** follows Commander.js subcommand pattern with registration-based command wiring
3. **Monorepo** uses pnpm workspaces with glob patterns and per-package vitest configs
4. **Config management** uses JSON5 parsing with snapshot-based read/write and atomic file operations

---

## 1. Embedded PostgreSQL Initialization Pattern

### Package Dependency

```json
// packages/db/package.json
{
  "dependencies": {
    "@paperclipai/db": "workspace:*",
    "embedded-postgres": "^16.0.0"
  }
}
```

### Connection String Format

```
postgres://user:password@127.0.0.1:port/database
```

### Initialization Sequence

Based on `referenceRepo/paperclip/packages/db/src/test-embedded-postgres.ts`:

```typescript
import { startEmbeddedPostgresTestDatabase } from "@paperclipai/db";

// 1. Start ephemeral test database
const { connectionString, cleanup } = await startEmbeddedPostgresTestDatabase("leclaw-test-");

// 2. Connection string is ready to use with pg client
const db = createDb(connectionString);
await db.execute("SELECT 1");

// 3. On cleanup
await cleanup();
```

### Production Use (from `referenceRepo/paperclip/cli/src/checks/database-check.ts`)

```typescript
import { createDb } from "@paperclipai/db";

// For embedded-postgres mode
const dataDir = resolveRuntimeLikePath(config.database.embeddedPostgresDataDir, configPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connection check only - database spawns on demand
const db = createDb(config.database.connectionString);
await db.execute("SELECT 1");
```

### Startup Sequence for Embedded Mode

1. **Probe support** - Check if embedded PostgreSQL can start (runs briefly to verify)
2. **Allocate port** - Use `net.createServer()` to find available port
3. **Create temp directory** - `fs.mkdtempSync(path.join(os.tmpdir(), "leclaw-embedded-postgres-"))`
4. **Spawn instance** - `new EmbeddedPostgres({ databaseDir, user, password, port, persistent: true })`
5. **Initialize** - `await instance.initialise()` (runs initdb)
6. **Start** - `await instance.start()` (starts postgres process)
7. **Create database** - `ensurePostgresDatabase(connectionString, "leclaw")`
8. **Run migrations** - `applyPendingMigrations(connectionString)`

### Key Configuration Options

```typescript
const instance = new EmbeddedPostgres({
  databaseDir: string,      // Persistent storage directory
  user: string,             // Default: "postgres"
  password: string,          // Default: "postgres"  
  port: number,             // Auto-allocated via net.createServer()
  persistent: boolean,      // true = data persists across restarts
  initdbFlags?: string[],   // ["--encoding=UTF8", "--locale=C", "--lc-messages=C"]
  onLog?: (msg) => void,
  onError?: (msg) => void,
});
```

---

## 2. Recommended Monorepo Package Structure with pnpm workspaces

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - packages/*
  - packages/adapters/*
  - packages/plugins/*
  - packages/plugins/examples/*
  - server
  - ui
  - cli
```

### Directory Structure

```
leclaw/
├── packages/
│   ├── cli/              # Commander.js CLI (leclaw CLI tool)
│   ├── core/             # Shared types, agent protocols, utilities
│   ├── db/               # Database client, migrations, embedded postgres
│   └── server/           # Express/Fastify API + SSE endpoints
├── ui/                   # React frontend (if separate from packages)
├── server/               # Standalone server package
├── cli/                  # CLI package (may merge with packages/cli)
├── pnpm-workspace.yaml
├── vitest.config.ts      # Root vitest config referencing project configs
├── vitest.shared.config.ts
└── package.json
```

### Root package.json Scripts

```json
{
  "scripts": {
    "build": "pnpm -r run build",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "check": "pnpm tsc && pnpm lint",
    "dev": "pnpm -r --parallel run dev"
  }
}
```

---

## 3. CLI Command Organization Pattern (Commander.js)

### Main Entry Point Pattern

Based on `referenceRepo/openclaw/src/cli/run-main.ts` and `src/cli/program/build-program.ts`:

```typescript
// src/cli/run-main.ts
export async function runCli(argv: string[] = process.argv) {
  const program = buildProgram();
  
  // Register commands before parsing
  registerCoreCliCommands(program);
  
  // Parse and execute
  await program.parseAsync(argv);
}

export function buildProgram() {
  const program = new Command();
  program.enablePositionalOptions();
  
  configureProgramHelp(program);
  registerPreActionHooks(program);
  registerProgramCommands(program);
  
  return program;
}
```

### Subcommand Registration Pattern

From `referenceRepo/openclaw/src/cli/acp-cli.ts`:

```typescript
// src/cli/acp-cli.ts
import type { Command } from "commander";

export function registerAcpCli(program: Command) {
  // Parent command with common options
  const acp = program
    .command("acp")
    .description("Run an ACP bridge backed by the Gateway")
    .option("--url <url>", "Gateway WebSocket URL")
    .option("--token <token>", "Gateway token")
    .addHelpText("after", () => `\nDocs: ...`)
    .action(async (opts) => {
      // Default action for `leclaw acp`
    });

  // Subcommand: leclaw acp client
  acp
    .command("client")
    .description("Run an interactive ACP client")
    .option("--cwd <dir>", "Working directory")
    .action(async (opts, command) => {
      // Handle `leclaw acp client`
    });
}
```

### Config Subcommand Pattern

From `referenceRepo/openclaw/src/cli/config-cli.ts`:

```typescript
// src/cli/config-cli.ts
export function registerConfigCli(program: Command) {
  const cmd = program
    .command("config")
    .description("Non-interactive config helpers")
    .action(async (opts) => {
      // Default action: guided setup
    });

  // leclaw config get <path>
  cmd
    .command("get")
    .description("Get a config value by dot path")
    .argument("<path>", "Config path (dot or bracket notation)")
    .option("--json", "Output JSON", false)
    .action(async (path: string, opts) => {
      await runConfigGet({ path, json: Boolean(opts.json) });
    });

  // leclaw config set <path> [value]
  cmd
    .command("set")
    .description("Set config values by path")
    .argument("[path]", "Config path")
    .argument("[value]", "Value")
    .option("--strict-json", "Strict JSON parsing")
    .option("--dry-run", "Validate without writing")
    .action(async (path, value, opts) => {
      await runConfigSet({ path, value, cliOptions: opts });
    });

  // leclaw config unset <path>
  cmd
    .command("unset")
    .description("Remove a config value")
    .argument("<path>", "Config path")
    .action(async (path: string) => {
      await runConfigUnset({ path });
    });
}
```

### Option Inheritance Pattern

From `referenceRepo/openclaw/src/cli/command-options.ts`:

```typescript
// src/cli/command-options.ts
const MAX_INHERIT_DEPTH = 2;

export function inheritOptionFromParent<T = unknown>(
  command: Command | undefined,
  name: string,
): T | undefined {
  if (!command) return undefined;
  
  // Don't inherit if explicitly set via CLI
  const childSource = getOptionSource(command, name);
  if (childSource && childSource !== "default") return undefined;

  // Walk up parent chain (max 2 levels)
  let depth = 0;
  let ancestor = command.parent;
  while (ancestor && depth < MAX_INHERIT_DEPTH) {
    const source = getOptionSource(ancestor, name);
    if (source && source !== "default") {
      return ancestor.opts<Record<string, unknown>>()[name] as T;
    }
    depth++;
    ancestor = ancestor.parent;
  }
  return undefined;
}
```

---

## 4. Config File Read/Write Pattern for JSON Config

### Config IO Factory Pattern

Based on `referenceRepo/openclaw/src/config/io.ts`:

```typescript
// src/config/io.ts
import JSON5 from "json5";
import { createConfigIO } from "./io.ts";

// Create IO with optional overrides (for testing)
const io = createConfigIO({
  fs: fsModule,           // Injectable for testing
  json5: JSON5Module,     // Injectable for testing
  env: process.env,
  configPath: "/path/to/config.json"
});

// Load config (sync, uses cached state)
const config = io.loadConfig();

// Read snapshot (async, for writes)
const snapshot = await io.readConfigFileSnapshot();

// Write config (atomic via temp file + rename)
await io.writeConfigFile(nextConfig, {
  envSnapshotForRestore: {...},
  expectedConfigPath: "/path/to/config.json",
  unsetPaths: [["some", "path"]]  // Paths to explicitly remove
});
```

### Config Snapshot Structure

```typescript
interface ConfigFileSnapshot {
  path: string;
  exists: boolean;
  raw: string | null;           // Original raw JSON5
  parsed: unknown;              // Parsed JSON5
  sourceConfig: OpenClawConfig; // Config after $include resolution, before defaults
  resolved: OpenClawConfig;     // Alias for sourceConfig
  runtimeConfig: OpenClawConfig;// Config with runtime defaults applied
  valid: boolean;
  hash?: string;                // SHA-256 of raw
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  legacyIssues: LegacyConfigIssue[];
}
```

### Atomic Write Pattern

```typescript
async function writeConfigFile(cfg: OpenClawConfig, options: ConfigWriteOptions) {
  const tmp = path.join(dir, `${basename}.${process.pid}.${crypto.randomUUID()}.tmp`);
  
  // Write to temp file with restricted permissions
  await fs.promises.writeFile(tmp, json, { encoding: "utf-8", mode: 0o600 });
  
  // Create backup if exists
  if (fs.existsSync(configPath)) {
    await maintainConfigBackups(configPath, fs.promises);
  }
  
  // Atomic rename (POSIX) or copy (Windows fallback)
  try {
    await fs.promises.rename(tmp, configPath);
  } catch (err) {
    if (code === "EPERM" || code === "EEXIST") {
      await fs.promises.copyFile(tmp, configPath);
    }
  }
}
```

### JSON5 Parsing with Fallback

```typescript
import JSON5 from "json5";

function parseValue(raw: string, strictJson: boolean): unknown {
  if (strictJson) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse JSON: ${err}`);
    }
  }
  
  // JSON5 allows comments, trailing commas, single quotes, etc.
  try {
    return JSON5.parse(raw);
  } catch {
    return raw; // Fallback to raw string
  }
}
```

### Dot-Path Config Access

```typescript
// src/cli/config-cli.ts
function getAtPath(root: unknown, path: string[]): { found: boolean; value?: unknown } {
  let current = root;
  for (const segment of path) {
    if (!current || typeof current !== "object") return { found: false };
    
    if (Array.isArray(current)) {
      if (!/^[0-9]+$/.test(segment)) return { found: false };
      const index = Number.parseInt(segment);
      if (index < 0 || index >= current.length) return { found: false };
      current = current[index];
    } else {
      if (!(segment in current)) return { found: false };
      current = (current as Record<string, unknown>)[segment];
    }
  }
  return { found: true, value: current };
}

function setAtPath(root: Record<string, unknown>, path: string[], value: unknown): void {
  // Mutates root in place, creating intermediate objects as needed
  let current = root;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!(segment in current)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}
```

---

## 5. Testing Setup for Monorepo (Vitest Workspace Config)

### Root vitest.config.ts

Based on `referenceRepo/openclaw/vitest.config.ts`:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { sharedVitestConfig } from "./vitest.shared.config.ts";

export default defineConfig({
  ...sharedVitestConfig,
  test: {
    ...sharedVitestConfig.test,
    projects: [
      "vitest.unit.config.ts",
      "vitest.infra.config.ts",
      "vitest.cli.config.ts",
      // ... other project configs
    ],
  },
});
```

### Shared Vitest Configuration

Based on `referenceRepo/openclaw/vitest.shared.config.ts`:

```typescript
// vitest.shared.config.ts
export const sharedVitestConfig = {
  resolve: {
    alias: [
      { find: "openclaw/extension-api", replacement: "./src/extensionAPI.ts" },
      // Package aliases
    ],
  },
  test: {
    testTimeout: 120_000,
    hookTimeout: 120_000,
    isolate: false,           // Non-isolated for performance
    pool: "threads",
    setupFiles: ["test/setup.ts"],
    include: ["src/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["dist/**", "**/node_modules/**", "**/*.e2e.test.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 55,
        statements: 70,
      },
    },
  },
};
```

### Per-Package Scoped Config

Based on `referenceRepo/openclaw/vitest.scoped-config.ts` and `vitest.cli.config.ts`:

```typescript
// vitest.scoped-config.ts
export function createScopedVitestConfig(
  include: string[],
  options?: {
    dir?: string;
    name?: string;
    environment?: string;
    exclude?: string[];
    pool?: "threads";
    passWithNoTests?: boolean;
    isolate?: boolean;
    setupFiles?: string[];
  }
) {
  return defineConfig({
    ...sharedVitestConfig,
    test: {
      ...sharedVitestConfig.test,
      include: include.map(pattern => relativizeScopedPattern(pattern, options?.dir)),
      exclude: [...sharedVitestConfig.test.exclude, ...(options?.exclude ?? [])],
      ...options,
    },
  });
}

// vitest.cli.config.ts
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export default createScopedVitestConfig(["src/cli/**/*.test.ts"], {
  dir: "src/cli",
  name: "cli",
  passWithNoTests: true,
});
```

### Worker Allocation Strategy

```typescript
// From vitest.shared.config.ts - adaptive worker count
function resolveLocalVitestScheduling(env, system, pool, processStats): LocalVitestScheduling {
  const cpuCount = os.availableParallelism();
  const totalMemoryGb = os.totalmem() / 1024 ** 3;
  
  // Scale workers based on resources
  let inferred = cpuCount <= 4 ? 1 
    : cpuCount <= 8 ? 2 
    : cpuCount <= 12 ? 3 : 4;
  
  if (totalMemoryGb <= 16) inferred = Math.min(inferred, 2);
  if (totalMemoryGb <= 32) inferred = Math.min(inferred, 3);
  
  return { maxWorkers: inferred, fileParallelism: inferred > 1 };
}
```

### Test Setup File Pattern

```typescript
// test/setup.ts
import { beforeAll, afterAll } from "vitest";

// Global test environment setup
beforeAll(() => {
  // Setup test database, mock external services
});

afterAll(async () => {
  // Cleanup resources
});
```

---

## Phase 1 Implementation Recommendations

### Recommended Order

1. **Set up monorepo** - Create pnpm-workspace.yaml, root package.json, TypeScript config
2. **Create packages** - cli, core, db, server packages with basic structure
3. **Implement config IO** - Copy JSON5 + snapshot pattern to packages/core
4. **Implement embedded PostgreSQL** - Wrap `@paperclipai/db` in packages/db
5. **Build CLI skeleton** - Commander.js with `config`, `init`, `doctor` commands
6. **Set up Vitest** - Root config + scoped configs per package
7. **Write initial tests** - Smoke tests for config IO, embedded PostgreSQL

### Critical Pitfalls to Avoid

1. **Config write race conditions** - Always use atomic temp-file-rename pattern
2. **Embedded PostgreSQL port conflicts** - Always allocate ports dynamically
3. **Vitest isolation** - `isolate: false` for performance, but clean up state in setup
4. **ESM/CJS boundary** - Use `.js` extensions in imports consistently

---

## Sources

- [Paperclip @paperclipai/db](referenceRepo/paperclip/packages/db/src/index.ts) - Embedded PostgreSQL wrapper
- [Paperclip embedded-postgres helper](referenceRepo/paperclip/packages/db/src/test-embedded-postgres.ts) - Initialization sequence
- [OpenClaw CLI entry](referenceRepo/openclaw/src/cli/run-main.ts) - CLI architecture
- [OpenClaw Commander setup](referenceRepo/openclaw/src/cli/program/build-program.ts) - Program building
- [OpenClaw config CLI](referenceRepo/openclaw/src/cli/config-cli.ts) - Subcommand pattern
- [OpenClaw config IO](referenceRepo/openclaw/src/config/io.ts) - Config read/write with snapshots
- [Paperclip vitest workspace](referenceRepo/paperclip/vitest.config.ts) - Monorepo vitest config
- [OpenClaw vitest shared](referenceRepo/openclaw/vitest.shared.config.ts) - Shared test configuration
