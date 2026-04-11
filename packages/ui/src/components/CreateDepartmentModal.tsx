import { useState } from 'react'
import { X, Building2, AlertCircle, Check } from 'lucide-react'
import { departmentApi } from '../lib/api'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  companyId: string
}

function CreateDepartmentModal({ isOpen, onClose, onSuccess, companyId }: CreateDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Department name is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await departmentApi.create(companyId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      })
      // Reset form and close
      setFormData({ name: '', description: '' })
      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', description: '' })
    setError(null)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h2 className="text-lg font-semibold text-black flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            New Department
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-black/40 hover:text-black/60 rounded transition-colors"
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
            <label htmlFor="dept-name" className="block text-sm font-medium text-black/70 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="dept-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter department name"
              className="w-full px-3 py-2 bg-white border border-black/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="dept-description" className="block text-sm font-medium text-black/70 mb-1">
              Description
            </label>
            <textarea
              id="dept-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional department description"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-black/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-black/60 hover:text-black transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Department
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateDepartmentModal
