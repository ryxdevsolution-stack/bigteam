import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Calendar,
  Mail,
  Shield,
  Eye,
  ChevronDown,
  RefreshCw,
  X,
  User as UserIcon,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { userService } from '../../services/userService'
import MetricCard from '../../components/dashboard/Cards/MetricCard'
import CustomerDetailModal from '../../components/admin/CustomerDetailModal'

interface CustomerData {
  id: string
  full_name: string
  username: string
  email: string
  role: 'admin' | 'customer'
  is_active: boolean
  created_at: string
  updated_at?: string
  sponsored_by?: string
  is_mlm_active: boolean
  total_earnings: number
  referral_code: string
  activation_date?: string
  amount: number
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  totalEarnings: number
  newThisMonth: number
  mlmActiveCount: number
}

const CustomerOverview: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    totalEarnings: 0,
    newThisMonth: 0,
    mlmActiveCount: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterMLM, setFilterMLM] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, searchTerm, filterStatus, filterMLM])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await userService.getAllUsers()
      const allUsers = response.data || []

      // Filter only customers (exclude admins)
      const customerData = allUsers.filter((user: CustomerData) => user.role === 'customer')
      setCustomers(customerData)
      calculateStats(customerData)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (customerData: CustomerData[]) => {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalCustomers = customerData.length
    const activeCustomers = customerData.filter(c => c.is_active).length
    const inactiveCustomers = totalCustomers - activeCustomers
    const totalEarnings = customerData.reduce((sum, c) => sum + (c.total_earnings || 0), 0)
    const newThisMonth = customerData.filter(c => {
      const createdDate = new Date(c.created_at)
      return createdDate >= firstDayOfMonth
    }).length
    const mlmActiveCount = customerData.filter(c => c.is_mlm_active).length

    setStats({
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalEarnings,
      newThisMonth,
      mlmActiveCount
    })
  }

  const applyFilters = () => {
    let filtered = [...customers]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer =>
        filterStatus === 'active' ? customer.is_active : !customer.is_active
      )
    }

    // Apply MLM filter
    if (filterMLM !== 'all') {
      filtered = filtered.filter(customer =>
        filterMLM === 'active' ? customer.is_mlm_active : !customer.is_mlm_active
      )
    }

    setFilteredCustomers(filtered)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleViewCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  const handleExportData = () => {
    // Convert customers to CSV
    const headers = ['ID', 'Name', 'Email', 'Username', 'Status', 'MLM Active', 'Total Earnings', 'Referral Code', 'Created Date']
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(c => [
        c.id,
        `"${c.full_name}"`,
        c.email,
        c.username,
        c.is_active ? 'Active' : 'Inactive',
        c.is_mlm_active ? 'Yes' : 'No',
        c.total_earnings || 0,
        c.referral_code || '',
        formatDate(c.created_at)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-light-200 dark:border-dark-700"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-accent-bitcoin to-accent-orange bg-clip-text text-transparent">
              Customer Overview
            </h1>
            <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
              Complete view of all customer accounts and their details
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-light-100 dark:bg-dark-800 hover:bg-light-200 dark:hover:bg-dark-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin" />}
          trend="neutral"
          delay={0}
        />
        <MetricCard
          title="Active Customers"
          value={stats.activeCustomers}
          icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
          trend="up"
          delay={0.1}
        />
        <MetricCard
          title="Inactive Customers"
          value={stats.inactiveCustomers}
          icon={<Activity className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />}
          trend="down"
          delay={0.2}
        />
        <MetricCard
          title="Total Earnings"
          value={stats.totalEarnings}
          prefix="$"
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin" />}
          trend="up"
          delay={0.3}
        />
        <MetricCard
          title="New This Month"
          value={stats.newThisMonth}
          icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
          trend="up"
          delay={0.4}
        />
        <MetricCard
          title="MLM Active"
          value={stats.mlmActiveCount}
          icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
          trend="neutral"
          delay={0.5}
        />
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-dark-900 rounded-2xl p-4 shadow-lg border border-light-200 dark:border-dark-700"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder="Search by name, email, username, or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
            />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full pl-10 pr-8 py-2 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-accent-bitcoin cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
          </div>

          {/* MLM Filter */}
          <div className="relative min-w-[160px]">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <select
              value={filterMLM}
              onChange={(e) => setFilterMLM(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full pl-10 pr-8 py-2 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-accent-bitcoin cursor-pointer"
            >
              <option value="all">MLM Status</option>
              <option value="active">MLM Active</option>
              <option value="inactive">MLM Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-dark-900 rounded-2xl shadow-lg border border-light-200 dark:border-dark-700 overflow-hidden"
      >
        {/* Table Header */}
        <div className="p-4 border-b border-light-200 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
            Customer List
          </h3>
          <p className="text-sm text-dark-600 dark:text-dark-400">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>

        {loading && customers.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-bitcoin mb-4"></div>
            <p className="text-dark-600 dark:text-dark-400">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Users className="w-16 h-16 text-dark-400 mb-4" />
            <h3 className="text-lg font-semibold text-dark-700 dark:text-dark-300 mb-2">
              No customers found
            </h3>
            <p className="text-sm text-dark-600 dark:text-dark-400">
              {searchTerm || filterStatus !== 'all' || filterMLM !== 'all'
                ? 'Try adjusting your filters'
                : 'No customers have been registered yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-50 dark:bg-dark-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                      MLM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-dark-700 dark:text-dark-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-200 dark:divide-dark-700">
                  {filteredCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-light-50 dark:hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-dark-900 dark:text-white">
                              {customer.full_name}
                            </p>
                            <p className="text-sm text-dark-600 dark:text-dark-400">
                              @{customer.username || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-dark-500" />
                            <span className="text-sm text-dark-700 dark:text-dark-300">
                              {customer.email}
                            </span>
                          </div>
                          {customer.referral_code && (
                            <span className="text-xs text-dark-500 dark:text-dark-500">
                              Code: {customer.referral_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            customer.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {customer.is_active ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            customer.is_mlm_active
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {customer.is_mlm_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-dark-900 dark:text-white">
                            {formatCurrency(customer.total_earnings || 0)}
                          </span>
                          <span className="text-xs text-dark-500 dark:text-dark-500">
                            Balance: {formatCurrency(customer.amount || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-dark-600 dark:text-dark-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(customer.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-700 transition-colors group"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-dark-600 dark:text-dark-400 group-hover:text-accent-bitcoin" />
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
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-light-50 dark:bg-dark-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-dark-900 dark:text-white">
                          {customer.full_name}
                        </p>
                        <p className="text-sm text-dark-600 dark:text-dark-400">
                          @{customer.username || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600 dark:text-dark-400">Email:</span>
                      <span className="text-sm text-dark-800 dark:text-dark-200">{customer.email}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600 dark:text-dark-400">Status:</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          customer.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600 dark:text-dark-400">MLM:</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          customer.is_mlm_active
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {customer.is_mlm_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600 dark:text-dark-400">Earnings:</span>
                      <span className="text-sm font-medium text-dark-800 dark:text-dark-200">
                        {formatCurrency(customer.total_earnings || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600 dark:text-dark-400">Joined:</span>
                      <span className="text-sm text-dark-800 dark:text-dark-200">
                        {formatDate(customer.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-light-200 dark:border-dark-700">
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="w-full px-4 py-2 text-sm bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      View Full Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedCustomer(null)
            }}
            onRefresh={fetchCustomers}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomerOverview
