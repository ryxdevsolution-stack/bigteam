import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Package, Calendar, TrendingUp, Award, Clock, AlertCircle } from 'lucide-react';
import activationHistoryService, { ActivationHistory } from '../../services/activationHistoryService';

const ActivationHistoryTimeline: React.FC = () => {
  const [history, setHistory] = useState<ActivationHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await activationHistoryService.getMyActivationHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load activation history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-accent-bitcoin border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-dark-700 rounded-xl text-center">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No activation history found</p>
      </div>
    );
  }

  const { user, activation_history, statistics, summary } = history;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Activations</p>
              <p className="text-2xl font-bold">{summary.total_activations}</p>
            </div>
            <Award className="w-8 h-8 opacity-80" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Lifetime Earnings</p>
              <p className="text-2xl font-bold">₹{summary.lifetime_earnings.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Current Position</p>
              <p className="text-2xl font-bold">{user.current_position || 'N/A'}</p>
            </div>
            <Package className="w-8 h-8 opacity-80" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Status</p>
              <p className="text-2xl font-bold">{summary.currently_active ? 'Active' : 'Inactive'}</p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </motion.div>
      </div>

      {/* Statistics */}
      {statistics && Object.keys(statistics).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-white dark:bg-dark-800 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statistics.average_days_active !== undefined && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Days Active</p>
                <p className="text-xl font-bold text-dark-900 dark:text-white">
                  {statistics.average_days_active} days
                </p>
              </div>
            )}
            {statistics.favorite_package && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Favorite Package</p>
                <p className="text-xl font-bold text-dark-900 dark:text-white">
                  {statistics.favorite_package}
                </p>
              </div>
            )}
            {statistics.current_package && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Package</p>
                <p className="text-xl font-bold text-dark-900 dark:text-white">
                  {statistics.current_package}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-white dark:bg-dark-800 rounded-xl shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-accent-bitcoin" />
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Activation Timeline</h3>
        </div>

        {activation_history.length === 0 && user.is_active && (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">
              This is your first activation! Start building your team to earn commissions.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Current Activation */}
          {user.is_active && (
            <div className="relative pl-8 pb-6 border-l-2 border-emerald-500">
              <div className="absolute left-[-9px] top-0 w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Current Activation
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Position: {user.current_position} • Commissions: {user.commission_count}/2
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Started: {formatDate(user.activation_date)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Historical Activations */}
          {activation_history.map((activation, index) => (
            <div
              key={index}
              className="relative pl-8 pb-6 border-l-2 border-gray-300 dark:border-gray-600 last:border-transparent"
            >
              <div className="absolute left-[-9px] top-0 w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                      {activation.package?.name || 'Unknown Package'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Position: {activation.position_in_chain} • Amount: ₹
                      {activation.package?.amount.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {formatDate(activation.timeline.activated_at)} -{' '}
                      {formatDate(activation.timeline.deactivated_at)}
                      <span className="ml-2">({activation.timeline.days_active} days)</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full">
                    COMPLETED
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Commissions Earned: {activation.performance.commissions_earned}/2
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activation_history.length === 0 && !user.is_active && (
          <div className="text-center py-6">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No activation history yet. Activate your account to get started!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivationHistoryTimeline;
