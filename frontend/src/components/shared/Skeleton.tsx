/**
 * Skeleton Loading Component - Provides better UX than spinners
 * Reduces perceived loading time and prevents layout shift
 */
import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = memo(({ className = '' }) => (
  <div className={`animate-pulse bg-light-200 dark:bg-dark-700 rounded ${className}`} />
));

Skeleton.displayName = 'Skeleton';

// Video card skeleton
export const VideoCardSkeleton: React.FC = memo(() => (
  <div className="relative aspect-[9/16] rounded-lg sm:rounded-xl overflow-hidden">
    <Skeleton className="w-full h-full" />
  </div>
));

VideoCardSkeleton.displayName = 'VideoCardSkeleton';

// Photo card skeleton
export const PhotoCardSkeleton: React.FC = memo(() => (
  <div className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden">
    <Skeleton className="w-full h-full" />
  </div>
));

PhotoCardSkeleton.displayName = 'PhotoCardSkeleton';

// Grid skeleton for loading states
export const VideoGridSkeleton: React.FC<{ count?: number }> = memo(({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <VideoCardSkeleton key={i} />
    ))}
  </div>
));

VideoGridSkeleton.displayName = 'VideoGridSkeleton';

export const PhotoGridSkeleton: React.FC<{ count?: number }> = memo(({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <PhotoCardSkeleton key={i} />
    ))}
  </div>
));

PhotoGridSkeleton.displayName = 'PhotoGridSkeleton';

// Carousel skeleton
export const CarouselSkeleton: React.FC = memo(() => (
  <div className="h-[20rem] sm:h-[22rem] md:h-[26rem] bg-gradient-to-br from-accent-bitcoin/10 via-accent-orange/10 to-accent-gold/10 rounded-xl sm:rounded-2xl">
    <div className="flex flex-col items-center justify-center h-full">
      <Skeleton className="w-full max-w-xs h-40 sm:h-48 md:h-56 rounded-lg mb-4 mx-4" />
      <Skeleton className="w-48 h-8 mb-2" />
      <Skeleton className="w-32 h-4" />
    </div>
  </div>
));

CarouselSkeleton.displayName = 'CarouselSkeleton';

// Home page content skeleton
export const HomeContentSkeleton: React.FC = memo(() => (
  <div className="space-y-6 sm:space-y-8">
    <CarouselSkeleton />
    <div className="space-y-4">
      <Skeleton className="w-32 h-8" />
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[45vw] sm:w-[280px]">
            <VideoCardSkeleton />
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="w-32 h-8" />
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[45vw] sm:w-[280px]">
            <PhotoCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  </div>
));

HomeContentSkeleton.displayName = 'HomeContentSkeleton';

// Metric card skeleton
export const MetricCardSkeleton: React.FC = memo(() => (
  <div className="p-4 rounded-xl bg-white/80 dark:bg-glass-light backdrop-blur-xl border border-light-300 dark:border-dark-800">
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="w-16 h-4" />
    </div>
    <Skeleton className="w-24 h-4 mb-2" />
    <Skeleton className="w-16 h-8" />
  </div>
));

MetricCardSkeleton.displayName = 'MetricCardSkeleton';

// Table skeleton
export const TableRowSkeleton: React.FC = memo(() => (
  <tr className="border-b border-light-200 dark:border-dark-700">
    <td className="px-6 py-4"><Skeleton className="w-32 h-4" /></td>
    <td className="px-6 py-4"><Skeleton className="w-40 h-4" /></td>
    <td className="px-6 py-4"><Skeleton className="w-20 h-6 rounded-full" /></td>
    <td className="px-6 py-4"><Skeleton className="w-20 h-6 rounded-full" /></td>
    <td className="px-6 py-4"><Skeleton className="w-24 h-4" /></td>
    <td className="px-6 py-4"><Skeleton className="w-24 h-4" /></td>
    <td className="px-6 py-4"><Skeleton className="w-20 h-8" /></td>
  </tr>
));

TableRowSkeleton.displayName = 'TableRowSkeleton';

export default Skeleton;
