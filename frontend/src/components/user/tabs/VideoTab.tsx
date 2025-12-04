import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Volume2, VolumeX, Play, Pause, ArrowLeft } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import api from '../../../services/api';

const VideoTab: React.FC = memo(() => {
  const navigate = useNavigate();
  const { posts, postsLoading, fetchPosts } = useData();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const viewTrackedRef = useRef<Set<string>>(new Set());
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter videos only
  const videos = useMemo(
    () => posts.filter(post => post.media_type?.toLowerCase() === 'video'),
    [posts]
  );

  // Fetch posts if needed
  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts();
    }
  }, [fetchPosts, posts.length]);

  // Current video object
  const currentVideo = videos[currentIndex];

  // Track view (fire and forget)
  const trackView = useCallback(async (contentId: string) => {
    if (viewTrackedRef.current.has(contentId)) return;
    viewTrackedRef.current.add(contentId);
    try {
      await api.post(`/api/feed/${contentId}/interact`, {
        type: 'view'
      });
    } catch {
      // Silent fail - view tracking is non-critical
    }
  }, []);

  // Track view when video changes
  useEffect(() => {
    if (currentVideo) {
      trackView(currentVideo.id);
    }
  }, [currentVideo, trackView]);

  // Video playback management
  useEffect(() => {
    if (!currentVideo) return;

    const video = videoRefs.current[currentVideo.id];
    if (video) {
      video.muted = isMuted;
      if (isPlaying) {
        // Small delay to ensure video element is ready
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Auto-play was prevented, try muted
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      } else {
        video.pause();
      }
    }

    // Pause other videos
    videos.forEach((v, i) => {
      if (i !== currentIndex) {
        const otherVideo = videoRefs.current[v.id];
        if (otherVideo) {
          otherVideo.pause();
          otherVideo.currentTime = 0;
        }
      }
    });
  }, [currentIndex, currentVideo, videos, isMuted, isPlaying]);

  // Navigation
  const navigateContent = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'up' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setIsPlaying(true);
        setShowHint(false);
      } else if (direction === 'down' && currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsPlaying(true);
        setShowHint(false);
      }
    },
    [currentIndex, videos.length]
  );

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) navigateContent('down');
    else if (distance < -50) navigateContent('up');
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Wheel handler with debouncing - one video per scroll
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      // Ignore if already scrolling or delta is too small
      if (isScrollingRef.current || Math.abs(e.deltaY) < 30) return;

      // Set scrolling flag to prevent multiple triggers
      isScrollingRef.current = true;

      // Navigate based on scroll direction
      if (e.deltaY > 0) {
        navigateContent('down');
      } else {
        navigateContent('up');
      }

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Reset scrolling flag after delay (prevents rapid scrolling)
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 400); // 400ms cooldown between scrolls
    },
    [navigateContent]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
        // Cleanup timeout on unmount
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleWheel]);

  // Play/Pause toggle
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  };

  // Hide hint after timeout
  useEffect(() => {
    if (showHint && videos.length > 1) {
      const timer = setTimeout(() => setShowHint(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showHint, videos.length]);

  // Loading state
  if (postsLoading && posts.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-40">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-40">
        <button
          onClick={() => navigate('/user/home')}
          className="absolute top-4 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <Play className="w-10 h-10 text-white/60" />
          </div>
          <p className="text-xl text-white mb-2">No videos available</p>
          <p className="text-sm text-gray-400">Check back later for new content</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden z-40"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full h-full max-w-full sm:max-w-[600px] mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/user/home')}
            className="absolute top-4 left-4 z-20 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Videos - render current and adjacent for preloading */}
          {videos.map((video, index) => {
            const isCurrentVideo = index === currentIndex;
            const isAdjacentVideo = Math.abs(index - currentIndex) === 1;

            // Only render current and adjacent videos for performance
            if (!isCurrentVideo && !isAdjacentVideo) return null;

            return (
              <video
                key={video.id}
                ref={el => {
                  if (el) videoRefs.current[video.id] = el;
                }}
                src={video.media_url}
                poster={video.thumbnail_url}
                className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-opacity duration-300 ${
                  isCurrentVideo ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                loop
                playsInline
                muted={isMuted}
                autoPlay={isCurrentVideo}
                preload={isAdjacentVideo ? 'metadata' : 'auto'}
                onClick={isCurrentVideo ? togglePlayPause : undefined}
              />
            );
          })}

          {/* Play/Pause indicator (brief flash) */}
          {showPlayIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="p-4 bg-black/50 rounded-full animate-pulse">
                {isPlaying ? (
                  <Play className="w-12 h-12 text-white" />
                ) : (
                  <Pause className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
          )}

          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-4 right-4 z-20 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Progress dots */}
          {videos.length > 1 && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10">
              <div className="flex flex-col items-center space-y-1.5">
                {videos.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsPlaying(true);
                      setShowHint(false);
                    }}
                    className={`rounded-full transition-all ${
                      i === currentIndex
                        ? 'bg-white w-2 h-4'
                        : 'bg-white/40 w-1.5 h-1.5 hover:bg-white/60'
                    }`}
                  />
                ))}
                {videos.length > 8 && (
                  <span className="text-white/60 text-xs mt-1">+{videos.length - 8}</span>
                )}
              </div>
            </div>
          )}

          {/* Video counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {videos.length}
              </span>
            </div>
          </div>

          {/* Swipe hint (first video only) */}
          {showHint && currentIndex === 0 && videos.length > 1 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-bounce">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-3">
                <p className="text-white text-sm">Swipe up for next</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

VideoTab.displayName = 'VideoTab';
export default VideoTab;
