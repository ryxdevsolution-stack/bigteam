import api from './api'
import { User } from '../types/user'

export interface CreateUserPayload {
  full_name: string
  email: string
  username: string
  password: string
  role?: 'customer' | 'admin'
  referred_by?: string
  amount?: number
}

export interface DashboardStats {
  user: User;
  total_referrals: number;
  active_referrals: number;
  inactive_referrals: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  total_commissions: number;
  commission_received_count: number;
  is_mlm_active: boolean;
  referral_code: string;
  recent_commissions: Array<{
    amount: number;
    created_at: string;
    from_user: string;
  }>;
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

  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/auth/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/auth/admin/users/${id}`),

  // User profile endpoints (with user_id parameter for now, will use JWT later)
  getUserProfile: (userId: string) => api.get<{ user: User }>(`/api/user/profile?user_id=${userId}`),

  updateUserProfile: (userId: string, data: Partial<User>) =>
    api.put<{ user: User }>('/api/user/profile', { user_id: userId, ...data }),

  // User dashboard stats
  getDashboardStats: async (userId: string): Promise<DashboardStats> => {
    const response = await api.get<{ stats: DashboardStats }>(`/api/user/dashboard-stats?user_id=${userId}`)
    return response.data.stats
  },

  // User referrals
  getReferrals: async (userId: string) => {
    const response = await api.get(`/api/user/referrals?user_id=${userId}`)
    return response.data.referrals
  },

  // Validation endpoints
  checkEmailExists: async (email: string) => {
    const response = await api.post<{ exists: boolean }>('/auth/check-email', { email })
    return response.data.exists
  },

  checkUsernameExists: async (username: string) => {
    const response = await api.post<{ exists: boolean }>('/auth/check-username', { username })
    return response.data.exists
  },
}