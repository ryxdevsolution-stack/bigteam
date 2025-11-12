import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { User } from '../../../types/user'

interface DeleteConfirmModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false
}) => {
  if (!isOpen || !user) return null

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
          className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-light-200 dark:border-dark-700"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-light-200 dark:border-dark-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                  Delete User
                </h2>
                <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-dark-600 dark:text-dark-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-dark-700 dark:text-dark-300 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-dark-900 dark:text-white">
                {user.full_name}
              </span>
              ?
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-600 dark:text-dark-400">Email:</span>
                  <span className="text-dark-900 dark:text-white font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600 dark:text-dark-400">Username:</span>
                  <span className="text-dark-900 dark:text-white font-medium">@{user.username || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600 dark:text-dark-400">Role:</span>
                  <span className="text-dark-900 dark:text-white font-medium capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 bg-light-200 dark:bg-dark-800 text-dark-700 dark:text-dark-300 py-3 px-6 rounded-lg font-medium hover:bg-light-300 dark:hover:bg-dark-700 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default DeleteConfirmModal
