import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Percent,
  IndianRupee,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import packageService, {
  Package as PackageType,
  CreatePackageData,
  UpdatePackageData
} from '../../services/packageService'

const PackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<PackageType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreatePackageData>({
    name: '',
    amount: 0,
    commission_percentage: 0,
    description: ''
  })

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await packageService.getAllPackages(false)
      setPackages(data)
    } catch {
      setError('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      commission_percentage: 0,
      description: ''
    })
    setEditingPackage(null)
  }

  const handleOpenModal = (pkg?: PackageType) => {
    if (pkg) {
      setEditingPackage(pkg)
      setFormData({
        name: pkg.name,
        amount: pkg.amount,
        commission_percentage: pkg.commission_percentage,
        description: pkg.description || ''
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingPackage) {
        const updateData: UpdatePackageData = {
          name: formData.name,
          amount: formData.amount,
          commission_percentage: formData.commission_percentage,
          description: formData.description
        }
        const result = await packageService.updatePackage(editingPackage.id, updateData)
        setPackages(prev =>
          prev.map(p => (p.id === editingPackage.id ? result : p))
        )
      } else {
        const result = await packageService.createPackage(formData)
        setPackages(prev => [...prev, result].sort((a, b) => a.amount - b.amount))
      }
      handleCloseModal()
    } catch {
      setError('Failed to save package')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (packageId: string) => {
    try {
      await packageService.deletePackage(packageId)
      setPackages(prev => prev.filter(p => p.id !== packageId))
      setDeleteConfirm(null)
    } catch {
      setError('Failed to delete package')
    }
  }

  const handleToggleActive = async (pkg: PackageType) => {
    try {
      const result = await packageService.togglePackageStatus(pkg.id)
      setPackages(prev =>
        prev.map(p => (p.id === pkg.id ? result : p))
      )
    } catch {
      setError('Failed to update package status')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Stats
  const stats = {
    total: packages.length,
    active: packages.filter(p => p.is_active).length,
    inactive: packages.filter(p => !p.is_active).length,
    avgCommission: packages.length > 0
      ? (packages.reduce((sum, p) => sum + p.commission_percentage, 0) / packages.length).toFixed(1)
      : '0'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
              Package Management
            </h1>
            <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300 mt-1">
              Create and manage activation packages with custom commission rates
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-bitcoin to-accent-orange hover:from-accent-orange hover:to-accent-bitcoin text-white font-medium rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Package</span>
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Packages', value: stats.total, icon: Package, color: 'blue' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'green' },
          { label: 'Inactive', value: stats.inactive, icon: ToggleLeft, color: 'gray' },
          { label: 'Avg Commission', value: `${stats.avgCommission}%`, icon: Percent, color: 'orange' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Packages List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent-orange" />
        </div>
      ) : packages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-orange/20 flex items-center justify-center">
            <Package className="w-8 h-8 text-accent-orange" />
          </div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
            No Packages Created
          </h3>
          <p className="text-dark-500 dark:text-dark-400 mb-4">
            Create your first activation package to define commission rates.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg ${
                !pkg.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  pkg.is_active
                    ? 'bg-gradient-to-br from-accent-bitcoin/20 to-accent-orange/20'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Package className={`w-6 h-6 ${
                    pkg.is_active
                      ? 'text-accent-orange'
                      : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex items-center gap-1">
                  {!pkg.is_active && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-1">
                {pkg.name}
              </h3>

              {pkg.description && (
                <p className="text-sm text-dark-600 dark:text-dark-300 mb-4 line-clamp-2">
                  {pkg.description}
                </p>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-accent-bitcoin" />
                  <span className="text-xl font-bold text-dark-900 dark:text-white">
                    {formatCurrency(pkg.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Percent className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {pkg.commission_percentage}%
                  </span>
                </div>
              </div>

              <div className="text-xs text-dark-500 dark:text-dark-400 mb-4">
                Commission: {formatCurrency(pkg.amount * pkg.commission_percentage / 100)} per activation
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-light-200 dark:border-dark-700">
                <button
                  onClick={() => handleOpenModal(pkg)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-dark-600 dark:text-dark-300 hover:bg-light-100 dark:hover:bg-dark-700 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(pkg)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    pkg.is_active
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {pkg.is_active ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Inactive
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(pkg.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Delete Confirmation */}
              <AnimatePresence>
                {deleteConfirm === pkg.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-light-200 dark:border-dark-700"
                  >
                    <p className="text-sm text-dark-600 dark:text-dark-300 mb-3">
                      Delete this package? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                  {editingPackage ? 'Edit Package' : 'Add New Package'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-light-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                    placeholder="Gold Package"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Amount (INR) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="number"
                      required
                      min={1}
                      step={1}
                      value={formData.amount || ''}
                      onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Commission Percentage *
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      step={0.1}
                      value={formData.commission_percentage || ''}
                      onChange={e => setFormData(prev => ({ ...prev, commission_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                  <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                    Enter percentage value (e.g., 15 for 15%)
                  </p>
                </div>

                {/* Commission Preview */}
                {formData.amount > 0 && formData.commission_percentage > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Commission per activation: <strong>{formatCurrency(formData.amount * formData.commission_percentage / 100)}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-accent-orange focus:border-transparent resize-none"
                    placeholder="Brief description of the package..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-dark-700 text-dark-700 dark:text-dark-300 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-bitcoin to-accent-orange hover:from-accent-orange hover:to-accent-bitcoin disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingPackage ? (
                      'Update Package'
                    ) : (
                      'Create Package'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PackageManagement
