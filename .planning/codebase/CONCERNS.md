# Concerns

Technical debt, known issues, security concerns, performance issues, and fragile areas identified in this codebase.

## Technical Debt

### Known TODOs
- `referenceRepo/paperclip/server/src/adapters/utils.ts:41` — Remove fallback once `@paperclipai/adapter-utils` exports `buildInvocationEnvForLogs`
- `referenceRepo/paperclip/cli/src/commands/client/company.ts:383` — Replace temporary `claude_local` fallback with adapter selection in import TUI
- `referenceRepo/openclaw/src/acp/translator.ts:960` — ChatEventSchema needs structured errorKind field

### Known Bugs
- `referenceRepo/openclaw/src/cron/isolated-agent/run.cron-model-override.test.ts:125` — BUG #21057: model was only written to session in certain conditions

### Multi-Repo Complexity
- This is a multi-package monorepo-style structure with `referenceRepo/` containing:
  - `paperclip/` — CLI, server, adapters
  - `openclaw/` — Main TUI application
  - `openclaw-control-center/` — Control plane API
- `referenceRepo/openclaw/` and root-level `openclaw/` may be duplicated/related code

## Architecture Concerns

### Cross-Cutting Issues
- Plugin system complexity — multiple abstraction layers (PluginEntry, GatewayProtocol, HookRunner)
- Session management spread across multiple handlers
- Config resolution caching not implemented (`config/io.ts:2377` notes intentional no-caching)

### Fragile Areas
- ACP translator (`src/acp/translator.ts`) — handles complex event routing
- Plugin loader (`referenceRepo/paperclip/server/src/services/plugin-loader.ts`) — complex path resolution
- Session isolation (`src/cron/isolated-agent/`) — regression-prone area with known bugs

## Security Notes

- `NOTE: Reaction mode requires user OAuth (not supported with service account auth)` — `src/config/types.googlechat.ts:110`
- `AUTH_TOKEN_MISMATCH` intentionally not included in certain error handling — `ui/src/ui/gateway.ts:60`

## Performance Considerations

- No config path caching in wrappers — `config/io.ts:2377`
- Remote debugging pages listed explicitly in `doctor-browser.ts` — may need maintenance

## Out of Scope for Mapping

- `skills/` directory contains skill templates with TODO placeholders
- `doc/plans/` contains historical plan documents
- `vendor/` and `test-fixtures/` special directories noted in STRUCTURE.md
