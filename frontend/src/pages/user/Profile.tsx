import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Copy, CheckCircle, Calendar, Award } from 'lucide-react';
import { userService } from '../../services/userService';

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getUserProfile(user.id);
        setProfile(response.data.user);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      fetchProfile();
    }
  }, [user.id]);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-dark-600 dark:text-dark-300">Manage your account information</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-lg"
      >
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center shadow-xl">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
              {profile?.full_name || 'User'}
            </h2>
            <p className="text-dark-600 dark:text-dark-300 flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {profile?.email}
            </p>
            <p className="text-sm text-accent-bitcoin dark:text-accent-gold font-semibold mt-1 capitalize">
              {profile?.role || 'Member'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-dark-600 dark:text-dark-300">Username</label>
              <p className="text-lg font-semibold text-dark-900 dark:text-white mt-1">
                @{profile?.username}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-600 dark:text-dark-300">Member Since</label>
              <p className="text-lg font-semibold text-dark-900 dark:text-white mt-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-bitcoin" />
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-dark-600 dark:text-dark-300">Referral Code</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-light-100 dark:bg-dark-700 rounded-lg p-3">
                  <p className="text-lg font-mono font-bold text-accent-bitcoin dark:text-accent-gold">
                    {profile?.referral_code || 'Not activated'}
                  </p>
                </div>
                <button
                  onClick={copyReferralCode}
                  disabled={!profile?.referral_code}
                  className={`p-3 rounded-lg transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-accent-bitcoin hover:bg-accent-orange text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-600 dark:text-dark-300">MLM Status</label>
              <div className={`mt-1 p-3 rounded-lg flex items-center gap-2 ${
                profile?.is_mlm_active
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
              }`}>
                <Award className="w-5 h-5" />
                <span className="font-semibold">
                  {profile?.is_mlm_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-4">MLM Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-light-100 dark:bg-dark-700 rounded-xl">
            <p className="text-sm text-dark-600 dark:text-dark-300 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-dark-900 dark:text-white">
              ₹{profile?.total_earnings?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-4 bg-light-100 dark:bg-dark-700 rounded-xl">
            <p className="text-sm text-dark-600 dark:text-dark-300 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-dark-900 dark:text-white">
              ₹{profile?.available_balance?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-4 bg-light-100 dark:bg-dark-700 rounded-xl">
            <p className="text-sm text-dark-600 dark:text-dark-300 mb-1">Commissions Received</p>
            <p className="text-2xl font-bold text-dark-900 dark:text-white">
              {profile?.commission_received_count || 0}
            </p>
          </div>
          <div className="p-4 bg-light-100 dark:bg-dark-700 rounded-xl">
            <p className="text-sm text-dark-600 dark:text-dark-300 mb-1">Pending Balance</p>
            <p className="text-2xl font-bold text-dark-900 dark:text-white">
              ₹{profile?.pending_balance?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfile;
