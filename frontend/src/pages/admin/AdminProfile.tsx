import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Users,
  FileVideo,
  TrendingUp,
  Activity,
  BarChart3,
  Megaphone,
  Edit3,
  Save,
  X,
  LogOut
} from 'lucide-react';
import { tokenUtils, cachedGet, cacheUtils } from '../../services/api';
import api from '../../services/api';
import authService from '../../services/authService';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalAds: number;
  recentActivity: number;
}

const AdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalAds: 0,
    recentActivity: 0
  });

  const [user, setUser] = useState(tokenUtils.getUser() || {});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', username: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    }
  };

  useEffect(() => {
    setEditForm({
      full_name: user.name || user.full_name || '',
      username: user.username || ''
    });
  }, [user]);

  const fetchAdminStats = useCallback(async (force: boolean = false) => {
    if (isFetchingRef.current && !force) return;
    if (hasFetchedRef.current && !force) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      if (force) {
        cacheUtils.invalidatePrefix('/api/admin');
      }

      // Fetch stats individually to handle errors gracefully
      let users: any[] = [];
      let posts: any[] = [];
      let ads: any[] = [];

      try {
        const usersResponse = await api.get('/auth/admin/users');
        users = usersResponse.data?.users || [];
      } catch (err) {
        console.warn('Could not fetch users');
      }

      try {
        const postsResponse = await cachedGet('/api/posts', { ttl: 30000 });
        posts = postsResponse.data?.posts || [];
      } catch (err) {
        console.warn('Could not fetch posts');
      }

      try {
        const adsResponse = await api.get('/api/ads');
        ads = adsResponse.data?.ads || adsResponse.data?.advertisements || [];
      } catch (err) {
        console.warn('Could not fetch advertisements');
      }

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.is_active_member).length,
        totalPosts: posts.length,
        totalAds: ads.length,
        recentActivity: users.filter((u: any) => {
          if (!u.created_at) return false;
          const created = new Date(u.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length
      });

      hasFetchedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const handleSaveProfile = async () => {
    if (!editForm.full_name.trim() || !editForm.username.trim()) {
      setError('Full name and username are required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put('/api/user/profile', {
        user_id: user.id,
        full_name: editForm.full_name.trim(),
        username: editForm.username.trim()
      });

      if (response.data.success) {
        // Update local storage and state
        const updatedUser = {
          ...user,
          name: editForm.full_name.trim(),
          full_name: editForm.full_name.trim(),
          username: editForm.username.trim()
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Profile updated successfully');
        setIsEditing(false);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setEditForm({
      full_name: user.name || user.full_name || '',
      username: user.username || ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
          <p className="text-dark-600 dark:text-dark-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-accent-bitcoin via-accent-orange to-accent-gold rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Admin Profile</h1>
            <p className="text-white/80 text-sm sm:text-base mt-1">Manage your account and view platform usage</p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors self-start sm:self-auto"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white text-accent-bitcoin rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-accent-bitcoin border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
        >
          {error}
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl"
        >
          {success}
        </motion.div>
      )}

      {/* Main Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Profile Header */}
        <div className="p-4 sm:p-6 border-b border-light-200 dark:border-dark-600">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center shadow-xl">
                <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-dark-800 bg-green-500 flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-light-100 dark:bg-dark-700 border border-light-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin text-dark-900 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Username</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">@</span>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                        className="w-full pl-8 pr-3 py-2 bg-light-100 dark:bg-dark-700 border border-light-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin text-dark-900 dark:text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-dark-900 dark:text-white">
                    {user.name || user.full_name || user.username || 'Admin User'}
                  </h2>
                  <p className="text-dark-500 dark:text-dark-400 text-sm sm:text-base mt-0.5">
                    @{user.username || 'admin'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-bitcoin/10 text-accent-bitcoin rounded-full text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      Administrator
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                      <Activity className="w-3 h-3" />
                      Active
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Email */}
            <div className="p-3 sm:p-4 bg-light-50 dark:bg-dark-700/50 rounded-lg sm:rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white truncate mt-0.5">
                    {user.email || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="p-3 sm:p-4 bg-light-50 dark:bg-dark-700/50 rounded-lg sm:rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Role</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white mt-0.5">
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="p-3 sm:p-4 bg-light-50 dark:bg-dark-700/50 rounded-lg sm:rounded-xl sm:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-semibold text-dark-900 dark:text-white mt-0.5">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not available'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Platform Usage Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-base sm:text-lg font-bold text-dark-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bitcoin" />
          Platform Usage
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Users */}
          <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 font-medium">Total Users</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-dark-900 dark:text-white mt-0.5 sm:mt-1">
              {stats.totalUsers}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1">
              {stats.activeUsers} active
            </p>
          </div>

          {/* Total Posts */}
          <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <FileVideo className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 font-medium">Total Posts</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-dark-900 dark:text-white mt-0.5 sm:mt-1">
              {stats.totalPosts}
            </p>
          </div>

          {/* Total Ads */}
          <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-lg">
                <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 font-medium">Total Ads</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-dark-900 dark:text-white mt-0.5 sm:mt-1">
              {stats.totalAds}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 font-medium">New This Week</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-dark-900 dark:text-white mt-0.5 sm:mt-1">
              {stats.recentActivity}
            </p>
            <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5 sm:mt-1">
              new users
            </p>
          </div>
        </div>
      </motion.div>

      {/* Account Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold">
                Administrator Access Active
              </h3>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">
                Full access to all platform features and settings
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-dark-800 text-red-600 dark:text-red-400 font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          {loggingOut ? (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </motion.div>
    </div>
  );
};

export default AdminProfile;
