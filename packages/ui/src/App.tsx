import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CompanyProvider } from './hooks/useCompany'
import AppLayout from './components/AppLayout'
import DashboardPage from './pages/DashboardPage'
import IssuesPage from './pages/IssuesPage'
import IssueDetailPage from './pages/issues/IssueDetailPage'
import SubIssueDetailPage from './pages/issues/SubIssueDetailPage'
import GoalsPage from './pages/GoalsPage'
import GoalDetailPage from './pages/goals/GoalDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import ApprovalsListPage from './pages/approvals/ApprovalsListPage'
import ApprovalDetailPage from './pages/approvals/ApprovalDetailPage'
import DepartmentsPage from './pages/DepartmentsPage'
import DepartmentDetailPage from './pages/DepartmentDetailPage'
import AgentsPage from './pages/AgentsPage'
import AgentDetailPage from './pages/AgentDetailPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <CompanyProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/:id" element={<IssueDetailPage />} />
            <Route path="/sub-issues/:id" element={<SubIssueDetailPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/goals/:id" element={<GoalDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/approvals" element={<ApprovalsListPage />} />
            <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/:id" element={<AgentDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </CompanyProvider>
    </BrowserRouter>
  )
}

export default App
