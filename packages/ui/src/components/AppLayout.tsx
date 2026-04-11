import { Outlet } from 'react-router-dom'
import CompanyRail from './CompanyRail'
import Sidebar from './Sidebar'
import { useCompany } from '../hooks/useCompany'

function AppLayout() {
  const { companies, selectedCompanyId, selectCompany } = useCompany()

  return (
    <div className="flex h-screen bg-black/5">
      <CompanyRail
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onCompanySelect={selectCompany}
      />
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
