import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, Target, FolderKanban, CheckCircle, Building2, Search, Settings, ChevronDown, Crown, User, Bot, } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'issues', label: 'Issues', icon: AlertCircle, path: '/issues' },
    { id: 'goals', label: 'Goals', icon: Target, path: '/goals' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle, path: '/approvals' },
];
function Sidebar() {
    const { selectedCompany, departments, agents } = useCompany();
    const location = useLocation();
    // Check if a path matches the current location (including nested routes)
    const isPathActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };
    if (!selectedCompany) {
        return (<div className="w-60 bg-black border-r border-black flex items-center justify-center">
        <span className="text-white text-sm tracking-widest uppercase">No company selected</span>
      </div>);
    }
    return (<div className="w-60 bg-black border-r border-black flex flex-col">
      {/* Company Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-white flex items-center justify-center text-white text-sm font-bold">
            {selectedCompany.name.charAt(0)}
          </div>
          <span className="text-white font-semibold tracking-wide truncate">{selectedCompany.name}</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"/>
          <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-2 bg-black border border-white/30 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white"/>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => (<NavLink key={item.id} to={item.path} className={`flex items-center gap-3 px-3 py-2 text-sm mb-1 transition-colors ${isPathActive(item.path)
                ? 'bg-white text-black'
                : 'text-white/60 hover:bg-white hover:text-black'}`}>
            <item.icon className="w-4 h-4"/>
            <span>{item.label}</span>
          </NavLink>))}
      </nav>

      {/* Divider */}
      <div className="px-4 py-2">
        <div className="border-t border-white/20"></div>
      </div>

      {/* COMPANY Section */}
      <div className="px-4 py-2">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Company</span>
      </div>

      {/* Departments Link */}
      <div className="px-2 pb-2">
        <NavLink to="/departments" className={`flex items-center gap-3 px-3 py-2 text-sm mb-1 transition-colors ${isPathActive('/departments')
            ? 'bg-white text-black'
            : 'text-white/60 hover:bg-white hover:text-black'}`}>
          <Building2 className="w-4 h-4"/>
          <span>Departments</span>
        </NavLink>
      </div>

      {/* Agents Link */}
      <div className="px-2 pb-2">
        <NavLink to="/agents" className={`flex items-center gap-3 px-3 py-2 text-sm mb-1 transition-colors ${isPathActive('/agents')
            ? 'bg-white text-black'
            : 'text-white/60 hover:bg-white hover:text-black'}`}>
          <Bot className="w-4 h-4"/>
          <span>Agents</span>
        </NavLink>
      </div>

      {/* Department Tree */}
      <div className="flex-1 px-2 pb-4 overflow-y-auto">
        {departments.map((dept) => {
            const deptAgents = agents.filter((a) => a.departmentId === dept.id);
            const manager = deptAgents.find((a) => a.role === 'Manager');
            const staff = deptAgents.filter((a) => a.role === 'Staff');
            const ceo = deptAgents.find((a) => a.role === 'CEO');
            return (<div key={dept.id} className="mb-3">
              <NavLink to={`/departments/${dept.id}`} className={`flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:bg-white hover:text-black transition-colors ${isPathActive(`/departments/${dept.id}`) ? 'bg-white text-black' : ''}`}>
                <ChevronDown className="w-3 h-3 text-white/40"/>
                <Building2 className="w-3.5 h-3.5"/>
                <span className="truncate">{dept.name}</span>
              </NavLink>

              {/* CEO */}
              {ceo && (<div className="ml-6 flex items-center gap-2 px-3 py-1 text-white/80 text-xs">
                  <Crown className="w-3 h-3"/>
                  <span>CEO: {ceo.name}</span>
                </div>)}

              {/* Manager */}
              {manager && (<div className="ml-6 flex items-center gap-2 px-3 py-1 text-white/60 text-xs">
                  <User className="w-3 h-3"/>
                  <span>{manager.name}</span>
                </div>)}

              {/* Staff */}
              {staff.length > 0 && (<div className="ml-8 space-y-1">
                  {staff.map((s) => (<div key={s.id} className="flex items-center gap-2 px-3 py-0.5 text-white/50 text-xs">
                      <span className="w-1.5 h-1.5 bg-white inline-block"></span>
                      <span>{s.name}</span>
                    </div>))}
                </div>)}
            </div>);
        })}
      </div>

      {/* Settings */}
      <div className="px-2 pb-4">
        <NavLink to="/settings" className={`flex items-center gap-3 px-3 py-2 text-sm mb-1 transition-colors ${isPathActive('/settings')
            ? 'bg-white text-black'
            : 'text-white/60 hover:bg-white hover:text-black'}`}>
          <Settings className="w-4 h-4"/>
          <span>Settings</span>
        </NavLink>
      </div>
    </div>);
}
export default Sidebar;
//# sourceMappingURL=Sidebar.js.map