# Domain Pitfalls

**Domain:** Agent Management Platform (LeClaw)
**Researched:** 2026-04-05
**Confidence:** MEDIUM (based on domain knowledge, limited verification due to external fetch restrictions)

## Pitfall Sources

This document synthesizes common mistakes across six domains relevant to LeClaw:
1. Agent management platforms (external runtime integration)
2. React + Node.js monorepo structures
3. Embedded PostgreSQL integration
4. SSE real-time communication
5. CLI tool design
6. Agent hierarchy and collaboration patterns

---

## 1. Agent Management Platform Pitfalls

### Critical: Treating External Runtime as Trusted

**What goes wrong:** LeClaw connects to external OpenClaw instances but assumes agent state, identity, and availability reports are trustworthy.

**Why it happens:** External runtimes can have bugs, can crash agents, can report stale state, or can be restarted mid-operation.

**Consequences:**
- Stale UI showing agents as "available" when they're actually dead
- Task assignment to agents that no longer exist
- Orphaned monitoring connections
- Data inconsistency between LeClaw state and OpenClaw reality

**Prevention:**
- Always verify agent liveness with a two-phase approach: (1) check registry, (2) confirm with heartbeat
- Implement connection retry with exponential backoff
- Store last-known-good state separately from desired state
- Add a "runtime health" metric separate from "agent health"

**Detection:**
- Monitoring logs show repeated re-connection attempts to same agent
- Agent state hasn't changed in >10x expected heartbeat interval
- SSE events stop without corresponding disconnect message

**Phase mapping:** Phase 2 (OpenClaw connection layer) - MUST implement robust state synchronization

---

### Critical: No Idempotency in Agent Binding

**What goes wrong:** When binding an OpenClaw agent to a LeClaw role (CEO/Manager/Staff), the same agent gets bound multiple times or bindings become inconsistent after reconnections.

**Why it happens:** Binding operations aren't idempotent, and reconnection logic doesn't check existing bindings.

**Consequences:**
- Same agent serving multiple roles in same hierarchy (breaks single-parent constraint)
- Orphaned bindings after OpenClaw restart
- UI shows duplicate entries for same agent

**Prevention:**
- Use database unique constraints: one agent ID per role per company
- Binding operations must be idempotent: upsert semantics, not insert-only
- On reconnect, validate existing bindings before creating new ones

**Phase mapping:** Phase 2 (OpenClaw connection layer)

---

### Moderate: Polling Too Frequently or Infrequently

**What goes wrong:** Either hammering OpenClaw with requests or polling so rarely that real-time features feel broken.

**Why it happens:** No clear understanding of OpenClaw's rate limits or the latency tolerance of monitoring features.

**Consequences:**
- OpenClaw rate limiting kicks in, causing monitoring to fail
- User sees stale data, reducing trust in the system
- Resource waste on unnecessary polling

**Prevention:**
- Start with 5-10 second polling intervals, adjust based on observed load
- Implement adaptive polling: faster when state changes, slower when stable
- Use SSE for push-based updates where OpenClaw supports it

**Phase mapping:** Phase 2 (monitoring implementation)

---

## 2. React + Node.js Monorepo Pitfalls

### Critical: Circular Dependencies Between Packages

**What goes wrong:** TypeScript compiles, but runtime fails with "Cannot resolve module" or modules load in wrong order.

**Why it happens:** Monorepo structure creates implicit dependencies that aren't obvious during development. Package A imports B, B imports C, C imports A.

**Consequences:**
- Production builds fail intermittently
- `ts-node` works but compiled JS fails
- Different behavior between development and production

**Prevention:**
- Enforce dependency direction rules: CLI depends on Commands, Commands depends on Gateway, Gateway depends on Plugin SDK, etc.
- Use ESLint plugin to detect circular imports
- Structure packages in clear layers: infra -> core -> features -> interface

**Detection:**
- `madge --circular` in CI
- Build fails on fresh clone but succeeds incrementally

**Phase mapping:** Phase 1 (project structure initialization)

---

### Critical: Shared Types Without Versioning

**What goes wrong:** Two packages in the monorepo have different views of the same type, causing runtime type mismatches.

**Why it happens:** Package A exports a type, Package B imports it, but Package C also imports and modifies expectations.

**Consequences:**
- "Type 'X' is not assignable to type 'Y'" even though they're "the same" type
- Runtime errors where data looks correct but fails validation
- Difficult to refactor shared types without breaking consumers

**Prevention:**
- Designate exactly one package as the "source of truth" for shared types
- Use a dedicated `@leclaw/types` package for cross-cutting types
- Never modify imported types - only extend or wrap

**Phase mapping:** Phase 1 (project structure initialization)

---

### Moderate: Build Order Dependencies

**What goes wrong:** `pnpm build` works locally but fails in CI because packages build in wrong order.

**Why it happens:** Turborepo/pnpm build order isn't explicitly declared, or build scripts have implicit assumptions.

**Consequences:**
- Flaky CI that passes on retry
- Developer builds succeed, CI fails
- "Cannot find module" during build

**Prevention:**
- Explicitly declare build order in `turbo.json` or build script
- Use `tsdown` with `--out-dir` flag to ensure output placement
- Add `prebuild` scripts that verify dependencies are built

**Phase mapping:** Phase 1 (build system setup)

---

### Moderate: Different ESLint/TypeScript Configs Per Package

**What goes wrong:** One package uses strict null checks, another doesn't, causing inconsistent behavior.

**Why it happens:** Each package has its own `tsconfig.json` that inherits differently from root.

**Consequences:**
- Bugs that only appear in some packages
- Confusion when migrating code between packages
- Inconsistent type safety guarantees

**Prevention:**
- Root `tsconfig.json` with `extends` in all packages
- Shared ESLint config with minimal per-package overrides
- CI should run type checking independently per package

**Phase mapping:** Phase 1 (tooling consistency)

---

## 3. Embedded PostgreSQL Integration Pitfalls

### Critical: Data Persistence After Process Crash

**What goes wrong:** Embedded PostgreSQL data directory gets corrupted or left in inconsistent state after unexpected process termination.

**Why it happens:** PostgreSQL requires proper shutdown. Embedded versions (like `embedded-postgres` or paperclip's approach) are sensitive to unclean exits.

**Consequences:**
- Database fails to start on next launch
- Data loss or corruption
- "database is recovering" state that blocks startup

**Prevention:**
- Implement graceful shutdown: catch SIGTERM/SIGINT, run `pg_ctl stop` before exiting
- Use `embedded-postgres` with built-in shutdown handling
- Store PID file and verify clean shutdown in startup health check
- Consider SQLite for MVP if PostgreSQL complexity is too high

**Detection:**
- Startup logs show "database was not shut down cleanly"
- `pg_control` version mismatch errors

**Phase mapping:** Phase 2 (data layer implementation)

---

### Critical: Port Conflicts in Development

**What goes wrong:** Multiple LeClaw instances or other PostgreSQL instances conflict on the same port.

**Why it happens:** Embedded PostgreSQL binds to a fixed port (default 5432) and doesn't check for availability.

**Consequences:**
- "Port already in use" errors
- One instance connects to wrong database
- Data bleeding between companies if using same database

**Prevention:**
- Use dynamic port allocation for development
- Store port in config file per project
- Add port availability check before starting embedded PG
- Use separate data directories per company/project

**Phase mapping:** Phase 2 (development environment setup)

---

### Moderate: Beta Version Instability

**What goes wrong:** `embedded-postgres` is at beta version (`18.1.0-beta.16`), which may have breaking changes or instability.

**Why it happens:** Beta versions aren't production-ready. API may change without warning.

**Consequences:**
- Upgrading breaks existing data directory
- Unexpected crashes or data corruption
- Missing features that are "coming soon"

**Prevention:**
- Pin to exact version in `package.json`
- Test upgrades in staging before applying to production
- Have migration plan for when beta stabilizes
- Consider `node:sqlite` (built-in, stable) as alternative for MVP

**Phase mapping:** Phase 2 (dependency decisions)

---

### Minor: Large Database Binaries in Repository

**What goes wrong:** Embedded PostgreSQL downloads binaries (50-100MB) on install, bloating repository or causing CI issues.

**Why it happens:** `embedded-postgres` downloads platform-specific binaries at install time.

**Prevention:**
- Add `postgresql-*` binaries to `.gitignore`
- Use `EMBEDDED_POSTGRES_DIR` environment variable to cache binaries
- Document binary download step in README

**Phase mapping:** Phase 1 (build/dev setup)

---

## 4. SSE Real-Time Communication Pitfalls

### Critical: SSE Connection Not Surviving Reconnection

**What goes wrong:** After network hiccup, client reconnects but misses events that occurred during disconnection.

**Why it happens:** No event ID tracking or catchup mechanism implemented.

**Consequences:**
- UI shows stale state after reconnect
- Events silently lost
- User misses important status changes

**Prevention:**
- Implement `Last-Event-ID` header on reconnect
- Server should buffer events for disconnected clients (short window, e.g., 30 seconds)
- Client should track last received event ID and request catchup
- Consider using WebSocket for bidirectional needs - SSE is unidirectional

**Phase mapping:** Phase 3 (Web UI real-time features)

---

### Critical: No Heartbeat/Keepalive on SSE

**What goes wrong:** Load balancers or proxies close "idle" SSE connections after timeout (often 30-60 seconds).

**Why it happens:** SSE connections look "idle" even when they're valid, because no data flows until an event occurs.

**Consequences:**
- Client stops receiving events silently
- No error reported until next user action
- Appears as random disconnection

**Prevention:**
- Send comment lines (`:`) or `ping` events every 15-30 seconds
- Configure server-side keepalive interval
- Client should detect lack of events for >2x expected interval as error

**Phase mapping:** Phase 3 (Web UI real-time features)

---

### Moderate: SSE Events Sent After Client Disconnect

**What goes wrong:** Server continues processing and sending events to closed connection, wasting resources and potentially causing errors.

**Why it happens:** No proper cleanup of SSE subscriptions when client disconnects.

**Consequences:**
- Resource leak (open file descriptors, memory)
- Errors in server logs
- Potential security issue if sensitive data is sent to wrong client

**Prevention:**
- Implement proper `close` event handling on server
- Track active SSE connections and clean up on disconnect
- Use `ReadableStream` cancellation signals

**Phase mapping:** Phase 3 (Web UI real-time features)

---

### Moderate: Event Format Inconsistency

**What goes wrong:** Different parts of the system send SSE events in different formats, confusing clients.

**Why it happens:** No shared SSE event schema or typing.

**Consequences:**
- Client code has special cases for different event types
- Hard to debug event-related issues
- Adding new event types is error-prone

**Prevention:**
- Define shared event type schema
- Validate events before sending
- Document event format in architecture docs

**Phase mapping:** Phase 3 (schema definition)

---

## 5. CLI Tool Design Pitfalls

### Critical: Commands That Modify State Without Confirmation

**What goes wrong:** `leclaw delete-company` or `leclaw reset` runs without prompting, causing data loss.

**Why it happens:** Destructive commands are treated like normal commands with no guardrails.

**Consequences:**
- Accidental data deletion
- No recovery path after destructive operation
- User trust issues

**Prevention:**
- All destructive commands MUST have `--force` flag to bypass prompt
- Default behavior: show confirmation prompt with explicit command to type
- Use `@clack/prompts` for interactive confirmation
- Log all destructive operations with timestamps

**Phase mapping:** Phase 1 (CLI implementation)

---

### Critical: No Structured Error Output

**What goes wrong:** `leclaw status` outputs human-readable text when it fails, making it impossible for scripts to detect failures.

**Why it happens:** CLI errors go to stdout/stderr with mixed formatting.

**Consequences:**
- Scripts cannot detect failures reliably
- Log aggregation systems can't parse errors
- Debugging is harder

**Prevention:**
- All commands support `--json` flag for machine-readable output
- Errors always go to stderr with exit code
- Success output goes to stdout
- Use `Result<T, E>` pattern in command handlers

**Phase mapping:** Phase 1 (CLI implementation)

---

### Moderate: Inconsistent Command Structure

**What goes wrong:** `leclaw config set gateway` but `leclaw openclaw directory`, naming isn't consistent.

**Why it happens:** Commands grew organically without naming conventions.

**Consequences:**
- Hard to remember commands
- User confusion
- Harder to extend

**Prevention:**
- Define command naming convention early:
  - `leclaw <resource> <verb>` for actions: `leclaw company create`
  - `leclaw <resource>` for listing: `leclaw companies`
  - `leclaw config <property>` for configuration
- Document pattern in CONTRIBUTING.md

**Phase mapping:** Phase 1 (CLI design)

---

### Moderate: Global State Mutation in Commands

**What goes wrong:** Running `leclaw status` modifies global config or connection state.

**Why it happens:** Commands import and mutate shared singleton objects.

**Consequences:**
- Side effects between commands
- Hard to test commands in isolation
- Race conditions in parallel execution

**Prevention:**
- Commands should be pure: input -> output, no side effects
- Use dependency injection for shared state
- Config writes should be explicit, never implicit

**Phase mapping:** Phase 1 (CLI architecture)

---

### Minor: No `--help` or `--version` Standard Flags

**What goes wrong:** `leclaw --version` doesn't work, or help text is inconsistent.

**Why it happens:** Commander.js handles this by default, but custom argument parsing can bypass it.

**Prevention:**
- Use Commander.js as the single source of truth for argument parsing
- Never implement custom argv parsing
- Always include `--help` and `--version`

**Phase mapping:** Phase 1 (CLI setup)

---

## 6. Agent Hierarchy and Collaboration Pitfalls

### Critical: Single Point of Failure at CEO Level

**What goes wrong:** If the CEO agent fails, entire company hierarchy becomes non-functional.

**Why it happens:** All task routing goes through CEO agent, making it a bottleneck and single point of failure.

**Consequences:**
- All departments become inactive if CEO agent dies
- Cannot reassign tasks during CEO outage
- No graceful degradation

**Prevention:**
- CEO agent should be replaceable without losing task state
- Implement "acting CEO" fallback for brief outages
- Tasks in progress should be checkpointed and resumable
- Consider making department independence higher (CEO as coordinator, not executor)

**Phase mapping:** Phase 2 (hierarchy implementation) - address resilience early

---

### Critical: Circular Task Dependencies

**What goes wrong:** Agent A assigns to B, B assigns back to A, creating infinite loop.

**Why it happens:** No cycle detection in task assignment graph.

**Consequences:**
- Tasks never complete
- Resource exhaustion as agents keep assigning back and forth
- System appears frozen

**Prevention:**
- Implement task dependency graph with cycle detection
- Task assignment should include "assigned_by" chain
- Set maximum assignment depth (e.g., 5 levels)
- Add task age limit - tasks older than threshold should escalate

**Phase mapping:** Phase 2 (task management)

---

### Moderate: Flat Hierarchy Abuse

**What goes wrong:** All agents at Staff level (no Managers), defeating the purpose of hierarchy.

**Why it happens:** Users find it easier to manage flat structures, or hierarchy creation is too cumbersome.

**Consequences:**
- CEO becomes bottleneck (same as single point of failure)
- Lost benefits of intermediate aggregation
- No clear escalation path

**Prevention:**
- Enforce minimum hierarchy: at least one Manager per Department
- Make hierarchy creation flow smoother than flat creation
- Show warning when hierarchy depth < 2

**Phase mapping:** Phase 2 (hierarchy enforcement)

---

### Moderate: Unclear Role Boundaries

**What goes wrong:** Manager does Staff work, Staff does Manager work, roles become meaningless.

**Why it happens:** No explicit capability matrix defining what each role can do.

**Consequences:**
- Agents stepping on each other
- Inefficient task distribution
- Accountability blur

**Prevention:**
- Define explicit capability matrix per role
- Task types should be tagged with required role level
- Validation: only assign tasks to agents with matching capabilities

**Phase mapping:** Phase 2 (role definitions)

---

### Moderate: Peer Collaboration Deadlock

**What goes wrong:** Two Staff agents both waiting for each other to complete their part, neither making progress.

**Why it happens:** No timeout or escalation for peer-to-peer collaboration tasks.

**Consequences:**
- Tasks stall indefinitely
- No notification that collaboration is blocked
- User sees "in progress" but nothing happening

**Prevention:**
- All collaboration tasks need a deadline
- If deadline passes without resolution, escalate to common Manager
- Periodic status check between collaborating peers

**Phase mapping:** Phase 2 (collaboration protocols)

---

### Minor: No Task Prioritization

**What goes wrong:** All tasks processed FIFO regardless of urgency.

**Why it happens:** Simple queue is easiest to implement.

**Consequences:**
- Urgent issues wait behind trivial ones
- User frustration
- Appears unresponsive

**Prevention:**
- Implement priority levels (P0-P4)
- Higher priority tasks preempt lower ones
- Allow priority adjustment after task creation

**Phase mapping:** Phase 2 (task management)

---

## Cross-Domain Pitfalls

### Critical: State Synchronization Between CLI, Web UI, and Backend

**What goes wrong:** CLI creates a company, but Web UI doesn't see it because they're reading different data sources or have stale caches.

**Why it happens:** No shared state store. CLI and Web UI may have different views of the same data.

**Consequences:**
- User confusion (data exists but can't see it)
- Impossible to debug ("I just created it!")
- Trust issues

**Prevention:**
- Single source of truth: embedded PostgreSQL
- Both CLI and Web UI read from same database
- No in-memory caching of authoritative state
- Real-time sync between Web UI and data layer

**Phase mapping:** Phase 2 (shared data layer)

---

## Phase-Specific Warning Summary

| Phase | Critical Pitfall | Mitigation |
|-------|------------------|------------|
| Phase 1 | CLI destructive commands without confirmation | Implement `--force` + prompt pattern |
| Phase 1 | Circular dependencies in monorepo | MADGE in CI, layer enforcement |
| Phase 2 | Agent state not verified before assignment | Two-phase liveness check |
| Phase 2 | PostgreSQL crash corruption | Graceful shutdown, health checks |
| Phase 2 | Single point of failure at CEO | Replaceable CEO, checkpointing |
| Phase 3 | SSE connection drops silently | Heartbeat every 15-30s |
| Phase 3 | Missed events on reconnect | Last-Event-ID tracking |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Agent Management | MEDIUM | Based on general distributed systems knowledge; OpenClaw-specific behavior unknown |
| Monorepo Patterns | HIGH | Well-documented patterns from Turborepo, Nx, Lerna |
| Embedded PG | MEDIUM | Beta status of `embedded-postgres` limits predictability |
| SSE Pitfalls | HIGH | Well-known HTTP streaming issues |
| CLI Design | HIGH | Commander.js patterns well-established |
| Agent Hierarchy | MEDIUM | Theory is solid; LeClaw-specific implementation may reveal new issues |

---

## Gaps Needing Phase-Specific Research

1. **OpenClaw API behavior under load** - How does it report failures? What are rate limits?
2. **Real-world monorepo sizes** - At what scale do build caches become critical?
3. **embedded-postgres beta limitations** - Specific bugs or missing features in 18.1.0-beta.16
4. **SSE at scale** - How many concurrent SSE connections does Express 5 handle well?
5. **Agent collaboration protocols** - Any existing standards in the OpenClaw ecosystem?
