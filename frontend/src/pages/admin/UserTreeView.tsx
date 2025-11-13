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

interface CommissionPayer {
  user_id: string;
  username: string;
  amount: number;
}

interface CommissionReceiver {
  user_id: string;
  username: string;
  amount: number;
}

interface ChainUser {
  position: number;
  user_id: string;
  is_active: boolean;
  created_at: string;
  username: string;
  email: string;
  commission_received_count: number;
  activation_date: string;
  pays_commission_to: CommissionReceiver | null;
  received_commissions_from: CommissionPayer[];
}

const UserTreeView: React.FC = () => {
  const [chainUsers, setChainUsers] = useState<ChainUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);

  useEffect(() => {
    if (!hasFetched) {
      fetchChainData();
      fetchMLMSettings();
    }
  }, [hasFetched]);

  const fetchMLMSettings = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/user/settings/mlm`);
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings;
        // Calculate commission amount: activation_amount * commission_rate
        const commission = parseFloat(settings.activation_amount) * parseFloat(settings.commission_rate);
        setCommissionAmount(commission);
      }
    } catch (error) {
      console.error('Failed to fetch MLM settings:', error);
    }
  };

  const fetchChainData = async () => {
    try {
      setLoading(true);
      setHasFetched(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      // Fetch chain with REAL commission data from database
      const response = await fetch(`${apiUrl}/api/mlm/chain-with-commissions`);
      if (response.ok) {
        const data = await response.json();

        if (data.success && data.chain) {
          // Use the real commission data directly from the API
          setChainUsers(data.chain);
        } else {
          console.error('Invalid response format:', data);
        }
      } else {
        console.error('Failed to fetch chain:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch chain:', error);
    } finally {
      setLoading(false);
    }
  };

  const ChainNode = ({ user, index, showConnectionLine, allUsers, commissionAmount }: { user: ChainUser; index: number; showConnectionLine: boolean; allUsers: ChainUser[]; commissionAmount: number }) => {
    const commissionLimit = 2; // From MLM settings
    const isInactive = user.commission_received_count >= commissionLimit;

    // Use REAL commission data from the API
    const commissionReceiver = user.pays_commission_to;
    const commissionPayers = user.received_commissions_from || [];

    return (
      <div className="relative flex flex-col items-center justify-center">
        {/* Vertical connecting line to previous user */}
        {showConnectionLine && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 -mt-8 bg-gradient-to-b from-accent-bitcoin/60 to-accent-bitcoin/20" />
        )}

        {/* Main chain node container - Centered */}
        <div className="w-full max-w-4xl">
          {/* User Card Container */}
          <div className="flex items-center gap-4 w-full">
            {/* Position number badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center font-bold text-white shadow-lg text-lg">
              {user.position}
            </div>

            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex-1 flex flex-col gap-3 p-5 rounded-xl shadow-lg border-2 ${
                isInactive
                  ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-400/50 dark:border-gray-600/50'
                  : user.is_active
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500/50'
                  : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-700'
              }`}
            >
              {/* Top Row - Avatar and Main Info */}
              <div className="flex items-center gap-4">
                {/* User Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-md relative ${
                  isInactive
                    ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                    : user.is_active
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-blue-400 to-blue-500'
                }`}>
                  <Users className="w-8 h-8 text-white" />
                  {/* Commission count badge */}
                  {user.commission_received_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent-bitcoin flex items-center justify-center text-xs font-bold text-white shadow-md">
                      {user.commission_received_count}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-dark-900 dark:text-white truncate">
                      {user.username}
                    </h3>
                    {user.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                    {isInactive && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex-shrink-0">
                        Cycle Complete
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {isInactive ? (
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      ✓
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                      <LinkIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row - Status Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-dark-500 dark:text-dark-400 text-sm flex-shrink-0">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </span>

                <span className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${
                  user.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                }`}>
                  {user.is_active ? 'Active in Chain' : 'Inactive'}
                </span>

                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-accent-bitcoin/20 text-accent-bitcoin dark:text-accent-gold flex-shrink-0">
                  <DollarSign className="w-4 h-4" />
                  {user.commission_received_count}/{commissionLimit} Commissions
                </span>
              </div>

              {/* Commission Flow Info */}
              <div className="mt-2 space-y-2">
                {/* Who this user pays to */}
                {commissionReceiver && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2 font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Pays Commission To:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-dark-700 shadow-sm border border-red-200 dark:border-red-800"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold text-white text-xs">
                          {allUsers.findIndex(u => u.user_id === commissionReceiver.user_id) + 1}
                        </div>
                        <span className="text-sm font-semibold text-dark-900 dark:text-white">
                          {commissionReceiver.username}
                        </span>
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold">
                          +${commissionReceiver.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Who has paid to this user */}
                {commissionPayers.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2 font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Received Commissions From:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {commissionPayers.map((payer) => (
                        <div
                          key={payer.user_id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-dark-700 shadow-sm border border-green-200 dark:border-green-800"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center font-bold text-white text-xs">
                            {allUsers.findIndex(u => u.user_id === payer.user_id) + 1}
                          </div>
                          <span className="text-sm font-semibold text-dark-900 dark:text-white">
                            {payer.username}
                          </span>
                          <span className="ml-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold">
                            +${payer.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Arrow down to next user */}
        {index < allUsers.length - 1 && (
          <div className="my-4 flex flex-col items-center">
            <div className="w-0.5 h-8 bg-gradient-to-b from-accent-bitcoin/60 to-accent-bitcoin/20" />
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-accent-bitcoin/60" />
          </div>
        )}
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

  const totalUsers = chainUsers.length;
  const activeUsers = chainUsers.filter(u => u.commission_received_count < 2).length;
  const completedCycles = chainUsers.filter(u => u.commission_received_count >= 2).length;
  const inactiveUsers = totalUsers - activeUsers - completedCycles;

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
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-gradient-to-b from-accent-bitcoin to-accent-orange rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white">
              MLM Commission Chain
            </h2>
          </div>
          <div className="text-base font-semibold text-accent-bitcoin">
            {totalUsers} {totalUsers === 1 ? 'Position' : 'Positions'}
          </div>
        </div>

        {chainUsers.length > 0 ? (
          <div
            className="flex flex-col items-center py-6 max-h-[70vh] overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {chainUsers.map((user, index) => (
              <ChainNode
                key={user.user_id}
                user={user}
                index={index}
                showConnectionLine={index > 0}
                allUsers={chainUsers}
                commissionAmount={commissionAmount}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <LinkIcon className="w-20 h-20 text-dark-300 dark:text-dark-600 mx-auto mb-6" />
            <p className="text-dark-700 dark:text-dark-200 text-xl font-bold">
              No users in chain yet
            </p>
            <p className="text-dark-500 dark:text-dark-400 text-base mt-3">
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
          Users join the chain sequentially. Each new member pays commission to ONE user only - the first active user before them who has received less than 2 commissions. After receiving 2 commissions, users complete their cycle and are <span className="font-semibold text-accent-bitcoin">shown as disabled with "Cycle Complete" badge</span>. All users remain visible in the chain.
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
