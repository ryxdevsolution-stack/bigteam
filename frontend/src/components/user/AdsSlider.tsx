import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Advertisement } from '../../contexts/DataContext';

interface AdsSliderProps {
  ads: Advertisement[];
  autoRotate?: boolean;
  interval?: number;
}

const AdsSlider: React.FC<AdsSliderProps> = ({
  ads,
  autoRotate = true,
  interval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoRotate || ads.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoRotate, ads.length, interval]);

  if (!ads || ads.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const currentAd = ads[currentIndex];

  const handleAdClick = () => {
    if (currentAd.link_url) {
      window.open(currentAd.link_url, '_blank');
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full aspect-video sm:aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-800 dark:to-dark-900 cursor-pointer"
          onClick={handleAdClick}
        >
          <img
            src={currentAd.media_url}
            alt={currentAd.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 md:p-6">
            <h3 className="text-white font-bold text-sm sm:text-lg md:text-xl mb-1 line-clamp-1">
              {currentAd.title}
            </h3>
            {currentAd.description && (
              <p className="text-white/90 text-xs sm:text-sm line-clamp-2">
                {currentAd.description}
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {ads.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-6 sm:w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdsSlider;
