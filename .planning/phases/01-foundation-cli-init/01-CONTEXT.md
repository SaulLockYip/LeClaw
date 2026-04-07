# Phase 1: Foundation + CLI Init - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

User can initialize LeClaw project and configure OpenClaw/Gateway settings via CLI.

**Scope:**
- `leclaw init` — 交互式初始化，创建 `~/.leclaw/` 目录（使用 @clack/prompts）
- `leclaw config` — 显示当前配置（分层子命令）
- `leclaw config openclaw --dir <path>` — 配置 OpenClaw 目录
- `leclaw config openclaw --gateway-url <url> --gateway-token <token>` — 配置 Gateway
- `leclaw config server --port <port>` — 配置服务器端口（默认 8080）
- `leclaw status` — 显示本地配置状态 + Gateway 连通性（JSON 输出）
- `leclaw start` — 启动 LeClaw 服务（不检查 Gateway 连通性）
- `leclaw doctor` — 诊断所有检查项（Config、OpenClaw dir、Gateway、DB、Port）
- 初始化 embedded PostgreSQL 数据库

**Out of scope for this phase:**
- Web UI (Phase 5+)
- REST API (Phase 4)
- OpenClaw 实际连接 (Phase 3)

</domain>

<decisions>
## Implementation Decisions

### CLI Output & Config Format
- **D-01:** CLI output format = Structured JSON (machine-parseable)
- **D-02:** Config file format = JSON (`~/.leclaw/config.json`)
- **D-03:** Config directory = `~/.leclaw/`

### Init Mode
- **D-06:** `leclaw init` = **交互式 TUI**，使用 @clack/prompts
- **D-07:** Init 引导用户输入：openclaw.dir, openclaw.gatewayUrl, openclaw.gatewayToken, server.port

### Config Command Design
- **D-08:** Config 命令 = **分层子命令**（不是 flat key-value）
  - `config openclaw --dir <path>` — OpenClaw 目录
  - `config openclaw --gateway-url <url> --gateway-token <token>` — Gateway 配置
  - `config server --port <port>` — 服务器端口
  - `config` (无参数) — 显示所有当前配置

### Error Handling
- **D-09:** Errors reported via verbose stderr (详细错误信息)
- **D-10:** Exit codes: 0 = success, non-zero = error

### Status Command
- **D-11:** `leclaw status` 输出：
  - 本地配置是否完整有效
  - Gateway 连通性（reachable/unreachable/unknown）
  - 输出格式：JSON

### Start Command
- **D-12:** `leclaw start` = 直接启动 LeClaw HTTP server + embedded PostgreSQL
- **D-13:** 启动时不检查 OpenClaw Gateway 连通性（LeClaw 独立运行）

### Doctor Command (NEW)
- **D-14:** `leclaw doctor` 检查项：
  - Config 文件存在性 (`~/.leclaw/config.json`)
  - Config JSON 有效性
  - OpenClaw 目录是否存在 (`openclaw.dir`)
  - Gateway 连通性 (`openclaw.gatewayUrl`)
  - 数据库目录可用性
  - 端口可用性 (`server.port`)
- **D-15:** Doctor 输出格式：JSON（每个检查项含 status: PASS/FAIL + details）

### Naming Convention
- **D-16:** 文件/函数命名 = camelCase (e.g., `leclawInit`, `configSet`)

### Project Structure
- **D-17:** 目录结构 = monorepo packages/ (不是 src/flat)
- **D-18:** packages layout:
  - `packages/cli/` — CLI tool
  - `packages/server/` — Backend server
  - `packages/web/` — React Web UI
  - `packages/shared/` — Shared types/utilities

### TypeScript Configuration
- **D-19:** TypeScript mode = 标准模式 (不是严格模式)
- **D-20:** NoImplicitAny = false

### Package Manager
- **D-21:** 包管理器 = pnpm
- **D-22:** Workspace 模式 = pnpm workspaces

### Testing
- **D-23:** 测试框架 = Vitest (与 openclaw/paperclip 一致)
- **D-24:** CLI 命令测试 = Snapshot + 集成测试 两者都要

### Linting & Formatting
- **D-25:** Linter = oxlint
- **D-26:** Formatter = oxfmt
- **D-27:** 与 openclaw/paperclip 保持一致

### Git Hooks
- **D-28:** Git hooks = Husky
- **D-29:** pre-commit hook 启用

### Claude's Discretion
以下由 Claude 自行决定：
- 具体 package.json 结构
- 内部模块组织
- JSON output 的具体 schema（除 doctor/status 已明确结构化 JSON 外）
- error code 体系细节
- husky pre-commit 具体检查什么
- Init 交互流程的具体提示文案

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — LeClaw 项目定义
- `.planning/SPEC.md` — 完整架构规范（OpenClaw 协调中心定义）
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
- @clack/prompts 用于交互式 TUI（已决定采用）

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
└── logs/          # 日志文件
```

**Key packages:**
- `@leclaw/cli` — CLI 入口
- `@leclaw/shared` — 共享类型
- `@leclaw/server` — 服务端
- `@leclaw/web` — Web UI

**Doctor output schema:**
```json
{
  "checks": [
    { "name": "config_exists", "status": "PASS", "details": "..." },
    { "name": "config_valid_json", "status": "FAIL", "details": "..." },
    { "name": "openclaw_dir", "status": "PASS", "details": "..." },
    { "name": "gateway_reachable", "status": "PASS", "details": "..." },
    { "name": "db_dir", "status": "PASS", "details": "..." },
    { "name": "port_available", "status": "PASS", "details": "..." }
  ],
  "summary": { "passed": 5, "failed": 1 }
}
```

**Status output schema:**
```json
{
  "config": {
    "openclaw.dir": "/path/to/openclaw",
    "openclaw.gatewayUrl": "http://...",
    "server.port": 8080
  },
  "gateway": {
    "status": "reachable" | "unreachable" | "unknown"
  }
}
```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-cli-init*
*Context gathered: 2026-04-07*
