import api from './api'
import { User } from '../types/user'

export interface CreateUserPayload {
  full_name: string
  email: string
  username: string
  password: string
  role?: 'customer' | 'admin'
  referred_by?: string
}

export const userService = {
  // Admin user management endpoints
  getAllUsers: async () => {
    const response = await api.get<User[]>('/auth/admin/users')
    return response
  },

  getUser: (id: string) => api.get<User>(`/admin/users/${id}`),

  // Using the actual backend register endpoint for user creation
  createUser: (data: CreateUserPayload) => api.post('/auth/register', data),

  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // User profile endpoints
  getUserProfile: () => api.get<User>('/user/profile'),

  updateUserProfile: (data: Partial<User>) => api.put<User>('/user/profile', data),
}