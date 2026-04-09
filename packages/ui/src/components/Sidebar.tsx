import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertCircle,
  Target,
  FolderKanban,
  CheckCircle,
  Building2,
  Search,
  Settings,
  ChevronDown,
  Crown,
  User,
  Bot,
} from 'lucide-react'
import { useCompany } from '../hooks/useCompany'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'issues', label: 'Issues', icon: AlertCircle, path: '/issues' },
  { id: 'goals', label: 'Goals', icon: Target, path: '/goals' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle, path: '/approvals' },
]

function Sidebar() {
  const { selectedCompany, departments, agents } = useCompany()
  const location = useLocation()

  // Check if a path matches the current location (including nested routes)
  const isPathActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  if (!selectedCompany) {
    return (
      <div className="w-60 bg-slate-800 flex items-center justify-center">
        <span className="text-slate-400 text-sm">No company selected</span>
      </div>
    )
  }

  return (
    <div className="w-60 bg-slate-800 flex flex-col">
      {/* Company Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: selectedCompany.color || '#3b82f6' }}
          >
            {selectedCompany.name.charAt(0)}
          </div>
          <span className="text-white font-semibold truncate">{selectedCompany.name}</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-slate-700 text-slate-200 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm mb-1 ${
              isPathActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="px-4 py-2">
        <div className="border-t border-slate-700"></div>
      </div>

      {/* COMPANY Section */}
      <div className="px-4 py-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</span>
      </div>

      {/* Departments Link */}
      <div className="px-2 pb-2">
        <NavLink
          to="/departments"
          className={`flex items-center gap-3 px-3 py-2 rounded text-sm mb-1 ${
            isPathActive('/departments')
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`
          }
        >
          <Building2 className="w-4 h-4" />
          <span>Departments</span>
        </NavLink>
      </div>

      {/* Agents Link */}
      <div className="px-2 pb-2">
        <NavLink
          to="/agents"
          className={`flex items-center gap-3 px-3 py-2 rounded text-sm mb-1 ${
            isPathActive('/agents')
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`
          }
        >
          <Bot className="w-4 h-4" />
          <span>Agents</span>
        </NavLink>
      </div>

      {/* Department Tree */}
      <div className="flex-1 px-2 pb-4 overflow-y-auto">
        {departments.map((dept) => {
          const deptAgents = agents.filter((a) => a.departmentId === dept.id)
          const manager = deptAgents.find((a) => a.role === 'Manager')
          const staff = deptAgents.filter((a) => a.role === 'Staff')
          const ceo = deptAgents.find((a) => a.role === 'CEO')

          return (
            <div key={dept.id} className="mb-3">
              <NavLink
                to={`/departments/${dept.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm text-slate-300 hover:bg-slate-700 ${
                  isPathActive(`/departments/${dept.id}`) ? 'bg-slate-700' : ''
                }`
                }
              >
                <ChevronDown className="w-3 h-3 text-slate-500" />
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{dept.name}</span>
              </NavLink>

              {/* CEO */}
              {ceo && (
                <div className="ml-6 flex items-center gap-2 px-3 py-1 text-amber-400 text-xs">
                  <Crown className="w-3 h-3" />
                  <span>CEO: {ceo.name}</span>
                </div>
              )}

              {/* Manager */}
              {manager && (
                <div className="ml-6 flex items-center gap-2 px-3 py-1 text-blue-400 text-xs">
                  <User className="w-3 h-3" />
                  <span>{manager.name}</span>
                </div>
              )}

              {/* Staff */}
              {staff.length > 0 && (
                <div className="ml-8 space-y-1">
                  {staff.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 px-3 py-0.5 text-slate-400 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Settings */}
      <div className="px-2 pb-4">
        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded text-sm mb-1 ${
            isPathActive('/settings')
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`
          }
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
