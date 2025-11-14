import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  User,
  Mail,
  Calendar,
  Shield,
  Activity,
  DollarSign,
  Users,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  Copy,
  Check
} from 'lucide-react'
import { userService } from '../../services/userService'

interface CustomerDetailModalProps {
  customer: {
    id: string
    full_name: string
    username?: string
    email: string
    role: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
    sponsored_by?: string
    is_mlm_active?: boolean
    total_earnings?: number
    referral_code?: string
    activation_date?: string
    amount?: number
  }
  onClose: () => void
  onRefresh: () => void
}

interface ReferralData {
  id: string
  full_name: string
  username: string
  email: string
  is_active: boolean
  is_mlm_active: boolean
  created_at: string
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, onClose }) => {
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [loadingReferrals, setLoadingReferrals] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferrals()
  }, [customer.id])

  const fetchReferrals = async () => {
    setLoadingReferrals(true)
    try {
      const referralData = await userService.getReferrals(customer.id)
      setReferrals(referralData || [])
    } catch (error) {
      console.error('Error fetching referrals:', error)
      setReferrals([])
    } finally {
      setLoadingReferrals(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeReferrals = referrals.filter(r => r.is_active).length
  const mlmActiveReferrals = referrals.filter(r => r.is_mlm_active).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-light-200 dark:border-dark-700"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-accent-bitcoin to-accent-orange p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{customer.full_name}</h2>
              <p className="text-white/80 text-sm sm:text-base">@{customer.username || 'N/A'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    customer.is_active
                      ? 'bg-green-500/20 text-white border border-white/30'
                      : 'bg-red-500/20 text-white border border-white/30'
                  }`}
                >
                  {customer.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {customer.is_active ? 'Active' : 'Inactive'}
                </span>
                {customer.is_mlm_active && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-white border border-white/30">
                    <Award className="w-3 h-3 mr-1" />
                    MLM Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <section>
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-accent-bitcoin" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-light-50 dark:bg-dark-800 rounded-xl p-4">
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase">Full Name</p>
                  <p className="text-sm font-medium text-dark-900 dark:text-white">{customer.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase">Username</p>
                  <p className="text-sm font-medium text-dark-900 dark:text-white">@{customer.username || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email Address
                  </p>
                  <p className="text-sm font-medium text-dark-900 dark:text-white break-all">{customer.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Account Role
                  </p>
                  <p className="text-sm font-medium text-dark-900 dark:text-white capitalize">{customer.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Account Created
                  </p>
                  <p className="text-sm font-medium text-dark-900 dark:text-white">{formatDate(customer.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last Updated
                  </p>
                  <p className="text-sm font-medium text-dark-900 dark:text-white">{formatDate(customer.updated_at)}</p>
                </div>
              </div>
            </section>

            {/* Financial Information */}
            <section>
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent-bitcoin" />
                Financial Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-dark-600 dark:text-dark-400 uppercase">Total Earnings</p>
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(customer.total_earnings || 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-dark-600 dark:text-dark-400 uppercase">Available Balance</p>
                    <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(customer.amount || 0)}
                  </p>
                </div>
              </div>
            </section>

            {/* MLM Information */}
            <section>
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent-bitcoin" />
                MLM Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-light-50 dark:bg-dark-800 rounded-xl p-4">
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase">MLM Status</p>
                  <p className={`text-sm font-medium ${customer.is_mlm_active ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {customer.is_mlm_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase">Activation Date</p>
                  <p className="text-sm font-medium text-dark-900 dark:text-white">
                    {customer.activation_date ? formatDate(customer.activation_date) : 'Not activated'}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Referral Code
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-bold text-accent-bitcoin bg-accent-bitcoin/10 px-3 py-2 rounded-lg flex-1">
                      {customer.referral_code || 'N/A'}
                    </p>
                    {customer.referral_code && (
                      <button
                        onClick={() => copyToClipboard(customer.referral_code || '')}
                        className="p-2 rounded-lg bg-light-100 dark:bg-dark-700 hover:bg-light-200 dark:hover:bg-dark-600 transition-colors"
                        title="Copy referral code"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-dark-600 dark:text-dark-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {customer.sponsored_by && (
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-dark-500 dark:text-dark-500 uppercase">Sponsored By</p>
                    <p className="text-sm font-medium text-dark-900 dark:text-white">User ID: {customer.sponsored_by}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Referrals */}
            <section>
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-bitcoin" />
                Referrals
              </h3>

              {/* Referral Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-light-50 dark:bg-dark-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold text-dark-900 dark:text-white">{referrals.length}</p>
                </div>
                <div className="bg-light-50 dark:bg-dark-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeReferrals}</p>
                </div>
                <div className="bg-light-50 dark:bg-dark-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-dark-500 dark:text-dark-500 uppercase mb-1">MLM Active</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{mlmActiveReferrals}</p>
                </div>
              </div>

              {/* Referral List */}
              <div className="bg-light-50 dark:bg-dark-800 rounded-xl p-4 max-h-64 overflow-y-auto">
                {loadingReferrals ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-bitcoin"></div>
                  </div>
                ) : referrals.length > 0 ? (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-dark-900 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-900 dark:text-white">
                              {referral.full_name}
                            </p>
                            <p className="text-xs text-dark-600 dark:text-dark-400">
                              @{referral.username} • {formatDate(referral.created_at).split(',')[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              referral.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {referral.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {referral.is_mlm_active && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                              MLM
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-dark-400 mx-auto mb-2" />
                    <p className="text-sm text-dark-600 dark:text-dark-400">No referrals yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-light-200 dark:border-dark-700 p-4 bg-light-50 dark:bg-dark-800">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-light-200 dark:bg-dark-700 hover:bg-light-300 dark:hover:bg-dark-600 transition-colors text-dark-900 dark:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CustomerDetailModal
