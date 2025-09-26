import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Film,
  Image,
  X,
  Eye
} from 'lucide-react'
import api from '../../services/api'

interface Advertisement {
  id: string
  title: string
  media_type: 'video' | 'image'
  media_url: string
  ad_type: 'banner' | 'in_stream'
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
}

interface FileWithPreview {
  file: File
  preview: string
  type: 'video' | 'image'
}

const AdManagement: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    ad_type: 'banner' as 'banner' | 'in_stream',
    start_date: '',
    end_date: '',
    file: null as File | null,
    filePreview: null as FileWithPreview | null
  })

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      const response = await api.get('/api/ads')
      setAds(response.data)
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const preview = URL.createObjectURL(file)
      const type = file.type.startsWith('video/') ? 'video' : 'image'

      setFormData({
        ...formData,
        file,
        filePreview: { file, preview, type }
      })
    }
  }

  const handleUpload = async () => {
    if (!formData.file || !formData.title) {
      alert('Please provide a title and select a file')
      return
    }

    setUploading(true)
    const data = new FormData()
    data.append('file', formData.file)
    data.append('title', formData.title)
    data.append('ad_type', formData.ad_type)
    if (formData.start_date) data.append('start_date', formData.start_date)
    if (formData.end_date) data.append('end_date', formData.end_date)

    try {
      const response = await api.post('/api/ads', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Add new ad to list
      setAds([response.data.ad, ...ads])

      // Reset form
      if (formData.filePreview) {
        URL.revokeObjectURL(formData.filePreview.preview)
      }
      setFormData({
        title: '',
        ad_type: 'banner',
        start_date: '',
        end_date: '',
        file: null,
        filePreview: null
      })
      setShowUploadForm(false)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload advertisement')
    } finally {
      setUploading(false)
    }
  }

  const toggleAdStatus = async (adId: string) => {
    try {
      const response = await api.patch(`/api/ads/${adId}/toggle`)
      setAds(ads.map(ad =>
        ad.id === adId ? { ...ad, is_active: response.data.is_active } : ad
      ))
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const deleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return

    try {
      await api.delete(`/api/ads/${adId}`)
      setAds(ads.filter(ad => ad.id !== adId))
    } catch (error) {
      console.error('Failed to delete ad:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-bitcoin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-dark-800 dark:text-white">
          Advertisement Management
        </h2>
        <button
          onClick={() => setShowUploadForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">New Ad</span>
        </button>
      </div>

      {/* Upload Form Modal with Preview */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Upload Advertisement
              </h3>
              <button
                onClick={() => {
                  if (formData.filePreview) {
                    URL.revokeObjectURL(formData.filePreview.preview)
                  }
                  setShowUploadForm(false)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preview Section */}
              <div>
                <label className="block text-sm font-medium mb-2">Preview</label>
                <div className="border rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                  {formData.filePreview ? (
                    formData.filePreview.type === 'video' ? (
                      <video
                        src={formData.filePreview.preview}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={formData.filePreview.preview}
                        alt="Ad preview"
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">Click to select file</p>
                      <p className="text-xs text-gray-500 mt-1">MP4, MOV, JPG, PNG, GIF</p>
                    </div>
                  )}
                </div>
                {formData.file && (
                  <div className="mt-2 text-xs text-gray-500">
                    {formData.file.name} ({(formData.file.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>

              {/* Form Section */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-dark-700 dark:border-dark-600"
                    placeholder="Advertisement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ad Type</label>
                  <select
                    value={formData.ad_type}
                    onChange={(e) => setFormData({ ...formData, ad_type: e.target.value as 'banner' | 'in_stream' })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-dark-700 dark:border-dark-600"
                  >
                    <option value="banner">Banner Ad</option>
                    <option value="in_stream">In-Stream Ad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>

                {!formData.file && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 border-2 border-dashed rounded-lg hover:border-accent-bitcoin transition-colors"
                  >
                    Select Media File
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (formData.filePreview) {
                        URL.revokeObjectURL(formData.filePreview.preview)
                      }
                      setShowUploadForm(false)
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !formData.file || !formData.title}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Animation - Same as Video Upload */}
      {uploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 sm:p-8 shadow-2xl border border-light-200 dark:border-dark-600 w-full max-w-sm sm:max-w-md">
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              {/* Logo Animation Container */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                {/* Glow Effect Behind Logo */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-bitcoin via-accent-orange to-accent-purple opacity-30 blur-2xl animate-pulse rounded-full" />

                {/* Rotating Ring - Smaller and Properly Centered */}
                <div className="absolute inset-[-5%] sm:inset-[-8%] flex items-center justify-center">
                  <div
                    className="w-full h-full border border-accent-bitcoin/20 rounded-full"
                    style={{ animation: 'rotate 4s linear infinite' }}
                  />
                </div>

                {/* Logo Container */}
                <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="BigTeam"
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.5))',
                      animation: 'flicker 1.5s infinite alternate, float 3s ease-in-out infinite'
                    }}
                  />

                  {/* Scanning Line Effect */}
                  <div
                    className="absolute inset-x-0 h-[20%] bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none"
                    style={{ animation: 'scan 2s linear infinite' }}
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center space-y-2">
                <p className="text-base sm:text-lg font-bold text-dark-800 dark:text-white">
                  Uploading Advertisement
                </p>
                <p className="text-xs sm:text-sm text-dark-600 dark:text-dark-400">
                  Please wait while we process your ad...
                </p>
              </div>

              {/* Loading Dots */}
              <div className="flex items-center justify-center space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-accent-bitcoin rounded-full"
                    style={{
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: `${i * 0.16}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CSS Animations */}
          <style jsx>{`
            @keyframes rotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes flicker {
              0% { opacity: 1; filter: brightness(1) drop-shadow(0 0 20px rgba(245, 158, 11, 0.5)); }
              50% { opacity: 0.8; filter: brightness(1.1) drop-shadow(0 0 25px rgba(245, 158, 11, 0.6)); }
              100% { opacity: 1; filter: brightness(1) drop-shadow(0 0 20px rgba(245, 158, 11, 0.5)); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-10px) scale(1.05); }
            }
            @keyframes scan {
              0% { top: -20%; opacity: 0; }
              10% { opacity: 0.5; }
              50% { opacity: 0.8; }
              90% { opacity: 0.5; }
              100% { top: 120%; opacity: 0; }
            }
            @keyframes bounce {
              0%, 80%, 100% {
                transform: scale(0) translateY(0);
                opacity: 0;
              }
              40% {
                transform: scale(1) translateY(-5px);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedAd && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {selectedAd.title}
              </h3>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedAd(null)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {selectedAd.media_type === 'video' ? (
                <video
                  src={selectedAd.media_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={selectedAd.media_url}
                  alt={selectedAd.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">{selectedAd.ad_type}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 font-medium ${selectedAd.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedAd.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {selectedAd.start_date && (
                <div>
                  <span className="text-gray-500">Start:</span>
                  <span className="ml-2">{new Date(selectedAd.start_date).toLocaleString()}</span>
                </div>
              )}
              {selectedAd.end_date && (
                <div>
                  <span className="text-gray-500">End:</span>
                  <span className="ml-2">{new Date(selectedAd.end_date).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ads Table */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Preview
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Media
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Schedule
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No advertisements found
                  </td>
                </tr>
              ) : (
                ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => {
                          setSelectedAd(ad)
                          setShowPreview(true)
                        }}
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-dark-600 dark:hover:bg-dark-500 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ad.title}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {ad.ad_type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {ad.media_type === 'video' ? (
                          <Film className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Image className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {ad.media_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {ad.start_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(ad.start_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span>No schedule</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleAdStatus(ad.id)}
                        className="flex items-center gap-2"
                      >
                        {ad.is_active ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                        <span className={`text-xs ${ad.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                          {ad.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => deleteAd(ad.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdManagement