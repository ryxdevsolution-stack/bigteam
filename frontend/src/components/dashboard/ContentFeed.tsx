import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Heart,
  Share2,
  Eye,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react'
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
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false) // Changed to false for better UX
  const [interacting, setInteracting] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  useEffect(() => {
    fetchFeed()
  }, [])

  useEffect(() => {
    // Auto-play current video
    if (feedData[currentIndex]?.media_type === 'video') {
      const video = videoRefs.current[feedData[currentIndex].id]
      if (video) {
        video.muted = isMuted
        if (isPlaying) {
          // Ensure video is loaded before playing
          if (video.readyState >= 3) {
            video.play().catch(console.error)
          } else {
            video.addEventListener('loadeddata', () => {
              video.play().catch(console.error)
            }, { once: true })
          }
        } else {
          video.pause()
        }
      }
    }

    // Pause other videos and preload next video
    feedData.forEach((item, index) => {
      if (index !== currentIndex && item.media_type === 'video') {
        const video = videoRefs.current[item.id]
        if (video) {
          video.pause()
          // Preload next video
          if (index === currentIndex + 1) {
            video.load()
          }
        }
      }
    })
  }, [currentIndex, feedData, isPlaying, isMuted])

  const fetchFeed = async (loadMore = false) => {
    if (!loadMore) setLoading(true)
    else setLoadingMore(true)

    try {
      const response = await api.get('/api/feed', {
        params: { page: loadMore ? page + 1 : 1, limit: 5 } // Reduced for faster loading
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

  const handleInteraction = async (contentId: string, type: 'like' | 'share') => {
    setInteracting(`${contentId}-${type}`)

    try {
      const response = await api.post(`/api/feed/${contentId}/interact`, { type })

      if (response.data.success) {
        setFeedData(prev =>
          prev.map(item => {
            if (item.id === contentId) {
              if (type === 'like') {
                return { ...item, likes_count: response.data.new_count }
              } else {
                return { ...item, shares_count: response.data.new_count }
              }
            }
            return item
          })
        )
      }
    } catch (error) {
      console.error('Interaction failed:', error)
    } finally {
      setTimeout(() => setInteracting(null), 300)
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') navigateContent('up')
    if (e.key === 'ArrowDown') navigateContent('down')
    if (e.key === ' ') {
      e.preventDefault()
      setIsPlaying(prev => !prev)
    }
  }, [currentIndex, feedData.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
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
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  const currentContent = feedData[currentIndex]

  return (
    <div ref={containerRef} className="h-screen bg-black overflow-hidden relative">
      {feedData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white">
          <p>No content available</p>
        </div>
      ) : (
        <>
          {/* Main Content */}
          <div className="relative h-full flex items-center justify-center">
            <div className="relative w-full max-w-md mx-auto h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-gray-900">
              {currentContent?.media_type === 'video' ? (
                <video
                  ref={el => {
                    if (el) videoRefs.current[currentContent.id] = el
                  }}
                  src={currentContent.media_url}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted={isMuted}
                  autoPlay
                  preload="auto"
                  onClick={() => setIsPlaying(!isPlaying)}
                />
              ) : (
                <img
                  src={currentContent?.media_url}
                  alt={currentContent?.title}
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {/* Ad Badge */}
              {currentContent?.content_type === 'ad' && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                  AD
                </div>
              )}

              {/* Video Controls */}
              {currentContent?.media_type === 'video' && (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                >
                  {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
                </button>
              )}

              {/* Side Actions */}
              <div className="absolute right-2 bottom-20 flex flex-col items-center space-y-6">
                {/* Like */}
                <button
                  onClick={() => handleInteraction(currentContent.id, 'like')}
                  className={`flex flex-col items-center transition-transform ${
                    interacting === `${currentContent.id}-like` ? 'scale-125' : ''
                  }`}
                >
                  <Heart
                    className={`w-8 h-8 ${
                      interacting === `${currentContent.id}-like`
                        ? 'text-red-500 fill-red-500'
                        : 'text-white'
                    }`}
                  />
                  <span className="text-white text-xs mt-1">
                    {currentContent.likes_count > 0 ?
                      currentContent.likes_count >= 1000
                        ? `${(currentContent.likes_count / 1000).toFixed(1)}k`
                        : currentContent.likes_count
                      : '0'
                    }
                  </span>
                </button>

                {/* Share */}
                <button
                  onClick={() => handleInteraction(currentContent.id, 'share')}
                  className={`flex flex-col items-center transition-transform ${
                    interacting === `${currentContent.id}-share` ? 'scale-125' : ''
                  }`}
                >
                  <Share2 className="w-8 h-8 text-white" />
                  <span className="text-white text-xs mt-1">
                    {currentContent.shares_count > 0 ?
                      currentContent.shares_count >= 1000
                        ? `${(currentContent.shares_count / 1000).toFixed(1)}k`
                        : currentContent.shares_count
                      : '0'
                    }
                  </span>
                </button>

                {/* Views */}
                <div className="flex flex-col items-center">
                  <Eye className="w-8 h-8 text-white" />
                  <span className="text-white text-xs mt-1">
                    {currentContent.views_count > 0 ?
                      currentContent.views_count >= 1000
                        ? `${(currentContent.views_count / 1000).toFixed(1)}k`
                        : currentContent.views_count
                      : '0'
                    }
                  </span>
                </div>

                {/* Sound Toggle */}
                {currentContent?.media_type === 'video' && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-black/30 rounded-full"
                  >
                    {isMuted ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                )}
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-medium">@{currentContent?.created_by}</p>
                <h3 className="text-white text-base font-semibold mt-1">{currentContent?.title}</h3>
                {currentContent?.content && (
                  <p className="text-white/80 text-sm mt-1 line-clamp-2">{currentContent.content}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => navigateContent('up')}
            disabled={currentIndex === 0}
            className="absolute top-4 left-1/2 -translate-x-1/2 p-2 bg-white/20 rounded-full disabled:opacity-30 hover:bg-white/30 transition-colors md:hidden"
          >
            <ChevronUp className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => navigateContent('down')}
            disabled={currentIndex === feedData.length - 1 && !hasMore}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 bg-white/20 rounded-full disabled:opacity-30 hover:bg-white/30 transition-colors md:hidden"
          >
            <ChevronDown className="w-6 h-6 text-white" />
          </button>

          {/* Progress Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / feedData.length) * 100}%` }}
            />
          </div>

          {/* Desktop Navigation Hints */}
          <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center space-y-4 text-white/50">
            <div className="text-xs">↑ Previous</div>
            <div className="text-xs">↓ Next</div>
            <div className="text-xs">Space: Play/Pause</div>
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ContentFeed