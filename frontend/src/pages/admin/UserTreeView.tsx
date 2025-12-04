import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Award,
  CheckCircle,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { cachedGet, cacheUtils } from '../../services/api';

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
  pays_commission_to: CommissionReceiver[];
  received_commissions_from: CommissionPayer[];
}

const UserTreeView: React.FC = memo(() => {
  const [chainUsers, setChainUsers] = useState<ChainUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [_commissionAmount, _setCommissionAmount] = useState<number>(0);
  const [commissionLimit, setCommissionLimit] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Use refs to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Combined fetch function - fetches both in parallel
  const fetchAllData = useCallback(async (force: boolean = false) => {
    // Prevent duplicate calls
    if (isFetchingRef.current && !force) return;
    if (hasFetchedRef.current && !force) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Clear cache if force refresh
      if (force) {
        cacheUtils.invalidatePrefix('/api/team');
        cacheUtils.invalidatePrefix('/api/user/settings');
      }

      // Fetch both endpoints in parallel with caching (30 second TTL for team data)
      const [chainResponse, settingsResponse] = await Promise.all([
        cachedGet('/api/team/chain-with-commissions', { ttl: 30000 }),
        cachedGet('/api/user/settings/team', { ttl: 60000 })
      ]);

      // Process chain data
      const chainData = chainResponse.data;
      if (chainData.success && chainData.chain) {
        setChainUsers(chainData.chain);
      }

      // Process settings
      const settings = settingsResponse.data.settings;
      const commission = parseFloat(settings.activation_amount) * parseFloat(settings.commission_rate);
      _setCommissionAmount(commission);

      // Get commission limit from settings (defaults to 2 if not set)
      const limit = parseInt(settings.commission_limit) || 2;
      setCommissionLimit(limit);

      hasFetchedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch on mount - only once
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Force refresh handler
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const ChainNode = ({ user, index, showPayTo = false }: { user: ChainUser; index: number; showPayTo?: boolean }) => {
    const isCompleted = user.commission_received_count >= commissionLimit;
    const commissionPayers = user.received_commissions_from || [];
    const totalEarned = commissionPayers.reduce((sum, p) => sum + p.amount, 0);
    const paysToList = user.pays_commission_to || [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`border rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow ${
          isCompleted
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-dark-800 border-emerald-200 dark:border-emerald-800/30'
        }`}
      >
        {/* Single row layout - responsive */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Position badge */}
          <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
            isCompleted
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
          }`}>
            {user.position}
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <p className={`text-xs sm:text-sm font-medium truncate ${
              isCompleted ? 'text-gray-500' : 'text-dark-900 dark:text-white'
            }`}>
              {user.username}
            </p>
            <p className="text-[0.65rem] sm:text-xs text-gray-400 truncate hidden sm:block">{user.email}</p>
          </div>

          {/* Commission info */}
          <div className="text-right flex-shrink-0">
            <p className={`text-xs sm:text-sm font-semibold ${
              isCompleted ? 'text-gray-500' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              🪙 {totalEarned.toFixed(0)}
            </p>
            <p className="text-[0.65rem] sm:text-xs text-gray-400">{user.commission_received_count}/{commissionLimit}</p>
          </div>

          {/* Status dot */}
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
            isCompleted ? 'bg-gray-400' : 'bg-emerald-500'
          }`} />
        </div>

        {/* Commission relationships */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
          {/* Pays to info - now shows ALL receivers */}
          {showPayTo && paysToList.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[0.65rem] sm:text-xs">
              <span className="text-orange-500 dark:text-orange-400">→ Paid 🪙 to:</span>
              {paysToList.map((receiver, idx) => (
                <span key={receiver.user_id} className="text-orange-600 dark:text-orange-400 font-medium">
                  {receiver.username} ({receiver.amount.toFixed(0)}){idx < paysToList.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Received from */}
          {commissionPayers.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[0.6rem] sm:text-[0.7rem] text-emerald-500 dark:text-emerald-400">← From 🪙:</span>
              {commissionPayers.map((payer, idx) => (
                <span key={payer.user_id} className="text-[0.65rem] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {payer.username} ({payer.amount.toFixed(0)}){idx < commissionPayers.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Empty state */}
          {paysToList.length === 0 && commissionPayers.length === 0 && (
            <p className="text-[0.6rem] sm:text-xs text-gray-400 italic">First user - no commissions yet</p>
          )}
        </div>
      </motion.div>
    );
  };

  // Smooth horizontal arrow connector between cards - Figma-style
  const HorizontalArrow = ({ color = 'emerald' }: { color?: 'emerald' | 'purple' | 'gray' }) => {
    const strokeColor = color === 'emerald' ? '#10b981' : color === 'purple' ? '#a855f7' : '#9ca3af';
    const gradientId = `hgrad-${color}-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="flex items-center justify-center px-0.5 sm:px-1.5 flex-shrink-0 w-6 sm:w-10">
        <svg className="w-full h-5" viewBox="0 0 36 16" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={strokeColor} />
            </linearGradient>
            <marker id={`harrow-${color}`} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
              <polygon points="0 0, 6 2.5, 0 5" fill={strokeColor} />
            </marker>
          </defs>
          {/* Start dot */}
          <circle cx="3" cy="8" r="2.5" fill={strokeColor} opacity="0.7" />
          {/* Smooth line */}
          <line x1="6" y1="8" x2="28" y2="8" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" markerEnd={`url(#harrow-${color})`} />
        </svg>
      </div>
    );
  };

  // Smooth SVG row connector - connects last card of row to first card of next row - Figma-style with bezier curves
  const RowConnector = ({ color = 'emerald', lastRowLength }: { color?: 'emerald' | 'purple' | 'gray'; lastRowLength: number }) => {
    const strokeColor = color === 'emerald' ? '#10b981' : color === 'purple' ? '#a855f7' : '#9ca3af';
    const gradientId = `rgrad-${color}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate start X position based on last row length (percentage)
    const startX = lastRowLength === 1 ? 200 : lastRowLength === 2 ? 300 : 360;
    const endX = 40;

    return (
      <div className="relative h-10 sm:h-12 my-0.5">
        <svg className="w-full h-full" viewBox="0 0 400 44" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.5" />
              <stop offset="50%" stopColor={strokeColor} />
              <stop offset="100%" stopColor={strokeColor} />
            </linearGradient>
            <marker id={`rarrow-${color}`} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill={strokeColor} />
            </marker>
          </defs>
          {/* Smooth bezier curved path - Figma style */}
          <path
            d={`M ${startX} 3
                L ${startX} 12
                C ${startX} 22, ${startX - 20} 22, ${startX - 40} 22
                L ${endX + 40} 22
                C ${endX + 20} 22, ${endX} 22, ${endX} 32
                L ${endX} 41`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#rarrow-${color})`}
          />
          {/* Start dot */}
          <circle cx={startX} cy="3" r="3" fill={strokeColor} opacity="0.8" />
        </svg>
      </div>
    );
  };

  // Simple down arrow for mobile - Figma-style
  const SimpleDownArrow = ({ color = 'emerald' }: { color?: 'emerald' | 'purple' | 'gray' }) => {
    const strokeColor = color === 'emerald' ? '#10b981' : color === 'purple' ? '#a855f7' : '#9ca3af';
    const gradientId = `dgrad-${color}-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="flex justify-center py-1.5 sm:py-2">
        <svg className="w-5 h-8 sm:h-10" viewBox="0 0 16 32" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={strokeColor} />
            </linearGradient>
            <marker id={`darrow-${color}`} markerWidth="6" markerHeight="5" refX="3" refY="5" orient="auto">
              <polygon points="0 0, 6 0, 3 5" fill={strokeColor} />
            </marker>
          </defs>
          {/* Start dot */}
          <circle cx="8" cy="3" r="2.5" fill={strokeColor} opacity="0.7" />
          {/* Line */}
          <line x1="8" y1="6" x2="8" y2="26" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" markerEnd={`url(#darrow-${color})`} />
        </svg>
      </div>
    );
  };

  // Group users into rows based on displayUsers
  const getRowsOfUsers = (users: ChainUser[]) => {
    const rows: ChainUser[][] = [];
    const usersPerRow = 3;
    for (let i = 0; i < users.length; i += usersPerRow) {
      rows.push(users.slice(i, i + usersPerRow));
    }
    return rows;
  };

  // Memoize derived values
  const { totalUsers, activeChainUsers, completedUsers, activeCount, completedCount } = useMemo(() => {
    const active = chainUsers.filter(u => u.commission_received_count < commissionLimit);
    const completed = chainUsers.filter(u => u.commission_received_count >= commissionLimit);
    return {
      totalUsers: chainUsers.length,
      activeChainUsers: active,
      completedUsers: completed,
      activeCount: active.length,
      completedCount: completed.length
    };
  }, [chainUsers, commissionLimit]);

  // Get users based on active tab
  const displayUsers = useMemo(() =>
    activeTab === 'active' ? activeChainUsers : completedUsers,
    [activeTab, activeChainUsers, completedUsers]
  );

  // Show skeleton on initial load only
  if (loading && chainUsers.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg animate-pulse">
          <div className="h-8 w-48 bg-light-200 dark:bg-dark-700 rounded mb-2" />
          <div className="h-4 w-64 bg-light-200 dark:bg-dark-700 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-light-200 dark:bg-dark-700 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-lg p-4 animate-pulse">
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-light-200 dark:bg-dark-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-8">
      {/* Header - Fully Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-1 sm:mb-2">
              Team Linear Chain
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-dark-600 dark:text-dark-300">
              Commission chain in sequential order
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1.5 sm:px-4 sm:py-2 md:py-3 rounded-lg bg-accent-bitcoin hover:bg-accent-bitcoin/90 text-white text-sm sm:text-base font-semibold transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards - Fully Responsive */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] sm:text-xs text-blue-600 dark:text-blue-400">Total Users</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-dark-900 dark:text-white mt-0.5 sm:mt-1">{totalUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] sm:text-xs text-emerald-600 dark:text-emerald-400">Active</span>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-dark-900 dark:text-white mt-0.5 sm:mt-1">{activeCount}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-100 dark:border-purple-800/30 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] sm:text-xs text-purple-600 dark:text-purple-400">Completed</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-dark-900 dark:text-white mt-0.5 sm:mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Tabs Section - Fully Responsive */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 dark:border-dark-600">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-[0.65rem] sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'
            }`}
          >
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            Active Chain
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[0.6rem] sm:text-xs ${
              activeTab === 'active'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                : 'bg-gray-100 dark:bg-dark-600 text-gray-500'
            }`}>
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-[0.65rem] sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'completed'
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'
            }`}
          >
            <Award className="w-3 h-3 sm:w-4 sm:h-4" />
            Completed
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[0.6rem] sm:text-xs ${
              activeTab === 'completed'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                : 'bg-gray-100 dark:bg-dark-600 text-gray-500'
            }`}>
              {completedCount}
            </span>
          </button>
        </div>

        {/* Tab Content - Fully Responsive */}
        <div className="p-2.5 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h2 className="text-sm sm:text-base font-semibold text-dark-900 dark:text-white">
              {activeTab === 'active' ? 'Active Chain' : 'Completed Cycles'}
            </h2>
            <span className="text-[0.65rem] sm:text-xs text-gray-500 dark:text-gray-400">
              {displayUsers.length} {displayUsers.length === 1 ? 'user' : 'users'}
            </span>
          </div>

        {/* Show last 5 completed users in Active tab for context */}
        {activeTab === 'active' && completedUsers.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Award className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                Recent Completed (last {Math.min(5, completedUsers.length)})
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {completedUsers.slice(-5).map((user, idx, arr) => (
                <div
                  key={user.user_id}
                  className={`bg-gray-50 dark:bg-gray-800/30 border rounded-lg p-2 ${
                    idx === arr.length - 1
                      ? 'border-purple-300 dark:border-purple-600 ring-2 ring-purple-200 dark:ring-purple-800/30'
                      : 'border-gray-200 dark:border-gray-700 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${
                      idx === arr.length - 1
                        ? 'bg-purple-200 dark:bg-purple-800 text-purple-600 dark:text-purple-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {user.position}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[0.65rem] sm:text-xs font-medium truncate ${
                        idx === arr.length - 1 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'
                      }`}>{user.username}</p>
                      <p className="text-[0.55rem] text-gray-400">🪙 {user.received_commissions_from?.reduce((s, p) => s + p.amount, 0).toFixed(0) || 0} • {commissionLimit}/{commissionLimit} ✓</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Smooth SVG connector from last completed to first active - Figma style with bezier curves */}
            <div className="relative h-12 sm:h-14 mt-2">
              <svg className="w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="connectorGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="40%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                    <polygon points="0 0, 7 2.5, 0 5" fill="#10b981" />
                  </marker>
                </defs>
                {/* Smooth bezier curved path from right to left */}
                <path
                  d={`M 360 4
                      L 360 12
                      C 360 22, 340 22, 320 22
                      L 80 22
                      C 60 22, 40 22, 40 32
                      L 40 46`}
                  fill="none"
                  stroke="url(#connectorGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd="url(#arrowhead)"
                />
                {/* Start dot */}
                <circle cx="360" cy="4" r="3.5" fill="#a855f7" opacity="0.9" />
              </svg>
            </div>
          </div>
        )}

        {displayUsers.length > 0 ? (
          <div className="py-3 sm:py-5">
            <div className="flex flex-col">
              {getRowsOfUsers(displayUsers).map((row, rowIndex) => {
                const connectorColor = activeTab === 'completed' ? 'purple' : 'emerald';
                const rows = getRowsOfUsers(displayUsers);
                const hasNextRow = rowIndex < rows.length - 1;

                return (
                  <div key={rowIndex}>
                    {/* Row of users with horizontal connectors */}
                    <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-0">
                      {row.map((user, userIndex) => {
                        const globalIndex = rowIndex * 3 + userIndex;
                        const isLastInRow = userIndex === row.length - 1;

                        return (
                          <div key={user.user_id} className="flex items-center flex-1">
                            <div className="flex-1">
                              <ChainNode user={user} index={globalIndex} showPayTo={true} />
                            </div>
                            {/* Horizontal connector between cards */}
                            {!isLastInRow && (
                              <div className="hidden sm:block">
                                <HorizontalArrow color={connectorColor} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Row connector to next row - L-shaped path */}
                    {hasNextRow && (
                      <div className="hidden sm:block">
                        <RowConnector color={connectorColor} lastRowLength={row.length} />
                      </div>
                    )}
                    {/* Mobile: simple down arrow */}
                    {hasNextRow && (
                      <div className="sm:hidden">
                        <SimpleDownArrow color={connectorColor} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            {activeTab === 'active' ? (
              <>
                <LinkIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  No active users in chain yet
                </p>
              </>
            ) : (
              <>
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  No completed cycles yet
                </p>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Legend - Responsive */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[0.65rem] sm:text-xs text-gray-500 dark:text-gray-400 py-1 sm:py-2">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-400" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="flex items-center">
            <div className="w-3 sm:w-4 h-0.5 bg-emerald-400 rounded" />
            <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-emerald-400" />
          </div>
          <span>Commission Flow</span>
        </div>
      </div>
    </div>
  );
});

UserTreeView.displayName = 'UserTreeView';

export default UserTreeView;
