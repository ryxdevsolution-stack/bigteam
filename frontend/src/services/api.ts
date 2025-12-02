/**
 * API Client - Axios configuration with JWT authentication
 * Handles token management, refresh, error handling, and request deduplication
 */
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// Get API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

// =============================================================================
// REQUEST DEDUPLICATION & CACHING
// =============================================================================

interface CacheEntry {
  data: any
  timestamp: number
  promise?: Promise<AxiosResponse>
}

// Cache for GET requests (5 second TTL by default)
const requestCache = new Map<string, CacheEntry>()
const DEFAULT_CACHE_TTL = 5000 // 5 seconds
const CACHE_CLEANUP_INTERVAL = 30000 // 30 seconds

// In-flight request tracking for deduplication
const inFlightRequests = new Map<string, Promise<AxiosResponse>>()

// Check if cache entry is valid
const isCacheValid = (entry: CacheEntry, ttl: number = DEFAULT_CACHE_TTL): boolean => {
  return Date.now() - entry.timestamp < ttl
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now()
  requestCache.forEach((entry, key) => {
    if (now - entry.timestamp > DEFAULT_CACHE_TTL * 2) {
      requestCache.delete(key)
    }
  })
}, CACHE_CLEANUP_INTERVAL)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
})

// Token management utilities
export const tokenUtils = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: () => {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  setUser: (user: any) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clearAll: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY)
  }
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenUtils.getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Skip refresh for auth endpoints themselves to avoid infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh')
    if (isAuthEndpoint) {
      return Promise.reject(error)
    }

    // Check if we have a refresh token to try
    const refreshToken = tokenUtils.getRefreshToken()
    if (!refreshToken) {
      tokenUtils.clearAll()
      // Don't immediately redirect - let the component handle the error
      const customError = new Error('Session expired. Please login again.')
      ;(customError as any).isAuthError = true
      return Promise.reject(customError)
    }

    // Token expired or invalid - try to refresh
    if (isRefreshing) {
      // Already refreshing - queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return api(originalRequest)
      }).catch(err => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken
      })

      const { access_token, refresh_token } = response.data
      tokenUtils.setTokens(access_token, refresh_token)

      processQueue(null, access_token)

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access_token}`
      }
      return api(originalRequest)

    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null)
      tokenUtils.clearAll()
      // Don't immediately redirect - let the component handle the error
      const customError = new Error('Session expired. Please login again.')
      ;(customError as any).isAuthError = true
      return Promise.reject(customError)
    } finally {
      isRefreshing = false
    }
  }
)

// =============================================================================
// DEDUPLICATED API WRAPPER
// =============================================================================

/**
 * Wrapper for GET requests with automatic deduplication and caching
 * - Deduplicates concurrent identical GET requests
 * - Caches responses for configurable TTL
 * - Automatically returns cached data if available
 */
export const cachedGet = async <T = any>(
  url: string,
  config?: { params?: any; ttl?: number }
): Promise<AxiosResponse<T>> => {
  const cacheKey = `get:${url}:${JSON.stringify(config?.params || {})}`
  const ttl = config?.ttl ?? DEFAULT_CACHE_TTL

  // Check cache first
  const cached = requestCache.get(cacheKey)
  if (cached && isCacheValid(cached, ttl)) {
    return cached.data
  }

  // Check if request is already in flight
  const inFlight = inFlightRequests.get(cacheKey)
  if (inFlight) {
    return inFlight as Promise<AxiosResponse<T>>
  }

  // Make the actual request
  const requestPromise = api.get<T>(url, { params: config?.params })
    .then(response => {
      // Cache the response
      requestCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      })
      inFlightRequests.delete(cacheKey)
      return response
    })
    .catch(error => {
      inFlightRequests.delete(cacheKey)
      throw error
    })

  // Track in-flight request
  inFlightRequests.set(cacheKey, requestPromise)
  return requestPromise
}

/**
 * Cache utility functions for manual cache management
 */
export const cacheUtils = {
  // Clear specific cache entry
  invalidate: (url: string, params?: any) => {
    const cacheKey = `get:${url}:${JSON.stringify(params || {})}`
    requestCache.delete(cacheKey)
  },

  // Clear all cache entries matching a URL prefix
  invalidatePrefix: (urlPrefix: string) => {
    requestCache.forEach((_, key) => {
      if (key.includes(urlPrefix)) {
        requestCache.delete(key)
      }
    })
  },

  // Clear entire cache
  clearAll: () => {
    requestCache.clear()
    inFlightRequests.clear()
  },

  // Get cache stats (for debugging)
  getStats: () => ({
    cacheSize: requestCache.size,
    inFlightCount: inFlightRequests.size
  })
}

export default api
