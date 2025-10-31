import React from 'react';
import { motion } from 'framer-motion';
import { Play, Eye, Heart, Video, Calendar, ArrowRight } from 'lucide-react';
import AdsSlider from '../AdsSlider';
import { useData } from '../../../contexts/DataContext';

interface HomeTabProps {
  onSeeMoreVideos: () => void;
  onSeeMorePhotos: () => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ onSeeMoreVideos, onSeeMorePhotos }) => {
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
  const ads = homeData?.ads || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* BigTeam Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 bg-gradient-to-br from-accent-bitcoin/10 via-accent-orange/10 to-accent-gold/10 rounded-xl sm:rounded-2xl"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mb-4 sm:mb-6">
          <img
            src="/logo.png"
            alt="BigTeam"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-bitcoin via-accent-orange to-accent-gold bg-clip-text text-transparent mb-2">
          BigTeam
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-dark-600 dark:text-dark-300 font-medium">
          Your Community Platform
        </p>
      </motion.div>

      {/* First Ads Slider */}
      {ads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AdsSlider ads={ads} />
        </motion.div>
      )}

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
            <button
              onClick={onSeeMoreVideos}
              className="flex items-center gap-1 text-sm sm:text-base text-accent-bitcoin hover:text-accent-orange transition-colors font-semibold"
            >
              See More
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 text-center">
            <Play className="w-12 h-12 mx-auto mb-3 text-dark-300 dark:text-dark-600" />
            <p className="text-dark-600 dark:text-dark-300">No videos available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={onSeeMoreVideos}
                className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-shadow"
              >
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
                  <div className="flex items-center gap-2 mt-0.5 text-white/80 text-xs">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {video.likes_count || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Second Ads Slider */}
      {ads.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AdsSlider ads={ads} />
        </motion.div>
      )}

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
            <button
              onClick={onSeeMorePhotos}
              className="flex items-center gap-1 text-sm sm:text-base text-accent-bitcoin hover:text-accent-orange transition-colors font-semibold"
            >
              See More
              <ArrowRight className="w-4 h-4" />
            </button>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                onClick={onSeeMorePhotos}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-shadow"
              >
                <img
                  src={photo.media_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-semibold line-clamp-2">{photo.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-white/80 text-xs">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {photo.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {photo.likes_count || 0}
                    </span>
                  </div>
                </div>
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
