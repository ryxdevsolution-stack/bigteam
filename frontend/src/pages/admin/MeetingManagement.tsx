import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  Users,
  Loader2,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import {
  Meeting,
  CreateMeetingData,
  getAllMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting
} from '../../services/meetingService'

const MeetingManagement: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateMeetingData>({
    title: '',
    description: '',
    zoom_link: '',
    meeting_date: '',
    meeting_time: '',
    duration_minutes: 60,
    host_name: ''
  })

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllMeetings()
      setMeetings(data)
    } catch (err) {
      setError('Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      zoom_link: '',
      meeting_date: '',
      meeting_time: '',
      duration_minutes: 60,
      host_name: ''
    })
    setEditingMeeting(null)
  }

  const handleOpenModal = (meeting?: Meeting) => {
    if (meeting) {
      setEditingMeeting(meeting)
      setFormData({
        title: meeting.title,
        description: meeting.description || '',
        zoom_link: meeting.zoom_link,
        meeting_date: meeting.meeting_date,
        meeting_time: meeting.meeting_time,
        duration_minutes: meeting.duration_minutes,
        host_name: meeting.host_name || ''
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingMeeting) {
        const result = await updateMeeting(editingMeeting.id, formData)
        setMeetings(prev =>
          prev.map(m => (m.id === editingMeeting.id ? result.meeting : m))
        )
      } else {
        const result = await createMeeting(formData)
        setMeetings(prev => [result.meeting, ...prev])
      }
      handleCloseModal()
    } catch (err) {
      setError('Failed to save meeting')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (meetingId: string) => {
    try {
      await deleteMeeting(meetingId)
      setMeetings(prev => prev.filter(m => m.id !== meetingId))
      setDeleteConfirm(null)
    } catch (err) {
      setError('Failed to delete meeting')
    }
  }

  const handleToggleActive = async (meeting: Meeting) => {
    try {
      const result = await updateMeeting(meeting.id, { is_active: !meeting.is_active })
      setMeetings(prev =>
        prev.map(m => (m.id === meeting.id ? result.meeting : m))
      )
    } catch (err) {
      setError('Failed to update meeting status')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const isPastMeeting = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const meetingDate = new Date(dateStr)
    return meetingDate < today
  }

  // Stats
  const stats = {
    total: meetings.length,
    active: meetings.filter(m => m.is_active).length,
    upcoming: meetings.filter(m => !isPastMeeting(m.meeting_date) && m.is_active).length,
    past: meetings.filter(m => isPastMeeting(m.meeting_date)).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
              Meeting Management
            </h1>
            <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300 mt-1">
              Schedule and manage Zoom meeting links
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Meeting</span>
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Meetings', value: stats.total, icon: Video, color: 'blue' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'green' },
          { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'purple' },
          { label: 'Past', value: stats.past, icon: Clock, color: 'gray' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Meetings List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : meetings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
            No Meetings Scheduled
          </h3>
          <p className="text-dark-500 dark:text-dark-400 mb-4">
            Create your first Zoom meeting to share with users.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Meeting
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting, index) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg ${
                !meeting.is_active ? 'opacity-60' : ''
              } ${isPastMeeting(meeting.meeting_date) ? 'border-l-4 border-gray-300 dark:border-gray-600' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPastMeeting(meeting.meeting_date)
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : meeting.is_active
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Video className={`w-6 h-6 ${
                        isPastMeeting(meeting.meeting_date)
                          ? 'text-gray-500'
                          : meeting.is_active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-dark-900 dark:text-white">
                          {meeting.title}
                        </h3>
                        {isPastMeeting(meeting.meeting_date) && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                            Past
                          </span>
                        )}
                        {!meeting.is_active && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-dark-600 dark:text-dark-300 mb-2 line-clamp-1">
                          {meeting.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dark-500 dark:text-dark-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(meeting.meeting_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(meeting.meeting_time)}</span>
                        </div>
                        <span>•</span>
                        <span>{meeting.duration_minutes} min</span>
                        {meeting.host_name && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span>{meeting.host_name}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <a
                    href={meeting.zoom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Open Zoom Link"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleOpenModal(meeting)}
                    className="p-2 text-dark-500 hover:bg-light-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(meeting)}
                    className={`p-2 rounded-lg transition-colors ${
                      meeting.is_active
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    title={meeting.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(meeting.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              <AnimatePresence>
                {deleteConfirm === meeting.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-light-200 dark:border-dark-700"
                  >
                    <p className="text-sm text-dark-600 dark:text-dark-300 mb-3">
                      Are you sure you want to delete this meeting?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                  {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-light-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Weekly Team Standup"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Brief description of the meeting..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Zoom Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.zoom_link}
                    onChange={e => setFormData(prev => ({ ...prev, zoom_link: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://zoom.us/j/123456789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.meeting_date}
                      onChange={e => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.meeting_time}
                      onChange={e => setFormData(prev => ({ ...prev, meeting_time: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Duration (minutes)
                    </label>
                    <select
                      value={formData.duration_minutes}
                      onChange={e => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Host Name
                    </label>
                    <input
                      type="text"
                      value={formData.host_name}
                      onChange={e => setFormData(prev => ({ ...prev, host_name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-light-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-dark-700 text-dark-700 dark:text-dark-300 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingMeeting ? (
                      'Update Meeting'
                    ) : (
                      'Create Meeting'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MeetingManagement
