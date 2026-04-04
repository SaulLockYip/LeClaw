# Architecture

**Analysis Date:** 2026-04-05

## Pattern Overview

**Overall:** Multi-channel AI Gateway with Plugin-based Extensibility

**Key Characteristics:**
- **Plugin-centric architecture**: The system is built around a plugin registry and runtime that supports channel integrations (Discord, Slack, Telegram, etc.) and model providers (OpenAI, Anthropic, etc.)
- **Gateway-centric design**: A central gateway server handles message routing, session management, and agent execution across all channels
- **Protocol-driven communication**: Typed wire protocol (`src/gateway/protocol/`) defines the contract between operator clients and nodes
- **Manifest-first plugin loading**: Plugins are discovered and validated via manifest files before runtime activation
- **Separation of concerns**: Clear boundaries between CLI (`src/cli/`), commands (`src/commands/`), gateway (`src/gateway/`), channels (`src/channels/`), and plugins (`src/plugins/`)

## Layers

**CLI Layer:**
- Purpose: User-facing command-line interface and entry point
- Location: `src/cli/`
- Contains: Argument parsing (`argv.ts`), profile management (`profile.ts`), container target resolution (`container-target.ts`), program definition (`program/`)
- Depends on: Commands layer, config layer
- Used by: End users, automation scripts

**Commands Layer:**
- Purpose: Discrete operational units (agents, channels, config, health, etc.)
- Location: `src/commands/`
- Contains: `agents.*`, `channels.*`, `configure.*`, `daemon.*`, `doctor.*`, `health.*`, `onboard.*`, `status.*`, `tasks.*`
- Depends on: Gateway layer, plugin system, config
- Used by: CLI layer

**Gateway Layer:**
- Purpose: Central server handling message routing, session management, and AI agent execution
- Location: `src/gateway/`
- Contains: `server/` (HTTP/WebSocket server), `protocol/` (wire schema), `client.ts` (gateway client), `auth.ts` (authentication), `hooks.ts` (hook system)
- Key files: `server/impl.ts` (main server implementation), `server-http.ts` (HTTP handler), `server-chat.ts` (chat session handling)
- Depends on: Plugin SDK, channel system, config
- Used by: Commands layer, mobile/desktop apps

**Plugin SDK Layer:**
- Purpose: Public contract for extension authors
- Location: `src/plugin-sdk/`
- Contains: `core.ts` (core interfaces), `channel-contract.ts` (channel interface), `provider-entry.ts` (provider interface), `runtime.ts` (runtime helpers), `hooks.ts` (hook system)
- Depends on: Plugin registry
- Used by: Bundled plugins, third-party plugins

**Plugin Registry/Loader Layer:**
- Purpose: Plugin discovery, manifest validation, loading, and lifecycle management
- Location: `src/plugins/`
- Contains: `loader.ts` (plugin loader), `registry.ts` (plugin registry), `manifest.ts` (manifest parsing), `discovery.ts` (plugin discovery), `install.ts` (installation)
- Depends on: Config, secrets system
- Used by: Gateway layer, CLI

**Channel Layer:**
- Purpose: Protocol-specific channel implementations (Discord, Slack, Telegram, etc.)
- Location: `src/channels/` (core channels), `extensions/` (bundled plugin channels)
- Contains: Channel adapters, routing logic, message parsing, send/monitor operations
- Key files: `channel-config.ts`, `registry.ts`, `plugins/types.plugin.ts`
- Depends on: Plugin SDK, gateway protocol
- Used by: Gateway server

**Config/Secrets Layer:**
- Purpose: Configuration management and secrets handling
- Location: `src/config/`, `src/secrets/`
- Contains: `config.ts` (main config), `sessions/` (session store), `store.ts` (config store), `schema.ts` (config validation)
- Depends on: Infrastructure layer
- Used by: All layers

**Infrastructure Layer:**
- Purpose: Cross-cutting concerns (logging, ports, binaries, environment)
- Location: `src/infra/`
- Contains: `logger.ts`, `ports.ts`, `binaries.ts`, `env.ts`, `errors.ts`
- Depends on: Node.js standard library
- Used by: All layers

## Data Flow

**Message Inbound Flow:**
1. Channel adapter (e.g., `src/channels/plugins/telegram.ts`) receives inbound message
2. Channel adapter validates and parses message into session envelope
3. Gateway server (`src/gateway/server-chat.ts`) receives envelope via channel transport
4. Hooks system (`src/gateway/hooks.ts`) processes `before-agent-start` hooks
5. Agent execution (`src/agents/agent-command.ts`) runs the agent with model provider
6. Hooks system processes `before-agent-reply` and `before-tool-call` hooks
7. Response routed back through channel adapter to messaging platform

**Message Outbound Flow:**
1. Agent generates response via `src/agents/agent-command.ts`
2. Response processed through `before-agent-reply` hooks
3. Gateway routes to appropriate channel via `src/gateway/server-channels.ts`
4. Channel adapter formats and sends message to messaging platform

**Plugin Installation Flow:**
1. User runs `openclaw plugins install <id>`
2. CLI invokes `src/commands/plugins-install-command.ts`
3. Plugin registry (`src/plugins/install.ts`) resolves plugin metadata
4. Manifest validated (`src/plugins/manifest.ts`)
5. Plugin runtime staged and activated via `src/plugins/loader.ts`

**Session Management Flow:**
1. Session created via `src/gateway/sessions.ts`
2. Session state persisted via `src/config/sessions/store.ts`
3. Session key derived from channel + sender identity via `src/config/sessions/session-key.ts`
4. Session history compacted via `src/auto-reply/session-compaction.ts` when needed

## Key Abstractions

**PluginEntry (Plugin Contract):**
- Purpose: Defines the interface all plugins must implement
- Examples: `src/plugin-sdk/plugin-entry.ts`, `src/plugins/types.ts`
- Pattern: Each plugin provides `openclaw.plugin.json` manifest + entry function

**ChannelContract:**
- Purpose: Standard interface for all messaging channel integrations
- Examples: `src/plugin-sdk/channel-contract.ts`, `src/channels/plugins/types.plugin.ts`
- Pattern: Implementors must provide `send`, `monitor`, `setup`, `onboard` operations

**ProviderEntry:**
- Purpose: Standard interface for AI model providers
- Examples: `src/plugin-sdk/provider-entry.ts`, `src/plugins/providers.ts`
- Pattern: Each provider registers models via catalog and handles auth

**GatewayProtocol:**
- Purpose: Wire contract between gateway server and clients/nodes
- Examples: `src/gateway/protocol/schema.ts`, `src/gateway/protocol/index.ts`
- Pattern: Typed schema with additive evolution versioning

**HookRunner:**
- Purpose: Extensibility system for intercepting and modifying behavior
- Examples: `src/plugins/hooks.ts`, `src/gateway/hooks.ts`
- Pattern: Phase-based hooks (`before-agent-start`, `before-agent-reply`, etc.)

**SessionEnvelope:**
- Purpose: Normalized representation of a messaging session
- Examples: `src/channels/inbound-envelope.ts`, `src/channels/session-envelope.ts`
- Pattern: Channel-agnostic session representation

## Entry Points

**CLI Entry:**
- Location: `src/cli/run-main.ts` (imported from `src/index.ts`)
- Triggers: `openclaw <command>` from terminal
- Responsibilities: Parse argv, apply profile, route to command handlers

**Gateway Server Entry:**
- Location: `src/gateway/server/impl.ts` (bootstrapped from `src/commands/gateway-run.ts`)
- Triggers: `openclaw gateway run`
- Responsibilities: Initialize HTTP/WebSocket server, load plugins, start channel monitors

**Library Entry:**
- Location: `src/library.ts`
- Triggers: Direct import of openclaw as a module
- Responsibilities: Export lazy-loaded functions for programmatic access

**Plugin Entry:**
- Location: `src/plugins/loader.ts`
- Triggers: Gateway startup, `openclaw plugins install`
- Responsibilities: Discover, validate, load, and activate plugins

## Error Handling

**Strategy:** Result types with closed error codes + graceful degradation

**Patterns:**
- `Result<T, E>` style outcomes in `src/utils.ts` for recoverable operations
- Closed error-code unions for runtime decisions (avoid `error: string` branching)
- Human-readable strings for logs/CLI, not for internal branching
- Global unhandled rejection handler in `src/entry.ts`
- Per-channel retry logic in transport adapters

**Hook Error Handling:**
- Hook failures logged but do not block message processing by default
- Hooks can opt into fatal behavior via `hookPolicy.fatal`

## Cross-Cutting Concerns

**Logging:** Structured logging via `src/infra/logger.ts` with log levels, redaction support

**Validation:** Zod schemas at external boundaries (config, webhooks, CLI JSON output)

**Authentication:** Multi-mode auth system (`src/gateway/auth.ts`) supporting token, OAuth, API key

**Configuration:** Zod-validated config with migration support, `src/config/schema.ts`

---

*Architecture analysis: 2026-04-05*
