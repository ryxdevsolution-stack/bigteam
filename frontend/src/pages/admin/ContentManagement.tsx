import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid3X3,
  List,
  Plus,
  Video,
  Image,
  Eye,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import MediaUpload from '../../components/dashboard/Content/MediaUpload'
import MediaPreview from '../../components/dashboard/Content/MediaPreview'
import ContentList from '../../components/dashboard/Content/ContentList'
import { Post } from '../../types/post'
import { postService } from '../../services/postService'
import { useData } from '../../contexts/DataContext'

const ContentManagement: React.FC = () => {
  const { posts, postsLoading, postsError, fetchPosts, addPost, updatePost: updatePostInContext, deletePost: deletePostFromContext } = useData()

  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'images'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-viewed' | 'most-liked'>('newest')

  // Stats for dashboard
  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.is_published).length,
    totalViews: posts.reduce((acc, post) => acc + post.views_count, 0),
    totalEngagement: posts.reduce((acc, post) => acc + post.likes_count + post.shares_count, 0)
  }

  // Load posts on component mount - will use cached data if available
  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    // Filter and sort posts
    let filtered = posts

    // Filter by media type
    if (activeTab === 'videos') {
      filtered = filtered.filter(post => post.media_type === 'video')
    } else if (activeTab === 'images') {
      filtered = filtered.filter(post => post.media_type === 'image')
    }

    // Filter by publish status
    if (filterStatus === 'published') {
      filtered = filtered.filter(post => post.is_published)
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter(post => !post.is_published)
    }

    // Sort posts
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'most-viewed':
          return b.views_count - a.views_count
        case 'most-liked':
          return b.likes_count - a.likes_count
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredPosts(filtered)
  }, [posts, activeTab, filterStatus, sortBy])

  const handleUploadComplete = (newPost: Post) => {
    addPost(newPost) // Add to global context
    setShowUploadModal(false)
    // Don't fetch again - we already have the new post
  }

  const handleTogglePublish = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post) return

    try {
      await postService.updatePost(postId, { is_published: !post.is_published })
      updatePostInContext(postId, { is_published: !post.is_published })
    } catch (err) {
      console.error('Error updating post:', err)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId)
      deletePostFromContext(postId)
    } catch (err) {
      console.error('Error deleting post:', err)
    }
  }

  const tabs = [
    { id: 'all', label: 'All Content', icon: Grid3X3, count: posts.length },
    { id: 'videos', label: 'Videos', icon: Video, count: posts.filter(p => p.media_type === 'video').length },
    { id: 'images', label: 'Images', icon: Image, count: posts.filter(p => p.media_type === 'image').length }
  ]

  return (
    <div className="min-h-screen bg-light-100 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-light-300 dark:border-dark-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white">
                Content Management
              </h1>
              <p className="text-sm sm:text-base text-dark-600 dark:text-dark-400 mt-1">
                Manage your videos, images, and media content
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPosts(true)}
                disabled={postsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-light-300 dark:border-dark-600 rounded-lg hover:bg-light-50 dark:hover:bg-dark-700 transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${postsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Upload Content</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Total Posts</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {stats.totalPosts}
                  </p>
                </div>
                <Grid3X3 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">Published</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {stats.publishedPosts}
                  </p>
                </div>
                <Eye className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">Total Views</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                    {stats.totalViews.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium">Engagement</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                    {stats.totalEngagement.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Controls */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg transition-all duration-200 whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'bg-white dark:bg-dark-900 text-accent-bitcoin border-b-2 border-accent-bitcoin'
                        : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm sm:text-base font-medium">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-light-200 dark:bg-dark-700">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Filters and View Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-viewed">Most Viewed</option>
                <option value="most-liked">Most Liked</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-light-300 dark:border-dark-600">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-accent-bitcoin text-white' : 'text-dark-600 dark:text-dark-400'}`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-accent-bitcoin text-white' : 'text-dark-600 dark:text-dark-400'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {postsError && (
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading content</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{postsError}</p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchPosts(true)
              }}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ContentList
          posts={filteredPosts}
          viewMode={viewMode}
          onTogglePublish={handleTogglePublish}
          onDelete={handleDeletePost}
          onEdit={(post) => setSelectedPost(post)}
          isLoading={postsLoading}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-800 rounded-xl shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-dark-800 border-b border-light-200 dark:border-dark-700 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">
                  Upload New Content
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-dark-600 dark:text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <MediaUpload
                onUploadComplete={handleUploadComplete}
                onCancel={() => setShowUploadModal(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Media Preview Modal */}
      {selectedPost && (
        <MediaPreview
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onSave={(updatedPost) => {
            updatePostInContext(updatedPost.id, updatedPost)
            setSelectedPost(null)
          }}
        />
      )}
    </div>
  )
}

export default ContentManagement