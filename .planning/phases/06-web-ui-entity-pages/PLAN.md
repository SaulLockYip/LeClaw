# Phase 6: Web UI - Entity Pages - Implementation Plan

**Status:** Ready for execution
**Created:** 2026-04-07

---

## Overview

This phase implements full entity pages with list and detail views for Issues, Goals, Projects, Approvals, and Departments. The Web UI is read-only except for Approval actions (approve/reject).

**Key Constraints:**
- Web UI is read-only for all entities except Approvals (D-15, D-16, D-17)
- Approval approve/reject = Web UI write (D-18), Approval create = CLI only (D-19)
- React Router for routing (route `/entity/:id` pattern, D-06)
- shadcn/ui components: Table, Card, Dialog, AlertDialog, DropdownMenu, Badge, Button

---

## Route Structure

```
/issues                    # IssuesListPage
/issues/:id                # IssueDetailPage
/goals                     # GoalsListPage
/goals/:id                 # GoalDetailPage
/projects                  # ProjectsListPage
/projects/:id              # ProjectDetailPage
/approvals                 # ApprovalsListPage
/departments               # DepartmentsListPage
/departments/:id           # DepartmentDetailPage
```

**Note:** Current implementation uses state-based navigation. Migration to React Router is required.

---

## Task Breakdown

### Task 6.1: Setup React Router + shadcn/ui

**Description:** Install React Router and configure shadcn/ui with required components.

**Steps:**
1. Install dependencies:
   - `react-router-dom` (latest)
   - Initialize shadcn/ui with `npx shadcn@latest init`
2. Install shadcn/ui components:
   - `npx shadcn@latest add table card dialog alert-dialog dropdown-menu badge button separator scroll-area`
3. Update `App.tsx` to use React Router
4. Create route configuration file `src/routes.tsx`

**Verification:**
- React Router renders correct page based on URL
- shadcn/ui components render correctly with TailwindCSS v4

---

### Task 6.2: Issues List Page

**Description:** Refactor existing IssuesPage with table layout, filters, and row click navigation.

**File:** `mock-ui/src/pages/IssuesPage.tsx` → `mock-ui/src/pages/issues/IssuesListPage.tsx`

**Model (from SPEC.md):**
```typescript
interface Issue {
  id: string
  title: string
  description: string
  status: "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled"
  assignee: AgentBindingId
  departmentId: string
  subIssues: string[]           // Issue IDs
  comments: Comment[]
  report: string                // Markdown
  projectId?: string
  goalId?: string
  createdAt: Date
  updatedAt: Date
}
```

**UI Elements:**
- Page header: "Issues" title + count badge
- Filter tabs: All, Open, In Progress, Done (table header dropdowns, D-04)
- Table columns: Title, Status (Badge), Assignee, Department, Created
- Row click navigates to `/issues/:id`
- Status badge colors: Open=green, InProgress=blue, Blocked=yellow, Done=gray, Cancelled=red

**API Endpoint:** `GET /api/issues`

**Verification:**
- Filter tabs correctly filter list
- Clicking row navigates to detail page
- Table sorts/handles empty state

---

### Task 6.3: Issue Detail Page

**Description:** Full page showing issue details, sub-issues, and comments.

**File:** `mock-ui/src/pages/issues/IssueDetailPage.tsx`

**UI Sections:**
1. **Header:** Back button (to `/issues`) + Title + Status badge
2. **Info Card:**
   - Description (rendered markdown for report field)
   - Assignee (linked to agent)
   - Department (linked to department)
   - Created/Updated timestamps
3. **Sub-Issues Card:** List of linked issues with status badges
4. **Comments Card:** List of comments with author + timestamp
5. **Report Card:** Full markdown rendered report

**API Endpoints:**
- `GET /api/issues/:id`
- `GET /api/issues/:id/comments`

**Verification:**
- Back button returns to list
- All sections render with correct data
- Sub-issues are clickable links

---

### Task 6.4: Goals List Page

**Description:** Refactor existing GoalsPage with table layout and filters.

**File:** `mock-ui/src/pages/GoalsPage.tsx` → `mock-ui/src/pages/goals/GoalsListPage.tsx`

**Model (from SPEC.md):**
```typescript
interface Goal {
  id: string
  title: string
  description: string
  status: "Open" | "Achieved" | "Archived"
  verification: string
  deadline?: Date
  departmentIds: string[]
  issueIds: string[]
  createdAt: Date
  updatedAt: Date
}
```

**UI Elements:**
- Page header: "Goals" title + "New Goal" button (disabled/hidden per D-17)
- Filter tabs: All, Open, Achieved, Archived
- Table columns: Title, Status (Badge), Progress (derived from related issues), Department, Deadline
- Progress = (completed issues / total related issues) * 100

**API Endpoint:** `GET /api/goals`

**Verification:**
- Filter tabs correctly filter list
- Progress calculation is correct

---

### Task 6.5: Goal Detail Page

**Description:** Full page showing goal details and related issues.

**File:** `mock-ui/src/pages/goals/GoalDetailPage.tsx`

**UI Sections:**
1. **Header:** Back button + Title + Status badge
2. **Info Card:**
   - Description
   - Verification text
   - Deadline
   - Departments involved
3. **Related Issues Card:** List of linked issues with status badges and progress

**API Endpoints:**
- `GET /api/goals/:id`
- `GET /api/goals/:id/issues`

**Verification:**
- Back button returns to list
- Related issues are clickable

---

### Task 6.6: Projects List Page

**Description:** Refactor existing ProjectsPage with table layout.

**File:** `mock-ui/src/pages/ProjectsPage.tsx` → `mock-ui/src/pages/projects/ProjectsListPage.tsx`

**Model (from SPEC.md):**
```typescript
interface Project {
  id: string
  companyId: string
  title: string
  description: string
  status: "Open" | "InProgress" | "Done" | "Archived"
  projectDir: string           // Project root directory
  issueIds: string[]
  createdAt: Date
  updatedAt: Date
}
```

**UI Elements:**
- Page header: "Projects" title
- Filter tabs: All, Open, In Progress, Done, Archived
- Table columns: Title, Description (truncated), Status (Badge), projectDir, Issues count
- Row click navigates to `/projects/:id`

**API Endpoint:** `GET /api/projects`

**Verification:**
- Filter tabs correctly filter list
- projectDir is displayed

---

### Task 6.7: Project Detail Page

**Description:** Full page showing project details and projectDir.

**File:** `mock-ui/src/pages/projects/ProjectDetailPage.tsx`

**UI Sections:**
1. **Header:** Back button + Title + Status badge
2. **Info Card:**
   - Description
   - Status
   - projectDir (displayed prominently)
   - Created/Updated timestamps
3. **Related Issues Card:** List of linked issues with status badges

**API Endpoints:**
- `GET /api/projects/:id`
- `GET /api/projects/:id/issues`

**Verification:**
- projectDir is clearly displayed
- Related issues are clickable

---

### Task 6.8: Approvals List Page

**Description:** List with approve/reject row actions and confirmation dialogs. This is the only page with Web UI write access.

**File:** `mock-ui/src/pages/ApprovalsPage.tsx` → `mock-ui/src/pages/approvals/ApprovalsListPage.tsx`

**Model (from SPEC.md):**
```typescript
interface Approval {
  id: string
  title: string
  description: string
  requester: AgentBindingId
  status: "Pending" | "Approved" | "Rejected"
  rejectMessage?: string
  createdAt: Date
  updatedAt: Date
}
```

**UI Elements:**
- Page header: "Approvals" title
- Filter tabs: All, Pending, Approved, Rejected
- Table columns: Request, Requester, Department, Date, Status, Actions
- Row actions (D-11, D-12):
  - Pending: "Approve" (green) + "Reject" (red) buttons
  - Approved/Rejected: "View" button

**Confirmation Dialog (Approve):**
```
┌─────────────────────────────────┐
│ Approve this request?           │
│                                 │
│ Title: Hardware Upgrade         │
│ Requester: Alice (CEO Agent)    │
│                                 │
│ [Cancel]         [Approve]      │
└─────────────────────────────────┘
```

**Confirmation Dialog (Reject) - uses AlertDialog (D-13):**
```
┌─────────────────────────────────┐
│ Reject this request?            │
│                                 │
│ Title: Hardware Upgrade         │
│ Requester: Alice (CEO Agent)    │
│                                 │
│ Reason: [________________]      │
│                                 │
│ [Cancel]        [Reject]        │
└─────────────────────────────────┘
```

**API Endpoints:**
- `GET /api/approvals`
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/reject` (body: `{ reason: string }`)

**Verification:**
- Approve/Reject buttons show confirmation dialog
- Reject dialog requires reason input
- Action updates approval status in list

---

### Task 6.9: Departments List Page

**Description:** List page showing all departments with summary info.

**File:** `mock-ui/src/pages/departments/DepartmentsListPage.tsx`

**Model (from SPEC.md):**
```typescript
interface Department {
  id: string
  name: string
  companyId: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

**UI Elements:**
- Page header: "Departments" title
- Table columns: Name, Company, Description (truncated), Issues count
- Row click navigates to `/departments/:id`

**API Endpoint:** `GET /api/departments`

**Verification:**
- List displays all departments
- Row click navigates to detail

---

### Task 6.10: Department Detail Page

**Description:** Refactor existing DepartmentsPage with full detail, manager, and staff lists.

**File:** `mock-ui/src/pages/DepartmentsPage.tsx` → `mock-ui/src/pages/departments/DepartmentDetailPage.tsx`

**UI Sections:**
1. **Header:** Back button + Department name + Company
2. **Info Card:**
   - Department Name
   - Company
   - Description
3. **Team Card:**
   - Manager section (Crown icon, name, role, status badge)
   - Staff section (count, list with avatar, name, role, status)
4. **Issues Summary Card:** Total, Open, In Progress, Done counts

**API Endpoints:**
- `GET /api/departments/:id`
- `GET /api/departments/:id/agents`
- `GET /api/departments/:id/issues`

**Verification:**
- Manager and Staff sections display correctly
- Status badges use correct colors

---

### Task 6.11: Update Navigation + Sidebar

**Description:** Update Sidebar and Company Rail to use React Router links.

**Files:**
- `mock-ui/src/components/Sidebar.tsx`
- `mock-ui/src/components/CompanyRail.tsx`
- `mock-ui/src/components/Layout.tsx` (create wrapper)

**Changes:**
- Replace `onNavigate` state callbacks with `Link` or `useNavigate`
- Add "Departments" nav item if missing
- Ensure active state reflects current route

**Verification:**
- Navigation highlights active route
- Clicking nav items updates URL and renders correct page

---

## File Structure

```
mock-ui/src/
├── routes.tsx                    # React Router configuration
├── App.tsx                       # Updated with RouterProvider
├── components/
│   ├── Layout.tsx                # Main layout wrapper (CompanyRail + Sidebar + content)
│   ├── Sidebar.tsx               # Updated with router links
│   └── ui/                       # shadcn/ui components
│       ├── table.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── alert-dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       └── ...
├── pages/
│   ├── issues/
│   │   ├── IssuesListPage.tsx
│   │   └── IssueDetailPage.tsx
│   ├── goals/
│   │   ├── GoalsListPage.tsx
│   │   └── GoalDetailPage.tsx
│   ├── projects/
│   │   ├── ProjectsListPage.tsx
│   │   └── ProjectDetailPage.tsx
│   ├── approvals/
│   │   └── ApprovalsListPage.tsx
│   └── departments/
│       ├── DepartmentsListPage.tsx
│       └── DepartmentDetailPage.tsx
└── data.ts                       # Updated with mock API functions
```

---

## API Endpoints Summary

| Entity   | List                | Detail              | Actions            |
|----------|---------------------|---------------------|--------------------|
| Issues   | GET /api/issues     | GET /api/issues/:id | -                  |
| Goals    | GET /api/goals      | GET /api/goals/:id  | -                  |
| Projects | GET /api/projects   | GET /api/projects/:id | -                |
| Approvals| GET /api/approvals  | GET /api/approvals/:id | POST /api/approvals/:id/approve, POST /api/approvals/:id/reject |
| Departments | GET /api/departments | GET /api/departments/:id | -              |

---

## Dependencies

**New npm packages:**
- `react-router-dom` (^7.x)
- `class-variance-authority` (shadcn peer)
- `clsx` (shadcn peer)
- `tailwind-merge` (shadcn peer)

**shadcn/ui components to install:**
- table, card, dialog, alert-dialog, dropdown-menu, badge, button, separator, scroll-area

---

## Out of Scope

- Bulk approve/reject (deferred to v2)
- Approval workflow customization (deferred to Phase 7)
- Create/Edit/Delete forms (Web UI read-only per D-17)
- Harness Infrastructure (Phase 7)

---

## Verification Checklist

- [ ] React Router navigation works for all routes
- [ ] Issues list filters work (All/Open/In Progress/Done)
- [ ] Issue detail shows sub-issues and comments
- [ ] Goals list shows progress derived from issues
- [ ] Goal detail shows related issues
- [ ] Projects list displays projectDir
- [ ] Project detail displays projectDir prominently
- [ ] Approvals approve button shows confirmation dialog
- [ ] Approvals reject button shows AlertDialog with reason input
- [ ] Departments list and detail display correctly
- [ ] Sidebar navigation highlights active route
- [ ] All pages are read-only except Approvals actions
