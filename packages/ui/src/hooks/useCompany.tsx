import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Company, Department, Agent } from '../lib/api'
import { companyApi, departmentApi, agentApi } from '../lib/api'
import { useSSE, type SSEEvent } from './useSSE'

interface CompanyContextValue {
  companies: Company[]
  selectedCompanyId: string | null
  selectedCompany: Company | null
  departments: Department[]
  agents: Agent[]
  currentAgent: Agent | null
  selectCompany: (companyId: string) => void
  isLoading: boolean
  error: Error | null
}

const CompanyContext = createContext<CompanyContextValue | null>(null)

export function useCompany(): CompanyContextValue {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

interface CompanyProviderProps {
  children: ReactNode
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null

  // Load companies on mount
  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await companyApi.list()
        setCompanies(data)
        if (data.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(data[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load companies'))
      } finally {
        setIsLoading(false)
      }
    }
    loadCompanies()
  }, [])

  // Load departments and agents when company changes
  useEffect(() => {
    if (!selectedCompanyId) return

    async function loadCompanyData() {
      setIsLoading(true)
      try {
        const [depts, agts] = await Promise.all([
          departmentApi.listByCompany(selectedCompanyId),
          agentApi.listByCompany(selectedCompanyId),
        ])
        setDepartments(depts)
        setAgents(agts)
        // Set currentAgent to the first CEO if exists, otherwise first Manager, otherwise first Staff
        const ceo = agts.find((a) => a.role === 'CEO')
        const manager = agts.find((a) => a.role === 'Manager')
        const staff = agts[0]
        setCurrentAgent(ceo || manager || staff || null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load company data'))
      } finally {
        setIsLoading(false)
      }
    }
    loadCompanyData()
  }, [selectedCompanyId])

  // Handle SSE events for real-time updates
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'agent_status_changed': {
        const { agentId, status } = event.payload as { agentId: string; status: string }
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === agentId
              ? { ...agent, status: status as Agent['status'] }
              : agent
          )
        )
        break
      }
      case 'agent_created':
      case 'agent_updated': {
        if (selectedCompanyId) {
          agentApi.listByCompany(selectedCompanyId).then(setAgents).catch(console.error)
        }
        break
      }
      case 'issue_created':
      case 'issue_updated': {
        // Refresh issues - would need issueApi and state
        break
      }
      case 'department_created':
      case 'department_updated':
      case 'department_deleted': {
        if (selectedCompanyId) {
          departmentApi.listByCompany(selectedCompanyId).then(setDepartments).catch(console.error)
        }
        break
      }
      case 'company_created':
      case 'company_updated':
      case 'company_deleted': {
        companyApi.list().then(setCompanies).catch(console.error)
        break
      }
      case 'goal_updated':
      case 'project_updated':
      case 'approval_updated': {
        // Refresh related data - would need respective APIs and state
        break
      }
    }
  }, [selectedCompanyId])

  // SSE connection for real-time updates
  useSSE({
    companyId: selectedCompanyId || '',
    onEvent: handleSSEEvent,
    onError: (err) => console.error('SSE error:', err),
  })

  const selectCompany = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId)
  }, [])

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompanyId,
        selectedCompany,
        departments,
        agents,
        currentAgent,
        selectCompany,
        isLoading,
        error,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}
