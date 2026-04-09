import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Crown, User, Building2, UserPlus } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import type { Agent } from '../lib/api'
import AgentInviteModal from '../components/AgentInviteModal'

function AgentsPage() {
  const { selectedCompany, agents, departments, isLoading } = useCompany()
  const [showInviteModal, setShowInviteModal] = useState(false)

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Select a company to view agents</p>
      </div>
    )
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'busy':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-slate-400'
      default:
        return 'bg-slate-400'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CEO':
        return <Crown className="w-4 h-4 text-amber-500" />
      case 'Manager':
        return <Crown className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-slate-500" />
    }
  }

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'CEO':
        return 'bg-amber-500'
      case 'Manager':
        return 'bg-blue-500'
      default:
        return 'bg-slate-400'
    }
  }

  // Group agents by department
  const ceos = agents.filter((a) => a.role === 'CEO')
  const managers = agents.filter((a) => a.role === 'Manager')
  const staff = agents.filter((a) => a.role === 'Staff')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
          <p className="text-slate-500 text-sm mt-1">{selectedCompany.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Agent
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No agents found</div>
      ) : (
        <div className="space-y-6">
          {/* CEOs */}
          {ceos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                CEO ({ceos.length})
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {ceos.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} department={null} getStatusColor={getStatusColor} getRoleIcon={getRoleIcon} getRoleBgColor={getRoleBgColor} />
                ))}
              </div>
            </div>
          )}

          {/* Managers */}
          {managers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-blue-500" />
                Managers ({managers.length})
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {managers.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    department={departments.find((d) => d.id === agent.departmentId) || null}
                    getStatusColor={getStatusColor}
                    getRoleIcon={getRoleIcon}
                    getRoleBgColor={getRoleBgColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Staff */}
          {staff.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Staff ({staff.length})
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {staff.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    department={departments.find((d) => d.id === agent.departmentId) || null}
                    getStatusColor={getStatusColor}
                    getRoleIcon={getRoleIcon}
                    getRoleBgColor={getRoleBgColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Agent Modal */}
      {selectedCompany && (
        <AgentInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          companyId={selectedCompany.id}
          departments={departments}
        />
      )}
    </div>
  )
}

// Agent Card Component
interface AgentCardProps {
  agent: Agent
  department: { name: string } | null
  getStatusColor: (status?: string) => string
  getRoleIcon: (role: string) => React.ReactNode
  getRoleBgColor: (role: string) => string
}

function AgentCard({ agent, department, getStatusColor, getRoleIcon, getRoleBgColor }: AgentCardProps) {
  return (
    <Link
      to={`/agents/${agent.id}`}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${getRoleBgColor(agent.role)} flex items-center justify-center text-white font-medium`}>
            {agent.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              {agent.name}
            </h3>
            {agent.title && (
              <p className="text-sm text-slate-500">{agent.title}</p>
            )}
            <p className="text-sm text-slate-400 flex items-center gap-1">
              {getRoleIcon(agent.role)}
              {agent.role}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>

      {department && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">{department.name}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
        <span className={`text-xs font-medium ${
          agent.status === 'online' ? 'text-green-700' :
          agent.status === 'busy' ? 'text-yellow-700' :
          'text-slate-500'
        }`}>
          {agent.status || 'offline'}
        </span>
      </div>
    </Link>
  )
}

export default AgentsPage
