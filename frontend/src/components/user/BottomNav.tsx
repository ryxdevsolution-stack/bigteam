import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Network, DollarSign, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-lg border-t border-light-300 dark:border-white/10 lg:hidden">
      <div className="max-w-full mx-auto px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {/* Home */}
          <button
            onClick={() => navigate('/user/home')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Home
              className={`w-6 h-6 ${
                isActive('/user/home')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/user/home')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Home
            </span>
          </button>

          {/* Tree */}
          <button
            onClick={() => navigate('/user/tree-profile')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Network
              className={`w-6 h-6 ${
                isActive('/user/tree-profile')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/user/tree-profile')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Tree
            </span>
          </button>

          {/* BigTeam Logo - Center */}
          <div className="flex flex-col items-center justify-center p-1">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-bitcoin via-accent-orange to-accent-gold flex items-center justify-center shadow-2xl border-2 border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
              <img src="/logo.png" alt="BigTeam" className="w-10 h-10 object-contain relative z-10" />
            </div>
          </div>

          {/* Earnings */}
          <button
            onClick={() => navigate('/user/earnings')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <DollarSign
              className={`w-6 h-6 ${
                isActive('/user/earnings')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/user/earnings')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Earnings
            </span>
          </button>

          {/* Profile */}
          <button
            onClick={() => navigate('/user/profile')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <User
              className={`w-6 h-6 ${
                isActive('/user/profile')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 ${
              isActive('/user/profile')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Profile
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
