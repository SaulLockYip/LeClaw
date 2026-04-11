import { agents, issues } from '../data'

const metrics = [
  { label: 'Companies', value: '12', icon: '🏢', color: 'bg-blue-500' },
  { label: 'Agents Online', value: '24', icon: '🤖', color: 'bg-green-500' },
  { label: 'Open Issues', value: '8', icon: '📋', color: 'bg-orange-500' },
  { label: 'Total Agents', value: '48', icon: '👥', color: 'bg-purple-500' },
]

function Dashboard() {
  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-black/5 text-black/70'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-black">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${metric.color} rounded-lg flex items-center justify-center text-xl`}>
                {metric.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-black">{metric.value}</div>
                <div className="text-sm text-black/50">{metric.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Status Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-black/10">
          <h2 className="text-lg font-semibold text-black">Agent Status</h2>
        </div>
        <table className="w-full">
          <thead className="bg-white">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-black/50">Agent</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black/50">Role</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black/50">Department</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black/50">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black/50">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-white">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                    <span className="text-sm font-medium text-black">{agent.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-black/60">{agent.role}</td>
                <td className="px-4 py-3 text-sm text-black/60">{agent.department}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'online' ? 'bg-green-100 text-green-700' :
                    agent.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-black/5 text-black/60'
                  }`}>
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-black/50">{agent.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Issues */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-black/10">
          <h2 className="text-lg font-semibold text-black">Recent Issues</h2>
        </div>
        <div className="divide-y divide-black/5">
          {issues.map((issue) => (
            <div key={issue.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-black">{issue.title}</div>
                <div className="text-xs text-black/50 mt-1">
                  {issue.id} · Assigned to {issue.assignee} · {issue.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                  {issue.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  issue.status === 'open' ? 'bg-black/5 text-black/60' :
                  issue.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {issue.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
