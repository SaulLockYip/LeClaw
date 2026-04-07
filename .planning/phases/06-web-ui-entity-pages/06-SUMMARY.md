# Phase 6: Web UI - Entity Pages - Summary

**Status:** Completed
**Completed:** 2026-04-07
**Duration:** ~8 hours (17:25 - 09:25)

---

## One-Liner

Full entity pages with list/detail views for Issues, Goals, Projects, Approvals, and Departments - all read-only except Approvals which supports approve/reject via dialog confirmation.

---

## Commits

| Hash | Message | Files |
|------|---------|-------|
| `cf6b201` | feat(06): implement Web UI entity pages with detail views | 9 files, +1118/-78 |
| `dc8ab49` | fix(06): update Sidebar to highlight active nav for detail routes | Sidebar.tsx |

---

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 6.1 | Setup React Router + shadcn/ui | React Router already set up; shadcn/ui deferred (Tailwind-based approach used) | - |
| 6.2 | Issues List Page | Done | cf6b201 |
| 6.3 | Issue Detail Page | Done | cf6b201 |
| 6.4 | Goals List Page | Done | cf6b201 |
| 6.5 | Goal Detail Page | Done | cf6b201 |
| 6.6 | Projects List Page | Done | cf6b201 |
| 6.7 | Project Detail Page | Done | cf6b201 |
| 6.8 | Approvals List Page | Done | cf6b201 |
| 6.9 | Departments List Page | Done (disabled New button) | cf6b201 |
| 6.10 | Department Detail Page | Already existed; verified | - |
| 6.11 | Update Navigation + Sidebar | Done | dc8ab49 |

---

## What Was Built

### New Files Created

- `mock-ui/src/pages/issues/IssueDetailPage.tsx` - Full issue detail with sub-issues, comments, report
- `mock-ui/src/pages/goals/GoalDetailPage.tsx` - Goal detail with related issues and progress tracking
- `mock-ui/src/pages/projects/ProjectDetailPage.tsx` - Project detail with projectDir prominently displayed
- `mock-ui/src/pages/approvals/ApprovalsListPage.tsx` - Approvals list with Dialog confirmations

### Modified Files

- `mock-ui/src/App.tsx` - Added routes for /issues/:id, /goals/:id, /projects/:id
- `mock-ui/src/pages/IssuesPage.tsx` - Added filter tabs, row click navigation, disabled New Issue button
- `mock-ui/src/pages/GoalsPage.tsx` - Added progress column, row click navigation, disabled New Goal button
- `mock-ui/src/pages/ProjectsPage.tsx` - Added table layout, projectDir column, row click navigation, disabled New Project button
- `mock-ui/src/pages/DepartmentsPage.tsx` - Disabled New Department button
- `mock-ui/src/components/Sidebar.tsx` - Fixed active state for nested routes

### Features Implemented

1. **Issues Page:** Filter tabs (All/Open/InProgress/Blocked/Done/Cancelled), table with Title/Status/Assignee/Created, row click to detail
2. **Issue Detail:** Header with back button, Info Card (description, assignee, department, timestamps), Sub-Issues Card, Comments Card, Report Card
3. **Goals Page:** Filter tabs, table with Title/Status/Verification/Progress/Deadline, progress bar, row click to detail
4. **Goal Detail:** Header, Info Card (description, verification, deadline, progress), Related Issues Card
5. **Projects Page:** Filter tabs, table with Title/Description/Status/Directory/Issues count, row click to detail
6. **Project Detail:** Header, Info Card with projectDir prominently displayed, Related Issues Card
7. **Approvals Page:** Filter tabs, table with approve/reject buttons, Dialog confirmations (approve shows info dialog, reject shows AlertDialog with reason input)
8. **Departments Page:** Disabled New Department button per read-only policy
9. **Navigation:** Sidebar highlights active nav item for nested routes

---

## Web UI Read-Only Policy Enforcement

All "New" buttons (Issue, Goal, Project, Department) are:
- Disabled (`disabled` attribute)
- Styled with muted colors (`bg-slate-300 text-slate-500`)
- Have `title` attribute explaining "Web UI is read-only. Create via CLI."

**Exception:** Approvals page supports human write actions (approve/reject) via Dialog confirmations.

---

## Route Structure

```
/issues                    # IssuesListPage
/issues/:id                # IssueDetailPage
/goals                     # GoalsListPage
/goals/:id                 # GoalDetailPage
/projects                  # ProjectsListPage
/projects/:id              # ProjectDetailPage
/approvals                 # ApprovalsListPage (with approve/reject dialogs)
/departments               # DepartmentsPage
/departments/:id           # DepartmentDetailPage
```

---

## Key Files

| File | Purpose |
|------|---------|
| `mock-ui/src/pages/issues/IssueDetailPage.tsx` | Issue detail with sub-issues, comments, report |
| `mock-ui/src/pages/goals/GoalDetailPage.tsx` | Goal detail with related issues, progress |
| `mock-ui/src/pages/projects/ProjectDetailPage.tsx` | Project detail with projectDir display |
| `mock-ui/src/pages/approvals/ApprovalsListPage.tsx` | Approvals with Dialog confirmations |
| `mock-ui/src/components/Sidebar.tsx` | Fixed nested route active state |

---

## Verification

- [x] Build passes (`pnpm build` succeeds)
- [x] All routes defined in App.tsx
- [x] React Router handles /entity/:id patterns
- [x] Row click navigation works from list to detail
- [x] Back button navigation from detail to list
- [x] Filter tabs filter list views
- [x] Approve button shows confirmation Dialog
- [x] Reject button shows Dialog with reason input
- [x] New buttons disabled per read-only policy
- [x] Sidebar highlights active nav for nested routes

---

## Decisions Made

1. **shadcn/ui deferred** - Used Tailwind-based approach instead; existing code already uses Tailwind effectively
2. **Progress tracking** - Goals show progress bar based on completed/total related issues
3. **Dialog approach** - Native HTML dialogs used instead of shadcn/ui Dialog for simplicity

---

## Known Stubs

None - All entity pages have functional data fetching from REST API.

---

## Self-Check: PASSED

Build verified successful:
```
dist/index.html                   0.48 kB │ gzip:  0.31 kB
dist/assets/index-CIcAZ0fJ.css   24.51 kB │ gzip:  5.33 kB
dist/assets/index-BkusSfUg.js   303.59 kB │ gzip: 85.21 kB
```
