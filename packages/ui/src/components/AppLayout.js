import { Outlet } from 'react-router-dom';
import CompanyRail from './CompanyRail';
import Sidebar from './Sidebar';
import { useCompany } from '../hooks/useCompany';
function AppLayout() {
    const { companies, selectedCompanyId, selectCompany } = useCompany();
    return (<div className="flex h-screen bg-white">
      <CompanyRail companies={companies} selectedCompanyId={selectedCompanyId} onCompanySelect={selectCompany}/>
      <Sidebar />
      <main className="flex-1 p-12 overflow-auto bg-white">
        <Outlet />
      </main>
    </div>);
}
export default AppLayout;
//# sourceMappingURL=AppLayout.js.map