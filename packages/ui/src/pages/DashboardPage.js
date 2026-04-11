import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Bot, Clock, Users, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import { issueApi } from '../lib/api';
function DashboardPage() {
    const { selectedCompany, departments, agents, isLoading } = useCompany();
    const [recentIssues, setRecentIssues] = useState([]);
    const [isLoadingIssues, setIsLoadingIssues] = useState(false);
    // Load recent issues
    useEffect(() => {
        if (!selectedCompany)
            return;
        async function loadRecentIssues() {
            setIsLoadingIssues(true);
            try {
                const issues = await issueApi.list(selectedCompany.id, 5);
                setRecentIssues(issues);
            }
            catch (err) {
                console.error('Failed to load recent issues:', err);
            }
            finally {
                setIsLoadingIssues(false);
            }
        }
        loadRecentIssues();
    }, [selectedCompany]);
    if (!selectedCompany) {
        return (<div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Select a company to view dashboard</p>
      </div>);
    }
    // Calculate agent stats
    const onlineAgents = agents.filter((a) => a.status === 'online').length;
    const busyAgents = agents.filter((a) => a.status === 'busy').length;
    const totalAgents = agents.length;
    // Calculate issue stats
    const openIssues = recentIssues.filter((i) => i.status === 'Open').length;
    const inProgressIssues = recentIssues.filter((i) => i.status === 'InProgress').length;
    const doneIssues = recentIssues.filter((i) => i.status === 'Done').length;
    const getIssueStatusBadge = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-black text-white';
            case 'InProgress':
                return 'bg-black text-white';
            case 'Done':
                return 'bg-white text-black border-2 border-black';
            case 'Blocked':
                return 'bg-black text-white';
            default:
                return 'bg-white text-black border-2 border-black';
        }
    };
    return (<div className="space-y-0">
      {/* Page Title - Oversized Serif */}
      <div className="py-16 border-b-4 border-black">
        <h1 className="font-serif text-6xl font-bold tracking-tight text-black">Dashboard</h1>
        <p className="text-lg mt-4 text-slate-600">{selectedCompany.name}</p>
      </div>

      {/* Metric Cards - Inverted Black Sections */}
      <div className="grid grid-cols-4 divide-x divide-black">
        <div className="bg-black p-8">
          <div className="flex items-center gap-4">
            <Building2 className="w-8 h-8 text-white"/>
            <div>
              <div className="text-5xl font-bold text-white">
                {isLoading ? '-' : departments.length}
              </div>
              <div className="text-sm text-slate-400 mt-1 uppercase tracking-wider">Departments</div>
            </div>
          </div>
        </div>

        <div className="bg-black p-8">
          <div className="flex items-center gap-4">
            <Bot className="w-8 h-8 text-white"/>
            <div>
              <div className="text-5xl font-bold text-white">
                {isLoading ? '-' : onlineAgents}
              </div>
              <div className="text-sm text-slate-400 mt-1 uppercase tracking-wider">Agents Online</div>
            </div>
          </div>
        </div>

        <div className="bg-black p-8">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-white"/>
            <div>
              <div className="text-5xl font-bold text-white">
                {isLoading ? '-' : busyAgents}
              </div>
              <div className="text-sm text-slate-400 mt-1 uppercase tracking-wider">Agents Busy</div>
            </div>
          </div>
        </div>

        <div className="bg-black p-8">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-white"/>
            <div>
              <div className="text-5xl font-bold text-white">
                {isLoading ? '-' : totalAgents}
              </div>
              <div className="text-sm text-slate-400 mt-1 uppercase tracking-wider">Total Agents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="h-4 bg-black"></div>

      {/* Issues Breakdown - White Section */}
      <div className="py-16 border-b-4 border-black">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-black mb-8">Issue Status</h2>
        <div className="grid grid-cols-3 divide-x divide-black border-4 border-black">
          <div className="bg-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-black">{openIssues}</div>
                <div className="text-sm uppercase tracking-wider text-slate-600 mt-2">Open Issues</div>
              </div>
              <AlertCircle className="w-12 h-12 text-black"/>
            </div>
          </div>

          <div className="bg-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-black">{inProgressIssues}</div>
                <div className="text-sm uppercase tracking-wider text-slate-600 mt-2">In Progress</div>
              </div>
              <Clock className="w-12 h-12 text-black"/>
            </div>
          </div>

          <div className="bg-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-black">{doneIssues}</div>
                <div className="text-sm uppercase tracking-wider text-slate-600 mt-2">Done</div>
              </div>
              <CheckCircle className="w-12 h-12 text-black"/>
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="h-4 bg-black"></div>

      {/* Agent Status Table - Inverted */}
      <div className="bg-black py-16 border-b-4 border-black">
        <div className="px-8 pb-8">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white">Agent Status</h2>
        </div>
        <table className="w-full">
          <thead className="bg-white">
            <tr>
              <th className="px-8 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">Agent</th>
              <th className="px-8 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">Role</th>
              <th className="px-8 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-white">
            {agents.slice(0, 5).map((agent) => (<tr key={agent.id} className="hover:bg-slate-900">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${agent.status === 'online' ? 'bg-white' : agent.status === 'busy' ? 'bg-yellow-400' : 'bg-slate-600'}`}></div>
                    <Link to={`/agents/${agent.id}`} className="text-lg font-medium text-white hover:underline">
                      {agent.name}
                    </Link>
                  </div>
                </td>
                <td className="px-8 py-6 text-lg text-white">{agent.role}</td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider ${agent.status === 'online' ? 'bg-white text-black' :
                agent.status === 'busy' ? 'bg-yellow-400 text-black' :
                    'bg-slate-600 text-white'}`}>
                    {agent.status || 'offline'}
                  </span>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* Section Divider */}
      <div className="h-4 bg-black"></div>

      {/* Recent Issues - White Section */}
      <div className="bg-white py-16">
        <div className="px-8 pb-8 flex items-center justify-between border-b-4 border-black">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-black">Recent Issues</h2>
          <Link to="/issues" className="text-lg font-bold text-black hover:underline flex items-center gap-2">
            View all <ArrowRight className="w-5 h-5"/>
          </Link>
        </div>
        <div className="divide-y-4 divide-black">
          {isLoadingIssues ? (<div className="px-8 py-12 text-center text-slate-600">Loading...</div>) : recentIssues.length === 0 ? (<div className="px-8 py-12 text-center text-slate-600">No recent issues</div>) : (recentIssues.map((issue) => (<div key={issue.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-100">
                <div className="flex-1">
                  <div className="text-lg font-bold text-black">{issue.title}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    {issue.id} · {issue.assignee || 'Unassigned'}
                  </div>
                </div>
                <span className={`px-4 py-2 text-sm font-bold uppercase tracking-wider ${getIssueStatusBadge(issue.status)}`}>
                  {issue.status}
                </span>
              </div>)))}
        </div>
      </div>
    </div>);
}
export default DashboardPage;