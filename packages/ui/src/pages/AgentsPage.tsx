import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Bot, ChevronRight, Crown, User, Building2, X } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import type { Agent } from '../lib/api'

function AgentsPage() {
  const { selectedCompany, agents, departments, isLoading } = useCompany()
  const [showAddModal, setShowAddModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'Staff' as 'CEO' | 'Manager' | 'Staff',
    departmentId: '',
  })

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Select a company to view agents</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch(`http://localhost:4396/api/companies/${selectedCompany.id}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          departmentId: formData.role === 'CEO' ? null : formData.departmentId || null,
        }),
      })

      if (response.ok) {
        // Refresh agents list
        window.location.reload()
      } else {
        console.error('Failed to create agent')
      }
    } catch (err) {
      console.error('Failed to create agent:', err)
    } finally {
      setIsCreating(false)
      setShowAddModal(false)
      setFormData({ name: '', role: 'Staff', departmentId: '' })
    }
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
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </button>
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

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add New Agent</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter agent name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'CEO' | 'Manager' | 'Staff' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="CEO">CEO</option>
                </select>
              </div>
              {formData.role !== 'CEO' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department (optional)
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
            <p className="text-sm text-slate-500 flex items-center gap-1">
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
