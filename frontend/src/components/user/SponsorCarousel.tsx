import React, { useState, useEffect, memo, useMemo, useRef, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { CarouselSkeleton } from '../shared/Skeleton';

const SponsorCarousel: React.FC = memo(() => {
  const { homeData, homeDataLoading } = useData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get ads array
  const ads = useMemo(() => homeData?.ads || [], [homeData?.ads]);
  const hasAds = ads.length > 0;
  const currentAd = hasAds ? ads[currentIndex] : null;
  const isVideo = currentAd?.media_type?.toLowerCase() === 'video';

  // Play current video and pause others
  const playCurrentVideo = useCallback(() => {
    if (!currentAd) return;

    // Pause all videos first
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    });

    // Play current video if it's a video type
    if (isVideo && currentAd.id) {
      const video = videoRefs.current[currentAd.id];
      if (video) {
        video.muted = true;
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Auto-play prevented, try again
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      }
    }
  }, [currentAd, isVideo]);

  // Auto-rotate ads
  useEffect(() => {
    if (!hasAds || ads.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hasAds, ads.length]);

  // Play video when index changes
  useEffect(() => {
    // Small delay to ensure video element is mounted
    const timer = setTimeout(playCurrentVideo, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, playCurrentVideo]);

  // Handle dot click
  const handleDotClick = (index: number) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  // Handle ad click
  const handleAdClick = () => {
    if (currentAd?.link_url) {
      window.open(currentAd.link_url, '_blank');
    }
  };

  // Loading state
  if (homeDataLoading && !homeData) {
    return <CarouselSkeleton />;
  }

  // No ads - show default banner
  if (!hasAds) {
    return (
      <div className="flex flex-col items-center justify-center h-[20rem] sm:h-[22rem] md:h-[26rem] bg-gradient-to-br from-accent-bitcoin/10 via-accent-orange/10 to-accent-gold/10 rounded-xl sm:rounded-2xl">
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
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden h-[20rem] sm:h-[22rem] md:h-[26rem] rounded-xl sm:rounded-2xl bg-black">
      {/* Ad Content */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleAdClick}
      >
        {/* Image Ad */}
        {currentAd?.media_type?.toLowerCase() === 'image' && (
          <img
            key={`img-${currentAd.id}`}
            src={currentAd.media_url}
            alt={currentAd.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Video Ad - render current video */}
        {currentAd?.media_type?.toLowerCase() === 'video' && currentAd.media_url && (
          <video
            key={`vid-${currentAd.id}`}
            ref={el => { if (el) videoRefs.current[currentAd.id] = el; }}
            src={currentAd.media_url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              vid.muted = true;
              vid.play().catch(() => {});
            }}
            onError={(e) => {
              console.error('Video failed to load:', currentAd.media_url, e);
            }}
          />
        )}

        {/* Text Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 line-clamp-1">
            {currentAd?.title}
          </h1>
          {currentAd?.description && (
            <p className="text-xs sm:text-sm text-white/80 font-medium line-clamp-2">
              {currentAd.description}
            </p>
          )}
        </div>
      </div>

      {/* Indicator Dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75 w-2'
              }`}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

SponsorCarousel.displayName = 'SponsorCarousel';

export default SponsorCarousel;
