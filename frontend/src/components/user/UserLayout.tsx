import React from 'react';
import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import BottomNav from './BottomNav';

const UserLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-light-50 via-light-100 to-accent-bitcoin/5 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
      <UserSidebar />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-8 xl:p-8">
          <div className="max-w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile/Tablet */}
      <BottomNav />
    </div>
  );
};

export default UserLayout;
