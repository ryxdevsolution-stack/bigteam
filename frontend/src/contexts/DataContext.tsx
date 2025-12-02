/**
 * Data Context - Centralized data fetching with smart caching
 * Implements per-user cache keys and request deduplication
 * Optimized for minimal API calls and maximum performance
 */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'
import { Post } from '../types/post'
import { User } from '../types/user'
import api, { cacheUtils } from '../services/api'
import { DashboardStats } from '../services/userService'
import { TreeData, Commission } from '../services/teamService'

export interface HomeData {
  videos: Post[]
  photos: Post[]
  ads: Advertisement[]
  meetings: any[]
}

export interface Advertisement {
  id: string
  title: string
  description: string
  media_type: string
  media_url: string
  link_url?: string
  start_date?: string
  end_date?: string
}

// Admin dashboard metrics
export interface AdminMetrics {
  totalUsers: number
  totalPosts: number
  engagementRate: number
  adRevenue: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalComments: number
  videoCount: number
  imageCount: number
}

// Cache entry with user-specific key
interface CacheEntry<T> {
  data: T
  timestamp: number
  userId?: string
}

interface DataContextType {
  // Posts
  posts: Post[]
  postsLoading: boolean
  postsError: string | null
  fetchPosts: (force?: boolean) => Promise<void>
  addPost: (post: Post) => void
  updatePost: (postId: string, updates: Partial<Post>) => void
  deletePost: (postId: string) => void

  // Users (admin)
  users: User[]
  usersLoading: boolean
  usersError: string | null
  fetchUsers: (force?: boolean) => Promise<void>
  refreshUsers: () => Promise<void>

  // Admin Metrics (derived from posts and users)
  adminMetrics: AdminMetrics
  adminMetricsLoading: boolean

  // Dashboard Stats
  dashboardStats: DashboardStats | null
  dashboardStatsLoading: boolean
  dashboardStatsError: string | null
  fetchDashboardStats: (userId: string, force?: boolean) => Promise<void>

  // Team Tree
  teamTree: TreeData | null
  teamTreeLoading: boolean
  teamTreeError: string | null
  fetchTeamTree: (userId: string, force?: boolean) => Promise<void>

  // Commissions
  commissions: Commission[]
  commissionsLoading: boolean
  commissionsError: string | null
  fetchCommissions: (userId: string, force?: boolean) => Promise<void>

  // User Profile
  userProfile: User | null
  userProfileLoading: boolean
  userProfileError: string | null
  fetchUserProfile: (userId: string, force?: boolean) => Promise<void>

  // Home Data
  homeData: HomeData | null
  homeDataLoading: boolean
  homeDataError: string | null
  fetchHomeData: (force?: boolean) => Promise<void>

  // Clear all cache
  clearCache: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Cache duration in milliseconds - increased for better performance
const CACHE_DURATION = 10000 // 10 seconds

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Posts state
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)
  const postsCache = useRef<CacheEntry<Post[]> | null>(null)
  const postsPromiseRef = useRef<Promise<void> | null>(null)

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const usersCache = useRef<CacheEntry<User[]> | null>(null)
  const usersPromiseRef = useRef<Promise<void> | null>(null)

  // Dashboard Stats state (per-user cache)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(false)
  const [dashboardStatsError, setDashboardStatsError] = useState<string | null>(null)
  const dashboardStatsCache = useRef<CacheEntry<DashboardStats> | null>(null)
  const dashboardStatsPromiseRef = useRef<Promise<void> | null>(null)

  // Team Tree state (per-user cache)
  const [teamTree, setTeamTree] = useState<TreeData | null>(null)
  const [teamTreeLoading, setTeamTreeLoading] = useState(false)
  const [teamTreeError, setTeamTreeError] = useState<string | null>(null)
  const teamTreeCache = useRef<CacheEntry<TreeData> | null>(null)
  const teamTreePromiseRef = useRef<Promise<void> | null>(null)

  // Commissions state (per-user cache)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [commissionsLoading, setCommissionsLoading] = useState(false)
  const [commissionsError, setCommissionsError] = useState<string | null>(null)
  const commissionsCache = useRef<CacheEntry<Commission[]> | null>(null)
  const commissionsPromiseRef = useRef<Promise<void> | null>(null)

  // User Profile state (per-user cache)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [userProfileLoading, setUserProfileLoading] = useState(false)
  const [userProfileError, setUserProfileError] = useState<string | null>(null)
  const userProfileCache = useRef<CacheEntry<User> | null>(null)
  const userProfilePromiseRef = useRef<Promise<void> | null>(null)

  // Home Data state
  const [homeData, setHomeData] = useState<HomeData | null>(null)
  const [homeDataLoading, setHomeDataLoading] = useState(false)
  const [homeDataError, setHomeDataError] = useState<string | null>(null)
  const homeDataCache = useRef<CacheEntry<HomeData> | null>(null)
  const homeDataPromiseRef = useRef<Promise<void> | null>(null)

  // Helper to check if cache is valid
  const isCacheValid = <T,>(cache: CacheEntry<T> | null, userId?: string): boolean => {
    if (!cache) return false
    const now = Date.now()
    if (now - cache.timestamp > CACHE_DURATION) return false
    if (userId && cache.userId !== userId) return false
    return true
  }

  // Fetch posts with caching and deduplication
  const fetchPosts = useCallback(async (force: boolean = false) => {
    if (!force && isCacheValid(postsCache.current)) {
      return
    }

    if (postsPromiseRef.current && !force) {
      return postsPromiseRef.current
    }

    const fetchPromise = (async () => {
      setPostsLoading(true)
      setPostsError(null)
      try {
        const response = await api.get('/api/posts')
        const data = response.data || []
        setPosts(data)
        postsCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        setPostsError(error.response?.data?.error || 'Failed to fetch posts')
        setPosts([])
      } finally {
        setPostsLoading(false)
        postsPromiseRef.current = null
      }
    })()

    postsPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Fetch users with caching (admin endpoint)
  const fetchUsers = useCallback(async (force: boolean = false) => {
    if (!force && isCacheValid(usersCache.current)) {
      return
    }

    if (usersPromiseRef.current && !force) {
      return usersPromiseRef.current
    }

    const fetchPromise = (async () => {
      setUsersLoading(true)
      setUsersError(null)
      try {
        const response = await api.get('/auth/admin/users')
        const data = response.data || []
        setUsers(data)
        usersCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        setUsersError(error.response?.data?.error || 'Failed to fetch users')
        setUsers([])
      } finally {
        setUsersLoading(false)
        usersPromiseRef.current = null
      }
    })()

    usersPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Post management functions
  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev])
    if (postsCache.current) {
      postsCache.current = {
        data: [post, ...postsCache.current.data],
        timestamp: Date.now()
      }
    }
  }, [])

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, ...updates } : post
    ))
  }, [])

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }, [])

  // Force refresh users (invalidates cache)
  const refreshUsers = useCallback(async () => {
    usersCache.current = null
    cacheUtils.invalidatePrefix('/auth/admin/users')
    return fetchUsers(true)
  }, [fetchUsers])

  // Memoized admin metrics derived from posts and users
  const adminMetrics = useMemo<AdminMetrics>(() => {
    const videoCount = posts.filter(p => p.media_type === 'video').length
    const imageCount = posts.filter(p => p.media_type === 'image').length
    const totalViews = posts.reduce((acc, p) => acc + (p.views_count || 0), 0)
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes_count || 0), 0)
    const totalShares = posts.reduce((acc, p) => acc + (p.shares_count || 0), 0)

    return {
      totalUsers: users.filter(u => u.role === 'customer').length,
      totalPosts: posts.length,
      engagementRate: posts.length > 0
        ? Math.round((totalLikes + totalShares) / posts.length * 100) / 100
        : 0,
      adRevenue: 0, // Would need ads data
      totalViews,
      totalLikes,
      totalShares,
      totalComments: 0, // Would need comments data
      videoCount,
      imageCount
    }
  }, [posts, users])

  const adminMetricsLoading = postsLoading || usersLoading

  // Fetch Dashboard Stats with per-user caching
  const fetchDashboardStats = useCallback(async (userId: string, force: boolean = false) => {
    // Check cache with user ID validation
    if (!force && isCacheValid(dashboardStatsCache.current, userId)) {
      return
    }

    // Check if we're already fetching for this user
    if (dashboardStatsPromiseRef.current && !force && dashboardStatsCache.current?.userId === userId) {
      return dashboardStatsPromiseRef.current
    }

    const fetchPromise = (async () => {
      setDashboardStatsLoading(true)
      setDashboardStatsError(null)
      try {
        const response = await api.get(`/api/user/dashboard-stats?user_id=${userId}`)
        const data = response.data.stats
        setDashboardStats(data)
        dashboardStatsCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        setDashboardStatsError(error.response?.data?.error || 'Failed to fetch dashboard stats')
        setDashboardStats(null)
      } finally {
        setDashboardStatsLoading(false)
        dashboardStatsPromiseRef.current = null
      }
    })()

    dashboardStatsPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Fetch Team Tree with per-user caching
  const fetchTeamTree = useCallback(async (userId: string, force: boolean = false) => {
    if (!force && isCacheValid(teamTreeCache.current, userId)) {
      return
    }

    if (teamTreePromiseRef.current && !force && teamTreeCache.current?.userId === userId) {
      return teamTreePromiseRef.current
    }

    const fetchPromise = (async () => {
      setTeamTreeLoading(true)
      setTeamTreeError(null)
      try {
        const response = await api.get(`/api/team/tree/${userId}`)
        const data = response.data.tree
        setTeamTree(data)
        teamTreeCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        setTeamTreeError(error.response?.data?.error || 'Failed to fetch team tree')
        setTeamTree(null)
      } finally {
        setTeamTreeLoading(false)
        teamTreePromiseRef.current = null
      }
    })()

    teamTreePromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Fetch Commissions with per-user caching
  const fetchCommissions = useCallback(async (userId: string, force: boolean = false) => {
    if (!force && isCacheValid(commissionsCache.current, userId)) {
      return
    }

    if (commissionsPromiseRef.current && !force && commissionsCache.current?.userId === userId) {
      return commissionsPromiseRef.current
    }

    const fetchPromise = (async () => {
      setCommissionsLoading(true)
      setCommissionsError(null)
      try {
        const response = await api.get('/api/user/commissions', {
          params: { user_id: userId, limit: 50 }
        })
        const data = response.data.commissions || []
        setCommissions(data)
        commissionsCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        setCommissionsError(error.response?.data?.error || 'Failed to fetch commissions')
        setCommissions([])
      } finally {
        setCommissionsLoading(false)
        commissionsPromiseRef.current = null
      }
    })()

    commissionsPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Fetch User Profile with per-user caching
  const fetchUserProfile = useCallback(async (userId: string, force: boolean = false) => {
    if (!force && isCacheValid(userProfileCache.current, userId)) {
      return
    }

    if (userProfilePromiseRef.current && !force && userProfileCache.current?.userId === userId) {
      return userProfilePromiseRef.current
    }

    const fetchPromise = (async () => {
      setUserProfileLoading(true)
      setUserProfileError(null)
      try {
        const response = await api.get(`/api/user/profile?user_id=${userId}`)
        const data = response.data.user
        setUserProfile(data)
        userProfileCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        setUserProfileError(error.response?.data?.error || 'Failed to fetch user profile')
        setUserProfile(null)
      } finally {
        setUserProfileLoading(false)
        userProfilePromiseRef.current = null
      }
    })()

    userProfilePromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Fetch Home Data with caching
  const fetchHomeData = useCallback(async (force: boolean = false) => {
    if (!force && isCacheValid(homeDataCache.current)) {
      return
    }

    if (homeDataPromiseRef.current && !force) {
      return homeDataPromiseRef.current
    }

    const fetchPromise = (async () => {
      setHomeDataLoading(true)
      setHomeDataError(null)
      try {
        const response = await api.get('/api/user/home-data')
        const data = response.data.data
        setHomeData(data)
        homeDataCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        setHomeDataError(error.response?.data?.error || 'Failed to fetch home data')
        setHomeData(null)
      } finally {
        setHomeDataLoading(false)
        homeDataPromiseRef.current = null
      }
    })()

    homeDataPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Clear all cache (both local refs and API cache)
  const clearCache = useCallback(() => {
    postsCache.current = null
    usersCache.current = null
    dashboardStatsCache.current = null
    teamTreeCache.current = null
    commissionsCache.current = null
    userProfileCache.current = null
    homeDataCache.current = null
    // Also clear the API-level cache
    cacheUtils.clearAll()
  }, [])

  const value: DataContextType = {
    // Posts
    posts,
    postsLoading,
    postsError,
    fetchPosts,
    addPost,
    updatePost,
    deletePost,

    // Users (admin)
    users,
    usersLoading,
    usersError,
    fetchUsers,
    refreshUsers,

    // Admin Metrics (derived from posts and users)
    adminMetrics,
    adminMetricsLoading,

    // Dashboard Stats
    dashboardStats,
    dashboardStatsLoading,
    dashboardStatsError,
    fetchDashboardStats,

    // Team Tree
    teamTree,
    teamTreeLoading,
    teamTreeError,
    fetchTeamTree,

    // Commissions
    commissions,
    commissionsLoading,
    commissionsError,
    fetchCommissions,

    // User Profile
    userProfile,
    userProfileLoading,
    userProfileError,
    fetchUserProfile,

    // Home Data
    homeData,
    homeDataLoading,
    homeDataError,
    fetchHomeData,

    // Cache control
    clearCache,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
