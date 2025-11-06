import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Volume2, VolumeX, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';

const VideoTab: React.FC = () => {
  const navigate = useNavigate();
  const { posts, postsLoading, fetchPosts } = useData();
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>(() => {
    // Auto-open in feed mode on mobile
    return window.innerWidth < 1024 ? 'feed' : 'grid';
  });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const videos = posts.filter(post => post.media_type === 'video');

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Auto-play video when it's in view (for mobile scroll reels)
  useEffect(() => {
    if (viewMode === 'feed' && videos.length > 0) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target as HTMLVideoElement;
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.7 }
      );

      Object.values(videoRefs.current).forEach((video) => {
        if (video && observerRef.current) {
          observerRef.current.observe(video);
        }
      });

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [viewMode, videos]);

  // Mute/unmute all videos
  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index);
    setViewMode('feed');

    // Scroll to the selected video after a short delay to ensure DOM is ready
    setTimeout(() => {
      const videoElement = document.getElementById(`video-${videos[index].id}`);
      if (videoElement) {
        videoElement.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }, 100);
  };

  const handleClose = () => {
    // Pause all videos before closing
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.pause();
      }
    });

    setViewMode('grid');

    // Scroll to top of grid view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (postsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  if (viewMode === 'feed' && videos.length > 0) {
    return (
      <>
        <style>{`
          .reels-container::-webkit-scrollbar {
            display: none;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .reels-container {
            animation: fadeIn 0.2s ease-in;
          }
        `}</style>
        {/* Mobile: Vertical Scrollable Reels */}
        <div
          className="reels-container fixed inset-0 bg-black z-[100] lg:hidden overflow-y-scroll snap-y snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map((video, index) => (
            <div
              key={video.id}
              id={`video-${video.id}`}
              className="relative w-full h-screen snap-start snap-always flex items-center justify-center"
            >
              <video
                ref={el => { if (el) videoRefs.current[video.id] = el; }}
                src={video.media_url}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
              />

              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />

              <button
                onClick={handleClose}
                className="absolute top-4 left-4 z-10 p-2.5 bg-black/50 backdrop-blur-md rounded-full active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-black/50 backdrop-blur-md rounded-full active:scale-95 transition-transform"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>

              <div className="absolute bottom-24 left-0 right-0 px-4 z-10 pointer-events-none">
                <h2 className="text-white font-bold text-base mb-1 drop-shadow-lg">
                  @{video.created_by}
                </h2>
                <p className="text-white text-sm drop-shadow-lg line-clamp-2">
                  {video.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Single Video View */}
        <div className="hidden lg:block h-[600px] bg-black rounded-2xl overflow-hidden">
          <div className="relative w-full h-full max-w-md mx-auto">
            <video
              ref={el => { if (el) videoRefs.current[videos[selectedVideoIndex].id] = el; }}
              src={videos[selectedVideoIndex].media_url}
              className="w-full h-full object-contain"
              loop
              playsInline
              muted={isMuted}
              autoPlay
            />
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
            <div className="absolute bottom-8 left-4 right-4 text-white">
              <h2 className="font-bold mb-1">@{videos[selectedVideoIndex].created_by}</h2>
              <p className="text-sm line-clamp-2">{videos[selectedVideoIndex].title}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/user/home')}
            className="p-2 hover:bg-light-100 dark:hover:bg-dark-700 rounded-lg transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-dark-900 dark:text-white" />
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
            Videos
          </h1>
        </div>
        <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300 ml-14">
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
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoTab;
