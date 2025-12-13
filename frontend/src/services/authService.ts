/**
 * Authentication Service - Login, logout, and token management
 * Integrates with JWT-based backend authentication
 */
import api, { tokenUtils, cacheUtils } from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  full_name: string
  email: string
  username: string
  password: string
  role?: string
  amount?: number
}

export interface AuthUser {
  id: string
  full_name: string
  email: string
  username: string
  role: string
  is_active_member: boolean
  total_earnings: number
  available_balance: number
}

export interface AuthResponse {
  message: string
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export const authService = {
  /**
   * Login user with email and password
   * Stores tokens and user data on success
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    const { access_token, refresh_token, user } = response.data

    // Store tokens and user
    tokenUtils.setTokens(access_token, refresh_token)
    tokenUtils.setUser(user)

    return response.data
  },

  /**
   * Register a new user
   * Automatically logs in on success
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data)
    const { access_token, refresh_token, user } = response.data

    // Store tokens and user
    tokenUtils.setTokens(access_token, refresh_token)
    tokenUtils.setUser(user)

    return response.data
  },

  /**
   * Logout user
   * Clears all stored tokens, user data, and cached API responses
   */
  logout: async (): Promise<void> => {
    try {
      // Call backend logout (optional - for token blacklisting)
      await api.post('/auth/logout')
    } catch (error) {
      // Ignore errors - we're logging out anyway
    } finally {
      // Clear all cached API responses to prevent stale data on re-login
      cacheUtils.clearAll()
      tokenUtils.clearAll()
    }
  },

  /**
   * Get current authenticated user from storage
   */
  getCurrentUser: (): AuthUser | null => {
    return tokenUtils.getUser()
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return tokenUtils.isAuthenticated()
  },

  /**
   * Get current user profile from server
   */
  getProfile: async (): Promise<AuthUser> => {
    const response = await api.get('/auth/me')
    const user = response.data.user
    tokenUtils.setUser(user)
    return user
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<{ access_token: string; refresh_token: string }> => {
    const refreshToken = tokenUtils.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken
    })

    const { access_token, refresh_token } = response.data
    tokenUtils.setTokens(access_token, refresh_token)

    return response.data
  },

  /**
   * Check if email exists
   */
  checkEmail: async (email: string): Promise<boolean> => {
    const response = await api.post('/auth/check-email', { email })
    return response.data.exists
  },

  /**
   * Check if username exists
   */
  checkUsername: async (username: string): Promise<boolean> => {
    const response = await api.post('/auth/check-username', { username })
    return response.data.exists
  }
}

export default authService
