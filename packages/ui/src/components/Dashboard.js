import { agents, issues } from '../data';
const metrics = [
    { label: 'Companies', value: '12' },
    { label: 'Agents Online', value: '24' },
    { label: 'Open Issues', value: '8' },
    { label: 'Total Agents', value: '48' },
];
function Dashboard() {
    const getStatusDot = (status) => {
        // Filled square = online, outlined square = busy, empty = offline
        if (status === 'online') {
            return 'bg-black';
        }
        if (status === 'busy') {
            return 'bg-black/40';
        }
        return 'bg-black/10 border border-black';
    };
    return (<div className="space-y-12">
      {/* Page Title */}
      <h1 className="text-4xl font-bold text-black" style={{ fontFamily: "'Playfair Display', serif" }}>Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric) => (<div key={metric.label} className="bg-white border border-black p-6 group hover:bg-black transition-colors cursor-default">
            <div className="text-4xl font-bold text-black group-hover:text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{metric.value}</div>
            <div className="text-xs text-black/50 group-hover:text-white/60 uppercase tracking-widest">{metric.label}</div>
          </div>))}
      </div>

      {/* Agent Status Table */}
      <div className="bg-white border border-black">
        <div className="px-6 py-4 border-b border-black">
          <h2 className="text-xl font-bold text-black" style={{ fontFamily: "'Playfair Display', serif" }}>Agent Status</h2>
        </div>
        <table className="w-full">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest">Department</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {agents.map((agent) => (<tr key={agent.id} className="hover:bg-black hover:text-white group transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 flex-shrink-0 ${getStatusDot(agent.status)}`}></div>
                    <span className="text-sm font-medium">{agent.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-black/60 group-hover:text-white/70">{agent.role}</td>
                <td className="px-6 py-4 text-sm text-black/60 group-hover:text-white/70">{agent.department}</td>
                <td className="px-6 py-4">
                  <span className="border border-black group-hover:border-white px-2 py-0.5 text-xs font-medium uppercase tracking-wider">
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-black/50 group-hover:text-white/60">{agent.lastSeen}</td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* Recent Issues */}
      <div className="bg-white border border-black">
        <div className="px-6 py-4 border-b border-black">
          <h2 className="text-xl font-bold text-black" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Issues</h2>
        </div>
        <div className="divide-y divide-black/10">
          {issues.map((issue) => (<div key={issue.id} className="px-6 py-4 flex items-center justify-between hover:bg-black hover:text-white group transition-colors cursor-default">
              <div className="flex-1">
                <div className="text-sm font-medium">{issue.title}</div>
                <div className="text-xs text-black/40 group-hover:text-white/50 mt-1">
                  {issue.id} · Assigned to {issue.assignee} · {issue.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="border border-black group-hover:border-white px-2 py-0.5 text-xs font-medium uppercase tracking-wider">
                  {issue.priority}
                </span>
                <span className="border border-black group-hover:border-white px-2 py-0.5 text-xs font-medium uppercase tracking-wider">
                  {issue.status}
                </span>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
export default Dashboard;
//# sourceMappingURL=Dashboard.js.map