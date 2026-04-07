import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CompanyProvider } from './hooks/useCompany'
import AppLayout from './components/AppLayout'
import DashboardPage from './pages/DashboardPage'
import IssuesPage from './pages/IssuesPage'
import GoalsPage from './pages/GoalsPage'
import ProjectsPage from './pages/ProjectsPage'
import ApprovalsPage from './pages/ApprovalsPage'
import DepartmentsPage from './pages/DepartmentsPage'
import DepartmentDetailPage from './pages/DepartmentDetailPage'

function App() {
  return (
    <BrowserRouter>
      <CompanyProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
          </Route>
        </Routes>
      </CompanyProvider>
    </BrowserRouter>
  )
}

export default App
