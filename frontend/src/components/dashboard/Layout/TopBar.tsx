import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, ChevronDown, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TopBar: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    // Clear any auth tokens from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Navigate to login page
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-dark-800 bg-dark-900/50 backdrop-blur-xl">
      <div className="h-full px-4 md:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-glass-light backdrop-blur-sm border border-dark-800 focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/20 transition-all duration-200"
            />
            {searchQuery && (
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs rounded bg-dark-800 text-dark-400">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 ml-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-glass-light transition-all duration-200"
          >
            {isDarkMode ? (
              <Moon className="w-5 h-5 text-accent-yellow" />
            ) : (
              <Sun className="w-5 h-5 text-accent-yellow" />
            )}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 rounded-xl hover:bg-glass-light transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">David Owner</p>
                <p className="text-xs text-dark-400">admin@bigteam.net</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-900 border border-dark-800 shadow-xl backdrop-blur-xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-dark-800">
                    <p className="text-sm font-medium">David Owner</p>
                    <p className="text-xs text-dark-400">Administrator</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => navigate('/admin/profile')}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-glass-light transition-all duration-200 text-left"
                    >
                      <User className="w-4 h-4 text-dark-400" />
                      <span className="text-sm">Profile</span>
                    </button>
                    <button
                      onClick={() => navigate('/admin/settings')}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-glass-light transition-all duration-200 text-left"
                    >
                      <Settings className="w-4 h-4 text-dark-400" />
                      <span className="text-sm">Settings</span>
                    </button>
                    <hr className="my-2 border-dark-800" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-glass-light transition-all duration-200 text-accent-red text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;