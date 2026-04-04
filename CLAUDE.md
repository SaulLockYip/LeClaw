<!-- GSD:project-start source:PROJECT.md -->
## Project

**LeClaw**

LeClaw 是一个独立进程，通过连接外部 OpenClaw 实例来实现：
1. **Agent 分层管理** — Company/Department 组织架构，CEO/Manager/Staff 三级 Agent
2. **Hybrid 协同编排** — 高对低是分配+验收，低对低是平行协作，零人工介入
3. **全链路监控** — 日志聚合、调用链路、性能指标、安全审计
4. **策略进化** — 基于运行反馈调整 Agent 行为策略

**Core Value:** **ONE thing that must work:** 分层 Agent 协同编排 + 实时状态监控
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript (ES2023) - Core application logic, CLI, gateway, plugins
- Node.js runtime with ESM modules (`"type": "module"` in `package.json`)
- Swift - iOS/macOS native applications (`apps/ios`, `apps/macos`)
- Kotlin - Android native application (`apps/android`)
- Shell scripts - Build and deployment scripts
## Runtime
- Node.js 22.14.0+ (minimum requirement in `package.json` `engines`)
- Bun (supported for scripts and development)
- pnpm 10.32.1
- Lockfile: `pnpm-lock.yaml` (present)
## Frameworks
- Express 5.2.1 - HTTP server framework (used in gateway)
- Hono 4.12.10 - Lightweight web framework (API routes)
- ws 8.20.0 - WebSocket library (real-time communication)
- dotenv 17.4.0 - Environment variable loading
- tsdown 0.21.7 - TypeScript bundler for production builds
- tsx 4.21.0 - TypeScript execution runtime
- Vitest 4.1.2 - Testing framework
- Oxlint 1.58.0 - Linter
- Oxfmt 0.43.0 - Code formatter
- Commander 14.0.3 - CLI argument parsing
- @clack/prompts 1.2.0 - Interactive CLI prompts
- JSZip 3.10.1 - ZIP archive handling
- tar 7.5.13 - TAR archive handling
- PDF.js 5.6.205 (pdfjs-dist) - PDF parsing
- linkedom 0.18.12 - HTML parsing
- markdown-it 14.1.1 - Markdown parsing
- @mozilla/readability 0.6.0 - Article extraction
- sharp 0.34.5 - Image processing
- node-edge-tts 1.2.10 - Text-to-speech
- node:sqlite (built-in Node.js) - Local SQLite storage
- drizzle-orm 0.38.4 - SQL query builder (paperclip db package)
- embedded-postgres 18.1.0-beta.16 - Embedded PostgreSQL (paperclip db package)
- @modelcontextprotocol/sdk 1.29.0 - MCP protocol
- @matrix-org/matrix-sdk-crypto-wasm 18.0.0 - Matrix protocol crypto
- matrix-js-sdk 41.3.0-rc.0 - Matrix chat protocol
- @agentclientprotocol/sdk 0.18.0 - Agent communication protocol
- Vitest with V8 coverage (thresholds: 70% lines/branches/functions/statements)
- Playwright 1.59.1 (playwright-core) - E2E testing
- jsdom 29.0.1 - DOM simulation for tests
- @lydell/node-pty 1.2.0-beta.3 - PTY for terminal emulation
- @napi-rs/canvas 0.1.89 (peer) - Canvas rendering
- node-llama-cpp 3.18.1 (peer, optional) - Local LLM inference
## Configuration
- Environment variables loaded via dotenv
- Config file: `~/.openclaw/openclaw.json`
- `.env` files supported (local development)
- Config: `tsconfig.json`
- Target: ES2023
- Module: NodeNext
- Strict mode enabled
- Path aliases: `openclaw/plugin-sdk/*` -> `src/plugin-sdk/*`
- Oxlint with TypeScript support
- OXFmt for code formatting
- SwiftLint for Swift code
- Vitest configured with multiple project configs (see `vitest.*.config.ts`)
- Coverage provider: V8
- Test files: `*.test.ts` naming convention
- Setup files: `test/setup.ts`
## Platform Requirements
- Node.js 22.14.0+
- pnpm 10.32.1+
- Bun (optional, for faster script execution)
- Git
- Node.js 22.14.0+
- Linux (Docker), macOS, Windows
- SQLite support (node:sqlite built-in)
- Docker (optional, for sandbox isolation)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Languages
- TypeScript (ESM modules) - All production code
- Node.js 22+ required
- Swift (iOS/macOS apps)
- Shell scripts (build/dev tasks)
## TypeScript Guidelines
- Never use `@ts-nocheck` unless code is intentionally correct and rule cannot express safely
- Never disable `no-explicit-any`; prefer `unknown`, real types, or narrow adapters
- Prefer `zod` or schema helpers at external boundaries (config, webhooks, CLI output, persisted JSON)
## Naming Patterns
- camelCase or kebab-case for source files: `utils.ts`, `path-exists.ts`
- Co-located tests: `*.test.ts` (e.g., `utils.test.ts`)
- E2E tests: `*.e2e.test.ts`
- Live/tests with real APIs: `*.live.test.ts`
- camelCase: `resolveConfigDir`, `isChannelConfigured`
- PascalCase for classes/types: `ChannelPlugin`, `BackoffPolicy`
- SCREAMING_SNAKE_CASE for constants: `DEFAULT_TIMEOUT_MS`, `WORKER_RUNTIME_STATE`
- Prefer explicit type annotations for function parameters and return types
- Use `type` for aliases, `interface` for object shapes
- Discriminated unions for runtime behavior variants
## Code Style
- `curly`: error
- `typescript/no-explicit-any`: error
- `eslint/no-await-in-loop`: off
- `eslint/no-new`: off
## Import Organization
- Do not mix `await import("x")` and static `import ... from "x"` for the same module
- Use dedicated `*.runtime.ts` boundaries for lazy loading
- Verify with `pnpm build` - check for `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings
## Error Handling
- Use closed error-code unions for recoverable runtime decisions
- Do not branch on `error: string` when a closed code union is reasonable
- Keep human-readable strings for logs/CLI; do not use strings as branching source of truth
## Logging
## Comments
- Add brief comments for tricky or non-obvious logic
- Document JSDoc for exported functions that are not self-explanatory
## Module Design
- Never share class behavior via prototype mutation
- Use explicit inheritance/composition
## Testing Patterns
## Special File Conventions
- `src/index.ts` - Main library export
- `src/entry.ts` - CLI entry
- `src/runtime.ts` - Runtime bootstrap
- `src/plugin-sdk/index.ts` - Plugin SDK public surface
- Local barrels like `./api.ts`, `./runtime-api.ts` for extensions
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **Plugin-centric architecture**: The system is built around a plugin registry and runtime that supports channel integrations (Discord, Slack, Telegram, etc.) and model providers (OpenAI, Anthropic, etc.)
- **Gateway-centric design**: A central gateway server handles message routing, session management, and agent execution across all channels
- **Protocol-driven communication**: Typed wire protocol (`src/gateway/protocol/`) defines the contract between operator clients and nodes
- **Manifest-first plugin loading**: Plugins are discovered and validated via manifest files before runtime activation
- **Separation of concerns**: Clear boundaries between CLI (`src/cli/`), commands (`src/commands/`), gateway (`src/gateway/`), channels (`src/channels/`), and plugins (`src/plugins/`)
## Layers
- Purpose: User-facing command-line interface and entry point
- Location: `src/cli/`
- Contains: Argument parsing (`argv.ts`), profile management (`profile.ts`), container target resolution (`container-target.ts`), program definition (`program/`)
- Depends on: Commands layer, config layer
- Used by: End users, automation scripts
- Purpose: Discrete operational units (agents, channels, config, health, etc.)
- Location: `src/commands/`
- Contains: `agents.*`, `channels.*`, `configure.*`, `daemon.*`, `doctor.*`, `health.*`, `onboard.*`, `status.*`, `tasks.*`
- Depends on: Gateway layer, plugin system, config
- Used by: CLI layer
- Purpose: Central server handling message routing, session management, and AI agent execution
- Location: `src/gateway/`
- Contains: `server/` (HTTP/WebSocket server), `protocol/` (wire schema), `client.ts` (gateway client), `auth.ts` (authentication), `hooks.ts` (hook system)
- Key files: `server/impl.ts` (main server implementation), `server-http.ts` (HTTP handler), `server-chat.ts` (chat session handling)
- Depends on: Plugin SDK, channel system, config
- Used by: Commands layer, mobile/desktop apps
- Purpose: Public contract for extension authors
- Location: `src/plugin-sdk/`
- Contains: `core.ts` (core interfaces), `channel-contract.ts` (channel interface), `provider-entry.ts` (provider interface), `runtime.ts` (runtime helpers), `hooks.ts` (hook system)
- Depends on: Plugin registry
- Used by: Bundled plugins, third-party plugins
- Purpose: Plugin discovery, manifest validation, loading, and lifecycle management
- Location: `src/plugins/`
- Contains: `loader.ts` (plugin loader), `registry.ts` (plugin registry), `manifest.ts` (manifest parsing), `discovery.ts` (plugin discovery), `install.ts` (installation)
- Depends on: Config, secrets system
- Used by: Gateway layer, CLI
- Purpose: Protocol-specific channel implementations (Discord, Slack, Telegram, etc.)
- Location: `src/channels/` (core channels), `extensions/` (bundled plugin channels)
- Contains: Channel adapters, routing logic, message parsing, send/monitor operations
- Key files: `channel-config.ts`, `registry.ts`, `plugins/types.plugin.ts`
- Depends on: Plugin SDK, gateway protocol
- Used by: Gateway server
- Purpose: Configuration management and secrets handling
- Location: `src/config/`, `src/secrets/`
- Contains: `config.ts` (main config), `sessions/` (session store), `store.ts` (config store), `schema.ts` (config validation)
- Depends on: Infrastructure layer
- Used by: All layers
- Purpose: Cross-cutting concerns (logging, ports, binaries, environment)
- Location: `src/infra/`
- Contains: `logger.ts`, `ports.ts`, `binaries.ts`, `env.ts`, `errors.ts`
- Depends on: Node.js standard library
- Used by: All layers
## Data Flow
## Key Abstractions
- Purpose: Defines the interface all plugins must implement
- Examples: `src/plugin-sdk/plugin-entry.ts`, `src/plugins/types.ts`
- Pattern: Each plugin provides `openclaw.plugin.json` manifest + entry function
- Purpose: Standard interface for all messaging channel integrations
- Examples: `src/plugin-sdk/channel-contract.ts`, `src/channels/plugins/types.plugin.ts`
- Pattern: Implementors must provide `send`, `monitor`, `setup`, `onboard` operations
- Purpose: Standard interface for AI model providers
- Examples: `src/plugin-sdk/provider-entry.ts`, `src/plugins/providers.ts`
- Pattern: Each provider registers models via catalog and handles auth
- Purpose: Wire contract between gateway server and clients/nodes
- Examples: `src/gateway/protocol/schema.ts`, `src/gateway/protocol/index.ts`
- Pattern: Typed schema with additive evolution versioning
- Purpose: Extensibility system for intercepting and modifying behavior
- Examples: `src/plugins/hooks.ts`, `src/gateway/hooks.ts`
- Pattern: Phase-based hooks (`before-agent-start`, `before-agent-reply`, etc.)
- Purpose: Normalized representation of a messaging session
- Examples: `src/channels/inbound-envelope.ts`, `src/channels/session-envelope.ts`
- Pattern: Channel-agnostic session representation
## Entry Points
- Location: `src/cli/run-main.ts` (imported from `src/index.ts`)
- Triggers: `openclaw <command>` from terminal
- Responsibilities: Parse argv, apply profile, route to command handlers
- Location: `src/gateway/server/impl.ts` (bootstrapped from `src/commands/gateway-run.ts`)
- Triggers: `openclaw gateway run`
- Responsibilities: Initialize HTTP/WebSocket server, load plugins, start channel monitors
- Location: `src/library.ts`
- Triggers: Direct import of openclaw as a module
- Responsibilities: Export lazy-loaded functions for programmatic access
- Location: `src/plugins/loader.ts`
- Triggers: Gateway startup, `openclaw plugins install`
- Responsibilities: Discover, validate, load, and activate plugins
## Error Handling
- `Result<T, E>` style outcomes in `src/utils.ts` for recoverable operations
- Closed error-code unions for runtime decisions (avoid `error: string` branching)
- Human-readable strings for logs/CLI, not for internal branching
- Global unhandled rejection handler in `src/entry.ts`
- Per-channel retry logic in transport adapters
- Hook failures logged but do not block message processing by default
- Hooks can opt into fatal behavior via `hookPolicy.fatal`
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
