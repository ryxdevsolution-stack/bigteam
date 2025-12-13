import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Award,
  CheckCircle,
  RefreshCw,
  Link as LinkIcon,
  Package,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cachedGet, cacheUtils } from '../../services/api';
import packageService, { Package as PackageType } from '../../services/packageService';

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
  package_id: string | null;
  package_name: string;
  package_amount: number;
  pays_commission_to: CommissionReceiver[];
  received_commissions_from: CommissionPayer[];
}

interface PackageGroup {
  package_id: string | null;
  package_name: string;
  package_amount: number;
  users: ChainUser[];
  activeCount: number;
  completedCount: number;
}

const UserTreeView: React.FC = memo(() => {
  const [chainUsers, setChainUsers] = useState<ChainUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionLimit, setCommissionLimit] = useState<number>(2);
  const [viewMode, setViewMode] = useState<'chain' | 'packages'>('packages');
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [allPackages, setAllPackages] = useState<PackageType[]>([]);

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

      // Fetch all endpoints in parallel with caching (30 second TTL for team data)
      const [chainResponse, settingsResponse, packagesData] = await Promise.all([
        cachedGet('/api/team/chain-with-commissions', { ttl: 30000 }),
        cachedGet('/api/user/settings/team', { ttl: 60000 }),
        packageService.getActivePackagesAdmin().catch(() => [])
      ]);

      // Process chain data
      const chainData = chainResponse.data;
      if (chainData.success && chainData.chain) {
        setChainUsers(chainData.chain);
      }

      // Store all packages
      setAllPackages(packagesData);

      // Process settings - get commission limit (defaults to 2 if not set)
      const settings = settingsResponse.data.settings;
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
        className={`border rounded-lg sm:rounded-xl p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-shadow ${
          isCompleted
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-dark-800 border-emerald-200 dark:border-emerald-800/30'
        }`}
      >
        {/* Single row layout - fully mobile responsive */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Position badge */}
          <div className={`w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[0.65rem] sm:text-sm font-bold flex-shrink-0 ${
            isCompleted
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
          }`}>
            {user.position}
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <p className={`text-[0.7rem] sm:text-sm font-medium truncate ${
              isCompleted ? 'text-gray-500' : 'text-dark-900 dark:text-white'
            }`}>
              {user.username}
            </p>
            <p className="text-[0.65rem] sm:text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          {/* Commission info - Compact on mobile */}
          <div className="text-right flex-shrink-0">
            <p className={`text-[0.7rem] sm:text-sm font-semibold ${
              isCompleted ? 'text-gray-500' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              🪙 {totalEarned.toFixed(0)}
            </p>
            <p className="text-[0.65rem] sm:text-xs text-gray-400">{user.commission_received_count}/{commissionLimit}</p>
          </div>

          {/* Status dot */}
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
            isCompleted ? 'bg-gray-400' : 'bg-emerald-500'
          }`} />
        </div>

        {/* Commission relationships - Compact on mobile */}
        <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
          {/* Pays to info - now shows ALL receivers */}
          {showPayTo && paysToList.length > 0 && (
            <div className="flex items-start gap-1 sm:gap-2 flex-wrap text-[0.65rem] sm:text-xs">
              <span className="text-orange-500 dark:text-orange-400 whitespace-nowrap">→ Paid:</span>
              <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                {paysToList.map((receiver, idx) => (
                  <span key={receiver.user_id} className="text-orange-600 dark:text-orange-400 font-medium">
                    {receiver.username} ({receiver.amount.toFixed(0)}){idx < paysToList.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Received from */}
          {commissionPayers.length > 0 && (
            <div className="flex items-start gap-1 sm:gap-2 flex-wrap">
              <span className="text-[0.65rem] sm:text-xs text-emerald-500 dark:text-emerald-400 whitespace-nowrap">← From:</span>
              <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                {commissionPayers.map((payer, idx) => (
                  <span key={payer.user_id} className="text-[0.65rem] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {payer.username} ({payer.amount.toFixed(0)}){idx < commissionPayers.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {paysToList.length === 0 && commissionPayers.length === 0 && (
            <p className="text-[0.65rem] sm:text-xs text-gray-400 italic">First user - no commissions yet</p>
          )}
        </div>
      </motion.div>
    );
  };

  // Smooth horizontal arrow connector between cards - Figma-style
  const HorizontalArrow = ({ color = 'emerald', id }: { color?: 'emerald' | 'purple' | 'gray'; id?: string }) => {
    const strokeColor = color === 'emerald' ? '#10b981' : color === 'purple' ? '#a855f7' : '#9ca3af';
    const gradientId = `hgrad-${color}-${id || 'default'}`;
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
  const RowConnector = ({ color = 'emerald', lastRowLength, id }: { color?: 'emerald' | 'purple' | 'gray'; lastRowLength: number; id?: string }) => {
    const strokeColor = color === 'emerald' ? '#10b981' : color === 'purple' ? '#a855f7' : '#9ca3af';
    const gradientId = `rgrad-${color}-${id || 'default'}`;

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
  const SimpleDownArrow = ({ color = 'emerald', id }: { color?: 'emerald' | 'purple' | 'gray'; id?: string }) => {
    const strokeColor = color === 'emerald' ? '#10b981' : color === 'purple' ? '#a855f7' : '#9ca3af';
    const gradientId = `dgrad-${color}-${id || 'default'}`;
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

  // Toggle package expansion
  const togglePackage = useCallback((packageKey: string) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageKey)) {
        newSet.delete(packageKey);
      } else {
        newSet.add(packageKey);
      }
      return newSet;
    });
  }, []);

  // Memoize derived values - counts for stats cards
  const { totalUsers, activeCount, completedCount } = useMemo(() => {
    const active = chainUsers.filter(u => u.commission_received_count < commissionLimit);
    const completed = chainUsers.filter(u => u.commission_received_count >= commissionLimit);
    return {
      totalUsers: chainUsers.length,
      activeCount: active.length,
      completedCount: completed.length
    };
  }, [chainUsers, commissionLimit]);

  // Group users by package - including all available packages from system
  const packageGroups = useMemo((): PackageGroup[] => {
    const groupMap = new Map<string, PackageGroup>();

    // First, add all available packages from the system (even if no users)
    allPackages.forEach(pkg => {
      groupMap.set(pkg.id, {
        package_id: pkg.id,
        package_name: pkg.name,
        package_amount: pkg.amount,
        users: [],
        activeCount: 0,
        completedCount: 0
      });
    });

    // Then add users to their respective packages
    chainUsers.forEach(user => {
      const key = user.package_id || 'no-package';
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          package_id: user.package_id,
          package_name: user.package_name || 'No Package',
          package_amount: user.package_amount || 0,
          users: [],
          activeCount: 0,
          completedCount: 0
        });
      }
      const group = groupMap.get(key)!;
      group.users.push(user);
      if (user.commission_received_count < commissionLimit) {
        group.activeCount++;
      } else {
        group.completedCount++;
      }
    });

    // Sort by package amount (highest first), with "No Package" at the end
    return Array.from(groupMap.values()).sort((a, b) => {
      if (!a.package_id) return 1;
      if (!b.package_id) return -1;
      return b.package_amount - a.package_amount;
    });
  }, [chainUsers, commissionLimit, allPackages]);

  // Auto-expand packages that have users on load - use functional update to avoid dependency on expandedPackages
  useEffect(() => {
    setExpandedPackages(prev => {
      // Only auto-expand on first load when no packages are expanded
      if (prev.size > 0 || packageGroups.length === 0) return prev;

      // Expand all packages that have users
      const packagesWithUsers = packageGroups
        .filter(g => g.users.length > 0)
        .map(g => g.package_id || 'no-package');

      // If no packages have users, expand first one
      if (packagesWithUsers.length === 0 && packageGroups.length > 0) {
        packagesWithUsers.push(packageGroups[0].package_id || 'no-package');
      }

      return new Set(packagesWithUsers);
    });
  }, [packageGroups]);

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
      {/* Header - Fully Mobile Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg"
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Title Row */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-0.5 sm:mb-2">
                Team Linear Chain
              </h1>
              <p className="text-[0.65rem] sm:text-sm md:text-base text-dark-600 dark:text-dark-300">
                Commission chain by package
              </p>
            </div>
            {/* Refresh Button - Always visible */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 md:py-3 rounded-lg bg-accent-bitcoin hover:bg-accent-bitcoin/90 text-white text-xs sm:text-sm md:text-base font-semibold transition-all flex items-center gap-1 sm:gap-2 shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>

          {/* View Mode Toggle - Full width on mobile with better visibility */}
          <div className="flex rounded-xl bg-light-100 dark:bg-dark-700 p-1 gap-1">
            <button
              onClick={() => setViewMode('packages')}
              className={`flex-1 px-3 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                viewMode === 'packages'
                  ? 'bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-dark-600/50'
              }`}
            >
              <Package className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Packages</span>
            </button>
            <button
              onClick={() => setViewMode('chain')}
              className={`flex-1 px-3 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                viewMode === 'chain'
                  ? 'bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-dark-600/50'
              }`}
            >
              <LinkIcon className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Chain Flow</span>
            </button>
          </div>
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

      {/* Package Groups View - Fully Mobile Responsive */}
      {viewMode === 'packages' && (
        <div className="space-y-2 sm:space-y-3">
          {packageGroups.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 sm:p-8 text-center">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No users in any package yet</p>
            </div>
          ) : (
            packageGroups.map((group) => {
              const key = group.package_id || 'no-package';
              const isExpanded = expandedPackages.has(key);
              const activeUsers = group.users.filter(u => u.commission_received_count < commissionLimit);
              const completedUsersInGroup = group.users.filter(u => u.commission_received_count >= commissionLimit);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg sm:rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Package Header - Mobile Optimized */}
                  <button
                    onClick={() => togglePackage(key)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                        group.package_id
                          ? 'bg-gradient-to-br from-accent-bitcoin to-accent-orange'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <h3 className="font-semibold text-dark-900 dark:text-white text-xs sm:text-sm md:text-base truncate">
                          {group.package_name}
                        </h3>
                        {group.package_amount > 0 && (
                          <p className="text-[0.65rem] sm:text-xs text-gray-500 dark:text-gray-400">
                            ₹{group.package_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                      {/* Mobile: Compact badges */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        {/* Users count - always show */}
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[0.65rem] sm:text-xs font-medium whitespace-nowrap">
                          {group.users.length}
                        </span>
                        {/* Active count - show on mobile too */}
                        {group.users.length > 0 && (
                          <>
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[0.65rem] sm:text-xs font-medium whitespace-nowrap">
                              <span className="hidden xs:inline">{group.activeCount} </span>
                              <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline xs:hidden" />
                              <span className="hidden sm:inline">active</span>
                            </span>
                            <span className="hidden sm:inline-flex px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs font-medium whitespace-nowrap">
                              {group.completedCount} done
                            </span>
                          </>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content - Mobile Optimized */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200 dark:border-dark-600"
                      >
                        <div className="p-2.5 sm:p-4 space-y-3 sm:space-y-4">
                          {/* Package Summary Stats - Mobile Only */}
                          {group.users.length > 0 && (
                            <div className="sm:hidden grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                                <p className="text-[0.65rem] text-blue-600 dark:text-blue-400">Total</p>
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{group.users.length}</p>
                              </div>
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 text-center">
                                <p className="text-[0.65rem] text-emerald-600 dark:text-emerald-400">Active</p>
                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{group.activeCount}</p>
                              </div>
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                                <p className="text-[0.65rem] text-purple-600 dark:text-purple-400">Done</p>
                                <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{group.completedCount}</p>
                              </div>
                            </div>
                          )}

                          {/* Active Users */}
                          {activeUsers.length > 0 && (
                            <div>
                              <h4 className="text-[0.65rem] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 sm:mb-2 flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Active ({activeUsers.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                                {activeUsers.map((user, idx) => (
                                  <ChainNode key={user.user_id} user={user} index={idx} showPayTo={false} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Completed Users */}
                          {completedUsersInGroup.length > 0 && (
                            <div>
                              <h4 className="text-[0.65rem] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1.5 sm:mb-2 flex items-center gap-1">
                                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Completed ({completedUsersInGroup.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                                {completedUsersInGroup.map((user, idx) => (
                                  <ChainNode key={user.user_id} user={user} index={idx} showPayTo={false} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty State - Mobile Optimized */}
                          {group.users.length === 0 && (
                            <div className="text-center py-4 sm:py-6 bg-gray-50 dark:bg-dark-700/50 rounded-lg">
                              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 dark:text-gray-600 mx-auto mb-1.5 sm:mb-2" />
                              <p className="text-gray-400 text-xs sm:text-sm">No users with this package yet</p>
                              <p className="text-gray-400 text-[0.65rem] sm:text-xs mt-0.5 sm:mt-1 px-4">Users appear here when activated</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Chain View - Package-wise with Chain Flow */}
      {viewMode === 'chain' && (
        <div className="space-y-3 sm:space-y-4">
          {packageGroups.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 sm:p-8 text-center">
              <LinkIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No users in chain yet</p>
            </div>
          ) : (
            packageGroups.map((group) => {
              const key = group.package_id || 'no-package';
              const isExpanded = expandedPackages.has(key);
              const activeUsersInPackage = group.users.filter(u => u.commission_received_count < commissionLimit);
              const completedUsersInPackage = group.users.filter(u => u.commission_received_count >= commissionLimit);

              // Sort users by position for chain flow
              const sortedActiveUsers = [...activeUsersInPackage].sort((a, b) => a.position - b.position);
              const sortedCompletedUsers = [...completedUsersInPackage].sort((a, b) => a.position - b.position);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg sm:rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Package Header */}
                  <button
                    onClick={() => togglePackage(key)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                        group.package_id
                          ? 'bg-gradient-to-br from-accent-bitcoin to-accent-orange'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <h3 className="font-semibold text-dark-900 dark:text-white text-xs sm:text-sm md:text-base truncate">
                          {group.package_name}
                        </h3>
                        {group.package_amount > 0 && (
                          <p className="text-[0.65rem] sm:text-xs text-gray-500 dark:text-gray-400">
                            ₹{group.package_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[0.65rem] sm:text-xs font-medium">
                          {group.users.length}
                        </span>
                        {group.users.length > 0 && (
                          <>
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[0.65rem] sm:text-xs font-medium">
                              {group.activeCount}
                            </span>
                            <span className="hidden sm:inline-flex px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs font-medium">
                              {group.completedCount}
                            </span>
                          </>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Chain Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200 dark:border-dark-600"
                      >
                        <div className="p-2.5 sm:p-4">
                          {/* Package Stats - Mobile */}
                          {group.users.length > 0 && (
                            <div className="sm:hidden grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                                <p className="text-[0.65rem] text-blue-600">Total</p>
                                <p className="text-sm font-bold text-blue-700">{group.users.length}</p>
                              </div>
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 text-center">
                                <p className="text-[0.65rem] text-emerald-600">Active</p>
                                <p className="text-sm font-bold text-emerald-700">{group.activeCount}</p>
                              </div>
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                                <p className="text-[0.65rem] text-purple-600">Done</p>
                                <p className="text-sm font-bold text-purple-700">{group.completedCount}</p>
                              </div>
                            </div>
                          )}

                          {/* Completed Users Section with Chain Flow */}
                          {sortedCompletedUsers.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="w-3.5 h-3.5 text-purple-500" />
                                <h4 className="text-[0.65rem] sm:text-xs font-semibold text-purple-600">
                                  Completed Chain ({sortedCompletedUsers.length})
                                </h4>
                              </div>
                              {/* Chain Flow for Completed */}
                              <div className="flex flex-col">
                                {/* Desktop: Row-based layout with horizontal arrows */}
                                <div className="hidden sm:block">
                                  {getRowsOfUsers(sortedCompletedUsers).map((row, rowIndex) => {
                                    const rows = getRowsOfUsers(sortedCompletedUsers);
                                    const hasNextRow = rowIndex < rows.length - 1;
                                    return (
                                      <div key={rowIndex}>
                                        <div className="flex flex-row items-stretch">
                                          {row.map((user, userIndex) => {
                                            const globalIndex = rowIndex * 3 + userIndex;
                                            const isLastInRow = userIndex === row.length - 1;
                                            return (
                                              <div key={user.user_id} className="flex items-center flex-1">
                                                <div className="flex-1">
                                                  <ChainNode user={user} index={globalIndex} showPayTo={true} />
                                                </div>
                                                {!isLastInRow && (
                                                  <HorizontalArrow color="purple" id={`${key}-c-${rowIndex}-${userIndex}`} />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                        {hasNextRow && (
                                          <RowConnector color="purple" lastRowLength={row.length} id={`${key}-c-row-${rowIndex}`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Mobile: Vertical chain with down arrows between each user */}
                                <div className="sm:hidden space-y-0">
                                  {sortedCompletedUsers.map((user, index) => (
                                    <div key={user.user_id}>
                                      <ChainNode user={user} index={index} showPayTo={true} />
                                      {index < sortedCompletedUsers.length - 1 && (
                                        <SimpleDownArrow color="purple" id={`${key}-c-mob-${index}`} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Connector to Active Section */}
                              {sortedActiveUsers.length > 0 && (
                                <div className="relative h-10 sm:h-12 my-2">
                                  <svg className="w-full h-full" viewBox="0 0 400 40" preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id={`gradient-${key}`} x1="100%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#10b981" />
                                      </linearGradient>
                                    </defs>
                                    <path
                                      d="M 200 4 L 200 36"
                                      fill="none"
                                      stroke={`url(#gradient-${key})`}
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      markerEnd="url(#arrowhead)"
                                    />
                                    <circle cx="200" cy="4" r="3" fill="#a855f7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Active Users Section with Chain Flow */}
                          {sortedActiveUsers.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <h4 className="text-[0.65rem] sm:text-xs font-semibold text-emerald-600">
                                  Active Chain ({sortedActiveUsers.length})
                                </h4>
                              </div>
                              {/* Chain Flow for Active */}
                              <div className="flex flex-col">
                                {/* Desktop: Row-based layout with horizontal arrows */}
                                <div className="hidden sm:block">
                                  {getRowsOfUsers(sortedActiveUsers).map((row, rowIndex) => {
                                    const rows = getRowsOfUsers(sortedActiveUsers);
                                    const hasNextRow = rowIndex < rows.length - 1;
                                    return (
                                      <div key={rowIndex}>
                                        <div className="flex flex-row items-stretch">
                                          {row.map((user, userIndex) => {
                                            const globalIndex = rowIndex * 3 + userIndex;
                                            const isLastInRow = userIndex === row.length - 1;
                                            return (
                                              <div key={user.user_id} className="flex items-center flex-1">
                                                <div className="flex-1">
                                                  <ChainNode user={user} index={globalIndex} showPayTo={true} />
                                                </div>
                                                {!isLastInRow && (
                                                  <HorizontalArrow color="emerald" id={`${key}-a-${rowIndex}-${userIndex}`} />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                        {hasNextRow && (
                                          <RowConnector color="emerald" lastRowLength={row.length} id={`${key}-a-row-${rowIndex}`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Mobile: Vertical chain with down arrows between each user */}
                                <div className="sm:hidden space-y-0">
                                  {sortedActiveUsers.map((user, index) => (
                                    <div key={user.user_id}>
                                      <ChainNode user={user} index={index} showPayTo={true} />
                                      {index < sortedActiveUsers.length - 1 && (
                                        <SimpleDownArrow color="emerald" id={`${key}-a-mob-${index}`} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Empty State */}
                          {group.users.length === 0 && (
                            <div className="text-center py-4 sm:py-6 bg-gray-50 dark:bg-dark-700/50 rounded-lg">
                              <LinkIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-1.5" />
                              <p className="text-gray-400 text-xs sm:text-sm">No users in this package chain</p>
                              <p className="text-gray-400 text-[0.65rem] mt-0.5">Commission flows within this package only</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      )}

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
