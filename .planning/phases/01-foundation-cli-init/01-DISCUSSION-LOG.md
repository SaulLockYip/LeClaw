# Phase 1: Foundation + CLI Init - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 01-foundation-cli-init
**Areas discussed:** Output format, Config format, Error handling, Init mode, Naming, Structure, TypeScript, Package manager, Testing, Linting, Git hooks

---

## Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| Rich with colors+tables | 类似 @clack/prompts 风格 | |
| Plain text | 最小化输出 | |
| Structured JSON | 适合程序解析 | ✓ |

**User's choice:** Structured JSON
**Notes:** CLI 输出为 machine-parseable JSON

---

## Config Format

| Option | Description | Selected |
|--------|-------------|----------|
| JSON | 与 CLI output 一致 | ✓ |
| TOML | INI-like | |
| YAML | YAML 格式 | |

**User's choice:** JSON
**Notes:** 配置文件 `~/.leclaw/config.json`

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Exit codes + JSON error objects | 非零 exit code + JSON error | |
| Verbose stderr | 详细错误信息到 stderr | ✓ |
| Exit codes only | 静默 | |

**User's choice:** Verbose stderr
**Notes:** 详细错误信息输出到 stderr

---

## Init Mode

| Option | Description | Selected |
|--------|-------------|----------|
| 纯非交互式 | 全部通过命令行参数 | ✓ |
| 交互式 TUI | 类似 @clack/prompts | |

**User's choice:** 纯非交互式
**Notes:** 不使用 @clack/prompts

---

## Naming Convention

| Option | Description | Selected |
|--------|-------------|----------|
| kebab-case | leclaw-init, config-set | |
| snake_case | leclaw_init, config_set | |
| camelCase | leclawInit, configSet | ✓ |

**User's choice:** camelCase

---

## Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 参考 openclaw 风格 | src/cli/, src/commands/ | |
| monorepo packages/ | packages/cli/, packages/server/ | ✓ |
| Feature-based | 按功能组织 | |

**User's choice:** monorepo packages/

---

## TypeScript Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| 严格模式 + NoImplicitAny | 严格类型检查 | |
| 标准模式 | 适度宽松 | ✓ |

**User's choice:** 标准模式

---

## Package Manager

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm | pnpm workspaces | ✓ |
| npm | npm workspaces | |
| yarn | yarn workspaces | |

**User's choice:** pnpm

---

## Testing Framework

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest | 参考 openclaw/paperclip | ✓ |
| Jest | 更成熟但较慢 | |
| Node.js test runner | 内置 | |

**User's choice:** Vitest

---

## CLI Testing

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot 测试 | 验证输出不变 | |
| 集成测试 | 真实执行命令 | |
| 两者都要 | Snapshot + 集成 | ✓ |

**User's choice:** 两者都要

---

## Linting & Formatting

| Option | Description | Selected |
|--------|-------------|----------|
| oxlint + oxfmt | openclaw 用的 | ✓ |
| ESLint + Prettier | 更通用 | |
| 两者都不用 | 裸奔 | |

**User's choice:** oxlint + oxfmt

---

## Git Hooks

| Option | Description | Selected |
|--------|-------------|----------|
| Husky | 传统选择 | ✓ |
| lefthook | 更快 | |
| 跳过 | 不需要 | |

**User's choice:** Husky

---

## Claude's Discretion

以下由 Claude 自行决定：
- 具体 package.json 结构
- 内部模块组织
- JSON output 的具体 schema
- error code 体系细节
- husky pre-commit 具体检查什么

## Deferred Ideas

None — discussion stayed within phase scope.
