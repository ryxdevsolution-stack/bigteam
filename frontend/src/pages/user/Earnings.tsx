import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Copy,
  Download
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Earnings: React.FC = () => {
  const {
    dashboardStats: stats,
    dashboardStatsLoading,
    fetchDashboardStats,
    commissions,
    commissionsLoading,
    fetchCommissions
  } = useData();
  const [copied, setCopied] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const loading = dashboardStatsLoading || commissionsLoading;

  useEffect(() => {
    if (user.id) {
      fetchDashboardStats(user.id);
      fetchCommissions(user.id);
    }
  }, [user.id, fetchDashboardStats, fetchCommissions]);

  const copyReferralCode = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  const earningCards = [
    {
      title: 'Total Earnings',
      value: `₹${stats?.total_earnings?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      description: 'All-time earnings'
    },
    {
      title: 'Available Balance',
      value: `₹${stats?.available_balance?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Ready to withdraw'
    },
    {
      title: 'Pending Balance',
      value: `₹${stats?.pending_balance?.toFixed(2) || '0.00'}`,
      icon: Clock,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      description: 'Processing'
    },
    {
      title: 'Commissions Received',
      value: stats?.commission_received_count || 0,
      icon: Award,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Total count'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">My Earnings</h1>
        <p className="text-dark-600 dark:text-dark-300">Track your income and commissions</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {earningCards.map((card, index) => (
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
            <p className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
              {card.value}
            </p>
            <p className="text-xs text-dark-500 dark:text-dark-400">
              {card.description}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">
            Referral Code
          </h2>
          <div className="flex gap-2">
            <button
              onClick={copyReferralCode}
              disabled={!stats?.referral_code}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-accent-bitcoin hover:bg-accent-orange text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
        <div className="bg-light-100 dark:bg-dark-700 rounded-xl p-6">
          <p className="text-3xl font-mono font-bold text-accent-bitcoin dark:text-accent-gold text-center">
            {stats?.referral_code || 'Not activated'}
          </p>
          <p className="text-sm text-dark-600 dark:text-dark-300 text-center mt-2">
            Share this code to earn commissions when others join
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">
            Commission History
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-bitcoin hover:bg-accent-orange text-white rounded-lg transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {commissions && commissions.length > 0 ? (
          <div className="space-y-3">
            {commissions.map((commission) => (
              <motion.div
                key={commission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-light-100 dark:bg-dark-700 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900 dark:text-white">
                      Commission from {commission.payer_username}
                    </p>
                    <p className="text-sm text-dark-600 dark:text-dark-300">
                      Level {commission.commission_level} • {commission.payer_email}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                      {new Date(commission.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +₹{commission.amount.toFixed(2)}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    commission.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    <CheckCircle className="w-3 h-3" />
                    {commission.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
            <p className="text-dark-600 dark:text-dark-300 text-lg">No commissions yet</p>
            <p className="text-dark-500 dark:text-dark-400 text-sm mt-2">
              Share your referral code to start earning
            </p>
          </div>
        )}
      </motion.div>

      {!stats?.is_mlm_active && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-lg text-white"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Award className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Activate Your Account</h3>
              <p className="text-white/90 mb-4">
                Purchase an activation package to start earning commissions from your referrals
              </p>
              <button className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-white/90 transition-all">
                Activate Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Earnings;
