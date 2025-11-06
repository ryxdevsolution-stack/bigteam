import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../contexts/DataContext';

const gradients = [
  'from-accent-bitcoin/10 via-accent-orange/10 to-accent-gold/10',
  'from-blue-500/10 via-purple-500/10 to-pink-500/10',
  'from-green-500/10 via-teal-500/10 to-cyan-500/10',
  'from-pink-500/10 via-rose-500/10 to-red-500/10',
  'from-indigo-500/10 via-blue-500/10 to-cyan-500/10'
];

const SponsorCarousel: React.FC = () => {
  const { homeData, homeDataLoading } = useData();
  const [currentIndex, setCurrentIndex] = useState(0);

  const ads = homeData?.ads || [];
  const hasAds = ads.length > 0;

  useEffect(() => {
    if (hasAds) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [hasAds, ads.length]);

  if (homeDataLoading) {
    return (
      <div className="flex items-center justify-center py-12 bg-gradient-to-br from-accent-bitcoin/10 via-accent-orange/10 to-accent-gold/10 rounded-xl sm:rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  if (!hasAds) {
    // Show default BigTeam banner if no ads
    return (
      <div className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 bg-gradient-to-br from-accent-bitcoin/10 via-accent-orange/10 to-accent-gold/10 rounded-xl sm:rounded-2xl">
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

  const currentAd = ads[currentIndex];
  const currentGradient = gradients[currentIndex % gradients.length];

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={`flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 bg-gradient-to-br ${currentGradient} rounded-xl sm:rounded-2xl cursor-pointer`}
          onClick={() => currentAd.link_url && window.open(currentAd.link_url, '_blank')}
        >
          {currentAd.media_type === 'image' && (
            <div className="w-full max-w-3xl mb-4 sm:mb-6">
              <img
                src={currentAd.media_url}
                alt={currentAd.title}
                className="w-full h-auto max-h-64 sm:max-h-80 object-contain drop-shadow-2xl rounded-lg"
              />
            </div>
          )}

          {currentAd.media_type === 'video' && (
            <div className="w-full max-w-3xl mb-4 sm:mb-6">
              <video
                key={currentAd.id}
                src={currentAd.media_url}
                className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-lg"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-bitcoin via-accent-orange to-accent-gold bg-clip-text text-transparent mb-2 text-center px-4">
            {currentAd.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-dark-600 dark:text-dark-300 font-medium text-center px-4">
            {currentAd.description}
          </p>

          {/* Indicator dots */}
          <div className="flex gap-2 mt-4">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-accent-bitcoin w-6'
                    : 'bg-dark-300 dark:bg-dark-600 hover:bg-dark-400'
                }`}
                aria-label={`Go to ad ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SponsorCarousel;
