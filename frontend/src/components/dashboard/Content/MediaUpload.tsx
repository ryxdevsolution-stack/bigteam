import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  File,
  Video,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react'
import { Post } from '../../../types/post'
import api from '../../../services/api'

interface MediaUploadProps {
  onUploadComplete: (post: Post) => void
  onCancel: () => void
}

interface FileWithPreview {
  file: File
  preview: string
  type: 'video' | 'image'
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  thumbnail?: string
  thumbnailBlob?: Blob
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onUploadComplete, onCancel }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [currentPreview, setCurrentPreview] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dragCounter = useRef(0)

  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)

    if (!isVideo && !isImage) {
      return { valid: false, error: 'File type not supported' }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 100MB' }
    }

    return { valid: true }
  }

  const generateVideoThumbnail = (file: File): Promise<{ thumbnail: string; blob: Blob }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      video.autoplay = false
      video.muted = true
      video.src = URL.createObjectURL(file)

      video.onloadeddata = () => {
        video.currentTime = video.duration * 0.25 // Get frame at 25% of video
      }

      video.onseeked = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context?.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob)
            resolve({ thumbnail: thumbnailUrl, blob })
          } else {
            reject(new Error('Failed to generate thumbnail'))
          }
          URL.revokeObjectURL(video.src)
        }, 'image/jpeg', 0.8)
      }

      video.onerror = () => {
        reject(new Error('Failed to load video'))
        URL.revokeObjectURL(video.src)
      }
    })
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FileWithPreview[] = []

    for (const file of Array.from(fileList)) {
      const validation = validateFile(file)
      if (validation.valid) {
        const preview = URL.createObjectURL(file)
        const type = ALLOWED_VIDEO_TYPES.includes(file.type) ? 'video' : 'image'

        const fileWithPreview: FileWithPreview = {
          file,
          preview,
          type,
          progress: 0,
          status: 'pending'
        }

        // Generate thumbnail for video files
        if (type === 'video') {
          try {
            const { thumbnail, blob } = await generateVideoThumbnail(file)
            fileWithPreview.thumbnail = thumbnail
            fileWithPreview.thumbnailBlob = blob
          } catch (error) {
            console.error('Failed to generate thumbnail:', error)
            // Use the video preview as fallback
            fileWithPreview.thumbnail = preview
          }
        } else {
          // For images, use the preview as thumbnail
          fileWithPreview.thumbnail = preview
        }

        newFiles.push(fileWithPreview)
      } else {
        // Show error toast or notification
        console.error(validation.error)
      }
    }

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
    if (currentPreview >= files.length - 1) {
      setCurrentPreview(Math.max(0, files.length - 2))
    }
  }

  const uploadFile = async (fileWithPreview: FileWithPreview, index: number) => {
    const formData = new FormData()
    formData.append('file', fileWithPreview.file)
    formData.append('title', title || fileWithPreview.file.name)
    formData.append('content', content)
    formData.append('media_type', fileWithPreview.type)
    formData.append('created_by', localStorage.getItem('userId') || '1') // Get from auth

    // Add thumbnail for videos
    if (fileWithPreview.type === 'video' && fileWithPreview.thumbnailBlob) {
      formData.append('thumbnail', fileWithPreview.thumbnailBlob, 'thumbnail.jpg')
    }

    try {
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, status: 'uploading' } : f
      ))

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0

          setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, progress } : f
          ))
        }
      })

      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, status: 'complete', progress: 100 } : f
      ))

      // Create a Post object from the response
      const newPost: Post = {
        id: response.data.post.id,
        title: response.data.post.title,
        content: response.data.post.content,
        media_type: response.data.post.media_type,
        media_url: response.data.post.media_url,
        thumbnail_url: response.data.post.thumbnail_url,
        created_by: response.data.post.created_by,
        is_published: isPublished,
        created_at: response.data.post.created_at,
        updated_at: new Date().toISOString(),
        likes_count: 0,
        shares_count: 0,
        views_count: 0
      }

      onUploadComplete(newPost)
    } catch (error: any) {
      setFiles(prev => prev.map((f, i) =>
        i === index ? {
          ...f,
          status: 'error',
          error: error.response?.data?.error || 'Upload failed'
        } : f
      ))
    }
  }

  const handleUploadAll = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i)
      }
    }
  }

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
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg">
      <div className="p-4 sm:p-6">
        {/* Upload Area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl transition-all duration-300
            ${isDragging
              ? 'border-accent-bitcoin bg-accent-bitcoin/10'
              : 'border-light-300 dark:border-dark-600 hover:border-accent-bitcoin'
            }
            ${files.length > 0 ? 'p-4' : 'p-8 sm:p-12'}
          `}
        >
          {files.length === 0 ? (
            <div className="text-center">
              <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-dark-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-dark-800 dark:text-white mb-2">
                Drag & Drop your media files here
              </h3>
              <p className="text-sm sm:text-base text-dark-600 dark:text-dark-400 mb-4">
                or click to browse from your device
              </p>
              <p className="text-xs sm:text-sm text-dark-500 mb-6">
                Supported: MP4, MOV, JPG, PNG, GIF (Max 100MB)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Section */}
              {files.length > 0 && (
                <div className="mb-6">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {files[currentPreview].type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          src={files[currentPreview].preview}
                          className="w-full h-full object-contain"
                          onEnded={() => setIsPlaying(false)}
                        />
                        {/* Video Controls */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={togglePlayPause}
                              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            >
                              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={toggleMute}
                              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            >
                              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <div className="flex-1" />
                            <button
                              onClick={toggleFullscreen}
                              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            >
                              <Maximize2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={files[currentPreview].preview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {files.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {files.map((file, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPreview(index)}
                          className={`
                            relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                            ${currentPreview === index
                              ? 'border-accent-bitcoin shadow-lg'
                              : 'border-transparent hover:border-dark-400'
                            }
                          `}
                        >
                          {file.type === 'video' ? (
                            <div className="relative w-full h-full bg-dark-800">
                              {file.thumbnail ? (
                                <img
                                  src={file.thumbnail}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <video
                                  src={file.preview}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={file.preview}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {file.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                          )}
                          {file.status === 'complete' && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                            className="absolute top-1 left-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* File List */}
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-light-50 dark:bg-dark-700 rounded-lg"
                  >
                    {file.type === 'video' ? (
                      <Video className="w-5 h-5 text-blue-500" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-green-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-800 dark:text-white truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-dark-500">
                        {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    {file.status === 'uploading' && (
                      <div className="w-24">
                        <div className="h-2 bg-light-200 dark:bg-dark-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-bitcoin transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-center mt-1">{file.progress}%</p>
                      </div>
                    )}
                    {file.status === 'complete' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-red-500">{file.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Metadata Form */}
        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title"
                className="w-full px-4 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Description
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content description"
                rows={3}
                className="w-full px-4 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-bitcoin resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="publish"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-accent-bitcoin rounded focus:ring-accent-bitcoin"
              />
              <label htmlFor="publish" className="text-sm text-dark-700 dark:text-dark-300">
                Publish immediately after upload
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-light-300 dark:border-dark-600 rounded-lg text-dark-700 dark:text-dark-300 hover:bg-light-50 dark:hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadAll}
                disabled={files.every(f => f.status === 'complete')}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload {files.filter(f => f.status === 'pending').length} File{files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default MediaUpload