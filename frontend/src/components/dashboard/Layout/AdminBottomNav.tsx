import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileVideo, Megaphone, TrendingUp } from 'lucide-react';

const AdminBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-lg border-t border-light-300 dark:border-white/10 lg:hidden">
      <div className="max-w-full mx-auto px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {/* Dashboard */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <LayoutDashboard
              className={`w-6 h-6 ${
                isActive('/admin/dashboard')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/admin/dashboard')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Dashboard
            </span>
          </button>

          {/* Customers */}
          <button
            onClick={() => navigate('/admin/customers')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Users
              className={`w-6 h-6 ${
                isActive('/admin/customers')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/admin/customers')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Users
            </span>
          </button>

          {/* User Tree */}
          <button
            onClick={() => navigate('/admin/tree')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <TrendingUp
              className={`w-6 h-6 ${
                isActive('/admin/tree')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/admin/tree')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Tree
            </span>
          </button>

          {/* Content */}
          <button
            onClick={() => navigate('/admin/content')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <FileVideo
              className={`w-6 h-6 ${
                isActive('/admin/content')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/admin/content')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Content
            </span>
          </button>

          {/* Ads */}
          <button
            onClick={() => navigate('/admin/ads')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Megaphone
              className={`w-6 h-6 ${
                isActive('/admin/ads')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/admin/ads')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Ads
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBottomNav;