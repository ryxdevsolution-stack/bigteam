import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const UserDashboard: React.FC = () => {
  const { dashboardStats: stats, dashboardStatsLoading: loading, fetchDashboardStats } = useData();
  const [copied, setCopied] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
      fetchDashboardStats(user.id);
    }
  }, [user.id, fetchDashboardStats]);

  const copyReferralCode = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statCards = [
    {
      title: 'Total Earnings',
      value: `₹${stats?.total_earnings?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Available Balance',
      value: `₹${stats?.available_balance?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Referrals',
      value: stats?.total_referrals || 0,
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Active Referrals',
      value: stats?.active_referrals || 0,
      icon: Award,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
          Welcome back, {user.full_name || user.name}!
        </h1>
        <p className="text-dark-600 dark:text-dark-300">
          Here's your MLM dashboard overview
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.bgColor} rounded-2xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-dark-600 dark:text-dark-300 mb-1">
              {card.title}
            </h3>
            <p className="text-2xl font-bold text-dark-900 dark:text-white">
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">
          Your Referral Code
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-light-100 dark:bg-dark-700 rounded-xl p-4">
            <p className="text-2xl font-mono font-bold text-accent-bitcoin dark:text-accent-gold text-center">
              {stats?.referral_code || 'Not activated'}
            </p>
          </div>
          <button
            onClick={copyReferralCode}
            disabled={!stats?.referral_code}
            className={`p-4 rounded-xl transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-accent-bitcoin hover:bg-accent-orange text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? <CheckCircle className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">
          MLM Status
        </h2>
        <div className="flex items-center gap-3">
          {stats?.is_mlm_active ? (
            <>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-dark-900 dark:text-white">Active</p>
                <p className="text-sm text-dark-600 dark:text-dark-300">
                  You are eligible to receive commissions
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-dark-900 dark:text-white">Not Activated</p>
                <p className="text-sm text-dark-600 dark:text-dark-300">
                  Purchase an activation package to start earning
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {stats?.recent_commissions && stats.recent_commissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">
            Recent Commissions
          </h2>
          <div className="space-y-3">
            {stats.recent_commissions.map((commission, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-light-100 dark:bg-dark-700 rounded-xl"
              >
                <div>
                  <p className="font-medium text-dark-900 dark:text-white">
                    From: {commission.from_user}
                  </p>
                  <p className="text-sm text-dark-600 dark:text-dark-300">
                    {new Date(commission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  +₹{commission.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserDashboard;
