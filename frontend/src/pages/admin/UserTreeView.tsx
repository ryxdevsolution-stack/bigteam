import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Award,
  CheckCircle,
  XCircle,
  Crown,
  Shield,
  DollarSign,
  RefreshCw,
  Mail,
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react';

interface ChainUser {
  position: number;
  user_id: string;
  is_active: boolean;
  created_at: string;
  username: string;
  email: string;
  commission_received_count: number;
  is_mlm_active?: boolean;
  role?: string;
}

const UserTreeView: React.FC = () => {
  const [chainUsers, setChainUsers] = useState<ChainUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      fetchChainData();
    }
  }, [hasFetched]);

  const fetchChainData = async () => {
    try {
      setLoading(true);
      setHasFetched(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      // Fetch all users instead of just MLM chain
      const response = await fetch(`${apiUrl}/auth/admin/users`);
      if (response.ok) {
        const users = await response.json();

        // Sort users by creation date (earliest first) and filter active users only
        const sortedUsers = users
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateA - dateB;
          })
          .filter((user: any) => {
            // Only show users who haven't completed their cycle (received less than 2 commissions)
            const commissionCount = user.commission_received_count || 0;
            return commissionCount < 2;
          })
          .map((user: any, index: number) => ({
            position: index + 1,
            user_id: user.id,
            is_active: user.is_mlm_active || false,
            created_at: user.created_at,
            username: user.username,
            email: user.email,
            commission_received_count: user.commission_received_count || 0,
            is_mlm_active: user.is_mlm_active || false,
            role: user.role
          }));

        setChainUsers(sortedUsers);
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const ChainNode = ({ user, index, showConnectionLine, allUsers }: { user: ChainUser; index: number; showConnectionLine: boolean; allUsers: ChainUser[] }) => {
    const commissionLimit = 2; // From MLM settings
    const isInactive = user.commission_received_count >= commissionLimit;

    // Find the 2 active users before this user who would receive commissions
    const usersBeforeThis = allUsers.slice(0, index);
    const activeUsersBeforeThis = usersBeforeThis.filter(u => u.is_mlm_active);
    const commissionReceivers = activeUsersBeforeThis.slice(-2); // Last 2 active users

    return (
      <div className="relative flex items-center justify-center">
        {/* Vertical connecting line to previous user */}
        {showConnectionLine && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-12 -mt-12 bg-gradient-to-b from-accent-bitcoin/60 to-accent-bitcoin/20" />
        )}

        {/* Main chain node container */}
        <div className="flex items-center gap-4 w-full max-w-2xl">
          {/* Position number badge */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center font-bold text-white shadow-lg">
            {user.position}
          </div>

          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl shadow-lg border-2 ${
              isInactive
                ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-400/50 dark:border-gray-600/50'
                : user.is_active
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500/50'
                : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-700'
            }`}
          >
            {/* User Avatar */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md relative ${
              isInactive
                ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                : user.is_active
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-blue-400 to-blue-500'
            }`}>
              <Users className="w-7 h-7 text-white" />
              {/* Commission count badge */}
              {user.commission_received_count > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent-bitcoin flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {user.commission_received_count}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-dark-900 dark:text-white truncate">
                  {user.username}
                </h3>
                {user.is_active ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                {isInactive && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex-shrink-0">
                    Cycle Complete
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-dark-600 dark:text-dark-300">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>

                <span className="text-dark-500 dark:text-dark-400 text-xs flex-shrink-0">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </span>

                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                  user.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                }`}>
                  {user.is_active ? 'Active in Chain' : 'Inactive'}
                </span>

                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-bitcoin/20 text-accent-bitcoin dark:text-accent-gold flex-shrink-0">
                  <TrendingUp className="w-3 h-3" />
                  {user.commission_received_count}/{commissionLimit} Commissions
                </span>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0">
              {isInactive ? (
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  ✓
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Commission flow info - show who would receive commissions from this user */}
          {commissionReceivers.length > 0 && (
            <div className="ml-16 mt-2 p-2 rounded-lg bg-accent-bitcoin/5 border border-accent-bitcoin/20">
              <p className="text-xs text-dark-600 dark:text-dark-400 mb-1 font-semibold">
                Pays commissions to positions:
              </p>
              <div className="flex gap-2">
                {commissionReceivers.map((receiver) => (
                  <span
                    key={receiver.user_id}
                    className="px-2 py-1 rounded-md bg-accent-bitcoin/10 text-accent-bitcoin text-xs font-semibold"
                  >
                    #{receiver.position} {receiver.username}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  const totalUsers = chainUsers.length; // Only active users in chain (not cycled out)
  const activeUsers = chainUsers.filter(u => u.is_mlm_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const completedCycles = 0; // No cycled users shown in this view (they're filtered out)

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white mb-2">
              MLM Linear Chain Structure
            </h1>
            <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300">
              Visual representation of the MLM commission chain in sequential order
            </p>
          </div>
          <button
            onClick={fetchChainData}
            className="px-4 py-2 sm:py-3 rounded-lg bg-accent-bitcoin hover:bg-accent-bitcoin/90 text-white font-semibold transition-all flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Active Chain Users</h3>
          <p className="text-xl sm:text-2xl font-bold">{totalUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Active Users</h3>
          <p className="text-xl sm:text-2xl font-bold">{activeUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <XCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Inactive Users</h3>
          <p className="text-xl sm:text-2xl font-bold">{inactiveUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <Award className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Completed Cycles</h3>
          <p className="text-xl sm:text-2xl font-bold">{completedCycles}</p>
        </motion.div>
      </div>

      {/* Linear Chain Structure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-gradient-to-b from-accent-bitcoin to-accent-orange rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">
              MLM Commission Chain
            </h2>
          </div>
          <div className="text-sm text-dark-600 dark:text-dark-300">
            {totalUsers} {totalUsers === 1 ? 'Position' : 'Positions'}
          </div>
        </div>

        {chainUsers.length > 0 ? (
          <div className="space-y-12 py-6">
            {chainUsers.map((user, index) => (
              <ChainNode
                key={user.user_id}
                user={user}
                index={index}
                showConnectionLine={index > 0}
                allUsers={chainUsers}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <LinkIcon className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
            <p className="text-dark-600 dark:text-dark-300 text-lg font-semibold">
              No users in chain yet
            </p>
            <p className="text-dark-500 dark:text-dark-400 text-sm mt-2">
              Users will appear here once they activate in the MLM system
            </p>
          </div>
        )}
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2">Understanding the Linear Chain</h3>
        <p className="text-sm text-dark-600 dark:text-dark-300 mb-4">
          Users join the chain sequentially. Each new member pays commissions to the last 2 active users before them. After receiving 2 commissions, users complete their cycle and are <span className="font-semibold text-accent-bitcoin">automatically hidden from the chain</span>. Only active users (0/2 or 1/2 commissions) are shown below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center font-bold text-white">
              #
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Position Number</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Order in the chain</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Active in Chain</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Can receive commissions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Inactive</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Cycle completed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-bitcoin flex items-center justify-center font-bold text-white text-xs">
              2
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Commission Counter</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Number received / limit</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-accent-bitcoin/60 to-accent-bitcoin/20"></div>
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Connection Lines</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Commission flow direction</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg">
              ✓
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Cycle Complete</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">2/2 commissions received</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserTreeView;
