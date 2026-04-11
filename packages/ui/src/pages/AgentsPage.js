import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Crown, User, Building2, UserPlus } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import AgentInviteModal from '../components/AgentInviteModal';
function AgentsPage() {
    const { selectedCompany, agents, departments, isLoading, currentAgent } = useCompany();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const canInviteAgent = currentAgent?.role === 'CEO' || currentAgent?.role === 'Manager';
    if (!selectedCompany) {
        return (<div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Select a company to view agents</p>
      </div>);
    }
    // Group agents by department
    const ceos = agents.filter((a) => a.role === 'CEO');
    const managers = agents.filter((a) => a.role === 'Manager');
    const staff = agents.filter((a) => a.role === 'Staff');
    return (<div className="space-y-0">
      {/* Page Header - Oversized Serif */}
      <div className="py-16 border-b-4 border-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-6xl font-bold tracking-tight text-black">Agents</h1>
            <p className="text-lg mt-4 text-slate-600">{selectedCompany.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {canInviteAgent && (<button onClick={() => setShowInviteModal(true)} className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5"/>
                Invite Agent
              </button>)}
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (<div className="text-center py-24 text-slate-600">Loading...</div>) : agents.length === 0 ? (<div className="text-center py-24 text-slate-600">No agents found</div>) : (<div className="space-y-0">
          {/* CEOs - Inverted Section */}
          {ceos.length > 0 && (<div className="border-b-4 border-black">
              <div className="bg-black px-8 py-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-3">
                  <Crown className="w-6 h-6 text-white"/>
                  CEO ({ceos.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 divide-x-4 divide-black border-x-4 border-black">
                {ceos.map((agent) => (<AgentCard key={agent.id} agent={agent} department={null} isInverted={true}/>))}
              </div>
            </div>)}

          {/* Managers */}
          {managers.length > 0 && (<div className="border-b-4 border-black">
              <div className="bg-white px-8 py-6 border-b-4 border-black">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black flex items-center gap-3">
                  <Crown className="w-6 h-6 text-black"/>
                  Managers ({managers.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 divide-x-4 divide-black border-x-4 border-black bg-white">
                {managers.map((agent) => (<AgentCard key={agent.id} agent={agent} department={departments.find((d) => d.id === agent.departmentId) || null} isInverted={false}/>))}
              </div>
            </div>)}

          {/* Staff - Inverted Section */}
          {staff.length > 0 && (<div className="border-b-4 border-black">
              <div className="bg-black px-8 py-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-3">
                  <User className="w-6 h-6 text-white"/>
                  Staff ({staff.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 divide-x-4 divide-black border-x-4 border-black">
                {staff.map((agent) => (<AgentCard key={agent.id} agent={agent} department={departments.find((d) => d.id === agent.departmentId) || null} isInverted={true}/>))}
              </div>
            </div>)}
        </div>)}

      {/* Invite Agent Modal */}
      {selectedCompany && (<AgentInviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} companyId={selectedCompany.id} departments={departments} currentAgent={currentAgent}/>)}
    </div>);
}
function AgentCard({ agent, department, isInverted }) {
    const textClass = isInverted ? 'text-white' : 'text-black';
    const subtextClass = isInverted ? 'text-slate-400' : 'text-slate-600';
    const borderClass = isInverted ? 'border-white' : 'border-black';
    return (<Link to={`/agents/${agent.id}`} className={`p-8 hover:${isInverted ? 'bg-slate-900' : 'bg-slate-100'} transition-colors border-4 ${borderClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 border-4 ${borderClass} flex items-center justify-center text-2xl font-bold ${textClass}`}>
            {agent.name.charAt(0)}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
              {agent.name}
            </h3>
            {agent.title && (<p className={`text-base ${subtextClass}`}>{agent.title}</p>)}
            <p className={`text-sm ${subtextClass} flex items-center gap-1 mt-1`}>
              {agent.role}
            </p>
          </div>
        </div>
        <ChevronRight className={`w-6 h-6 ${subtextClass}`}/>
      </div>

      {department && (<div className={`flex items-center gap-2 mt-6 pt-6 border-t-4 ${borderClass}`}>
          <Building2 className={`w-5 h-5 ${subtextClass}`}/>
          <span className={`text-base ${subtextClass}`}>{department.name}</span>
        </div>)}

      <div className="flex items-center gap-3 mt-6">
        <div className={`w-4 h-4 border-2 ${borderClass} ${agent.status === 'online' ? 'bg-white' : agent.status === 'busy' ? 'bg-yellow-400' : 'bg-slate-600'}`}></div>
        <span className={`text-sm font-bold uppercase tracking-wider ${subtextClass}`}>
          {agent.status || 'offline'}
        </span>
      </div>
    </Link>);
}
export default AgentsPage;