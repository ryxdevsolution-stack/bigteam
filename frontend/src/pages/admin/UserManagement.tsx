import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Search, Filter, ChevronDown } from 'lucide-react'
import { userService, CreateUserPayload } from '../../services/userService'
import { User } from '../../types/user'
import CreateUserForm from '../../components/dashboard/Users/CreateUserForm'
import UsersTable from '../../components/dashboard/Users/UsersTable'

type TabType = 'create' | 'view'

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('view')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'customer'>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await userService.getAllUsers()
      setUsers(response.data || [])
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (userData: CreateUserPayload) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await userService.createUser(userData)
      setSuccess(`User "${userData.full_name}" created successfully!`)

      // Switch to view tab and refresh users list
      setActiveTab('view')
      await fetchUsers()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

      return response
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create user'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })

  const tabAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-lg border border-light-200 dark:border-dark-700"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent-bitcoin to-accent-orange bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
              Create and manage platform users
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'view'
                  ? 'bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white shadow-lg'
                  : 'bg-light-100 dark:bg-dark-800 hover:bg-light-200 dark:hover:bg-dark-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">View Users</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white shadow-lg'
                  : 'bg-light-100 dark:bg-dark-800 hover:bg-light-200 dark:hover:bg-dark-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Create User</span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg"
          >
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg"
          >
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={tabAnimation}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'view' ? (
          <div className="space-y-4">
            {/* Search and Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-900 rounded-2xl p-4 shadow-lg border border-light-200 dark:border-dark-700"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
                  />
                </div>

                <div className="relative min-w-[150px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as 'all' | 'customer')}
                    className="w-full pl-10 pr-8 py-2 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-accent-bitcoin cursor-pointer"
                  >
                    <option value="all">All Users</option>
                    <option value="customer">Customer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
                </div>
              </div>
            </motion.div>

            {/* Users Table */}
            <UsersTable
              users={filteredUsers}
              loading={loading}
              onRefresh={fetchUsers}
            />
          </div>
        ) : (
          <CreateUserForm
            onSubmit={handleCreateUser}
            loading={loading}
            error={error}
            onClearError={() => setError(null)}
          />
        )}
      </motion.div>
    </div>
  )
}

export default UserManagement