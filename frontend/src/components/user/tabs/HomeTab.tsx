import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Video, Calendar, ArrowRight } from 'lucide-react';
import SponsorCarousel from '../SponsorCarousel';
import { useData } from '../../../contexts/DataContext';

const HomeTab: React.FC = () => {
  const { homeData, homeDataLoading } = useData();

  if (homeDataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  const videos = homeData?.videos || [];
  const photos = homeData?.photos || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Sponsor Carousel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SponsorCarousel />
      </motion.div>

      {/* Videos Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin" />
            Latest Videos
          </h2>
          {videos.length > 0 && (
            <Link
              to="/user/videos"
              className="flex items-center gap-1 text-sm sm:text-base text-accent-bitcoin hover:text-accent-orange transition-colors font-semibold"
            >
              See More
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 text-center">
            <Play className="w-12 h-12 mx-auto mb-3 text-dark-300 dark:text-dark-600" />
            <p className="text-dark-600 dark:text-dark-300">No videos available</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="relative flex-shrink-0 w-[45vw] sm:w-[280px] aspect-[9/16] rounded-lg overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow snap-start"
              >
                <Link to="/user/videos" className="block w-full h-full">
                <img
                  src={video.thumbnail_url || video.media_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-semibold line-clamp-2">{video.title}</p>
                </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Photos Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Latest Photos
          </h2>
          {photos.length > 0 && (
            <Link
              to="/user/photos"
              className="flex items-center gap-1 text-sm sm:text-base text-accent-bitcoin hover:text-accent-orange transition-colors font-semibold"
            >
              See More
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-dark-300 dark:text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-dark-600 dark:text-dark-300">No photos available</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="relative flex-shrink-0 w-[45vw] sm:w-[280px] aspect-square rounded-lg overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow snap-start"
              >
                <Link to="/user/photos" className="block w-full h-full">
                <img
                  src={photo.media_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-semibold line-clamp-2">{photo.title}</p>
                </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Zoom Meetings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">
            Upcoming Zoom Meetings
          </h2>
        </div>
        <div className="bg-white/50 dark:bg-dark-800/50 rounded-lg p-6 text-center">
          <Video className="w-12 h-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
          <p className="text-dark-700 dark:text-dark-200 font-medium mb-2">
            No meetings scheduled
          </p>
          <p className="text-sm text-dark-600 dark:text-dark-400">
            Zoom integration coming soon
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default HomeTab;
