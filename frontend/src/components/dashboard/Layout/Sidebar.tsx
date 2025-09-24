import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileVideo,
  BarChart3,
  DollarSign,
  Settings,
  Bell,
  LogOut,
  TrendingUp,
  Activity,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  User,
  ChevronDown,
  Palette
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
    { id: 'content', label: 'Content', icon: FileVideo, path: '/admin/content', badge: 12 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { id: 'revenue', label: 'Ad Revenue', icon: DollarSign, path: '/admin/revenue' },
    { id: 'performance', label: 'Performance', icon: Activity, path: '/admin/performance' },
  ];

  const notificationCount = 5; // This would come from your state management or API

  const isActive = (path: string) => location.pathname === path;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-light-200 dark:border-dark-700 bg-white/50 dark:bg-dark-900/50">
        <motion.div
          animate={{ width: isCollapsed ? 'auto' : '100%' }}
          className="flex items-center space-x-3"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center">
            <img src="/logo.png" alt="BigTeam" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-accent-orange to-accent-bitcoin bg-clip-text text-transparent">BigTeam</h1>
              <p className="text-[0.625rem] sm:text-xs text-dark-700 dark:text-dark-300 font-medium">Admin Panel</p>
            </div>
          )}
        </motion.div>
      </div>

      <nav className="flex-1 p-2 sm:p-3 md:p-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl transition-all duration-200
                  ${isActive(item.path)
                    ? 'bg-gradient-to-r from-accent-bitcoin to-accent-orange shadow-lg text-white'
                    : 'hover:bg-accent-bitcoin/10 dark:hover:bg-accent-bitcoin/20'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 ${
                      isActive(item.path) ? 'text-white' : 'text-dark-700 dark:text-dark-300'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className={`text-xs sm:text-sm md:text-base ${isActive(item.path) ? 'text-white font-semibold' : 'text-dark-800 dark:text-dark-100 font-medium'}`}>
                      {item.label}
                    </span>
                  )}
                </div>
                {!isCollapsed && item.badge && (
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'bg-accent-bitcoin/20 text-accent-orange dark:text-accent-gold'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-dark-300 dark:border-dark-800 p-2 sm:p-3 md:p-4" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center justify-between w-full p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-accent-bitcoin/10 to-accent-orange/10 hover:from-accent-bitcoin/20 hover:to-accent-orange/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-accent-bitcoin to-accent-orange flex items-center justify-center shadow-lg">
                  <User className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                </div>
                {notificationCount > 0 && !isCollapsed && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">
                      {notificationCount}
                    </span>
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs sm:text-sm font-bold text-dark-900 dark:text-white truncate">
                    {user.name || 'David Owner'}
                  </p>
                  <p className="text-[0.625rem] sm:text-xs text-dark-700 dark:text-dark-300 truncate font-medium">
                    {user.email || 'admin@bigteam.net'}
                  </p>
                  <p className="text-[0.625rem] sm:text-xs text-accent-bitcoin dark:text-accent-gold font-semibold">
                    {user.role || 'Administrator'}
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`w-4 h-4 text-dark-700 dark:text-dark-300 transition-transform ${
                isProfileDropdownOpen ? 'rotate-180' : ''
              }`} />
            )}
          </button>

          <AnimatePresence>
            {isProfileDropdownOpen && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-light-300 dark:border-dark-700 overflow-hidden"
              >
                <Link
                  to="/admin/notifications"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center justify-between w-full p-3 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-dark-700 dark:text-dark-300" />
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-200">Notifications</span>
                  </div>
                  {notificationCount > 0 && (
                    <span className="flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-red-500 text-white font-bold">
                      {notificationCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center space-x-3 w-full p-3 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-dark-700 dark:text-dark-300" />
                  <span className="text-sm font-medium text-dark-800 dark:text-dark-200">Settings</span>
                </Link>

                <button
                  onClick={() => {
                    toggleTheme();
                    setIsProfileDropdownOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full p-3 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-left"
                >
                  <Palette className="w-4 h-4 text-dark-700 dark:text-dark-300" />
                  <span className="text-sm font-medium text-dark-800 dark:text-dark-200">Theme</span>
                  <span className="ml-auto flex items-center space-x-1">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-accent-yellow" />
                    ) : (
                      <Moon className="w-4 h-4 text-accent-bitcoin" />
                    )}
                    <span className="text-xs text-dark-600 dark:text-dark-400">
                      {theme === 'dark' ? 'Light' : 'Dark'}
                    </span>
                  </span>
                </button>

                <div className="border-t border-light-300 dark:border-dark-700">
                  <button
                    onClick={() => {
                      localStorage.removeItem('authToken');
                      localStorage.removeItem('user');
                      window.location.href = '/login';
                    }}
                    className="flex items-center space-x-3 w-full p-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                  >
                    <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Log Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 z-50 p-1.5 sm:p-2 rounded-lg bg-white dark:bg-dark-900 border border-light-300 dark:border-dark-800 shadow-lg"
      >
        {isMobileOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 'auto' : 'auto' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          hidden lg:flex flex-col h-full bg-white/95 dark:bg-dark-900/80 backdrop-blur-2xl border-r border-light-200 dark:border-dark-700 shadow-xl
          ${isCollapsed ? 'w-16 xl:w-20' : 'w-56 xl:w-64 2xl:w-72'}
        `}
      >
        {sidebarContent}
      </motion.div>

      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isMobileOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="lg:hidden fixed inset-y-0 left-0 z-40 w-[70vw] sm:w-64 md:w-72 max-w-[20rem] flex flex-col bg-white dark:bg-dark-900/95 backdrop-blur-2xl border-r border-light-200 dark:border-dark-700 shadow-2xl"
      >
        {sidebarContent}
      </motion.div>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;