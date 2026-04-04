# Codebase Structure

**Analysis Date:** 2026-04-05

## Directory Layout

```
openclaw/
├── src/                          # Main source code
│   ├── cli/                      # CLI entry point and argument parsing
│   ├── commands/                 # Command handlers (agents, channels, config, etc.)
│   ├── gateway/                  # Gateway server and protocol
│   ├── channels/                  # Core channel implementations
│   ├── plugins/                   # Plugin registry and loader
│   ├── plugin-sdk/                # Public SDK for plugin authors
│   ├── config/                    # Configuration management
│   ├── secrets/                  # Secrets handling
│   ├── infra/                    # Infrastructure (logging, ports, binaries)
│   ├── agents/                    # Agent implementation
│   ├── auto-reply/               # Auto-reply and templating
│   ├── utils/                     # Utilities
│   └── [other modules]/          # Media, cron, tasks, etc.
├── extensions/                    # Bundled plugin workspace
│   ├── discord/
│   ├── telegram/
│   ├── slack/
│   ├── whatsapp/
│   └── [70+ other extensions]/
├── packages/                      # Internal packages
│   ├── clawdbot/
│   ├── moltbot/
│   ├── memory-host-sdk/
│   └── plugin-package-contract/
├── apps/                         # Mobile/desktop apps
│   ├── android/
│   ├── ios/
│   ├── macos/
│   └── shared/
├── ui/                           # UI components
├── test/                         # Test utilities
├── docs/                         # Documentation
├── skills/                       # Agent skills
└── scripts/                      # Build and utility scripts
```

## Directory Purposes

**src/cli/:**
- Purpose: CLI entry point, argument parsing, program setup
- Contains: `argv.ts`, `profile.ts`, `container-target.ts`, `run-main.ts`, `program/` subdirectory
- Key files: `program/root-help.ts`, `program.ts`

**src/commands/:**
- Purpose: Discrete operational command handlers
- Contains: `agents.*`, `channels.*`, `configure.*`, `daemon.*`, `doctor.*`, `gateway-status.*`, `health.*`, `message.*`, `models.*`, `onboard.*`, `reset.*`, `sandbox.*`, `sessions.*`, `setup.*`, `status.*`, `tasks.*`
- Key files: `agents.commands.add.ts`, `channels.add.ts`, `configure.wizard.ts`, `doctor.ts`

**src/gateway/:**
- Purpose: Central gateway server handling routing, sessions, and agent execution
- Contains: `server/` (HTTP/WebSocket server), `protocol/` (wire schema), `client.ts`, `auth.ts`, `hooks.ts`
- Key files: `server/impl.ts`, `server-http.ts`, `server-chat.ts`, `server-plugins.ts`

**src/channels/:**
- Purpose: Core channel implementations and channel infrastructure
- Contains: Channel adapters, routing logic, `plugins/` subdirectory for channel plugin types
- Key files: `channel-config.ts`, `registry.ts`, `allowlist-match.ts`, `thread-bindings-policy.ts`

**src/plugins/:**
- Purpose: Plugin discovery, manifest validation, loading, and lifecycle
- Contains: `loader.ts`, `registry.ts`, `manifest.ts`, `discovery.ts`, `install.ts`, `hooks.ts`
- Key files: `loader.ts`, `registry.ts`, `types.ts`, `bundled-plugin-metadata.ts`

**src/plugin-sdk/:**
- Purpose: Public SDK surface for extension authors
- Contains: `core.ts`, `channel-contract.ts`, `provider-entry.ts`, `runtime.ts`, `setup.ts`
- Key files: `index.ts`, `core.ts`, `channel-contract.ts`

**src/config/:**
- Purpose: Configuration management and validation
- Contains: `config.ts`, `schema.ts`, `sessions/` (session storage), `store.ts`
- Key files: `config.ts`, `schema.ts`, `sessions/session-key.ts`, `sessions/store.ts`

**src/infra/:**
- Purpose: Cross-cutting infrastructure concerns
- Contains: `logger.ts`, `ports.ts`, `binaries.ts`, `env.ts`, `errors.ts`, `is-main.ts`
- Key files: `logger.ts`, `ports.ts`, `gaxios-fetch-compat.ts`

**src/agents/:**
- Purpose: Agent implementation and execution
- Contains: `agent-command.ts`, `agent-scope.ts`, `agent-prompt.ts`
- Key files: `agent-command.ts`, `acp-spawn.ts`

**src/auto-reply/:**
- Purpose: Auto-reply functionality and message templating
- Contains: `reply.runtime.ts`, `templating.ts`, `session-compaction.ts`
- Key files: `reply.runtime.ts`, `templating.ts`

## Key File Locations

**Entry Points:**
- `src/index.ts`: Main CLI entry (openclaw.mjs wrapper)
- `src/entry.ts`: Legacy direct entry point
- `src/library.ts`: Library exports for programmatic use

**Configuration:**
- `src/config/config.ts`: Main config loader
- `src/config/schema.ts`: Config validation schema
- `.env.example`: Environment variable template

**Core Logic:**
- `src/gateway/server/impl.ts`: Gateway server implementation
- `src/plugins/loader.ts`: Plugin loader
- `src/plugins/registry.ts`: Plugin registry

**Testing:**
- `test/` or alongside source as `*.test.ts`
- `vitest.config.ts`: Test configuration
- `vitest.*.config.ts`: Scoped test configs

**Mobile Apps:**
- `apps/android/`: Android native app
- `apps/ios/`: iOS native app
- `apps/macos/`: macOS native app

## Naming Conventions

**Files:**
- TypeScript files: `kebab-case.ts` (e.g., `session-key.ts`, `channel-config.ts`)
- Test files: Same name with `.test.ts` suffix (e.g., `session-key.test.ts`)
- Runtime boundary files: `*.runtime.ts` suffix
- E2E tests: `*.e2e.test.ts` suffix

**Directories:**
- Lowercase plural nouns: `src/channels/`, `src/plugins/`, `src/commands/`
- Module directories: `src/gateway/server/`, `src/cli/program/`

**Functions/Variables:**
- camelCase: `loadConfig`, `resolveSessionKey`, `ensurePortAvailable`
- PascalCase for classes/types: `class GatewayServer`, `interface PluginManifest`

**Types/Interfaces:**
- Suffix with type name: `PluginManifest`, `ChannelConfig`, `ProviderEntry`
- Contract interfaces: `*Contract` suffix

## Where to Add New Code

**New CLI Command:**
- Primary code: `src/cli/program/<command-name>.ts`
- Command registration: `src/cli/program/root-help.ts` or via Commander auto-binding
- Tests: `src/cli/program/<command-name>.test.ts`

**New Command Handler:**
- Primary code: `src/commands/<feature>.<action>.ts` (e.g., `channels.add.ts`)
- Command definitions: `src/commands/<feature>.ts` for orchestration

**New Plugin Type (Channel/Provider):**
- Bundled plugin: `extensions/<plugin-id>/src/index.ts`
- Plugin manifest: `extensions/<plugin-id>/openclaw.plugin.json`
- SDK entry: `src/plugin-sdk/<plugin-type>.ts`

**New Gateway Feature:**
- Server implementation: `src/gateway/server/<feature>.ts`
- Protocol schema: `src/gateway/protocol/schema/<feature>.ts`
- Hooks: `src/plugins/hooks.<feature>.ts`

**New Channel (Core):**
- Channel implementation: `src/channels/<channel-name>/`
- Channel config: `src/channels/channel-config.ts`
- Tests: alongside source as `*.test.ts`

**Utilities:**
- Shared helpers: `src/utils.ts` for small utilities
- Larger utilities: `src/utils/<feature>.ts`

## Special Directories

**extensions/:**
- Purpose: Bundled plugin workspace packages
- Contains: 70+ messaging channel and model provider integrations
- Generated: No (committed source)
- Note: Each extension is a separate workspace package with its own `package.json`

**packages/:**
- Purpose: Internal shared packages
- Contains: `clawdbot`, `moltbot`, `memory-host-sdk`, `plugin-package-contract`
- Generated: No
- Note: Used by bundled plugins and core

**vendor/:**
- Purpose: Vendored third-party code
- Contains: `a2ui/` (Angular rendering components)
- Note: Third-party code maintained separately

**test-fixtures/:**
- Purpose: Test data and fixtures
- Generated: No
- Note: Shared test resources

**docs/.generated/:**
- Purpose: Auto-generated documentation artifacts
- Generated: Yes (by docs pipeline)
- Note: SHA256 baseline files tracked in git

**dist/:**
- Purpose: Build output
- Generated: Yes (by build process)
- Note: Not committed, ignored in .gitignore

---

*Structure analysis: 2026-04-05*
