import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Edit2,
  Save,
  Eye,
  Heart,
  MessageCircle,
  SkipBack,
  SkipForward,
  Settings,
  Info
} from 'lucide-react'
import { Post } from '../../../types/post'

interface MediaPreviewProps {
  post: Post
  onClose: () => void
  onSave: (post: Post) => void
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ post, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPost, setEditedPost] = useState(post)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          toggleFullscreen()
        } else {
          onClose()
        }
      }
      if (post.media_type === 'video' && videoRef.current) {
        switch (e.key) {
          case ' ':
            e.preventDefault()
            togglePlayPause()
            break
          case 'ArrowLeft':
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
            break
          case 'ArrowRight':
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
            break
          case 'ArrowUp':
            e.preventDefault()
            setVolume(prev => Math.min(1, prev + 0.1))
            break
          case 'ArrowDown':
            e.preventDefault()
            setVolume(prev => Math.max(0, prev - 0.1))
            break
          case 'm':
            toggleMute()
            break
          case 'f':
            toggleFullscreen()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, duration])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSave = () => {
    onSave(editedPost)
    setIsEditing(false)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full ${isFullscreen ? 'h-full' : 'max-w-6xl max-h-[90vh]'} bg-white dark:bg-dark-900 rounded-xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
          onMouseMove={handleMouseMove}
        >
          {/* Header */}
          {(!isFullscreen || showControls) && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPost.title}
                        onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
                        className="bg-white/20 backdrop-blur rounded-lg px-3 py-1 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      editedPost.title
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs bg-white/20 backdrop-blur text-white">
                      {post.media_type}
                    </span>
                    {post.is_published && (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/80 text-white">
                        Published
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditedPost(post)
                          setIsEditing(false)
                        }}
                        className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = post.media_url
                          link.download = post.title
                          link.click()
                        }}
                        className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Media Content */}
          <div className={`relative ${isFullscreen ? 'h-full' : 'h-[60vh]'} bg-black flex items-center justify-center`}>
            {post.media_type === 'video' ? (
              <>
                <video
                  ref={videoRef}
                  src={post.media_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlayPause}
                />

                {/* Video Controls */}
                {(!isFullscreen || showControls) && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                  >
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #f7931a 0%, #f7931a ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-white/80 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlayPause}
                          className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = Math.max(0, currentTime - 10)
                            }
                          }}
                          className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = Math.min(duration, currentTime + 10)
                            }
                          }}
                          className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>

                        {/* Volume Control */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleMute}
                            className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value)
                              setVolume(newVolume)
                              setIsMuted(newVolume === 0)
                            }}
                            className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Playback Speed */}
                        <select
                          value={playbackRate}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value)
                            setPlaybackRate(rate)
                            if (videoRef.current) {
                              videoRef.current.playbackRate = rate
                            }
                          }}
                          className="px-2 py-1 rounded bg-white/20 backdrop-blur text-white text-sm focus:outline-none"
                        >
                          <option value="0.5">0.5x</option>
                          <option value="0.75">0.75x</option>
                          <option value="1">1x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2x</option>
                        </select>

                        <button
                          onClick={toggleFullscreen}
                          className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                        >
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <img
                src={post.media_url || post.thumbnail_url || 'https://picsum.photos/1200/800'}
                alt={post.title}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Info Section */}
          {!isFullscreen && (
            <div className="p-6 bg-white dark:bg-dark-900">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Description */}
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-2">Description</h4>
                  {isEditing ? (
                    <textarea
                      value={editedPost.content}
                      onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })}
                      className="w-full p-3 border border-light-300 dark:border-dark-600 rounded-lg bg-light-50 dark:bg-dark-800 text-dark-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
                      rows={3}
                    />
                  ) : (
                    <p className="text-dark-600 dark:text-dark-400">{editedPost.content}</p>
                  )}
                </div>

                {/* Stats */}
                <div>
                  <h4 className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-3">Engagement</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-light-50 dark:bg-dark-800 rounded-lg">
                      <span className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                        <Eye className="w-4 h-4" />
                        Views
                      </span>
                      <span className="font-semibold text-dark-900 dark:text-white">
                        {post.views_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-light-50 dark:bg-dark-800 rounded-lg">
                      <span className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                        <Heart className="w-4 h-4" />
                        Likes
                      </span>
                      <span className="font-semibold text-dark-900 dark:text-white">
                        {post.likes_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-light-50 dark:bg-dark-800 rounded-lg">
                      <span className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                        <Share2 className="w-4 h-4" />
                        Shares
                      </span>
                      <span className="font-semibold text-dark-900 dark:text-white">
                        {post.shares_count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t border-light-200 dark:border-dark-700">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-dark-500">Created</span>
                    <p className="font-medium text-dark-900 dark:text-white">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-500">Updated</span>
                    <p className="font-medium text-dark-900 dark:text-white">
                      {new Date(post.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-500">Type</span>
                    <p className="font-medium text-dark-900 dark:text-white capitalize">
                      {post.media_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-500">Status</span>
                    <p className="font-medium text-dark-900 dark:text-white">
                      {post.is_published ? 'Published' : 'Draft'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MediaPreview