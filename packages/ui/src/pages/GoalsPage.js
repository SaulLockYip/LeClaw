import { useState, useEffect } from 'react';
import { Plus, Target } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import { goalApi } from '../lib/api';
function GoalsPage() {
    const { selectedCompany, isLoading: isCompanyLoading } = useCompany();
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    useEffect(() => {
        if (!selectedCompany)
            return;
        async function loadGoals() {
            setIsLoading(true);
            try {
                const data = await goalApi.list(selectedCompany.id);
                setGoals(data);
            }
            catch (err) {
                console.error('Failed to load goals:', err);
            }
            finally {
                setIsLoading(false);
            }
        }
        loadGoals();
    }, [selectedCompany]);
    const filteredGoals = activeTab === 'All'
        ? goals
        : goals.filter((g) => g.status === activeTab);
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-black text-white';
            case 'Achieved':
                return 'bg-white text-black border-4 border-black';
            case 'Archived':
                return 'bg-slate-200 text-black border-4 border-black';
            default:
                return 'bg-slate-200 text-black border-4 border-black';
        }
    };
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
            <h1 className="font-serif text-6xl font-bold tracking-tight text-black">Goals</h1>
            <p className="text-lg mt-4 text-slate-600">{selectedCompany?.name}</p>
          </div>
          <button className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-800 flex items-center gap-2" disabled title="Web UI is read-only. Create goals via CLI.">
            <Plus className="w-5 h-5"/>
            New Goal
          </button>
        </div>
      </div>

      {/* Tabs - Black Border Style */}
      <div className="py-8 border-b-4 border-black flex gap-0">
        {['All', 'Open', 'Achieved', 'Archived'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 text-lg font-bold uppercase tracking-wider border-4 border-black -mr-px ${activeTab === tab
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-slate-100'}`}>
            {tab}
            <span className="ml-3 text-sm">
              {tab === 'All' ? goals.length : goals.filter((g) => g.status === tab).length}
            </span>
          </button>))}
      </div>

      {/* Goals Table */}
      <div className="bg-white border-b-4 border-black">
        <table className="w-full">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Title</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Status</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Verification</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Progress</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-black">
            {isLoading ? (<tr>
                <td colSpan={5} className="px-8 py-16 text-center text-slate-600">Loading...</td>
              </tr>) : filteredGoals.length === 0 ? (<tr>
                <td colSpan={5} className="px-8 py-16 text-center text-slate-600">No goals found</td>
              </tr>) : (filteredGoals.map((goal) => {
            const completedIssues = goal.issueIds?.filter(id => id).length || 0;
            const totalIssues = goal.issueIds?.length || 0;
            const progressPercent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
            return (<tr key={goal.id} className="hover:bg-slate-100 cursor-pointer" onClick={() => window.location.href = `/goals/${goal.id}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-black"/>
                        <span className="text-lg font-bold text-black">{goal.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 text-sm font-bold uppercase tracking-wider ${getStatusBadge(goal.status)}`}>
                        {goal.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-lg text-slate-700">{goal.verification || '-'}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-4 bg-slate-200 border-2 border-black overflow-hidden">
                          <div className="h-full bg-black" style={{ width: `${progressPercent}%` }}/>
                        </div>
                        <span className="text-lg font-bold text-black">{progressPercent}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-lg text-slate-700">
                      {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}
                    </td>
                  </tr>);
        }))}
          </tbody>
        </table>
      </div>
    </div>);
}
export default GoalsPage;