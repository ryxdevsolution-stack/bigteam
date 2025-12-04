import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, X, Heart, Share2, Eye, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { PhotoGridSkeleton } from '../../shared/Skeleton';

const PhotoTab: React.FC = memo(() => {
  const navigate = useNavigate();
  const { posts, postsLoading, fetchPosts } = useData();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Filter photos
  const photos = useMemo(() =>
    posts.filter(post => post.media_type?.toLowerCase() === 'image'),
    [posts]
  );

  // Fetch posts if empty
  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts();
    }
  }, [fetchPosts, posts.length]);

  // Photo viewer handlers
  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      goToNext();
    }
    if (touchStart - touchEnd < -75) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') closePhotoViewer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex]);

  // Loading state
  if (postsLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-light-200 dark:bg-dark-700 rounded-lg animate-pulse" />
            <div className="h-8 w-32 bg-light-200 dark:bg-dark-700 rounded animate-pulse" />
          </div>
          <div className="h-4 w-48 bg-light-200 dark:bg-dark-700 rounded animate-pulse ml-14" />
        </div>
        <PhotoGridSkeleton count={8} />
      </div>
    );
  }

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/user/home')}
              className="p-2 hover:bg-light-100 dark:hover:bg-dark-700 rounded-lg transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-dark-900 dark:text-white" />
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
              Photos
            </h1>
          </div>
          <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300 ml-14">
            Browse all photo content
          </p>
        </div>

        {/* Photo Grid or Empty State */}
        {photos.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-12 text-center shadow-lg">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-dark-300 dark:text-dark-600" />
            <p className="text-dark-600 dark:text-dark-300">No photos available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => openPhotoViewer(index)}
                className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Photo Viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closePhotoViewer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo */}
            <img
              src={selectedPhoto.media_url}
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Close Button */}
            <button
              onClick={closePhotoViewer}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 p-2 sm:p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            {/* Previous Button */}
            {selectedPhotoIndex !== null && selectedPhotoIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </button>
            )}

            {/* Next Button */}
            {selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </button>
            )}

            {/* Photo Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-6 pb-safe">
              <h2 className="text-white font-bold text-base sm:text-lg mb-1">
                @{selectedPhoto.created_by}
              </h2>
              <p className="text-white/90 text-sm sm:text-base mb-3">
                {selectedPhoto.title}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="flex flex-col items-center gap-1">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="text-white text-xs font-semibold">{selectedPhoto.likes_count || 0}</span>
                  </span>
                  <span className="flex flex-col items-center gap-1">
                    <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="text-white text-xs font-semibold">{selectedPhoto.shares_count || 0}</span>
                  </span>
                  <span className="flex flex-col items-center gap-1">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                    <span className="text-white/70 text-xs font-semibold">{selectedPhoto.views_count || 0}</span>
                  </span>
                </div>
                {selectedPhotoIndex !== null && (
                  <span className="text-white/60 text-xs sm:text-sm font-medium">
                    {selectedPhotoIndex + 1} / {photos.length}
                  </span>
                )}
              </div>
              {/* Swipe hint for mobile */}
              <div className="flex items-center justify-center mt-3 lg:hidden">
                <span className="text-white/50 text-xs">Swipe left or right for more</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

PhotoTab.displayName = 'PhotoTab';

export default PhotoTab;
