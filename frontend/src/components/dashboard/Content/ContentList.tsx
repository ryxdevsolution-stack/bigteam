import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  MoreVertical,
  Heart,
  Share2,
  Clock,
  Calendar,
  Video,
  Image as ImageIcon,
  TrendingUp,
  Download,
  Copy
} from 'lucide-react'
import { Post } from '../../../types/post'

interface ContentListProps {
  posts: Post[]
  viewMode: 'grid' | 'list'
  onTogglePublish: (postId: string) => void
  onDelete: (postId: string) => void
  onEdit: (post: Post) => void
  isLoading?: boolean
}

const ContentList: React.FC<ContentListProps> = ({
  posts,
  viewMode,
  onTogglePublish,
  onDelete,
  onEdit,
  isLoading = false
}) => {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const toggleAllSelection = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(posts.map(post => post.id))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-bitcoin mx-auto"></div>
          <p className="mt-4 text-dark-600 dark:text-dark-400">Loading content...</p>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-24 h-24 rounded-full bg-light-200 dark:bg-dark-700 flex items-center justify-center mb-4">
          <Video className="w-12 h-12 text-dark-400" />
        </div>
        <h3 className="text-xl font-semibold text-dark-800 dark:text-white mb-2">No content yet</h3>
        <p className="text-dark-600 dark:text-dark-400 text-center max-w-md">
          Start by uploading your first video or image to share with your audience
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Bulk Actions Bar */}
      {selectedPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-accent-bitcoin/10 rounded-lg flex items-center justify-between"
        >
          <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
            {selectedPosts.length} item{selectedPosts.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-white dark:bg-dark-800 rounded-lg hover:shadow-md transition-shadow">
              Publish
            </button>
            <button className="px-3 py-1.5 text-sm bg-white dark:bg-dark-800 rounded-lg hover:shadow-md transition-shadow">
              Unpublish
            </button>
            <button className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
              Delete
            </button>
          </div>
        </motion.div>
      )}

      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-dark-900 group">
                  <img
                    src={post.thumbnail_url || post.media_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTUwIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
                    }}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(post)}
                          className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(post)}
                          className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => onDelete(post.id)}
                        className="p-2 rounded-full bg-red-500/80 backdrop-blur text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Media Type Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium backdrop-blur
                      ${post.media_type === 'video'
                        ? 'bg-blue-500/80 text-white'
                        : 'bg-green-500/80 text-white'
                      }
                    `}>
                      {post.media_type === 'video' ? (
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Video
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Image
                        </span>
                      )}
                    </span>
                    {!post.is_published && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/80 text-white backdrop-blur">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Selection Checkbox */}
                  <div className="absolute top-3 right-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="w-4 h-4 rounded border-white/50 bg-white/20 text-accent-bitcoin focus:ring-accent-bitcoin"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-dark-900 dark:text-white mb-1 truncate">
                    {post.title}
                  </h3>
                  <p className="text-sm text-dark-600 dark:text-dark-400 line-clamp-2 mb-3">
                    {post.content}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-dark-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.views_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {post.likes_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3.5 h-3.5" />
                        {post.shares_count}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-light-200 dark:border-dark-700">
                    <span className="text-xs text-dark-500">
                      {formatDate(post.created_at)}
                    </span>
                    <button
                      onClick={() => onTogglePublish(post.id)}
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${post.is_published
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-900/30'
                        }
                      `}
                    >
                      {post.is_published ? (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {/* List Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-dark-600 dark:text-dark-400 uppercase tracking-wider">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedPosts.length === posts.length && posts.length > 0}
                onChange={toggleAllSelection}
                className="w-4 h-4 rounded border-dark-400 text-accent-bitcoin focus:ring-accent-bitcoin"
              />
            </div>
            <div className="col-span-4">Content</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Stats</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1">Actions</div>
          </div>

          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white dark:bg-dark-800 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center">
                  {/* Checkbox */}
                  <div className="md:col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="w-4 h-4 rounded border-dark-400 text-accent-bitcoin focus:ring-accent-bitcoin"
                    />
                  </div>

                  {/* Content */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjUwIiB5PSI1MCIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-dark-900 dark:text-white truncate">
                        {post.title}
                      </h3>
                      <p className="text-sm text-dark-600 dark:text-dark-400 truncate">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="md:col-span-2">
                    <span className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${post.media_type === 'video'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      }
                    `}>
                      {post.media_type === 'video' ? (
                        <>
                          <Video className="w-3 h-3" />
                          Video
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3" />
                          Image
                        </>
                      )}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="md:col-span-2 flex items-center gap-3 text-sm text-dark-600 dark:text-dark-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {post.views_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes_count.toLocaleString()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <button
                      onClick={() => onTogglePublish(post.id)}
                      className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${post.is_published
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                        }
                      `}
                    >
                      {post.is_published ? 'Live' : 'Draft'}
                    </button>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-1 text-sm text-dark-600 dark:text-dark-400">
                    {formatDate(post.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}
                      className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-dark-600 dark:text-dark-400" />
                    </button>

                    {showDropdown === post.id && (
                      <div className="absolute right-0 top-10 w-48 bg-white dark:bg-dark-700 rounded-lg shadow-xl border border-light-200 dark:border-dark-600 z-10">
                        <button
                          onClick={() => {
                            onEdit(post)
                            setShowDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-light-50 dark:hover:bg-dark-600 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-light-50 dark:hover:bg-dark-600 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-light-50 dark:hover:bg-dark-600 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <hr className="my-1 border-light-200 dark:border-dark-600" />
                        <button
                          onClick={() => {
                            onDelete(post.id)
                            setShowDropdown(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default ContentList