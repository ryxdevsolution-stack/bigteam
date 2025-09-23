import api from './api'
import { User } from '../types/user'

export const userService = {
  getAllUsers: () => api.get<User[]>('/api/admin/users'),

  getUser: (id: string) => api.get<User>(`/api/admin/users/${id}`),

  createUser: (data: Partial<User>) => api.post<User>('/api/admin/users', data),

  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/api/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),

  getUserProfile: () => api.get<User>('/api/user/profile'),

  updateUserProfile: (data: Partial<User>) => api.put<User>('/api/user/profile', data),
}