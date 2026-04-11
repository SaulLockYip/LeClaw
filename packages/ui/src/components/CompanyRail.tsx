import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import type { Company } from '../lib/api'
import CompanyCreateModal from './CompanyCreateModal'

interface CompanyRailProps {
  companies: Company[]
  selectedCompanyId: string | null
  onCompanySelect: (companyId: string) => void
}

function CompanyRail({ companies, selectedCompanyId, onCompanySelect }: CompanyRailProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <>
      <div className="w-[72px] bg-black flex flex-col items-center py-4 gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="relative group cursor-pointer"
            title={company.name}
            onClick={() => onCompanySelect(company.id)}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all ${
                selectedCompanyId === company.id
                  ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black'
                  : ''
              }`}
              style={{ backgroundColor: company.color }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            {company.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
            )}
          </div>
        ))}

        {/* Create Company Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-black/40 hover:text-white hover:bg-black/70 transition-all"
          title="Create Company"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <CompanyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  )
}

export default CompanyRail
