import { useState, useEffect } from 'react'
import { X, Copy, Check, UserPlus, AlertCircle } from 'lucide-react'
import { agentInviteApi, agentApi, openclawAgentsApi, type OpenClawAgent, type AgentInvite } from '../lib/api'
import type { Department } from '../lib/api'

interface AgentInviteModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  departments: Department[]
}

export interface InviteResult {
  inviteKey: string
  expiresAt: string
  prompt: string
}

function AgentInviteModal({ isOpen, onClose, companyId, departments }: AgentInviteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    role: 'Staff' as 'CEO' | 'Manager' | 'Staff',
    departmentId: '',
    openClawAgentId: '',
    openClawAgentWorkspace: '',
    openClawAgentDir: '',
  })
  const [openClawAgents, setOpenClawAgents] = useState<OpenClawAgent[]>([])
  const [usedOpenClawAgentIds, setUsedOpenClawAgentIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch OpenClaw agents, onboarded agents, and pending invites when modal opens
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        openclawAgentsApi.list(),
        agentApi.listByCompany(companyId),
        agentInviteApi.list(companyId),
      ])
        .then(([{ agents }, onboardedAgents, pendingInvites]) => {
          setOpenClawAgents(agents)

          // Compute set of used OpenClaw agent IDs
          const usedIds = new Set<string>()

          // Add onboarded agents' openClawAgentIds
          onboardedAgents
            .filter(a => a.openClawAgentId)
            .forEach(a => usedIds.add(a.openClawAgentId))

          // Add pending invites' openClawAgentIds
          pendingInvites
            .filter(i => i.status === 'pending' && i.openClawAgentId)
            .forEach(i => usedIds.add(i.openClawAgentId))

          setUsedOpenClawAgentIds(usedIds)
        })
        .catch(() => {
          setOpenClawAgents([])
          setUsedOpenClawAgentIds(new Set())
        })
    }
  }, [isOpen, companyId])

  const handleOpenClawAgentChange = (agentId: string) => {
    const agent = openClawAgents.find(a => a.id === agentId)
    setFormData(prev => ({
      ...prev,
      openClawAgentId: agentId,
      openClawAgentWorkspace: agent?.workspace || '',
      openClawAgentDir: agent?.workspace || '',
    }))
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.title.trim() || !formData.openClawAgentId) {
      setError('Please fill in all required fields and select an OpenClaw agent.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const result = await agentInviteApi.create(companyId, {
        name: formData.name.trim(),
        title: formData.title.trim(),
        role: formData.role,
        departmentId: formData.role === 'CEO' ? undefined : formData.departmentId || undefined,
        openClawAgentId: formData.openClawAgentId || undefined,
        openClawAgentWorkspace: formData.openClawAgentWorkspace || undefined,
        openClawAgentDir: formData.openClawAgentDir || undefined,
      })
      setInviteResult(result)
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to create invite'

      // Make "already has a CEO" error more user-friendly
      if (errorMessage.includes("already has a CEO")) {
        errorMessage = 'This company already has a CEO. Please select a different role or company.'
      }

      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (inviteResult?.prompt) {
      await navigator.clipboard.writeText(inviteResult.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setInviteResult(null)
    setFormData({ name: '', title: '', role: 'Staff', departmentId: '', openClawAgentId: '', openClawAgentWorkspace: '', openClawAgentDir: '' })
    setError(null)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Result view - show invite key and prompt
  if (inviteResult) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Invite Created
            </h2>
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Result Content */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Share the following command with the agent to onboard them:
            </p>

            {/* Invite Key - Large, centered display */}
            <div className="text-center py-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300">
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                Invite Key
              </label>
              <div className="font-mono text-3xl font-bold text-slate-800 tracking-widest">
                {inviteResult.inviteKey}
              </div>
            </div>

            {/* Onboard Command */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                Onboard Command
              </label>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-slate-900 text-slate-100 rounded font-mono text-sm break-all">
                  {inviteResult.prompt}
                </code>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                  title="Copy command"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-300" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Expiry */}
            <p className="text-xs text-slate-500">
              This invite expires at: {new Date(inviteResult.expiresAt).toLocaleString()}
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form view
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Invite Agent
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="agent-name" className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="agent-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter agent name"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="agent-title" className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="agent-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Engineer, Product Manager"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="agent-role" className="block text-sm font-medium text-slate-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="agent-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'CEO' | 'Manager' | 'Staff' })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="Staff">Staff</option>
              <option value="Manager">Manager</option>
              <option value="CEO">CEO</option>
            </select>
          </div>

          {formData.role !== 'CEO' && (
            <div>
              <label htmlFor="agent-department" className="block text-sm font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                id="agent-department"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="">No department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="openclaw-agent" className="block text-sm font-medium text-slate-700 mb-1">
              OpenClaw Agent <span className="text-red-500">*</span>
            </label>
            <select
              id="openclaw-agent"
              value={formData.openClawAgentId}
              onChange={(e) => handleOpenClawAgentChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select an agent</option>
              {openClawAgents
                .filter(agent => !usedOpenClawAgentIds.has(agent.id))
                .map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name || agent.id} - {agent.workspace}
                  </option>
                ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || !formData.title.trim() || !formData.openClawAgentId || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AgentInviteModal