# Phase 1: Foundation + CLI Init - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 01-foundation-cli-init
**Areas discussed:** Init Mode, Config Command Design, Status Command, Start Command, Doctor Command, plus prior session items

---

## Init Mode (Updated 2026-04-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 交互式 TUI（推荐） | 使用 @clack/prompts，符合 SPEC 定义的人类初始化流程 | ✓ |
| 纯 CLI Flags | 适合自动化，但首次使用需要查阅文档 | |

**User's choice:** 交互式 TUI（推荐）
**Notes:** SPEC.md 明确说 "Interactive initialization for humans"，更新自 2026-04-05 的决定

---

## Config Command Design (Updated 2026-04-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 分层子命令（推荐） | config openclaw --dir, config server --port — 类型安全，符合 SPEC 结构 | ✓ |
| 平面 key-value | config set openclaw.dir /path — 灵活，接近 dotnet style | |

**User's choice:** 分层子命令（推荐）
**Notes:** 类型安全，与 SPEC 的分层配置结构一致

---

## Status Command Scope (New 2026-04-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 本地配置 + Gateway 连通性 | 显示配置是否完整 + Gateway 是否可连 | ✓ |
| 仅本地配置状态 | 只显示 ~/.leclaw/config.json 是否存在和有效 | |

**User's choice:** 本地配置 + Gateway 连通性

---

## Start Command Behavior (New 2026-04-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 不检查，直接启动 | LeClaw 独立运行，Gateway 连通性由 status 检查 | ✓ |
| 检查并警告 | 启动时尝试连接 Gateway，失败则警告但继续启动 | |

**User's choice:** 不检查，直接启动
**Notes:** LeClaw 独立于 OpenClaw

---

## Doctor Command Scope (New 2026-04-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 全部检查（推荐） | Config + OpenClaw dir + Gateway + DB + Port | ✓ |
| 核心检查 | 只检查 Config 和 Gateway 连通性 | |
| 仅 Config | 只检查配置文件本身 | |

**User's choice:** 全部检查（推荐）

---

## Doctor Output Format (New 2026-04-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 结构化输出（推荐） | 检查项 + PASS/FAIL + 详细信息（可用 JSON） | ✓ |
| 简洁状态 | 一行一个检查项，简单 OK/FAIL | |

**User's choice:** 结构化输出（推荐）

---

## Status Output Format (New 2026-04-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 结构化输出（推荐） | JSON 格式，便于程序解析 | ✓ |
| 人类可读 | 表格或列表形式，更易读 | |

**User's choice:** 结构化输出（推荐）

---

## Output Format (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Rich with colors+tables | 类似 @clack/prompts 风格 | |
| Plain text | 最小化输出 | |
| Structured JSON | 适合程序解析 | ✓ |

**User's choice:** Structured JSON
**Notes:** CLI 输出为 machine-parseable JSON

---

## Config Format (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| JSON | 与 CLI output 一致 | ✓ |
| TOML | INI-like | |
| YAML | YAML 格式 | |

**User's choice:** JSON
**Notes:** 配置文件 `~/.leclaw/config.json`

---

## Error Handling (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Exit codes + JSON error objects | 非零 exit code + JSON error | |
| Verbose stderr | 详细错误信息到 stderr | ✓ |
| Exit codes only | 静默 | |

**User's choice:** Verbose stderr

---

## Naming Convention (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| kebab-case | leclaw-init, config-set | |
| snake_case | leclaw_init, config_set | |
| camelCase | leclawInit, configSet | ✓ |

**User's choice:** camelCase

---

## Project Structure (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| 参考 openclaw 风格 | src/cli/, src/commands/ | |
| monorepo packages/ | packages/cli/, packages/server/ | ✓ |
| Feature-based | 按功能组织 | |

**User's choice:** monorepo packages/

---

## TypeScript Configuration (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| 严格模式 + NoImplicitAny | 严格类型检查 | |
| 标准模式 | 适度宽松 | ✓ |

**User's choice:** 标准模式

---

## Package Manager (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm | pnpm workspaces | ✓ |
| npm | npm workspaces | |
| yarn | yarn workspaces | |

**User's choice:** pnpm

---

## Testing Framework (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest | 参考 openclaw/paperclip | ✓ |
| Jest | 更成熟但较慢 | |
| Node.js test runner | 内置 | |

**User's choice:** Vitest

---

## CLI Testing (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot 测试 | 验证输出不变 | |
| 集成测试 | 真实执行命令 | |
| 两者都要 | Snapshot + 集成 | ✓ |

**User's choice:** 两者都要

---

## Linting & Formatting (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| oxlint + oxfmt | openclaw 用的 | ✓ |
| ESLint + Prettier | 更通用 | |
| 两者都不用 | 裸奔 | |

**User's choice:** oxlint + oxfmt

---

## Git Hooks (Prior Session 2026-04-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Husky | 传统选择 | ✓ |
| lefthook | 更快 | |
| 跳过 | 不需要 | |

**User's choice:** Husky

---

## Key Changes from Prior Session

1. **Init Mode**: 从"纯非交互式"改为"交互式 TUI @clack/prompts"
2. **Config Command**: 从 flat key-value (`config set <key> <value>`) 改为分层子命令
3. **Status Command**: 新增定义（显示本地配置 + Gateway 连通性，JSON 输出）
4. **Start Command**: 新增定义（直接启动，不检查 Gateway）
5. **Doctor Command**: 新增功能（全部检查项，结构化 JSON 输出）

---

## Deferred Ideas

None — discussion stayed within phase scope.
