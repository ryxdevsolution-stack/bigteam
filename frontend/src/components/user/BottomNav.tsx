import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Image, Wallet, Video, Film } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-lg border-t border-light-300 dark:border-white/10 lg:hidden">
      <div className="max-w-full mx-auto px-2 py-1 sm:py-2 safe-area-inset-bottom">
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
            <span className={`text-xs mt-0.5 hidden sm:block ${
              isActive('/user/home')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Home
            </span>
          </button>

          {/* Videos */}
          <button
            onClick={() => navigate('/user/videos')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Film
              className={`w-6 h-6 ${
                isActive('/user/videos')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 hidden sm:block ${
              isActive('/user/videos')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Videos
            </span>
          </button>

          {/* Photos */}
          <button
            onClick={() => navigate('/user/photos')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Image
              className={`w-6 h-6 ${
                isActive('/user/photos')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 hidden sm:block ${
              isActive('/user/photos')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Photos
            </span>
          </button>

          {/* Logo - Center (navigates to Profile) */}
          <button
            onClick={() => navigate('/user/profile')}
            className="flex flex-col items-center justify-center p-1 transition-transform active:scale-90"
          >
            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full ${
              isActive('/user/profile')
                ? 'ring-2 ring-accent-bitcoin dark:ring-white'
                : ''
            }`}>
              <img src="/logo.png" alt="Profile" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
          </button>

          {/* Meetings */}
          <button
            onClick={() => navigate('/user/meetings')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Video
              className={`w-6 h-6 ${
                isActive('/user/meetings')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 hidden sm:block ${
              isActive('/user/meetings')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Meetings
            </span>
          </button>

          {/* Earnings */}
          <button
            onClick={() => navigate('/user/earnings')}
            className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
          >
            <Wallet
              className={`w-6 h-6 ${
                isActive('/user/earnings')
                  ? 'text-accent-bitcoin dark:text-white fill-accent-bitcoin dark:fill-white'
                  : 'text-dark-600 dark:text-white'
              }`}
              strokeWidth={2}
            />
            <span className={`text-xs mt-0.5 hidden sm:block ${
              isActive('/user/earnings')
                ? 'text-accent-bitcoin dark:text-white font-semibold'
                : 'text-dark-600 dark:text-white/70'
            }`}>
              Earnings
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
