import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, Heart, Share2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { Post } from '../../../types/post';

const PhotoTab: React.FC = () => {
  const { posts, postsLoading, fetchPosts } = useData();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const photos = posts.filter(post => post.media_type === 'image');

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClose = () => {
    setSelectedPhotoIndex(null);
  };

  const handlePrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-2">
            Photos
          </h1>
          <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300">
            Browse all photo content
          </p>
        </motion.div>

        {photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-12 text-center shadow-lg"
          >
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-dark-300 dark:text-dark-600" />
            <p className="text-dark-600 dark:text-dark-300">No photos available</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handlePhotoClick(index)}
                className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-shadow"
              >
                <img
                  src={photo.media_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2">
                    {photo.title}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-white/80 text-xs">
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
      </div>

      {/* Full-Screen Photo Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={handleClose}
          >
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={selectedPhoto.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={selectedPhoto.media_url}
                alt={selectedPhoto.title}
                className="max-w-full max-h-full object-contain"
              />

              <button
                onClick={handleClose}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 p-2 sm:p-3 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>

              {selectedPhotoIndex !== null && selectedPhotoIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </button>
              )}

              {selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
                <h2 className="text-white font-bold text-lg sm:text-xl mb-2">
                  @{selectedPhoto.created_by}
                </h2>
                <p className="text-white text-sm sm:text-base mb-3">
                  {selectedPhoto.title}
                </p>
                <div className="flex items-center gap-4 sm:gap-6 text-white/90 text-sm">
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    {selectedPhoto.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    {selectedPhoto.shares_count || 0}
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    {selectedPhoto.views_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhotoTab;
