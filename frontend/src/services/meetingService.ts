/**
 * Meeting Service - API calls for Zoom meeting management
 */
import api, { cacheUtils } from './api'

export interface Meeting {
  id: string
  title: string
  description: string
  zoom_link: string
  meeting_date: string
  meeting_time: string
  duration_minutes: number
  host_name: string
  is_active: boolean
  created_at: string
  updated_at?: string
  created_by_name?: string
}

export interface CreateMeetingData {
  title: string
  description?: string
  zoom_link: string
  meeting_date: string
  meeting_time: string
  duration_minutes?: number
  host_name?: string
}

export interface UpdateMeetingData {
  title?: string
  description?: string
  zoom_link?: string
  meeting_date?: string
  meeting_time?: string
  duration_minutes?: number
  host_name?: string
  is_active?: boolean
}

/**
 * Get upcoming meetings for users
 */
export const getMeetings = async (): Promise<Meeting[]> => {
  const response = await api.get<Meeting[]>('/api/meetings')
  return response.data
}

/**
 * Get all meetings including past (admin only)
 */
export const getAllMeetings = async (): Promise<Meeting[]> => {
  const response = await api.get<Meeting[]>('/api/meetings/all')
  return response.data
}

/**
 * Create a new meeting (admin only)
 */
export const createMeeting = async (data: CreateMeetingData): Promise<{ message: string; meeting: Meeting }> => {
  const response = await api.post<{ message: string; meeting: Meeting }>('/api/admin/meetings', data)
  // Invalidate meetings cache after creating
  cacheUtils.invalidatePrefix('/api/meetings')
  return response.data
}

/**
 * Update a meeting (admin only)
 */
export const updateMeeting = async (meetingId: string, data: UpdateMeetingData): Promise<{ message: string; meeting: Meeting }> => {
  const response = await api.put<{ message: string; meeting: Meeting }>(`/api/admin/meetings/${meetingId}`, data)
  // Invalidate meetings cache after updating
  cacheUtils.invalidatePrefix('/api/meetings')
  return response.data
}

/**
 * Delete a meeting (admin only)
 */
export const deleteMeeting = async (meetingId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/api/admin/meetings/${meetingId}`)
  // Invalidate meetings cache after deleting
  cacheUtils.invalidatePrefix('/api/meetings')
  return response.data
}
