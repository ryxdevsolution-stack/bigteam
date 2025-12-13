import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileVideo,
  Megaphone,
  User,
  Video,
  TrendingUp,
  Grid3X3,
  X,
  ChevronRight,
  Package
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  description?: string;
}

const AdminBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowMore(false);
  };

  // More menu items
  const moreItems: NavItem[] = [
    { path: '/admin/packages', icon: Package, label: 'Packages', description: 'Manage activation packages' },
    { path: '/admin/tree', icon: TrendingUp, label: 'User Tree', description: 'View commission chain' },
    { path: '/admin/meetings', icon: Video, label: 'Meetings', description: 'Manage video meetings' },
    { path: '/admin/profile', icon: User, label: 'Profile', description: 'Your account details' },
  ];

  // Check if any "more" menu item is active
  const isMoreActive = moreItems.some(item => isActive(item.path));
  const activeMoreItem = moreItems.find(item => isActive(item.path));

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowMore(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-900 rounded-t-3xl shadow-2xl lg:hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-dark-200 dark:bg-dark-700 rounded-full" />
              </div>

              <div className="px-5 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-dark-900 dark:text-white">More Options</h3>
                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">Additional features & settings</p>
                  </div>
                  <button
                    onClick={() => setShowMore(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-light-100 dark:bg-dark-800 hover:bg-light-200 dark:hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-dark-600 dark:text-dark-300" />
                  </button>
                </div>

                {/* Menu Items List */}
                <div className="space-y-2">
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-accent-bitcoin/10 to-accent-orange/10 border border-accent-bitcoin/20'
                            : 'bg-light-50 dark:bg-dark-800/80 border border-transparent hover:border-light-200 dark:hover:border-dark-700'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          active
                            ? 'bg-gradient-to-br from-accent-bitcoin to-accent-orange shadow-lg shadow-accent-bitcoin/20'
                            : 'bg-light-100 dark:bg-dark-700'
                        }`}>
                          <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-dark-600 dark:text-dark-300'}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-semibold ${
                            active ? 'text-accent-bitcoin dark:text-accent-orange' : 'text-dark-800 dark:text-white'
                          }`}>{item.label}</p>
                          <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">{item.description}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${
                          active ? 'text-accent-bitcoin dark:text-accent-orange' : 'text-dark-400 dark:text-dark-500'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl border-t border-light-200 dark:border-dark-800 lg:hidden">
        <div className="max-w-full mx-auto px-2 py-2 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {/* Dashboard */}
            <button
              onClick={() => handleNavigate('/admin/dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive('/admin/dashboard') ? 'bg-accent-bitcoin/10' : ''
              }`}
            >
              <LayoutDashboard
                className={`w-5 h-5 ${
                  isActive('/admin/dashboard')
                    ? 'text-accent-bitcoin dark:text-accent-orange'
                    : 'text-dark-400 dark:text-dark-500'
                }`}
                strokeWidth={isActive('/admin/dashboard') ? 2.5 : 2}
              />
              <span className={`text-[0.65rem] mt-1 ${
                isActive('/admin/dashboard')
                  ? 'text-accent-bitcoin dark:text-accent-orange font-semibold'
                  : 'text-dark-400 dark:text-dark-500'
              }`}>
                Home
              </span>
            </button>

            {/* Customers */}
            <button
              onClick={() => handleNavigate('/admin/customers')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive('/admin/customers') ? 'bg-accent-bitcoin/10' : ''
              }`}
            >
              <Users
                className={`w-5 h-5 ${
                  isActive('/admin/customers')
                    ? 'text-accent-bitcoin dark:text-accent-orange'
                    : 'text-dark-400 dark:text-dark-500'
                }`}
                strokeWidth={isActive('/admin/customers') ? 2.5 : 2}
              />
              <span className={`text-[0.65rem] mt-1 ${
                isActive('/admin/customers')
                  ? 'text-accent-bitcoin dark:text-accent-orange font-semibold'
                  : 'text-dark-400 dark:text-dark-500'
              }`}>
                Users
              </span>
            </button>

            {/* Content */}
            <button
              onClick={() => handleNavigate('/admin/content')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive('/admin/content') ? 'bg-accent-bitcoin/10' : ''
              }`}
            >
              <FileVideo
                className={`w-5 h-5 ${
                  isActive('/admin/content')
                    ? 'text-accent-bitcoin dark:text-accent-orange'
                    : 'text-dark-400 dark:text-dark-500'
                }`}
                strokeWidth={isActive('/admin/content') ? 2.5 : 2}
              />
              <span className={`text-[0.65rem] mt-1 ${
                isActive('/admin/content')
                  ? 'text-accent-bitcoin dark:text-accent-orange font-semibold'
                  : 'text-dark-400 dark:text-dark-500'
              }`}>
                Content
              </span>
            </button>

            {/* Ads */}
            <button
              onClick={() => handleNavigate('/admin/ads')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive('/admin/ads') ? 'bg-accent-bitcoin/10' : ''
              }`}
            >
              <Megaphone
                className={`w-5 h-5 ${
                  isActive('/admin/ads')
                    ? 'text-accent-bitcoin dark:text-accent-orange'
                    : 'text-dark-400 dark:text-dark-500'
                }`}
                strokeWidth={isActive('/admin/ads') ? 2.5 : 2}
              />
              <span className={`text-[0.65rem] mt-1 ${
                isActive('/admin/ads')
                  ? 'text-accent-bitcoin dark:text-accent-orange font-semibold'
                  : 'text-dark-400 dark:text-dark-500'
              }`}>
                Ads
              </span>
            </button>

            {/* More */}
            <button
              onClick={() => setShowMore(true)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${
                isMoreActive ? 'bg-accent-bitcoin/10' : ''
              }`}
            >
              <div className="relative">
                <Grid3X3
                  className={`w-5 h-5 ${
                    isMoreActive
                      ? 'text-accent-bitcoin dark:text-accent-orange'
                      : 'text-dark-400 dark:text-dark-500'
                  }`}
                  strokeWidth={isMoreActive ? 2.5 : 2}
                />
                {isMoreActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-accent-bitcoin to-accent-orange rounded-full ring-2 ring-white dark:ring-dark-900"
                  />
                )}
              </div>
              <span className={`text-[0.65rem] mt-1 ${
                isMoreActive
                  ? 'text-accent-bitcoin dark:text-accent-orange font-semibold'
                  : 'text-dark-400 dark:text-dark-500'
              }`}>
                {isMoreActive && activeMoreItem ? activeMoreItem.label : 'More'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminBottomNav;