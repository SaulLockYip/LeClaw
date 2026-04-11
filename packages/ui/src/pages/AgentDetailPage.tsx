import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Crown, User, Building2 } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'

function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { agents, departments, isLoading } = useCompany()

  const agent = agents.find((a) => a.id === id)
  const department = agent?.departmentId
    ? departments.find((d) => d.id === agent.departmentId)
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-black/50">Loading...</p>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/agents" className="flex items-center gap-2 text-black/50 hover:text-black/70">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-black/10 p-6">
          <p className="text-black/50">Agent not found</p>
        </div>
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
        return 'bg-black/40'
      default:
        return 'bg-black/40'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CEO':
        return <Crown className="w-4 h-4 text-amber-500" />
      case 'Manager':
        return <Crown className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-black/50" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CEO':
        return 'bg-amber-500'
      case 'Manager':
        return 'bg-blue-500'
      default:
        return 'bg-black/40'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/agents" className="flex items-center gap-2 text-black/50 hover:text-black/70">
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-black">{agent.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)}`}></div>
          <span className="text-sm text-black/50 capitalize">{agent.status || 'offline'}</span>
        </div>
      </div>

      {/* Agent Info Card */}
      <div className="bg-white rounded-lg border border-black/10 p-6">
        <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          {getRoleIcon(agent.role)}
          Agent Information
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Name</label>
            <p className="text-black mt-1 font-medium">{agent.name}</p>
          </div>
          {agent.title && (
            <div>
              <label className="text-xs uppercase text-black/50 tracking-wider">Title</label>
              <p className="text-black mt-1 font-medium">{agent.title}</p>
            </div>
          )}
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Role</label>
            <p className="text-black mt-1 flex items-center gap-2">
              {getRoleIcon(agent.role)}
              {agent.role}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Department</label>
            <p className="text-black mt-1 flex items-center gap-2">
              {department ? (
                <>
                  <Building2 className="w-4 h-4 text-black/40" />
                  {department.name}
                </>
              ) : (
                <span className="text-black/40">No department</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Status</label>
            <p className="text-black mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                agent.status === 'online' ? 'bg-green-100 text-green-700' :
                agent.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                'bg-black/5 text-black/60'
              }`}>
                {agent.status || 'offline'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* OpenClaw Agent Info Card */}
      <div className="bg-white rounded-lg border border-black/10 p-6">
        <h2 className="text-lg font-semibold text-black mb-4">
          OpenClaw Agent Configuration
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Agent ID</label>
            <p className="text-black/70 mt-1 font-mono text-sm bg-white px-3 py-2 rounded">
              {agent.openClawAgentId}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Workspace</label>
            <p className="text-black/70 mt-1 font-mono text-sm bg-white px-3 py-2 rounded truncate">
              {agent.openClawAgentWorkspace}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Agent Directory</label>
            <p className="text-black/70 mt-1 font-mono text-sm bg-white px-3 py-2 rounded truncate">
              {agent.openClawAgentDir}
            </p>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-white rounded-lg border border-black/10 p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Activity</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Created</label>
            <p className="text-black/70 mt-1">
              {new Date(agent.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-black/50 tracking-wider">Last Updated</label>
            <p className="text-black/70 mt-1">
              {new Date(agent.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentDetailPage
