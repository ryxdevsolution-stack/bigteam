import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, ArrowDown, ArrowRight, CheckCircle, XCircle, Crown, Zap } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const MLMTree: React.FC = () => {
  const { mlmTree: treeData, mlmTreeLoading: loading, fetchMlmTree } = useData();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
      fetchMlmTree(user.id);
    }
  }, [user.id, fetchMlmTree]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  const UserNode = ({ userData, label, isActive, isYou = false }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-6 rounded-2xl shadow-xl ${
        isYou
          ? 'bg-gradient-to-br from-accent-bitcoin to-accent-orange text-white'
          : isActive
          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
          : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
      } min-w-[16rem] max-w-[20rem]`}
    >
      {isYou && (
        <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 rounded-full p-2 shadow-lg">
          <Crown className="w-5 h-5" />
        </div>
      )}

      <div className="flex items-center gap-4 mb-3">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
          isYou ? 'bg-white/20' : 'bg-white/30'
        }`}>
          <Users className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg truncate">{userData?.full_name || userData?.username || 'User'}</p>
          <p className="text-xs opacity-90 truncate">{userData?.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-90">{label}</span>
          {isActive ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">
              <XCircle className="w-3 h-3" />
              Inactive
            </span>
          )}
        </div>
        {userData?.total_earnings !== undefined && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-white/20">
            <span className="opacity-90">Earnings</span>
            <span className="font-bold">₹{userData.total_earnings?.toFixed(2) || '0.00'}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const ConnectionLine = ({ direction = 'down', animated = false }: { direction?: 'down' | 'right', animated?: boolean }) => (
    <div className={`flex items-center justify-center ${direction === 'down' ? 'h-12' : 'w-12'}`}>
      {direction === 'down' ? (
        <div className="relative h-full flex flex-col items-center">
          <div className="w-0.5 h-full bg-gradient-to-b from-accent-bitcoin to-accent-orange relative">
            {animated && (
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent-orange rounded-full shadow-lg"
                animate={{
                  y: [0, 40, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>
          <ArrowDown className="w-6 h-6 text-accent-bitcoin -mt-1" />
        </div>
      ) : (
        <div className="relative w-full flex items-center">
          <div className="h-0.5 w-full bg-gradient-to-r from-accent-bitcoin to-accent-orange relative">
            {animated && (
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-accent-orange rounded-full shadow-lg"
                animate={{
                  x: [0, 40, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>
          <ArrowRight className="w-6 h-6 text-accent-bitcoin -ml-1" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-4 lg:pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white mb-2">My Team Structure</h1>
        <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300">Visual representation of your MLM network</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white"
        >
          <Users className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-80" />
          <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">Total Referrals</h3>
          <p className="text-2xl sm:text-3xl font-bold">{treeData?.total_referrals || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white"
        >
          <Award className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-80" />
          <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">Active Referrals</h3>
          <p className="text-2xl sm:text-3xl font-bold">{treeData?.active_referrals || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white"
        >
          <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-80" />
          <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">Chain Position</h3>
          <p className="text-2xl sm:text-3xl font-bold">#{treeData?.chain_info?.position || 'N/A'}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-lg overflow-x-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <Zap className="w-6 h-6 text-accent-bitcoin" />
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Linear Chain Flow</h2>
        </div>

        <div className="flex flex-col items-center space-y-0 min-w-max">
          {/* Upline (Sponsor) */}
          {treeData?.upline && (
            <>
              <UserNode
                userData={treeData.upline}
                label="Your Sponsor (Upline)"
                isActive={treeData.upline.is_mlm_active}
              />
              <ConnectionLine direction="down" animated />
            </>
          )}

          {/* You (Current User) */}
          <UserNode
            userData={treeData?.user}
            label="You"
            isActive={treeData?.user.is_mlm_active}
            isYou={true}
          />

          {/* Downline (Your Referrals) */}
          {treeData?.downline && treeData.downline.length > 0 && (
            <>
              <ConnectionLine direction="down" animated />

              <div className="flex flex-wrap gap-6 justify-center items-start max-w-6xl">
                {treeData.downline.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <UserNode
                      userData={referral}
                      label={`Referral ${index + 1}`}
                      isActive={referral.is_mlm_active}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* No Downline Message */}
          {(!treeData?.downline || treeData.downline.length === 0) && (
            <>
              <ConnectionLine direction="down" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-light-100 dark:bg-dark-700 rounded-2xl p-8 text-center max-w-md"
              >
                <Users className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
                <p className="text-dark-600 dark:text-dark-300 text-lg font-semibold mb-2">
                  No Team Members Yet
                </p>
                <p className="text-dark-500 dark:text-dark-400 text-sm">
                  Share your referral code to build your team and start earning commissions
                </p>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Chain Position Info */}
      {treeData?.chain_info && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white"
        >
          <h2 className="text-xl font-bold mb-4">Your Position in Global Chain</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Position Number</p>
              <p className="text-3xl font-bold">#{treeData.chain_info.position}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Status</p>
              <p className={`text-2xl font-bold ${
                treeData.chain_info.is_active ? 'text-green-300' : 'text-gray-300'
              }`}>
                {treeData.chain_info.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Joined Chain</p>
              <p className="text-lg font-bold">
                {new Date(treeData.chain_info.joined_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white/10 backdrop-blur rounded-xl">
            <p className="text-sm opacity-90 mb-2">How It Works:</p>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• When you're <strong>active</strong>, you receive commissions from new users joining after you</li>
              <li>• After receiving <strong>2 commissions</strong>, you become inactive</li>
              <li>• You can <strong>reactivate</strong> anytime by making another purchase</li>
              <li>• Reactivation places you at the <strong>end of the chain</strong> with a new position</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white">You</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Your position in the network</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white">Active</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Eligible to receive commissions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark-900 dark:text-white">Inactive</p>
              <p className="text-xs text-dark-600 dark:text-dark-300">Received 2 commissions</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MLMTree;
