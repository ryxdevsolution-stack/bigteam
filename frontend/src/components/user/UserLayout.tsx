import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import BottomNav from './BottomNav';

const UserLayout: React.FC = () => {
  const location = useLocation();
  const isFeedPage = location.pathname === '/user/feed';

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-light-50 via-light-100 to-accent-bitcoin/5 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
      <UserSidebar />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <main className={`flex-1 overflow-y-auto ${isFeedPage ? 'p-0' : 'p-4 pb-24 lg:p-6 lg:pb-8 xl:p-8'}`}>
          <div className="max-w-full mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile/Tablet - Hidden on Feed page as ContentFeed has its own */}
      {!isFeedPage && <BottomNav />}
    </div>
  );
};

export default UserLayout;
