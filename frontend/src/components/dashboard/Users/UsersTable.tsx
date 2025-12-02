import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Users
} from 'lucide-react'
import { User } from '../../../types/user'
import { userService } from '../../../services/userService'
import EditUserModal from './EditUserModal'
import DeleteConfirmModal from './DeleteConfirmModal'

interface UsersTableProps {
  users: User[]
  loading: boolean
  onRefresh: () => void
}

const UsersTable: React.FC<UsersTableProps> = ({ users, loading, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'customer':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleSave = async (userId: string, data: Partial<User>) => {
    await userService.updateUser(userId, data)
    await onRefresh()
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      await userService.deleteUser(userToDelete.id)
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
      await onRefresh()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    }
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setSelectedUser(null)
  }

  if (loading && users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-dark-900 rounded-2xl p-12 shadow-lg border border-light-200 dark:border-dark-700"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-bitcoin"></div>
          <p className="text-dark-600 dark:text-dark-400">Loading users...</p>
        </div>
      </motion.div>
    )
  }

  if (users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-900 rounded-2xl p-12 shadow-lg border border-light-200 dark:border-dark-700"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Users className="w-16 h-16 text-dark-400" />
          <h3 className="text-lg font-semibold text-dark-700 dark:text-dark-300">No users found</h3>
          <p className="text-sm text-dark-600 dark:text-dark-400">
            Create your first user to get started
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-dark-900 rounded-2xl shadow-lg border border-light-200 dark:border-dark-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-light-200 dark:border-dark-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Users List</h3>
          <p className="text-sm text-dark-600 dark:text-dark-400">
            Total: {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-dark-600 dark:text-dark-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-light-50 dark:bg-dark-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-2 sm:px-4 md:px-6 py-3 text-center text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-200 dark:divide-dark-700">
            {users.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-light-50 dark:hover:bg-dark-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-dark-900 dark:text-white">{user.full_name}</p>
                      <p className="text-sm text-dark-600 dark:text-dark-400">@{user.username || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-dark-500" />
                    <span className="text-sm text-dark-700 dark:text-dark-300">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-dark-900 dark:text-white">
                      🪙{(user.amount || 0).toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    user.is_active !== false
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-sm text-dark-600 dark:text-dark-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-4">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(user)
                      }}
                      className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group cursor-pointer"
                      title="Edit User"
                      aria-label="Edit User"
                      disabled={isDeleting}
                    >
                      <Edit className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(user)
                      }}
                      className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group cursor-pointer disabled:opacity-50"
                      title="Delete User"
                      aria-label="Delete User"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden p-4 space-y-4">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-light-50 dark:bg-dark-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-dark-900 dark:text-white">{user.full_name}</p>
                  <p className="text-sm text-dark-600 dark:text-dark-400">@{user.username || 'N/A'}</p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-light-200 dark:hover:bg-dark-700 transition-colors">
                <MoreVertical className="w-5 h-5 text-dark-600 dark:text-dark-400" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-600 dark:text-dark-400">Email:</span>
                <span className="text-sm text-dark-800 dark:text-dark-200">{user.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-600 dark:text-dark-400">Role:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-600 dark:text-dark-400">Amount:</span>
                <span className="text-sm font-semibold text-dark-900 dark:text-white">
                  🪙{(user.amount || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-600 dark:text-dark-400">Status:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  user.is_active !== false
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {user.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-600 dark:text-dark-400">Joined:</span>
                <span className="text-sm text-dark-800 dark:text-dark-200">{formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-light-200 dark:border-dark-700">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(user)
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 active:bg-blue-500/30 transition-all font-medium cursor-pointer disabled:opacity-50"
                  aria-label="Edit User"
                  disabled={isDeleting}
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden xs:inline">Edit</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(user)
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 transition-all font-medium cursor-pointer disabled:opacity-50"
                  aria-label="Delete User"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden xs:inline">Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        user={userToDelete}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </motion.div>
  )
}

export default UsersTable