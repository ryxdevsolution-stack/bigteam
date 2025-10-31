import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, Clock, Plus } from 'lucide-react';

const MeetingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
            Zoom Meetings
          </h1>
          <button
            disabled
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Meeting</span>
          </button>
        </div>
        <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300">
          Manage your upcoming Zoom meetings and video calls
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 shadow-lg"
      >
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Video className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-dark-800 flex items-center justify-center shadow-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white mb-3">
            No Meetings Scheduled
          </h2>

          <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300 mb-6">
            You don't have any upcoming Zoom meetings at the moment. Schedule your first meeting to get started.
          </p>

          <div className="bg-light-100 dark:bg-dark-700 rounded-xl p-4 sm:p-6 w-full">
            <div className="flex items-start gap-3 text-left">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-dark-900 dark:text-white text-sm sm:text-base mb-1">
                  Coming Soon
                </h3>
                <p className="text-xs sm:text-sm text-dark-600 dark:text-dark-300">
                  Zoom meeting integration will be available soon. You'll be able to schedule, join, and manage video calls directly from here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MeetingsTab;
