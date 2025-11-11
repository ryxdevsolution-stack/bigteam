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
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  is_mlm_active?: boolean;
  total_earnings?: number;
  sponsored_by?: string | null;
  referral_code?: string;
  activation_date?: string;
}

const UserTreeView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      fetchAllUsers();
    }
  }, [hasFetched]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setHasFetched(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/auth/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        // Auto-expand all users by default
        const allUserIds = data.map((u: User) => u.id);
        setExpandedUsers(new Set(allUserIds));
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getUserChildren = (userId: string): User[] => {
    return users.filter(user => user.sponsored_by === userId);
  };

  const getRootUsers = (): User[] => {
    return users.filter(user => !user.sponsored_by);
  };

  const TreeNode = ({ user }: { user: User }) => {
    const children = getUserChildren(user.id);
    const isExpanded = expandedUsers.has(user.id);
    const hasChildren = children.length > 0;

    return (
      <div className="relative">
        {/* Current User Node */}
        <div className="flex items-start gap-2 mb-2">
          {/* Tree Lines */}
          <div className="flex items-center h-full pt-2">
            <div className="flex items-center">
              {/* Vertical and horizontal lines */}
              <div className={`w-8 h-0.5 ${
                user.role === 'admin'
                  ? 'bg-purple-500'
                  : user.is_mlm_active
                  ? 'bg-green-500'
                  : 'bg-gray-400'
              }`} />
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(user.id)}
              className="flex-shrink-0 w-6 h-6 rounded-md bg-accent-bitcoin/20 hover:bg-accent-bitcoin/40 flex items-center justify-center transition-all mt-1"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-accent-bitcoin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-accent-bitcoin" />
              )}
            </button>
          )}

          {!hasChildren && <div className="w-6 h-6" />}

          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex-1 flex items-center gap-3 p-3 rounded-xl shadow-lg border-2 ${
              user.role === 'admin'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50'
                : user.is_mlm_active
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
                : 'bg-white dark:bg-dark-800 border-gray-300/30 dark:border-gray-700/30'
            }`}
          >
            {/* User Avatar */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
              user.role === 'admin'
                ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                : user.is_mlm_active
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {user.role === 'admin' ? (
                <Shield className="w-6 h-6 text-white" />
              ) : (
                <Users className="w-6 h-6 text-white" />
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white truncate">
                  {user.full_name}
                </h3>
                {user.role === 'admin' && (
                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
                {user.is_active ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-dark-600 dark:text-dark-300">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                  user.role === 'admin'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}>
                  {user.role}
                </span>

                {user.is_mlm_active !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                    user.is_mlm_active
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                  }`}>
                    {user.is_mlm_active ? 'MLM Active' : 'MLM Inactive'}
                  </span>
                )}

                {user.total_earnings !== undefined && user.total_earnings > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-bitcoin/20 text-accent-bitcoin dark:text-accent-gold flex-shrink-0">
                    <DollarSign className="w-3 h-3" />
                    {user.total_earnings.toFixed(2)}
                  </span>
                )}

                {hasChildren && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-orange/20 text-accent-orange flex-shrink-0">
                    <Users className="w-3 h-3" />
                    {children.length}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Render Children with Tree Lines */}
        {isExpanded && hasChildren && (
          <div className="relative ml-4 pl-4 border-l-2 border-dashed border-accent-bitcoin/30">
            {children.map((child) => (
              <div key={child.id} className="relative">
                {/* Connecting line to child */}
                <TreeNode user={child} />
              </div>
            ))}
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

  const rootUsers = getRootUsers();
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const customerUsers = users.filter(u => u.role === 'customer').length;
  const mlmActiveUsers = users.filter(u => u.is_mlm_active).length;

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
              User Tree Hierarchy
            </h1>
            <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300">
              Complete MLM network structure with referral relationships
            </p>
          </div>
          <button
            onClick={fetchAllUsers}
            className="px-4 py-2 sm:py-3 rounded-lg bg-accent-bitcoin hover:bg-accent-bitcoin/90 text-white font-semibold transition-all flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Total Users</h3>
          <p className="text-xl sm:text-2xl font-bold">{totalUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Active</h3>
          <p className="text-xl sm:text-2xl font-bold">{activeUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Admins</h3>
          <p className="text-xl sm:text-2xl font-bold">{adminUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <Award className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">Customers</h3>
          <p className="text-xl sm:text-2xl font-bold">{customerUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-3 sm:p-4 shadow-lg text-white"
        >
          <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-80" />
          <h3 className="text-xs font-medium opacity-90 mb-0.5">MLM Active</h3>
          <p className="text-xl sm:text-2xl font-bold">{mlmActiveUsers}</p>
        </motion.div>
      </div>

      {/* Tree Structure */}
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
              Network Tree Structure
            </h2>
          </div>
          <div className="text-sm text-dark-600 dark:text-dark-300">
            {rootUsers.length} Root {rootUsers.length === 1 ? 'User' : 'Users'}
          </div>
        </div>

        {rootUsers.length > 0 ? (
          <div className="space-y-4 overflow-x-auto">
            {rootUsers.map((user) => (
              <TreeNode key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
            <p className="text-dark-600 dark:text-dark-300 text-lg font-semibold">
              No users found
            </p>
            <p className="text-dark-500 dark:text-dark-400 text-sm mt-2">
              Users will appear here once they are registered
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
        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Understanding the Tree</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Admin User</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">System administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">MLM Active</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Receiving commissions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">MLM Inactive</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Not in MLM system</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-accent-bitcoin/20 flex items-center justify-center">
              <ChevronDown className="w-5 h-5 text-accent-bitcoin" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Expand/Collapse</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Show/hide downline</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-purple-500"></div>
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Connection Lines</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Parent-child relationship</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-bitcoin/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-bitcoin" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Earnings Badge</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Total MLM earnings</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserTreeView;
