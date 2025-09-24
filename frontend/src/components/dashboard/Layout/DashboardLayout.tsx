import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { motion } from 'framer-motion';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-light-100 dark:bg-gradient-dark text-dark-900 dark:text-white transition-colors duration-300">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col w-full lg:ml-0">
          <main className="flex-1 overflow-y-auto bg-light-50 dark:bg-dark-950/50 pt-12 sm:pt-14 lg:pt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 2xl:p-10 max-w-[100vw] lg:max-w-[calc(100vw-14rem)] xl:max-w-[calc(100vw-16rem)] 2xl:max-w-[1920px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;