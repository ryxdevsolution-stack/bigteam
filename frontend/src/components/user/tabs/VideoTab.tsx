import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Heart, Share2, Eye, Volume2, VolumeX, ChevronLeft } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { Post } from '../../../types/post';

const VideoTab: React.FC = () => {
  const { posts, postsLoading, fetchPosts } = useData();
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const videos = posts.filter(post => post.media_type === 'video');

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (viewMode === 'feed' && videos.length > 0) {
      const currentVideo = videos[selectedVideoIndex];
      if (currentVideo) {
        const video = videoRefs.current[currentVideo.id];
        if (video) {
          video.muted = isMuted;
          video.play().catch(() => {});
        }
      }

      videos.forEach((item, index) => {
        if (index !== selectedVideoIndex) {
          const video = videoRefs.current[item.id];
          if (video) {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    }
  }, [viewMode, selectedVideoIndex, videos, isMuted]);

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index);
    setViewMode('feed');
  };

  const handleClose = () => {
    setViewMode('grid');
    const currentVideo = videos[selectedVideoIndex];
    if (currentVideo) {
      const video = videoRefs.current[currentVideo.id];
      if (video) {
        video.pause();
      }
    }
  };

  const handleSwipe = (direction: 'up' | 'down') => {
    if (direction === 'up' && selectedVideoIndex < videos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    } else if (direction === 'down' && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  if (viewMode === 'feed' && videos.length > 0) {
    const currentVideo = videos[selectedVideoIndex];

    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full max-w-screen-sm mx-auto bg-black">
            <video
              ref={el => { if (el) videoRefs.current[currentVideo.id] = el; }}
              src={currentVideo.media_url}
              className="w-full h-full object-contain"
              loop
              playsInline
              muted={isMuted}
              autoPlay
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

            <button
              onClick={handleClose}
              className="absolute top-4 left-4 z-10 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
            >
              {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
            </button>

            <div className="absolute bottom-20 left-0 right-0 p-6 z-10">
              <h2 className="text-white font-bold text-lg mb-2 drop-shadow-lg">
                @{currentVideo.created_by}
              </h2>
              <p className="text-white text-sm drop-shadow-lg line-clamp-2">
                {currentVideo.title}
              </p>
            </div>

            <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-10">
              <div className="flex flex-col items-center gap-1">
                <Heart className="w-8 h-8 text-white" />
                <span className="text-white text-xs">{currentVideo.likes_count || 0}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Share2 className="w-8 h-8 text-white" />
                <span className="text-white text-xs">{currentVideo.shares_count || 0}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Eye className="w-8 h-8 text-white" />
                <span className="text-white text-xs">{currentVideo.views_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <button
            onClick={() => handleSwipe('down')}
            disabled={selectedVideoIndex === 0}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handleSwipe('up')}
            disabled={selectedVideoIndex === videos.length - 1}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-2">
          Videos
        </h1>
        <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300">
          Browse all video content
        </p>
      </motion.div>

      {videos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-12 text-center shadow-lg"
        >
          <Play className="w-16 h-16 mx-auto mb-4 text-dark-300 dark:text-dark-600" />
          <p className="text-dark-600 dark:text-dark-300">No videos available</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleVideoClick(index)}
              className="relative aspect-[9/16] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-shadow"
            >
              <img
                src={video.thumbnail_url || video.media_url}
                alt={video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
                <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2">
                  {video.title}
                </p>
                <div className="flex items-center gap-2 sm:gap-3 mt-1 text-white/80 text-xs">
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
    </div>
  );
};

export default VideoTab;
