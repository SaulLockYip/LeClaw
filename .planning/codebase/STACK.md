# Technology Stack

**Analysis Date:** 2026-04-05

## Languages

**Primary:**
- TypeScript (ES2023) - Core application logic, CLI, gateway, plugins
- Node.js runtime with ESM modules (`"type": "module"` in `package.json`)

**Secondary:**
- Swift - iOS/macOS native applications (`apps/ios`, `apps/macos`)
- Kotlin - Android native application (`apps/android`)
- Shell scripts - Build and deployment scripts

## Runtime

**Environment:**
- Node.js 22.14.0+ (minimum requirement in `package.json` `engines`)
- Bun (supported for scripts and development)

**Package Manager:**
- pnpm 10.32.1
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core:**
- Express 5.2.1 - HTTP server framework (used in gateway)
- Hono 4.12.10 - Lightweight web framework (API routes)
- ws 8.20.0 - WebSocket library (real-time communication)
- dotenv 17.4.0 - Environment variable loading

**Build & Tooling:**
- tsdown 0.21.7 - TypeScript bundler for production builds
- tsx 4.21.0 - TypeScript execution runtime
- Vitest 4.1.2 - Testing framework
- Oxlint 1.58.0 - Linter
- Oxfmt 0.43.0 - Code formatter

**CLI:**
- Commander 14.0.3 - CLI argument parsing
- @clack/prompts 1.2.0 - Interactive CLI prompts

**Data Processing:**
- JSZip 3.10.1 - ZIP archive handling
- tar 7.5.13 - TAR archive handling
- PDF.js 5.6.205 (pdfjs-dist) - PDF parsing
- linkedom 0.18.12 - HTML parsing
- markdown-it 14.1.1 - Markdown parsing
- @mozilla/readability 0.6.0 - Article extraction

**Media:**
- sharp 0.34.5 - Image processing
- node-edge-tts 1.2.10 - Text-to-speech

**Database:**
- node:sqlite (built-in Node.js) - Local SQLite storage
- drizzle-orm 0.38.4 - SQL query builder (paperclip db package)
- embedded-postgres 18.1.0-beta.16 - Embedded PostgreSQL (paperclip db package)

**AI/ML:**
- @modelcontextprotocol/sdk 1.29.0 - MCP protocol
- @matrix-org/matrix-sdk-crypto-wasm 18.0.0 - Matrix protocol crypto
- matrix-js-sdk 41.3.0-rc.0 - Matrix chat protocol

**Protocols:**
- @agentclientprotocol/sdk 0.18.0 - Agent communication protocol

**Testing:**
- Vitest with V8 coverage (thresholds: 70% lines/branches/functions/statements)
- Playwright 1.59.1 (playwright-core) - E2E testing
- jsdom 29.0.1 - DOM simulation for tests

**Native Modules:**
- @lydell/node-pty 1.2.0-beta.3 - PTY for terminal emulation
- @napi-rs/canvas 0.1.89 (peer) - Canvas rendering
- node-llama-cpp 3.18.1 (peer, optional) - Local LLM inference

## Configuration

**Environment:**
- Environment variables loaded via dotenv
- Config file: `~/.openclaw/openclaw.json`
- `.env` files supported (local development)

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2023
- Module: NodeNext
- Strict mode enabled
- Path aliases: `openclaw/plugin-sdk/*` -> `src/plugin-sdk/*`

**Linting:**
- Oxlint with TypeScript support
- OXFmt for code formatting
- SwiftLint for Swift code

**Testing:**
- Vitest configured with multiple project configs (see `vitest.*.config.ts`)
- Coverage provider: V8
- Test files: `*.test.ts` naming convention
- Setup files: `test/setup.ts`

## Platform Requirements

**Development:**
- Node.js 22.14.0+
- pnpm 10.32.1+
- Bun (optional, for faster script execution)
- Git

**Production:**
- Node.js 22.14.0+
- Linux (Docker), macOS, Windows
- SQLite support (node:sqlite built-in)
- Docker (optional, for sandbox isolation)

---

*Stack analysis: 2026-04-05*
