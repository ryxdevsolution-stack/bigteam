import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Volume2,
  VolumeX,
  Loader2,
  Home,
  Search,
  User,
  DollarSign
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

interface FeedContent {
  id: string
  title: string
  content: string
  media_type: 'video' | 'image'
  media_url: string
  thumbnail_url: string
  created_by: string
  created_at: string
  likes_count: number
  shares_count: number
  views_count: number
  content_type: 'post' | 'ad'
  ad_type?: string
}

const ContentFeed: React.FC = () => {
  const [feedData, setFeedData] = useState<FeedContent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [touchStart, setTouchStart] = useState<number>(0)
  const [touchEnd, setTouchEnd] = useState<number>(0)

  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  useEffect(() => {
    fetchFeed()
  }, [])

  useEffect(() => {
    const currentContent = feedData[currentIndex]
    if (!currentContent) return

    // Handle current video
    if (currentContent.media_type === 'video') {
      const video = videoRefs.current[currentContent.id]
      if (video) {
        video.muted = isMuted
        video.play().catch(err => console.log('Play error:', err))
      }
    }

    // Pause all other videos
    feedData.forEach((item, index) => {
      if (index !== currentIndex && item.media_type === 'video') {
        const video = videoRefs.current[item.id]
        if (video) {
          video.pause()
          video.currentTime = 0
        }
      }
    })

    // Preload next content
    if (currentIndex < feedData.length - 1) {
      const nextContent = feedData[currentIndex + 1]
      if (nextContent?.media_type === 'video') {
        const nextVideo = videoRefs.current[nextContent.id]
        if (nextVideo) {
          nextVideo.load()
        }
      }
    }
  }, [currentIndex, feedData, isMuted])

  const fetchFeed = async (loadMore = false) => {
    if (!loadMore) setLoading(true)
    else setLoadingMore(true)

    try {
      const response = await api.get('/api/feed', {
        params: { page: loadMore ? page + 1 : 1, limit: 10 }
      })

      const { feed, has_more } = response.data

      if (loadMore) {
        setFeedData(prev => [...prev, ...feed])
        setPage(prev => prev + 1)
      } else {
        setFeedData(feed)
      }
      setHasMore(has_more)
    } catch (error) {
      console.error('Failed to fetch feed:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const navigateContent = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else if (direction === 'down' && currentIndex < feedData.length - 1) {
      setCurrentIndex(currentIndex + 1)

      // Load more when near end
      if (currentIndex >= feedData.length - 3 && hasMore && !loadingMore) {
        fetchFeed(true)
      }
    }
  }

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      // Swipe up - next content
      navigateContent('down')
    } else if (distance < -minSwipeDistance) {
      // Swipe down - previous content
      navigateContent('up')
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  // Mouse wheel handler for desktop
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (Math.abs(e.deltaY) < 10) return // Ignore small scrolls

    if (e.deltaY > 0) {
      navigateContent('down')
    } else {
      navigateContent('up')
    }
  }, [currentIndex, feedData.length])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    )
  }

  if (feedData.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-2">No content available</p>
          <p className="text-sm text-gray-400">Check back later for new posts</p>
        </div>
      </div>
    )
  }

  const currentContent = feedData[currentIndex]

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Content Container - Fully Responsive */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full h-full max-w-[100vw] sm:max-w-[600px] sm:h-[100vh] mx-auto bg-black">
          {/* Media Display */}
          {currentContent?.media_type === 'video' ? (
            <video
              ref={el => {
                if (el) videoRefs.current[currentContent.id] = el
              }}
              src={currentContent.media_url}
              className="w-full h-full object-contain"
              loop
              playsInline
              muted={isMuted}
              autoPlay
              preload="metadata"
            />
          ) : (
            <img
              src={currentContent?.media_url}
              alt={currentContent?.title}
              className="w-full h-full object-contain"
            />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

          {/* Ad Badge */}
          {currentContent?.content_type === 'ad' && (
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
              <div className="bg-yellow-400 text-black px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                SPONSORED
              </div>
            </div>
          )}

          {/* Top Left Menu Button - Only show on laptop/desktop - Navigate to dashboard with sidebar */}
          <button
            onClick={() => navigate('/user/mlm-tree')}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 p-2 sm:p-3 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all hidden lg:block"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mute/Unmute Button */}
          {currentContent?.media_type === 'video' && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 sm:p-3 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
          )}


          {/* Bottom Content Info - Responsive positioning */}
          <div className="absolute bottom-16 lg:bottom-4 left-0 right-0 p-4 sm:p-6 z-10">
            <div className="mb-2">
              <h2 className="text-white font-bold text-base sm:text-lg mb-1 drop-shadow-lg line-clamp-1">
                @{currentContent.created_by || 'BigTreat'}
              </h2>
              <p className="text-white text-sm sm:text-base drop-shadow-lg line-clamp-2">
                {currentContent.title}
              </p>
            </div>
            {currentContent.content && (
              <p className="text-white/90 text-xs sm:text-sm drop-shadow-lg line-clamp-2">
                {currentContent.content}
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="absolute top-1/2 right-1 -translate-y-1/2 z-10">
            <div className="flex flex-col items-center space-y-1">
              {feedData.map((_, index) => (
                <div
                  key={index}
                  className={`w-1 h-1 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white h-3'
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          )}

          {/* Swipe Instructions (Show on first load) */}
          {currentIndex === 0 && feedData.length > 1 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-3 animate-pulse">
                <p className="text-white text-sm text-center">
                  Swipe up for next
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar - Mobile/Tablet Only (hide on lg and above) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-white/10 lg:hidden">
        <div className="max-w-[600px] mx-auto px-2 py-2 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {/* Home/Feed - Active */}
            <button className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90">
              <Home className="w-6 h-6 text-white fill-white" strokeWidth={2} />
              <span className="text-white text-xs font-semibold mt-0.5">Home</span>
            </button>

            {/* Discover/Search */}
            <button
              onClick={() => navigate('/user/mlm-tree')}
              className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
            >
              <Search className="w-6 h-6 text-white" strokeWidth={2} />
              <span className="text-white/70 text-xs mt-0.5">Discover</span>
            </button>

            {/* BigTreat Logo */}
            <div className="flex flex-col items-center justify-center p-1">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-bitcoin via-accent-orange to-accent-gold flex items-center justify-center shadow-2xl border-2 border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
                <img src="/logo.png" alt="BigTreat" className="w-10 h-10 object-contain relative z-10" />
              </div>
            </div>

            {/* Earnings */}
            <button
              onClick={() => navigate('/user/earnings')}
              className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
            >
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2} />
              <span className="text-white/70 text-xs mt-0.5">Earnings</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate('/user/profile')}
              className="flex flex-col items-center justify-center p-2 transition-transform active:scale-90"
            >
              <User className="w-6 h-6 text-white" strokeWidth={2} />
              <span className="text-white/70 text-xs mt-0.5">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentFeed
