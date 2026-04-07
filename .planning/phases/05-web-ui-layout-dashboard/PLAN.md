# Phase 5 Plan: Web UI Layout + Dashboard

## 1. Overview

**Goal:** Implement React Router-based navigation with Company Rail, Sidebar, and Company-layer Dashboard with real-time SSE updates.

**Deliverables:**
- React Router v6 setup with routes
- Company Rail (72px fixed width)
- Sidebar (240px fixed width)
- Company Dashboard with metrics
- SSE hook for real-time updates

---

## 2. React Router Setup

### 2.1 Install Dependencies
```bash
cd packages/web
pnpm add react-router-dom
```

### 2.2 Route Structure
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Redirect to `/dashboard` | — |
| `/dashboard` | `DashboardPage` | Company metrics |
| `/issues` | `IssuesPage` | Issues list |
| `/goals` | `GoalsPage` | Goals list |
| `/projects` | `ProjectsPage` | Projects list |
| `/approvals` | `ApprovalsPage` | Approvals list |
| `/departments` | `DepartmentsPage` | Departments list |
| `/departments/:id` | `DepartmentDetailPage` | Department detail |

### 2.3 Layout Component
Create `packages/web/src/components/AppLayout.tsx`:
- Wraps all pages
- Renders `CompanyRail` + `Sidebar` + `<Outlet />`
- Provides company context via `useCompany()` hook

---

## 3. Company Rail (72px)

**Component:** `packages/web/src/components/CompanyRail.tsx`

**Props:**
```typescript
interface CompanyRailProps {
  companies: Company[]
  selectedCompanyId: string
  onCompanySelect: (companyId: string) => void
}
```

**Behavior:**
- Displays company avatars (initial letter + background color)
- Online indicator dot (green, bottom-right)
- Click selects company and triggers SSE re-subscription
- Currently selected company has ring highlight

---

## 4. Sidebar (240px)

**Component:** `packages/web/src/components/Sidebar.tsx`

**Props:**
```typescript
interface SidebarProps {
  currentPath: string
  company: Company
  onNavigate: (path: string) => void
}
```

**Sections:**
1. **Company Header** — Avatar + company name
2. **Search Input** — (decorative for v1)
3. **Navigation Items** — Dashboard, Issues, Goals, Projects, Approvals
4. **Divider**
5. **Company Section** — Departments
6. **Department Tree** — Expandable CEO→Manager→Staff hierarchy
7. **Settings** — Footer

---

## 5. Dashboard (Company-layer)

**Component:** `packages/web/src/pages/DashboardPage.tsx`

**Metrics Cards (4-column grid):**
| Metric | Source | Icon |
|--------|--------|------|
| Departments | `GET /api/companies/:id/departments` count | Building2 |
| Agents Online | SSE `agent_status_changed` events | Bot |
| Agents Busy | SSE `agent_status_changed` events | Clock |
| Total Agents | `GET /api/companies/:id/agents` count | Users |

**Issues Breakdown (3-column):**
| Status | Count | Color |
|--------|-------|-------|
| Open | Query | Orange |
| In Progress | Query | Blue |
| Done | Query | Green |

**Sections:**
- Metric cards row
- Issues summary with status badges
- Recent Issues list (last 5, from `GET /api/issues?companyId=X&limit=5`)

---

## 6. SSE Connection for Real-time Updates

### 6.1 Hook: `useSSE`
```typescript
function useSSE(companyId: string, onEvent: (event: SSEEvent) => void): void
```

**Behavior:**
- Connects to `http://localhost:{port}/api/events?companyId={companyId}`
- Auto-reconnects on connection drop (exponential backoff, max 30s)
- Sends `company_id` in query param per D-13
- Cleanup on unmount or company change

### 6.2 SSE Event Types
| Event | Payload | Dashboard Action |
|-------|---------|------------------|
| `agent_status_changed` | `{ agentId, status }` | Update agent counts |
| `issue_updated` | `{ issueId, status }` | Refresh issue counts |
| `department_updated` | `{ departmentId }` | Refresh department count |

### 6.3 Initial Data Fetch
- Use REST API on mount
- Populate state before SSE delivers events
- SSE updates modify existing state

---

## 7. Navigation Structure

**Flow:**
```
AppLayout
├── CompanyRail (left, 72px)
│   └── Company avatars (clickable)
├── Sidebar (240px)
│   ├── Nav items → React Router links
│   └── Department tree → Navigate to /departments/:id
└── <Outlet /> (main content, flex-1)
    └── DashboardPage, IssuesPage, etc.
```

**Company Switch:**
1. User clicks company in CompanyRail
2. `onCompanySelect(companyId)` fires
3. Layout updates `selectedCompanyId` context
4. SSE reconnects with new `companyId`
5. All data pages refetch for new company

---

## 8. File Structure

```
packages/web/src/
├── main.tsx
├── App.tsx                    # Router setup
├── components/
│   ├── AppLayout.tsx          # Layout wrapper
│   ├── CompanyRail.tsx       # 72px company switcher
│   ├── Sidebar.tsx           # 240px navigation
│   └── ui/                   # shadcn components
│       ├── card.tsx
│       ├── button.tsx
│       ├── badge.tsx
│       ├── avatar.tsx
│       └── table.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── IssuesPage.tsx
│   ├── GoalsPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ApprovalsPage.tsx
│   ├── DepartmentsPage.tsx
│   └── DepartmentDetailPage.tsx
├── hooks/
│   ├── useSSE.ts
│   └── useCompany.ts
└── lib/
    └── api.ts                # REST API client
```

---

## 9. Dependencies

```bash
pnpm add react-router-dom
pnpm add lucide-react        # Icons (already in mock-ui)
```

---

## 10. Verification

- [ ] `/` redirects to `/dashboard`
- [ ] Company Rail displays all companies with online indicator
- [ ] Clicking company in rail updates all data
- [ ] Sidebar navigation highlights active route
- [ ] Dashboard shows correct company data
- [ ] SSE reconnects on company switch
- [ ] SSE reconnects after connection drop
- [ ] All 6 navigation routes render correct pages
- [ ] Department tree links to `/departments/:id`
