import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import { issueApi } from '../lib/api';
function IssuesPage() {
    const { selectedCompany, isLoading: isCompanyLoading } = useCompany();
    const [issues, setIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    useEffect(() => {
        if (!selectedCompany)
            return;
        async function loadIssues() {
            setIsLoading(true);
            try {
                const data = await issueApi.list(selectedCompany.id);
                setIssues(data);
            }
            catch (err) {
                console.error('Failed to load issues:', err);
            }
            finally {
                setIsLoading(false);
            }
        }
        loadIssues();
    }, [selectedCompany]);
    const filteredIssues = issues.filter((issue) => {
        if (filter === 'All')
            return true;
        return issue.status === filter;
    });
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-black text-white';
            case 'InProgress':
                return 'bg-black text-white';
            case 'Done':
                return 'bg-white text-black border-4 border-black';
            case 'Blocked':
                return 'bg-black text-white';
            case 'Cancelled':
                return 'bg-slate-200 text-black border-4 border-black';
            default:
                return 'bg-slate-200 text-black border-4 border-black';
        }
    };
    const filterTabs = [
        { label: 'All', count: issues.length },
        { label: 'Open', count: issues.filter((i) => i.status === 'Open').length },
        { label: 'InProgress', count: issues.filter((i) => i.status === 'InProgress').length },
        { label: 'Blocked', count: issues.filter((i) => i.status === 'Blocked').length },
        { label: 'Done', count: issues.filter((i) => i.status === 'Done').length },
        { label: 'Cancelled', count: issues.filter((i) => i.status === 'Cancelled').length },
    ];
    if (isCompanyLoading) {
        return (<div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>);
    }
    return (<div className="space-y-0">
      {/* Page Header - Oversized Serif */}
      <div className="py-16 border-b-4 border-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-6xl font-bold tracking-tight text-black">Issues</h1>
            <p className="text-lg mt-4 text-slate-600">{selectedCompany?.name}</p>
          </div>
          <button className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-800 flex items-center gap-2" disabled title="Web UI is read-only. Create issues via CLI.">
            <Plus className="w-5 h-5"/>
            New Issue
          </button>
        </div>
      </div>

      {/* Filter Tabs - Black Border Style */}
      <div className="border-b-4 border-black">
        <div className="flex">
          {filterTabs.map((tab) => (<button key={tab.label} onClick={() => setFilter(tab.label)} className={`px-8 py-6 text-lg font-bold uppercase tracking-wider border-r-4 border-black ${filter === tab.label
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-slate-100'}`}>
              {tab.label}
              <span className={`ml-3 px-3 py-1 text-sm font-bold ${filter === tab.label ? 'bg-white text-black' : 'bg-slate-200 text-black'}`}>
                {tab.count}
              </span>
            </button>))}
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white border-b-4 border-black">
        <table className="w-full">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Title</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Status</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Assignee</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-black">
            {isLoading ? (<tr>
                <td colSpan={4} className="px-8 py-16 text-center text-slate-600">Loading...</td>
              </tr>) : filteredIssues.length === 0 ? (<tr>
                <td colSpan={4} className="px-8 py-16 text-center text-slate-600">No issues found</td>
              </tr>) : (filteredIssues.map((issue) => (<tr key={issue.id} className="hover:bg-slate-100 cursor-pointer" onClick={() => window.location.href = `/issues/${issue.id}`}>
                  <td className="px-8 py-6 text-lg font-bold text-black">{issue.title}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 text-sm font-bold uppercase tracking-wider ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-lg text-slate-700">{issue.assignee || 'Unassigned'}</td>
                  <td className="px-8 py-6 text-lg text-slate-700">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
}
export default IssuesPage;