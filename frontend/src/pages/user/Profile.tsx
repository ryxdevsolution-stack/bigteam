import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Award,
  Check,
  TrendingUp,
  Wallet,
  Clock,
  Shield,
  ChevronRight,
  Target,
  Activity,
  LogOut
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import authService from '../../services/authService';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile: profile,
    userProfileLoading: loading,
    fetchUserProfile,
    dashboardStats,
    dashboardStatsLoading,
    fetchDashboardStats
  } = useData();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    }
  };

  useEffect(() => {
    if (user.id) {
      fetchUserProfile(user.id);
      fetchDashboardStats(user.id);
    }
  }, [user.id, fetchUserProfile, fetchDashboardStats]);

  if (loading || dashboardStatsLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
          <p className="text-dark-600 dark:text-dark-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isActiveMember = dashboardStats?.is_active_member || profile?.is_active_member;
  const commissionCount = dashboardStats?.commission_received_count || profile?.commission_received_count || 0;
  const totalEarnings = dashboardStats?.total_earnings || profile?.total_earnings || 0;
  const availableBalance = dashboardStats?.available_balance || profile?.available_balance || 0;
  const pendingBalance = dashboardStats?.pending_balance || profile?.pending_balance || 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-accent-bitcoin via-accent-orange to-accent-gold rounded-2xl p-4 sm:p-6 shadow-lg text-white relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
          <p className="text-white/80 text-sm sm:text-base mt-1">View your account and progress</p>
        </div>
      </motion.div>

      {/* Main Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Profile Header */}
        <div className="p-4 sm:p-6 border-b border-light-200 dark:border-dark-600">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center shadow-xl">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              {/* Status Badge */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-dark-800 flex items-center justify-center ${
                isActiveMember ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                {isActiveMember ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <Clock className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-dark-500 dark:text-dark-400 flex items-center gap-1 mt-1">
                @{profile?.username}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-bitcoin/10 text-accent-bitcoin rounded-full text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  {profile?.role === 'admin' ? 'Administrator' : 'Member'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isActiveMember
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                }`}>
                  <Activity className="w-3 h-3" />
                  {isActiveMember ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Email */}
            <div className="p-4 bg-light-50 dark:bg-dark-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white truncate mt-0.5">
                    {profile?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="p-4 bg-light-50 dark:bg-dark-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white mt-0.5">
                    {profile?.activation_date
                      ? new Date(profile.activation_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not activated yet'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Commission Progress */}
            <div className="p-4 bg-light-50 dark:bg-dark-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Commission Progress</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-light-200 dark:bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((commissionCount / 2) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-dark-900 dark:text-white">{commissionCount}/2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Total Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-4 sm:p-5 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <ChevronRight className="w-5 h-5 text-dark-300 dark:text-dark-500" />
          </div>
          <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 font-medium">Total Earnings</p>
          <p className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white mt-1">
            ₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-4 sm:p-5 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <ChevronRight className="w-5 h-5 text-dark-300 dark:text-dark-500" />
          </div>
          <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 font-medium">Available Balance</p>
          <p className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white mt-1">
            ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Pending Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-4 sm:p-5 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <ChevronRight className="w-5 h-5 text-dark-300 dark:text-dark-500" />
          </div>
          <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 font-medium">Pending Balance</p>
          <p className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white mt-1">
            ₹{pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      {/* Recent Commissions */}
      {dashboardStats?.recent_commissions && dashboardStats.recent_commissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-light-200 dark:border-dark-600">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-accent-bitcoin" />
              Recent Commissions
            </h3>
          </div>
          <div className="divide-y divide-light-200 dark:divide-dark-600">
            {dashboardStats.recent_commissions.map((commission, index) => (
              <div key={index} className="p-4 sm:px-6 flex items-center justify-between hover:bg-light-50 dark:hover:bg-dark-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">
                      Commission from @{commission.from_user}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">
                      {commission.created_at
                        ? new Date(commission.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recently'
                      }
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  +₹{commission.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Account Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={`rounded-2xl p-4 sm:p-6 shadow-lg ${
          isActiveMember
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              {isActiveMember ? (
                <Award className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              ) : (
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">
                {isActiveMember ? 'Your Account is Active!' : 'Account Inactive'}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {isActiveMember
                  ? `You have received ${commissionCount}/2 commissions. ${commissionCount >= 2 ? 'Reactivate to continue earning!' : 'Keep growing your team!'}`
                  : 'Activate your account to start earning commissions from your team.'
                }
              </p>
            </div>
          </div>
          {!isActiveMember && (
            <button className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg self-start sm:self-auto">
              Activate Now
            </button>
          )}
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-dark-800 text-red-600 dark:text-red-400 font-semibold rounded-2xl shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          {loggingOut ? (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </motion.div>
    </div>
  );
};

export default UserProfile;
