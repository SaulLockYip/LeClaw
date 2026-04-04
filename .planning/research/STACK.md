# Technology Stack

**Project:** LeClaw
**Domain:** Agent management platform with React UI, CLI tooling, embedded database, and SSE real-time updates
**Researched:** 2026-04-05
**Confidence:** MEDIUM-HIGH (well-established technologies, recommend verifying specific versions at project start)

## Recommended Stack

### Core Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.x or 19.x | UI framework | Mature, широко используется, strong ecosystem for agent dashboards |
| TypeScript | 5.x | Type safety | Catches errors early, critical for complex agent state management |
| Vite | 5.x | Build tool | Fast HMR, optimized builds, standard for modern React apps |
| Tailwind CSS | 3.x | Styling | Rapid UI development, consistent design system |
| shadcn/ui | latest | UI primitives | Accessible, copy-paste components, no magic - aligns with Vercel/HYDRA philosophy |

**Confidence:** HIGH - Standard modern React stack, extensively documented

### State Management & Data Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack Query (React Query) | 5.x | Server state | Best-in-class for SSE/caching, handles real-time updates elegantly |
| Zustand | 4.x or 5.x | Client state | Minimal boilerplate, good for UI state (modals, sidebar) |

**Confidence:** HIGH - React Query is de facto standard for server state; Zustand is lightweight and proven

### Real-Time Communication (SSE)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Browser native EventSource | built-in | SSE client | Zero dependencies, native browser support |
| Node.js http module | built-in | SSE server | Lightweight, full control over headers/streaming |
| @tanstack/react-query | 5.x | SSE integration | Built-in support for streaming queries with `useSuspenseQuery` + streaming |

**Alternative:** `sse` npm package (middleware wrapper)

**Confidence:** HIGH - SSE is a mature standard, no complex libraries needed

### CLI Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Commander.js | 14.x | CLI framework | Most popular (28k stars), typed flags, nested commands |
| Inquirer.js | 9.x | Interactive prompts | Standard for CLI prompts, works well with Commander |
| chalk | 5.x | Terminal colors | Simple, chainable ANSI styling |

**Alternative:** oclif (Salesforce) - better for complex enterprise CLIs with plugins

**Confidence:** HIGH - Commander is the Node.js CLI standard

### Database (Embedded PostgreSQL)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pg | 8.x | PostgreSQL client | Standard Node.js PostgreSQL driver |
| @databases/pg | latest | Query builder | Type-safe SQL, prevents injection |
| pg-mem | latest | In-memory PostgreSQL | For testing/development without full PostgreSQL |

**Note on "Embedded PostgreSQL":** True embedded PostgreSQL (single-file database like SQLite) does not exist for PostgreSQL. Options:
1. **pg-mem** - In-memory implementation, good for dev/testing
2. **Docker + PostgreSQL** - Run PostgreSQL in same container/process
3. **Supabase/postgres-app** - Alternative embedded approach

**Confidence:** MEDIUM - "Embedded PostgreSQL" is non-standard; verify approach with Paperclip reference

### Backend API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Express | 4.x or Fastify 3.x | HTTP server | Fastify has better performance; Express has larger ecosystem |
| Zod | 3.x | Schema validation | TypeScript-native, used with React Query |
| CORS | built-in middleware | Security | Required for dev, configurable for prod |

**Alternative:** tRPC - if you want end-to-end type safety

**Confidence:** HIGH - Express/Fastify are standards

### Process Management & IPC

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js child_process | built-in | Process spawning | Standard for connecting to external instances |
| node-ipc | 10.x | Inter-process communication | For independent process coordination |
| ws | 8.x | WebSocket (optional) | Fallback if SSE insufficient for agent communication |

**Confidence:** HIGH - Native Node.js APIs + established WebSocket library

### Multi-Agent Orchestration Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Flow | 11.x | Node-based graphs | Designed for workflow orchestration, customizable nodes |
| @xyflow/react | 12.x | React Flow successor | If upgrading to latest |

**Alternative:** Custom SVG/Canvas implementation for simpler needs

**Confidence:** MEDIUM - React Flow is best-in-class but adds complexity; may be overkill for basic dashboards

## Project Structure Recommendation

```
leclaw/
├── packages/
│   ├── web/           # React frontend (Vite + React)
│   ├── cli/           # Commander.js CLI
│   ├── core/          # Shared types, agent protocols
│   └── server/        # Express/Fastify API + SSE
├── database/          # PostgreSQL migrations, seeds
└── docker/            # PostgreSQL + any external services
```

## Installation

```bash
# Frontend dependencies
npm install react react-dom @tanstack/react-query zustand tailwindcss shadcn-ui
npm install -D vite @vitejs/plugin-react typescript @types/node

# CLI dependencies
npm install -D commander inquirer chalk @types/inquirer

# Database
npm install pg @databases/pg
npm install -D pg-mem

# Server
npm install express cors zod

# Process/IPC
npm install ws node-ipc

# Visualization (optional)
npm install @xyflow/react
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite | Webpack | Webpack is legacy; Vite is standard modern choice |
| State (server) | React Query | SWR | React Query has better SSE/streaming support |
| State (client) | Zustand | Redux | Zustand is simpler for LeClaw's scope |
| CLI framework | Commander | oclif | Commander is lighter; oclif for enterprise-scale |
| DB client | pg + @databases | Prisma | Simpler stack, less magic than Prisma |
| HTTP server | Express | Fastify | Express has broader ecosystem; Fastify if performance critical |
| Orchestration UI | React Flow | Custom SVG | React Flow handles edge cases; custom if minimal UI |

## Stack Philosophy for LeClaw

**Principle:** Minimal magic, maximum control

- React Query over GraphQL/Relay - simpler for SSE real-time updates
- Commander over oclif - lighter weight for CLI that ships with the platform
- pg-mem for development, real PostgreSQL for production
- Native SSE over Socket.IO - SSE is unidirectional (agent -> dashboard), simpler

## Sources

- [Commander.js GitHub](https://github.com/tj/commander.js) - CLI standard
- [TanStack Query Docs](https://tanstack.com/query/latest) - SSE/streaming support
- [React Flow](https://reactflow.dev/) - Node graph visualization
- [pg-mem GitHub](https://github.com/oguimbal/pg-mem) - In-memory PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Component primitives
