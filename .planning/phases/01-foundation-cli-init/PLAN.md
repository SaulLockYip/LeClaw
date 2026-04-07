# Phase 1: Foundation + CLI Init — Implementation Plan

**Phase:** 01-foundation-cli-init
**Created:** 2026-04-07
**Status:** Ready for execution

---

## Overview

This plan covers the complete Phase 1 implementation: a pnpm monorepo with packages for CLI, server, shared types, and database; an embedded PostgreSQL wrapper; and a Commander.js-based CLI with interactive init, hierarchical config subcommands, status, doctor, and start commands.

**Success Criteria:**
1. `leclaw init` runs interactively and creates `~/.leclaw/` directory with embedded PostgreSQL
2. `leclaw config` shows current configuration
3. `leclaw config openclaw --dir <path>` sets OpenClaw directory
4. `leclaw config gateway --url <url> --token <token>` sets Gateway settings
5. `leclaw config server --port <port>` sets server port
6. `leclaw status` outputs JSON with connectivity status
7. `leclaw doctor` runs diagnostic checks and outputs JSON
8. `leclaw start` launches server with embedded PostgreSQL
9. Config file: `~/.leclaw/config.json`

---

## Directory Structure

```
leclaw/
├── packages/
│   ├── cli/              # @leclaw/cli — Commander.js CLI
│   ├── server/           # @leclaw/server — Express backend
│   ├── shared/           # @leclaw/shared — Types, config IO, utilities
│   └── db/               # @leclaw/db — Embedded PostgreSQL wrapper
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── vitest.shared.config.ts
├── oxlintrc.json
├── oxfmtrc.json
└── .husky/
    └── pre-commit
```

---

## Task 1: Root Workspace Setup

### Files

- `pnpm-workspace.yaml`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `vitest.shared.config.ts`
- `oxlintrc.json`
- `oxfmtrc.json`
- `.husky/pre-commit`

### Actions

**pnpm-workspace.yaml:**
```yaml
packages:
  - packages/*
```

**package.json:**
- name: `"leclaw"`, `private: true`
- scripts: `build` (`pnpm -r run build`), `test` (`vitest`), `check` (`pnpm tsc && pnpm oxlint`)
- devDependencies: `typescript`, `vitest`, `oxlint`, `oxfmt`, `husky`
- engines: `{ node: ">=22.14.0" }`, `{ pnpm: ">=10.32.1" }`

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": false,
    "noImplicitAny": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2023"]
  },
  "include": ["packages/*/src", "packages/*/bin"],
  "exclude": ["**/dist/**", "**/node_modules/**"]
}
```

**vitest.config.ts:**
```typescript
import { defineConfig } from "vitest/config";
import { sharedVitestConfig } from "./vitest.shared.config.ts";

export default defineConfig({
  ...sharedVitestConfig,
  test: {
    ...sharedVitestConfig.test,
    projects: [
      { path: "./vitest.shared.config.ts" },
    ],
  },
});
```

**vitest.shared.config.ts:**
```typescript
export const sharedVitestConfig = {
  resolve: {
    alias: {
      "@leclaw/shared": "./packages/shared/src",
      "@leclaw/db": "./packages/db/src",
    },
  },
  test: {
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: "threads",
    include: ["packages/**/*.test.ts"],
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

**oxlintrc.json:** Standard recommended configuration

**oxfmtrc.json:** Default configuration

**.husky/pre-commit:**
```sh
#!/bin/sh
pnpm check
```

---

## Task 2: packages/shared — Shared Types and Config IO

### Files

- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/types/config.ts`
- `packages/shared/src/config/io.ts`
- `packages/shared/src/config/atomic-write.ts`
- `packages/shared/src/utils/index.ts`
- `packages/shared/vitest.config.ts`

### Actions

**packages/shared/package.json:**
- name: `"@leclaw/shared"`, `type: "module"`
- exports: `"./src/index.ts"`
- dependencies: `json5@^14.1.1`
- devDependencies: `vitest@^4.1.2`

**packages/shared/tsconfig.json:** extends `"../../tsconfig.json"`, `outDir: "./dist"`

**packages/shared/src/types/config.ts:**

Config schema per 01-CONTEXT.md D-02 and SPEC.md:

```typescript
export interface LeClawConfig {
  version: string;
  openclaw: {
    dir: string;
    gatewayUrl: string;
    gatewayToken: string;
    gatewayPassword?: string;
  };
  server: {
    port: number;
  };
  database: {
    connectionString: string;
    embeddedDataDir?: string;
  };
}

export const DEFAULT_CONFIG: Partial<LeClawConfig> = {
  version: "1.0.0",
  server: { port: 8080 },
};
```

**packages/shared/src/config/io.ts:**

```typescript
import JSON5 from "json5";
import { atomicWriteFile } from "./atomic-write.js";
import { DEFAULT_CONFIG, type LeClawConfig } from "../types/config.js";
import fs from "node:fs";
import path from "node:path";

export interface ConfigLoadOptions {
  configPath: string;
  fsModule?: typeof fs;
}

export function loadConfig(options: ConfigLoadOptions): LeClawConfig {
  const { configPath, fsModule = fs } = options;
  const defaults = { ...DEFAULT_CONFIG };

  if (!fsModule.existsSync(configPath)) {
    return { ...defaults } as LeClawConfig;
  }

  try {
    const raw = fsModule.readFileSync(configPath, "utf-8");
    const parsed = JSON5.parse(raw);
    return { ...defaults, ...parsed } as LeClawConfig;
  } catch {
    return { ...defaults } as LeClawConfig;
  }
}

export interface ConfigWriteOptions {
  configPath: string;
  config: LeClawConfig;
  fsModule?: typeof fs;
}

export async function writeConfig(options: ConfigWriteOptions): Promise<void> {
  const { configPath, config, fsModule = fs } = options;
  const dir = path.dirname(configPath);

  if (!fsModule.existsSync(dir)) {
    fsModule.mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(config, null, 2);
  await atomicWriteFile({ filePath: configPath, content: json, fsModule });
}
```

**packages/shared/src/config/atomic-write.ts:**

```typescript
import fs from "node:fs";
import path from "node:path";

export interface AtomicWriteOptions {
  filePath: string;
  content: string;
  fsModule?: typeof fs;
  mode?: number;
}

export async function atomicWriteFile(options: AtomicWriteOptions): Promise<void> {
  const { filePath, content, fsModule = fs, mode = 0o600 } = options;
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const tmp = path.join(dir, `${basename}.${process.pid}.${crypto.randomUUID()}.tmp`);

  // Write to temp file with restricted permissions
  await fsModule.promises.writeFile(tmp, content, { encoding: "utf-8", mode });

  // Backup existing file if present
  if (fsModule.existsSync(filePath)) {
    const backup = `${filePath}.bak`;
    await fsModule.promises.copyFile(filePath, backup);
  }

  // Atomic rename (POSIX) or copy (Windows fallback)
  try {
    await fsModule.promises.rename(tmp, filePath);
  } catch (err: any) {
    if (err.code === "EPERM" || err.code === "EEXIST") {
      await fsModule.promises.copyFile(tmp, filePath);
    }
    throw err;
  }
}
```

**packages/shared/src/utils/index.ts:**

```typescript
export function dotPathGet(root: unknown, pathSegments: string[]): { found: boolean; value?: unknown } {
  let current: unknown = root;
  for (const segment of pathSegments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return { found: false };
    }
    if (Array.isArray(current)) {
      const index = Number.parseInt(segment, 10);
      if (!Number.isFinite(index) || index < 0 || index >= current.length) {
        return { found: false };
      }
      current = current[index];
    } else {
      if (!(segment in (current as Record<string, unknown>))) {
        return { found: false };
      }
      current = (current as Record<string, unknown>)[segment];
    }
  }
  return { found: true, value: current };
}

export function dotPathSet(root: Record<string, unknown>, pathSegments: string[], value: unknown): void {
  let current: Record<string, unknown> = root;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    if (!(segment in current)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
    if (typeof current !== "object" || current === null) {
      current = {};
    }
  }
  current[pathSegments[pathSegments.length - 1]] = value;
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port < 65536;
}
```

**packages/shared/src/index.ts:**
```typescript
export * from "./types/config.js";
export * from "./config/io.js";
export * from "./utils/index.js";
```

**packages/shared/vitest.config.ts:**
```typescript
import { defineConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.shared.config.ts";

export default defineConfig({
  ...sharedVitestConfig,
  test: {
    ...sharedVitestConfig.test,
    include: ["src/**/*.test.ts"],
    exclude: [...sharedVitestConfig.test.exclude],
  },
});
```

---

## Task 3: packages/db — Embedded PostgreSQL Wrapper

### Files

- `packages/db/package.json`
- `packages/db/tsconfig.json`
- `packages/db/src/index.ts`
- `packages/db/src/embedded-postgres.ts`
- `packages/db/src/port-allocator.ts`
- `packages/db/vitest.config.ts`

### Actions

**packages/db/package.json:**
- name: `"@leclaw/db"`, `type: "module"`
- dependencies: `embedded-postgres@^16.0.0`
- devDependencies: `vitest@^4.1.2`, `@types/node@^22.0.0`

**packages/db/src/port-allocator.ts:**

Based on `referenceRepo/paperclip/packages/db/src/migration-runtime.ts` port allocation pattern:

```typescript
import net from "net";

export async function isPortInUse(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error: NodeJS.ErrnoException) => {
      resolve(error.code === "EADDRINUSE");
    });
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(false));
    });
  });
}

export async function allocatePort(startPort: number = 5432): Promise<number> {
  const maxLookahead = 20;
  let port = startPort;
  for (let i = 0; i < maxLookahead; i += 1, port += 1) {
    if (!(await isPortInUse(port))) return port;
  }
  throw new Error(`Could not find a free port from ${startPort} to ${startPort + maxLookahead - 1}`);
}
```

**packages/db/src/embedded-postgres.ts:**

Based on `referenceRepo/paperclip/packages/db/src/migration-runtime.ts`:

```typescript
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "os";
import { allocatePort } from "./port-allocator.js";

type EmbeddedPostgresInstance = {
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
};

type EmbeddedPostgresCtor = new (opts: {
  databaseDir: string;
  user: string;
  password: string;
  port: number;
  persistent: boolean;
  initdbFlags?: string[];
  onLog?: (message: unknown) => void;
  onError?: (message: unknown) => void;
}) => EmbeddedPostgresInstance;

export interface DbConfig {
  dataDir?: string;
  user?: string;
  password?: string;
  port?: number;
}

export interface DbConnection {
  connectionString: string;
  source: string;
  stop: () => Promise<void>;
}

function readRunningPostmasterPid(postmasterPidFile: string): number | null {
  if (!existsSync(postmasterPidFile)) return null;
  try {
    const pid = Number(readFileSync(postmasterPidFile, "utf8").split("\n")[0]?.trim());
    if (!Number.isInteger(pid) || pid <= 0) return null;
    process.kill(pid, 0);
    return pid;
  } catch {
    return null;
  }
}

function readPidFilePort(postmasterPidFile: string): number | null {
  if (!existsSync(postmasterPidFile)) return null;
  try {
    const lines = readFileSync(postmasterPidFile, "utf8").split("\n");
    const port = Number(lines[3]?.trim());
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

async function loadEmbeddedPostgresCtor(): Promise<EmbeddedPostgresCtor> {
  try {
    const mod = await import("embedded-postgres");
    return mod.default as EmbeddedPostgresCtor;
  } catch {
    throw new Error(
      "Embedded PostgreSQL support requires dependency `embedded-postgres`. Reinstall dependencies and try again.",
    );
  }
}

export async function initializeDb(config?: DbConfig): Promise<DbConnection> {
  const dataDir = config?.dataDir ?? path.join(os.homedir(), ".leclaw", "db");
  const user = config?.user ?? "postgres";
  const password = config?.password ?? "postgres";
  const preferredPort = config?.port ?? 5432;

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const EmbeddedPostgres = await loadEmbeddedPostgresCtor();
  const selectedPort = await allocatePort(preferredPort);
  const postmasterPidFile = path.resolve(dataDir, "postmaster.pid");
  const pgVersionFile = path.resolve(dataDir, "PG_VERSION");
  const runningPid = readRunningPostmasterPid(postmasterPidFile);
  const runningPort = readPidFilePort(postmasterPidFile);
  const logBuffer: string[] = [];

  // Reuse existing instance if running
  if (runningPid) {
    const port = runningPort ?? selectedPort;
    const connectionString = `postgres://${user}:${password}@127.0.0.1:${port}/leclaw`;
    return {
      connectionString,
      source: `embedded-postgres@${port}`,
      stop: async () => {},
    };
  }

  // Start new instance
  const instance = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port: selectedPort,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-messages=C"],
    onLog: (msg) => logBuffer.push(String(msg)),
    onError: (msg) => logBuffer.push(String(msg)),
  });

  if (!existsSync(pgVersionFile)) {
    await instance.initialise();
  }

  if (existsSync(postmasterPidFile)) {
    rmSync(postmasterPidFile, { force: true });
  }

  await instance.start();

  const connectionString = `postgres://${user}:${password}@127.0.0.1:${selectedPort}/leclaw`;

  return {
    connectionString,
    source: `embedded-postgres@${selectedPort}`,
    stop: async () => {
      await instance.stop();
    },
  };
}
```

**packages/db/src/index.ts:**
```typescript
export * from "./embedded-postgres.js";
export * from "./port-allocator.js";
```

**packages/db/vitest.config.ts:**
```typescript
import { defineConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.shared.config.ts";

export default defineConfig({
  ...sharedVitestConfig,
  test: {
    ...sharedVitestConfig.test,
    include: ["src/**/*.test.ts"],
    exclude: [...sharedVitestConfig.test.exclude],
  },
});
```

---

## Task 4: packages/cli — Commander.js CLI Skeleton

### Files

- `packages/cli/package.json`
- `packages/cli/tsconfig.json`
- `packages/cli/src/index.ts`
- `packages/cli/src/run-cli.ts`
- `packages/cli/src/program/build-program.ts`
- `packages/cli/src/program/configure-help.ts`
- `packages/cli/src/commands/init-command.ts`
- `packages/cli/src/commands/config-command.ts`
- `packages/cli/src/commands/config-openclaw-command.ts`
- `packages/cli/src/commands/config-gateway-command.ts`
- `packages/cli/src/commands/config-server-command.ts`
- `packages/cli/src/commands/status-command.ts`
- `packages/cli/src/commands/start-command.ts`
- `packages/cli/bin/leclaw.js`
- `packages/cli/vitest.config.ts`

### Actions

**packages/cli/package.json:**
- name: `"@leclaw/cli"`, `type: "module"`
- bin: `{ "leclaw": "./bin/leclaw.js" }`
- dependencies: `{ commander: "^14.0.3", "@leclaw/shared": "workspace:*", "@leclaw/db": "workspace:*" }`
- devDependencies: `{ vitest@^4.1.2 }`

**packages/cli/bin/leclaw.js:**
```javascript
#!/usr/bin/env node
import { runCli } from "../dist/index.js";

runCli(process.argv).catch((err) => {
  console.error(
    JSON.stringify({
      success: false,
      error: err.message,
      code: "UNKNOWN_ERROR",
    })
  );
  process.exit(1);
});
```

**packages/cli/src/run-cli.ts:**
```typescript
import { buildProgram } from "./program/build-program.js";

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}
```

**packages/cli/src/program/build-program.ts:**
```typescript
import { Command } from "commander";
import { configureProgramHelp } from "./configure-help.js";
import { registerInitCommand } from "../commands/init-command.js";
import { registerConfigCommand } from "../commands/config-command.js";
import { registerStatusCommand } from "../commands/status-command.js";
import { registerStartCommand } from "../commands/start-command.js";
import { registerDoctorCommand } from "../commands/doctor-command.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("leclaw")
    .description("LeClaw - Agent Management Platform")
    .version("1.0.0");

  configureProgramHelp(program);

  registerInitCommand(program);
  registerConfigCommand(program);
  registerStatusCommand(program);
  registerDoctorCommand(program);
  registerStartCommand(program);

  return program;
}
```

**packages/cli/src/program/configure-help.ts:**
```typescript
import { Command } from "commander";

export function configureProgramHelp(program: Command): void {
  program.configureOutput({
    writeErr: (str) => console.error(str),
  });

  program.addHelpText("after", () => {
    return `
Examples:
  leclaw init                    Start interactive setup
  leclaw config                  Show current configuration
  leclaw config openclaw --dir /path/to/openclaw
  leclaw config gateway --url ws://localhost:8080 --token xxx
  leclaw config server --port 3000
  leclaw status                  Check connection status
  leclaw doctor                  Run diagnostic checks
  leclaw start                   Start LeClaw server
`;
  });
}
```

**packages/cli/src/commands/init-command.ts:**

Interactive init using @clack/prompts:

```typescript
import { Command } from "commander";
import { confirm, text, select } from "@clack/prompts";
import path from "path";
import os from "os";
import fs from "fs";
import { initializeDb } from "@leclaw/db";
import { writeConfig, loadConfig, type LeClawConfig } from "@leclaw/shared";

const CONFIG_DIR = path.join(os.homedir(), ".leclaw");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const DB_DIR = path.join(CONFIG_DIR, "db");

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize LeClaw configuration (interactive)")
    .action(async () => {
      try {
        // Create directories
        if (!fs.existsSync(CONFIG_DIR)) {
          fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }

        // Check if already initialized
        let existingConfig: LeClawConfig | null = null;
        if (fs.existsSync(CONFIG_FILE)) {
          existingConfig = loadConfig({ configPath: CONFIG_FILE });
        }

        const s = await import("@clack/prompts").then((m) => m.default);
        s.intro("LeClaw Init");

        const openclawDir = (await s.text({
          message: "OpenClaw directory:",
          defaultValue: existingConfig?.openclaw?.dir ?? "",
          placeholder: "/path/to/openclaw",
        })) as string;

        const gatewayUrl = (await s.text({
          message: "Gateway WebSocket URL:",
          defaultValue: existingConfig?.openclaw?.gatewayUrl ?? "ws://localhost:8080",
          placeholder: "ws://localhost:8080",
        })) as string;

        const gatewayToken = (await s.text({
          message: "Gateway API token:",
          defaultValue: existingConfig?.openclaw?.gatewayToken ?? "",
          placeholder: "your-api-token",
        })) as string;

        const serverPort = (await s.text({
          message: "Server port:",
          defaultValue: String(existingConfig?.server?.port ?? 8080),
          placeholder: "8080",
        })) as string;

        s.info("Initializing embedded PostgreSQL database...");

        // Initialize embedded PostgreSQL
        let connectionString = existingConfig?.database?.connectionString ?? "";
        if (!connectionString) {
          const { connectionString: cs } = await initializeDb({ dataDir: DB_DIR });
          connectionString = cs;
        }

        const config: LeClawConfig = {
          version: "1.0.0",
          openclaw: {
            dir: openclawDir,
            gatewayUrl,
            gatewayToken,
          },
          server: {
            port: parseInt(serverPort, 10) || 8080,
          },
          database: {
            connectionString,
          },
        };

        await writeConfig({ configPath: CONFIG_FILE, config });

        s.success(`Configuration saved to ${CONFIG_FILE}`);

        console.log(
          JSON.stringify({
            success: true,
            configDir: CONFIG_DIR,
            configFile: CONFIG_FILE,
            dbInitialized: true,
          })
        );
        process.exit(0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "INIT_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
```

**packages/cli/src/commands/config-command.ts:**

Hierarchical config with subcommands per D-08:

```typescript
import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, type LeClawConfig } from "@leclaw/shared";
import { registerConfigOpenClawCommand } from "./config-openclaw-command.js";
import { registerConfigGatewayCommand } from "./config-gateway-command.js";
import { registerConfigServerCommand } from "./config-server-command.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("Manage LeClaw configuration");

  // leclaw config (show current)
  config.action(async () => {
    const config = loadConfig({ configPath: CONFIG_FILE });
    console.log(JSON.stringify({ success: true, config }, null, 2));
    process.exit(0);
  });

  registerConfigOpenClawCommand(config);
  registerConfigGatewayCommand(config);
  registerConfigServerCommand(config);
}
```

**packages/cli/src/commands/config-openclaw-command.ts:**

```typescript
import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, type LeClawConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigOpenClawCommand(program: Command): void {
  program
    .command("openclaw")
    .description("Configure OpenClaw settings")
    .option("--dir <path>", "OpenClaw directory path")
    .option("--gateway-url <url>", "Gateway WebSocket URL")
    .option("--gateway-token <token>", "Gateway API token")
    .option("--gateway-password <password>", "Gateway password (optional)")
    .action(async (opts) => {
      try {
        const config = loadConfig({ configPath: CONFIG_FILE });

        if (opts.dir !== undefined) config.openclaw.dir = opts.dir;
        if (opts.gatewayUrl !== undefined) config.openclaw.gatewayUrl = opts.gatewayUrl;
        if (opts.gatewayToken !== undefined) config.openclaw.gatewayToken = opts.gatewayToken;
        if (opts.gatewayPassword !== undefined) config.openclaw.gatewayPassword = opts.gatewayPassword;

        await writeConfig({ configPath: CONFIG_FILE, config });

        console.log(
          JSON.stringify({
            success: true,
            openclaw: {
              dir: config.openclaw.dir,
              gatewayUrl: config.openclaw.gatewayUrl,
              gatewayToken: config.openclaw.gatewayToken ? "***" : undefined,
            },
          })
        );
        process.exit(0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "CONFIG_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
```

**packages/cli/src/commands/config-gateway-command.ts:**

```typescript
import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, type LeClawConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigGatewayCommand(program: Command): void {
  const gateway = program
    .command("gateway")
    .description("Configure Gateway settings (alternative to 'config openclaw')")
    .option("--url <url>", "Gateway WebSocket URL")
    .option("--token <token>", "Gateway API token")
    .option("--password <password>", "Gateway password (optional)");

  gateway.action(async (opts) => {
    try {
      const config = loadConfig({ configPath: CONFIG_FILE });

      if (opts.url !== undefined) config.openclaw.gatewayUrl = opts.url;
      if (opts.token !== undefined) config.openclaw.gatewayToken = opts.token;
      if (opts.password !== undefined) config.openclaw.gatewayPassword = opts.password;

      await writeConfig({ configPath: CONFIG_FILE, config });

      console.log(
        JSON.stringify({
          success: true,
          gateway: {
            url: config.openclaw.gatewayUrl,
            token: config.openclaw.gatewayToken ? "***" : undefined,
          },
        })
      );
      process.exit(0);
    } catch (err) {
      console.error(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
          code: "CONFIG_ERROR",
        })
      );
      process.exit(1);
    }
  });
}
```

**packages/cli/src/commands/config-server-command.ts:**

```typescript
import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig, writeConfig, isValidPort, type LeClawConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerConfigServerCommand(program: Command): void {
  program
    .command("server")
    .description("Configure server settings")
    .option("--port <port>", "Server port", (value) => parseInt(value, 10))
    .action(async (opts) => {
      try {
        const config = loadConfig({ configPath: CONFIG_FILE });

        if (opts.port !== undefined) {
          if (!isValidPort(opts.port)) {
            console.error(
              JSON.stringify({
                success: false,
                error: `Invalid port: ${opts.port}`,
                code: "INVALID_PORT",
              })
            );
            process.exit(1);
          }
          config.server.port = opts.port;
        }

        await writeConfig({ configPath: CONFIG_FILE, config });

        console.log(
          JSON.stringify({
            success: true,
            server: { port: config.server.port },
          })
        );
        process.exit(0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "CONFIG_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
```

**packages/cli/src/commands/status-command.ts:**

```typescript
import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("View connection status to OpenClaw and Gateway")
    .action(async () => {
      try {
        const result: any = {
          config: null,
          openclaw: { configured: false, dir: "", exists: false, accessible: false },
          gateway: { configured: false, url: "", reachable: null },
          database: { configured: false, connectionString: "" },
          overall: "ok",
        };

        if (!fs.existsSync(CONFIG_FILE)) {
          result.overall = "error";
          console.log(JSON.stringify({ success: false, ...result }));
          process.exit(1);
        }

        const config = loadConfig({ configPath: CONFIG_FILE });
        result.config = config;

        // Check OpenClaw directory
        if (config.openclaw?.dir) {
          result.openclaw.configured = true;
          result.openclaw.dir = config.openclaw.dir;
          result.openclaw.exists = fs.existsSync(config.openclaw.dir);
          if (result.openclaw.exists) {
            try {
              fs.accessSync(config.openclaw.dir, fs.constants.R_OK);
              result.openclaw.accessible = true;
            } catch {
              result.openclaw.accessible = false;
            }
          }
        }

        // Check Gateway connectivity
        if (config.openclaw?.gatewayUrl) {
          result.gateway.configured = true;
          result.gateway.url = config.openclaw.gatewayUrl;
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(config.openclaw.gatewayUrl, {
              method: "HEAD",
              signal: controller.signal,
            });
            clearTimeout(timeout);
            result.gateway.reachable = response.ok;
          } catch {
            result.gateway.reachable = false;
          }
        }

        // Check Database
        if (config.database?.connectionString) {
          result.database.configured = true;
          result.database.connectionString = config.database.connectionString.replace(/:[^:@]+@/, ":***@");
        }

        // Determine overall status
        if (!result.database.configured) {
          result.overall = "error";
        } else if (!result.openclaw.configured || !result.gateway.configured) {
          result.overall = "warning";
        } else if (!result.openclaw.exists || result.gateway.reachable === false) {
          result.overall = "warning";
        }

        console.log(JSON.stringify({ success: true, ...result }));
        process.exit(result.overall === "error" ? 1 : 0);
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "STATUS_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
```

**packages/cli/src/commands/doctor-command.ts:**

Per D-14 and D-15 from 01-CONTEXT.md:

```typescript
import { Command } from "commander";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { isPortInUse } from "@leclaw/db";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");
const CONFIG_DIR = path.join(os.homedir(), ".leclaw");
const DB_DIR = path.join(CONFIG_DIR, "db");

interface DoctorCheck {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  details: string;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Run diagnostic checks")
    .action(async () => {
      const checks: DoctorCheck[] = [];

      // 1. Config file exists
      const configExists = fs.existsSync(CONFIG_FILE);
      checks.push({
        name: "config_exists",
        status: configExists ? "PASS" : "FAIL",
        details: configExists ? CONFIG_FILE : `Config file not found at ${CONFIG_FILE}`,
      });

      // 2. Config JSON valid
      if (configExists) {
        try {
          const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
          JSON.parse(raw);
          checks.push({ name: "config_valid_json", status: "PASS", details: "Config file is valid JSON" });
        } catch (err) {
          checks.push({
            name: "config_valid_json",
            status: "FAIL",
            details: `Config file is invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      // 3. OpenClaw directory
      if (configExists) {
        const config = loadConfig({ configPath: CONFIG_FILE });
        if (config.openclaw?.dir) {
          const dirExists = fs.existsSync(config.openclaw.dir);
          checks.push({
            name: "openclaw_dir",
            status: dirExists ? "PASS" : "FAIL",
            details: dirExists ? `OpenClaw directory exists: ${config.openclaw.dir}` : `OpenClaw directory not found: ${config.openclaw.dir}`,
          });
        } else {
          checks.push({ name: "openclaw_dir", status: "WARN", details: "OpenClaw directory not configured" });
        }
      }

      // 4. Gateway connectivity
      if (configExists) {
        const config = loadConfig({ configPath: CONFIG_FILE });
        if (config.openclaw?.gatewayUrl) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(config.openclaw.gatewayUrl, { method: "HEAD", signal: controller.signal });
            clearTimeout(timeout);
            checks.push({
              name: "gateway_reachable",
              status: response.ok ? "PASS" : "FAIL",
              details: `Gateway responded with status ${response.status}`,
            });
          } catch (err) {
            checks.push({
              name: "gateway_reachable",
              status: "FAIL",
              details: `Gateway unreachable: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        } else {
          checks.push({ name: "gateway_reachable", status: "WARN", details: "Gateway URL not configured" });
        }
      }

      // 5. Database directory
      const dbDirExists = fs.existsSync(DB_DIR);
      checks.push({
        name: "db_dir",
        status: dbDirExists ? "PASS" : "WARN",
        details: dbDirExists ? `Database directory exists: ${DB_DIR}` : `Database directory not found: ${DB_DIR}`,
      });

      // 6. Port availability
      if (configExists) {
        const config = loadConfig({ configPath: CONFIG_FILE });
        const port = config.server?.port ?? 8080;
        const portAvailable = !(await isPortInUse(port));
        checks.push({
          name: "port_available",
          status: portAvailable ? "PASS" : "FAIL",
          details: portAvailable ? `Port ${port} is available` : `Port ${port} is already in use`,
        });
      }

      const passed = checks.filter((c) => c.status === "PASS").length;
      const failed = checks.filter((c) => c.status === "FAIL").length;
      const warnings = checks.filter((c) => c.status === "WARN").length;

      console.log(
        JSON.stringify({
          success: true,
          checks,
          summary: { passed, failed, warnings, total: checks.length },
        }, null, 2)
      );

      process.exit(failed > 0 ? 1 : 0);
    });
}
```

**packages/cli/src/commands/start-command.ts:**

```typescript
import { Command } from "commander";
import path from "path";
import os from "os";
import { fork } from "child_process";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerStartCommand(program: Command): void {
  program
    .command("start")
    .description("Start LeClaw server")
    .option("--port <port>", "Server port")
    .option("--host <host>", "Server host", "0.0.0.0")
    .action(async (opts) => {
      try {
        if (!fs.existsSync(CONFIG_FILE)) {
          console.error(
            JSON.stringify({
              success: false,
              error: "Config not found. Run 'leclaw init' first.",
              code: "NOT_INITIALIZED",
            })
          );
          process.exit(1);
        }

        const config = loadConfig({ configPath: CONFIG_FILE });
        const port = opts.port ?? String(config.server?.port ?? 8080);
        const host = opts.host;

        // Fork server process
        const serverDistPath = path.resolve(import.meta.dirname, "..", "..", "server", "dist", "index.js");

        if (!fs.existsSync(serverDistPath)) {
          console.error(
            JSON.stringify({
              success: false,
              error: `Server not found at ${serverDistPath}. Run 'pnpm build' first.`,
              code: "SERVER_NOT_BUILT",
            })
          );
          process.exit(1);
        }

        const serverProcess = fork(serverDistPath, {
          env: {
            ...process.env,
            PORT: port,
            HOST: host,
            DATABASE_URL: config.database?.connectionString ?? "",
          },
          stdio: ["inherit", "pipe", "pipe", "ipc"],
        });

        serverProcess.stdout?.on("data", (data) => process.stdout.write(data));
        serverProcess.stderr?.on("data", (data) => process.stderr.write(data));

        serverProcess.on("exit", (code) => process.exit(code ?? 1));

        process.on("SIGINT", () => {
          serverProcess.kill("SIGINT");
        });
      } catch (err) {
        console.error(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            code: "START_ERROR",
          })
        );
        process.exit(1);
      }
    });
}
```

**packages/cli/src/index.ts:**
```typescript
export { runCli } from "./run-cli.js";
export { buildProgram } from "./program/build-program.js";
```

**packages/cli/vitest.config.ts:**
```typescript
import { defineConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.shared.config.ts";

export default defineConfig({
  ...sharedVitestConfig,
  test: {
    ...sharedVitestConfig.test,
    include: ["src/**/*.test.ts"],
    exclude: [...sharedVitestConfig.test.exclude],
  },
});
```

---

## Task 5: packages/server — Express Backend

### Files

- `packages/server/package.json`
- `packages/server/tsconfig.json`
- `packages/server/src/index.ts`
- `packages/server/src/app.ts`
- `packages/server/src/routes/health.ts`
- `packages/server/vitest.config.ts`

### Actions

**packages/server/package.json:**
- name: `"@leclaw/server"`, `type: "module"`
- main: `"./dist/index.js"`
- dependencies: `{ express: "^5.2.1", cors: "^2.8.5", "@leclaw/shared": "workspace:*", "@leclaw/db": "workspace:*" }`
- devDependencies: `{ vitest@^4.1.2`, `@types/express@^4.17.0`, `@types/cors@^2.8.0` }`

**packages/server/src/app.ts:**
```typescript
import express, { Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/health", healthRouter);
  return app;
}
```

**packages/server/src/routes/health.ts:**
```typescript
import { Router, Request, Response } from "express";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

export const healthRouter = Router();

healthRouter.get("/", (req: Request, res: Response) => {
  const configPath = path.join(os.homedir(), ".leclaw", "config.json");
  let dbConnected = false;

  try {
    if (fs.existsSync(configPath)) {
      const config = loadConfig({ configPath });
      dbConnected = !!config.database?.connectionString;
    }
  } catch {
    dbConnected = false;
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: dbConnected ? "connected" : "disconnected",
  });
});
```

**packages/server/src/index.ts:**
```typescript
import { createApp } from "./app.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(
    JSON.stringify({
      success: true,
      server: { port: PORT, host: HOST },
    })
  );
});
```

**packages/server/vitest.config.ts:**
```typescript
import { defineConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.shared.config.ts";

export default defineConfig({
  ...sharedVitestConfig,
  test: {
    ...sharedVitestConfig.test,
    include: ["src/**/*.test.ts"],
    exclude: [...sharedVitestConfig.test.exclude],
  },
});
```

---

## Verification

1. `pnpm install` succeeds at root
2. `pnpm build` succeeds (builds all packages)
3. `pnpm test -- --run` passes (runs all package tests)
4. `node packages/cli/bin/leclaw.js --help` outputs help
5. `node packages/cli/bin/leclaw.js init` runs interactive prompts
6. `node packages/cli/bin/leclaw.js config` outputs current config as JSON
7. `node packages/cli/bin/leclaw.js config openclaw --dir /tmp/test` updates config
8. `node packages/cli/bin/leclaw.js config server --port 3000` updates config
9. `node packages/cli/bin/leclaw.js status` outputs JSON status
10. `node packages/cli/bin/leclaw.js doctor` outputs JSON diagnostic checks
11. Server `/health` endpoint returns `{ status: "ok", timestamp, version, database }`

---

## Success Criteria

1. **Root workspace**: pnpm workspaces configured, TypeScript standard mode, Vitest configured, oxlint/oxfmt enabled, Husky pre-commit hook
2. **packages/shared**: LeClawConfig type, JSON5 config IO with atomic writes, dot-path utilities
3. **packages/db**: Embedded PostgreSQL initialization with port allocation, data directory management
4. **packages/cli**: Commander.js subcommands, hierarchical config, interactive init with @clack/prompts, status JSON output, doctor diagnostics
5. **packages/server**: Express app with /health endpoint, configurable port/host
6. **Config file**: `~/.leclaw/config.json` with structure matching SPEC.md
7. **CLI output**: Structured JSON to stdout, errors to stderr, exit codes 0/1

---

## Output

After completion, create `.planning/phases/01-foundation-cli-init/SUMMARY.md`
