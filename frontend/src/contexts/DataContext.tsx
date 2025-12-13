/**
 * Data Context - Centralized data fetching with smart caching
 * Implements per-user cache keys and request deduplication
 * Optimized for minimal API calls and maximum performance
 */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'
import { Post } from '../types/post'
import { User } from '../types/user'
import { cacheUtils, cachedGet } from '../services/api'
import { DashboardStats } from '../services/userService'
import { TreeData, Commission } from '../services/teamService'
import { Meeting } from '../services/meetingService'
import { Package } from '../services/packageService'

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

  // Meetings (admin)
  meetings: Meeting[]
  meetingsLoading: boolean
  meetingsError: string | null
  fetchMeetings: (force?: boolean) => Promise<void>
  addMeeting: (meeting: Meeting) => void
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => void
  deleteMeeting: (meetingId: string) => void

  // Packages (admin)
  packages: Package[]
  packagesLoading: boolean
  packagesError: string | null
  fetchPackages: (force?: boolean) => Promise<void>
  addPackage: (pkg: Package) => void
  updatePackage: (packageId: string, updates: Partial<Package>) => void
  deletePackage: (packageId: string) => void

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

  // Meetings state (admin - static data, longer cache)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)
  const [meetingsError, setMeetingsError] = useState<string | null>(null)
  const meetingsCache = useRef<CacheEntry<Meeting[]> | null>(null)
  const meetingsPromiseRef = useRef<Promise<void> | null>(null)

  // Packages state (admin - static data, longer cache)
  const [packages, setPackages] = useState<Package[]>([])
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [packagesError, setPackagesError] = useState<string | null>(null)
  const packagesCache = useRef<CacheEntry<Package[]> | null>(null)
  const packagesPromiseRef = useRef<Promise<void> | null>(null)

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
        // Use cachedGet with 30 second TTL to prevent duplicate calls
        const response = await cachedGet('/api/posts', { ttl: 30000 })
        const data = response.data.data || []
        setPosts(data)
        postsCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return
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
        // Use cachedGet with 30 second TTL to prevent duplicate calls
        const response = await cachedGet('/auth/admin/users', { ttl: 30000 })
        const data = response.data.data || []
        setUsers(data)
        usersCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return
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
    // 1. Solution for 'posts': Ensures 'posts' is an array, defaulting to [] if not.
    const validPosts = Array.isArray(posts) ? posts : [];
    
    // 2. Solution for 'users': Ensures 'users' is an array, defaulting to [] if not.
    const validUsers = Array.isArray(users) ? users : [];

    // --- Calculations using the safe, valid array variables ---
    
    // Use validPosts for all filter and reduce operations:
    const videoCount = validPosts.filter(p => p.media_type === 'video').length
    const imageCount = validPosts.filter(p => p.media_type === 'image').length
    
    // Use validPosts for reduce:
    const totalViews = validPosts.reduce((acc, p) => acc + (p.views_count || 0), 0)
    const totalLikes = validPosts.reduce((acc, p) => acc + (p.likes_count || 0), 0)
    const totalShares = validPosts.reduce((acc, p) => acc + (p.shares_count || 0), 0)

    return {
      // Use validUsers for filtering total users:
      totalUsers: validUsers.filter(u => u.role === 'customer').length,
      
      // Use validPosts for totalPosts and the length check in engagementRate:
      totalPosts: validPosts.length,
      
      engagementRate: validPosts.length > 0
        ? Math.round((totalLikes + totalShares) / validPosts.length * 100) / 100
        : 0,
        
      adRevenue: 0, // Would need ads data
      totalViews,
      totalLikes,
      totalShares,
      totalComments: 0, // Would need comments data
      videoCount,
      imageCount
    }
    // The dependency array is correct
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
        const response = await cachedGet(`/api/user/dashboard-stats?user_id=${userId}`, { ttl: 30000 })
        const data = response.data.stats
        setDashboardStats(data)
        dashboardStatsCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return
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
        const response = await cachedGet(`/api/team/tree/${userId}`, { ttl: 30000 })
        const data = response.data.tree
        setTeamTree(data)
        teamTreeCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return
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
        const response = await cachedGet('/api/user/commissions', {
          params: { user_id: userId, limit: 50 },
          ttl: 30000
        })
        const data = response.data.commissions || []
        setCommissions(data)
        commissionsCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        // Ignore cancelled requests (component unmount)
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }
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
        const response = await cachedGet(`/api/user/profile?user_id=${userId}`, { ttl: 30000 })
        const data = response.data.user
        setUserProfile(data)
        userProfileCache.current = { data, timestamp: Date.now(), userId }
      } catch (error: any) {
        // Ignore cancelled requests (component unmount)
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }
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
        const response = await cachedGet('/api/user/home-data', { ttl: 30000 })
        const data = response.data.data
        setHomeData(data)
        homeDataCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        // Ignore cancelled requests (component unmount)
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }
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

  // === MEETINGS MANAGEMENT (ADMIN) ===
  const fetchMeetings = useCallback(async (force: boolean = false) => {
    if (!force && isCacheValid(meetingsCache.current)) {
      return
    }

    if (meetingsPromiseRef.current && !force) {
      return meetingsPromiseRef.current
    }

    const fetchPromise = (async () => {
      setMeetingsLoading(true)
      setMeetingsError(null)
      try {
        const response = await cachedGet('/api/meetings/all', { ttl: 30000 })
        // API returns raw array directly
        const data = Array.isArray(response.data) ? response.data : (response.data.data || [])
        setMeetings(data)
        meetingsCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        // Ignore cancelled requests (component unmount)
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }
        setMeetingsError(error.response?.data?.error || error.message || 'Failed to fetch meetings')
        setMeetings([])
      } finally {
        setMeetingsLoading(false)
        meetingsPromiseRef.current = null
      }
    })()

    meetingsPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  const addMeeting = useCallback((meeting: Meeting) => {
    setMeetings(prev => [meeting, ...prev])
    if (meetingsCache.current) {
      meetingsCache.current = {
        data: [meeting, ...meetingsCache.current.data],
        timestamp: Date.now()
      }
    }
  }, [])

  const updateMeeting = useCallback((meetingId: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId ? { ...m, ...updates } : m
    ))
    if (meetingsCache.current) {
      meetingsCache.current = {
        data: meetingsCache.current.data.map(m =>
          m.id === meetingId ? { ...m, ...updates } : m
        ),
        timestamp: Date.now()
      }
    }
  }, [])

  const deleteMeeting = useCallback((meetingId: string) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId))
    if (meetingsCache.current) {
      meetingsCache.current = {
        data: meetingsCache.current.data.filter(m => m.id !== meetingId),
        timestamp: Date.now()
      }
    }
  }, [])

  // === PACKAGES MANAGEMENT (ADMIN) ===
  const fetchPackages = useCallback(async (force: boolean = false) => {
    // Return early if cache is valid and not forcing refresh
    if (!force && isCacheValid(packagesCache.current)) {
      return
    }

    // Return existing promise if a request is already in flight
    if (packagesPromiseRef.current && !force) {
      return packagesPromiseRef.current
    }

    // Use cachedGet for automatic deduplication and caching
    const fetchPromise = (async () => {
      setPackagesLoading(true)
      setPackagesError(null)
      try {
        // Use cachedGet with 30 second TTL to prevent duplicate calls
        const response = await cachedGet('/api/admin/packages', { ttl: 30000 })
        const data = response.data.data || []
        setPackages(data)
        packagesCache.current = { data, timestamp: Date.now() }
      } catch (error: any) {
        // Ignore cancelled requests (from StrictMode or component unmount)
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }
        setPackagesError(error.response?.data?.error || error.message || 'Failed to fetch packages')
        setPackages([])
      } finally {
        setPackagesLoading(false)
        packagesPromiseRef.current = null
      }
    })()

    packagesPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  const addPackage = useCallback((pkg: Package) => {
    setPackages(prev => [pkg, ...prev])
    if (packagesCache.current) {
      packagesCache.current = {
        data: [pkg, ...packagesCache.current.data],
        timestamp: Date.now()
      }
    }
  }, [])

  const updatePackage = useCallback((packageId: string, updates: Partial<Package>) => {
    setPackages(prev => prev.map(p =>
      p.id === packageId ? { ...p, ...updates } : p
    ))
    if (packagesCache.current) {
      packagesCache.current = {
        data: packagesCache.current.data.map(p =>
          p.id === packageId ? { ...p, ...updates } : p
        ),
        timestamp: Date.now()
      }
    }
  }, [])

  const deletePackage = useCallback((packageId: string) => {
    setPackages(prev => prev.filter(p => p.id !== packageId))
    if (packagesCache.current) {
      packagesCache.current = {
        data: packagesCache.current.data.filter(p => p.id !== packageId),
        timestamp: Date.now()
      }
    }
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
    meetingsCache.current = null
    packagesCache.current = null
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

    // Meetings (admin)
    meetings,
    meetingsLoading,
    meetingsError,
    fetchMeetings,
    addMeeting,
    updateMeeting,
    deleteMeeting,

    // Packages (admin)
    packages,
    packagesLoading,
    packagesError,
    fetchPackages,
    addPackage,
    updatePackage,
    deletePackage,

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
