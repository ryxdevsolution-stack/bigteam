import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  DollarSign,
  Save,
  Loader
} from 'lucide-react'
import { User } from '../../../types/user'

interface EditUserModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, data: Partial<User>) => Promise<void>
  loading?: boolean
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    username: user.username || '',
    role: user.role,
    amount: user.amount || 0,
    is_active: user.is_active !== false
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        username: user.username || '',
        role: user.role,
        amount: user.amount || 0,
        is_active: user.is_active !== false
      })
      setError(null)
    }
  }, [isOpen, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      is_active: e.target.checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await onSave(user.id, formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-light-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-dark-900 border-b border-light-200 dark:border-dark-700 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                Edit User
              </h2>
              <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
                Update user information and settings
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 transition-colors"
              disabled={saving}
            >
              <X className="w-5 h-5 text-dark-600 dark:text-dark-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Role *
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin appearance-none cursor-pointer"
                    disabled={saving}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Account Balance
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    disabled={saving}
                    className="w-5 h-5 rounded border-light-300 dark:border-dark-600 text-accent-bitcoin focus:ring-2 focus:ring-accent-bitcoin cursor-pointer"
                  />
                  <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                    Active Account
                  </span>
                </label>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 bg-light-50 dark:bg-dark-800 rounded-lg space-y-2">
              <p className="text-xs text-dark-600 dark:text-dark-400">
                <span className="font-semibold">User ID:</span> {user.id}
              </p>
              {user.created_at && (
                <p className="text-xs text-dark-600 dark:text-dark-400">
                  <span className="font-semibold">Created:</span>{' '}
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white py-3 px-6 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 sm:flex-none bg-light-200 dark:bg-dark-800 text-dark-700 dark:text-dark-300 py-3 px-6 rounded-lg font-medium hover:bg-light-300 dark:hover:bg-dark-700 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default EditUserModal
