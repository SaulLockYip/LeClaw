# Coding Conventions

**Analysis Date:** 2026-04-05

## Languages

**Primary:**
- TypeScript (ESM modules) - All production code
- Node.js 22+ required

**Secondary:**
- Swift (iOS/macOS apps)
- Shell scripts (build/dev tasks)

## TypeScript Guidelines

**Strict Mode:** Enabled - `strict: true` in tsconfig.json

**Key Settings (tsconfig.json:1-30):**
```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmitOnError": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Type Rules:**
- Never use `@ts-nocheck` unless code is intentionally correct and rule cannot express safely
- Never disable `no-explicit-any`; prefer `unknown`, real types, or narrow adapters
- Prefer `zod` or schema helpers at external boundaries (config, webhooks, CLI output, persisted JSON)

## Naming Patterns

**Files:**
- camelCase or kebab-case for source files: `utils.ts`, `path-exists.ts`
- Co-located tests: `*.test.ts` (e.g., `utils.test.ts`)
- E2E tests: `*.e2e.test.ts`
- Live/tests with real APIs: `*.live.test.ts`

**Functions/Variables:**
- camelCase: `resolveConfigDir`, `isChannelConfigured`
- PascalCase for classes/types: `ChannelPlugin`, `BackoffPolicy`
- SCREAMING_SNAKE_CASE for constants: `DEFAULT_TIMEOUT_MS`, `WORKER_RUNTIME_STATE`

**Types:**
- Prefer explicit type annotations for function parameters and return types
- Use `type` for aliases, `interface` for object shapes
- Discriminated unions for runtime behavior variants

## Code Style

**Formatting Tool:** Oxfmt

**Configuration (`.oxfmtrc.jsonc`):**
```json
{
  "tabWidth": 2,
  "useTabs": false,
  "experimentalSortImports": { "newlinesBetween": false }
}
```

**Linting Tool:** Oxlint with typescript, unicorn, and oxc plugins

**Configuration (`.oxlintrc.json`):**
```json
{
  "plugins": ["unicorn", "typescript", "oxc"],
  "categories": {
    "correctness": "error",
    "perf": "error",
    "suspicious": "error"
  },
  "rules": {
    "typescript/no-explicit-any": "error"
  }
}
```

**Key Rules:**
- `curly`: error
- `typescript/no-explicit-any`: error
- `eslint/no-await-in-loop`: off
- `eslint/no-new`: off

**Commands:**
```bash
pnpm format          # Check formatting (oxfmt --check)
pnpm format:fix      # Fix formatting (oxfmt --write)
pnpm lint            # Run linter
pnpm lint:fix        # Fix lint issues
pnpm check           # Full check (lint + format + type check)
```

## Import Organization

**Order (via oxfmt experimentalSortImports):**
1. Node built-ins (`node:fs`, `node:path`)
2. External packages (`vitest`, `zod`)
3. Internal packages (`openclaw/plugin-sdk/*`)
4. Relative imports (`./utils`, `../infra/home-dir`)

**Path Aliases (tsconfig.json:20-25):**
```json
"paths": {
  "openclaw/extension-api": ["./src/extensionAPI.ts"],
  "openclaw/plugin-sdk": ["./src/plugin-sdk/index.ts"],
  "openclaw/plugin-sdk/*": ["./src/plugin-sdk/*.ts"],
  "@openclaw/*": ["./extensions/*"]
}
```

**Dynamic Import Guardrail:**
- Do not mix `await import("x")` and static `import ... from "x"` for the same module
- Use dedicated `*.runtime.ts` boundaries for lazy loading
- Verify with `pnpm build` - check for `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings

## Error Handling

**Pattern: Prefer explicit returns over thrown errors for recoverable cases**

```typescript
// Good: returns null on failure
export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

// Good: Result-style outcomes for recoverable errors
export function computeBackoff(policy: BackoffPolicy, attempt: number) {
  const base = policy.initialMs * policy.factor ** Math.max(attempt - 1, 0);
  const jitter = base * policy.jitter * Math.random();
  return Math.min(policy.maxMs, Math.round(base + jitter));
}
```

**Error Propagation:**
- Use closed error-code unions for recoverable runtime decisions
- Do not branch on `error: string` when a closed code union is reasonable
- Keep human-readable strings for logs/CLI; do not use strings as branching source of truth

**Aborted Operations:**
```typescript
export async function sleepWithAbort(ms: number, abortSignal?: AbortSignal) {
  if (ms <= 0) {
    return;
  }
  try {
    await delay(ms, undefined, { signal: abortSignal });
  } catch (err) {
    if (abortSignal?.aborted) {
      throw new Error("aborted", { cause: err });
    }
    throw err;
  }
}
```

## Logging

**Framework:** tslog (structured logging via `src/logging/logger.js`)

**Patterns:**
```typescript
import { logDebug, logInfo, logWarn, logError, logSuccess } from "./logger.js";
import { isVerbose } from "./global-state.js";

// Debug: only emits when verbose is enabled
logDebug("message");

// Info/Warn/Error/Success: always logs
logInfo("info", runtime);
logWarn("warn", runtime);
logError("bad", runtime);
logSuccess("ok", runtime);
```

## Comments

**When to Comment:**
- Add brief comments for tricky or non-obvious logic
- Document JSDoc for exported functions that are not self-explanatory

**JSDoc Pattern:**
```typescript
/**
 * Check if a file or directory exists at the given path.
 */
export async function pathExists(targetPath: string): Promise<boolean> {
  // ...
}
```

## Module Design

**File Size:** Aim for under ~700 LOC; extract helpers instead of "V2" copies

**Dependency Injection:**
```typescript
export function resolveConfigDir(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): string {
  // Use passed deps instead of globals when possible
}
```

**Prefer composition over class inheritance:**
- Never share class behavior via prototype mutation
- Use explicit inheritance/composition

## Testing Patterns

**See TESTING.md** for detailed testing conventions.

## Special File Conventions

**Entry Points:**
- `src/index.ts` - Main library export
- `src/entry.ts` - CLI entry
- `src/runtime.ts` - Runtime bootstrap

**Barrel Files:**
- `src/plugin-sdk/index.ts` - Plugin SDK public surface
- Local barrels like `./api.ts`, `./runtime-api.ts` for extensions

**Extension Structure:**
```
extensions/<name>/
  src/
    config.ts
    index.ts
    api.ts           # Public API surface
    runtime-api.ts   # Runtime helpers
  package.json
  vitest.config.ts
```

---

*Convention analysis: 2026-04-05*
