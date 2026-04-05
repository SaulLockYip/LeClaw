# Phase 1: Foundation + CLI Init - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

User can initialize LeClaw project and configure OpenClaw/Gateway settings via CLI.

**Scope:**
- `leclaw init` — 初始化 `~/.leclaw/` 目录
- `leclaw config openclaw --dir <path>` — 配置 OpenClaw 目录
- `leclaw config gateway --url <url> --key <key>` — 配置 Gateway 地址和密钥
- `leclaw config` — 查看当前配置
- `leclaw status` — 查看连接状态
- `leclaw start` — 启动 LeClaw 服务
- 初始化 embedded PostgreSQL 数据库

**Out of scope for this phase:**
- Web UI (Phase 5+)
- REST API (Phase 2+)
- OpenClaw 实际连接 (Phase 3)

</domain>

<decisions>
## Implementation Decisions

### CLI Output & Config Format
- **D-01:** CLI output format = Structured JSON (machine-parseable)
- **D-02:** Config file format = JSON (`~/.leclaw/config.json`)
- **D-03:** Config directory = `~/.leclaw/`

### Error Handling
- **D-04:** Errors reported via verbose stderr (详细错误信息)
- **D-05:** Exit codes: 0 = success, non-zero = error

### Init Mode
- **D-06:** `leclaw init` = 纯非交互式，all flags passed via CLI arguments
- **D-07:** 不使用交互式 TUI (@clack/prompts)

### Naming Convention
- **D-08:** 文件/函数命名 = camelCase (e.g., `leclawInit`, `configSet`)

### Project Structure
- **D-09:** 目录结构 = monorepo packages/ (不是 src/flat)
- **D-10:** packages layout:
  - `packages/cli/` — CLI tool
  - `packages/server/` — Backend server
  - `packages/web/` — React Web UI
  - `packages/shared/` — Shared types/utilities

### TypeScript Configuration
- **D-11:** TypeScript mode = 标准模式 (不是严格模式)
- **D-12:** NoImplicitAny = false

### Package Manager
- **D-13:** 包管理器 = pnpm
- **D-14:** Workspace 模式 = pnpm workspaces

### Testing
- **D-15:** 测试框架 = Vitest (与 openclaw/paperclip 一致)
- **D-16:** CLI 命令测试 = Snapshot + 集成测试 两者都要

### Linting & Formatting
- **D-17:** Linter = oxlint
- **D-18:** Formatter = oxfmt
- **D-19:** 与 openclaw/paperclip 保持一致

### Git Hooks
- **D-20:** Git hooks = Husky
- **D-21:** pre-commit hook 启用

### Claude's Discretion
以下由 Claude 自行决定：
- 具体 package.json 结构
- 内部模块组织
- JSON output 的具体 schema
- error code 体系细节
- husky pre-commit 具体检查什么

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — LeClaw 项目定义
- `.planning/REQUIREMENTS.md` — v1 requirements (CLI-01 to CLI-05, DATA-01)
- `.planning/ROADMAP.md` — Phase 1 goals and success criteria
- `.planning/research/STACK.md` — 技术栈建议 (Vitest, oxlint, pnpm)
- `.planning/codebase/STACK.md` — 参考 openclaw 技术栈
- `referenceRepo/openclaw/` — 参考 CLI 结构 (src/cli/)
- `referenceRepo/paperclip/` — 参考 monorepo 结构

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- openclaw 的 CLI 结构 (`referenceRepo/openclaw/src/cli/`) 可参考命令组织
- Commander.js 用于 CLI 参数解析 (openclaw/paperclip 都用)

### Established Patterns
- monorepo packages/ 布局 (参考 pnpm workspaces 标准)
- Vitest 测试配置
- oxlint + oxfmt 配置

### Integration Points
- `packages/cli/` 依赖 `packages/shared/`
- `packages/server/` 依赖 `packages/shared/`
- config 存储在 `~/.leclaw/config.json`

</codebase_context>

<specifics>
## Specific Ideas

**Config directory structure:**
```
~/.leclaw/
├── config.json    # 主配置
├── db/            # embedded PostgreSQL 数据
└── logs/         # 日志文件
```

**Key packages:**
- `@leclaw/cli` — CLI 入口
- `@leclaw/shared` — 共享类型
- `@leclaw/server` — 服务端
- `@leclaw/web` — Web UI

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-cli-init*
*Context gathered: 2026-04-05*
