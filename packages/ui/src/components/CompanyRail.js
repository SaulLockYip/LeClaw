import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import CompanyCreateModal from './CompanyCreateModal';
function CompanyRail({ companies, selectedCompanyId, onCompanySelect }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    return (<>
      <div className="w-[64px] bg-black border-r border-white/10 flex flex-col items-center py-6 gap-3">
        {companies.map((company) => (<div key={company.id} className="relative cursor-pointer" title={company.name} onClick={() => onCompanySelect(company.id)}>
            <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-colors ${selectedCompanyId === company.id
                ? 'bg-white text-black'
                : 'bg-black text-white border border-white/30 hover:border-white hover:bg-white hover:text-black'}`}>
              <Building2 className="w-5 h-5"/>
            </div>
            {/* Online indicator: small white square */}
            {company.online && (<div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-white border border-black"></div>)}
          </div>))}

        {/* Create Company Button */}
        <button onClick={() => setIsCreateModalOpen(true)} className="w-10 h-10 flex items-center justify-center text-white/40 border border-white/20 hover:border-white hover:text-white hover:bg-white hover:text-black transition-colors" title="Create Company">
          <Plus className="w-5 h-5"/>
        </button>
      </div>

      <CompanyCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}/>
    </>);
}
export default CompanyRail;
//# sourceMappingURL=CompanyRail.js.map