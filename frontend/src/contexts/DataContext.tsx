import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { Post } from '../types/post'
import { User } from '../types/user'
import api from '../services/api'
import { DashboardStats } from '../services/userService'
import { TreeData, Commission } from '../services/mlmService'

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

interface DataContextType {
  // Posts
  posts: Post[]
  postsLoading: boolean
  postsError: string | null
  lastPostsFetch: number | null
  fetchPosts: (force?: boolean) => Promise<void>
  addPost: (post: Post) => void
  updatePost: (postId: string, updates: Partial<Post>) => void
  deletePost: (postId: string) => void

  // Users
  users: User[]
  usersLoading: boolean
  usersError: string | null
  lastUsersFetch: number | null
  fetchUsers: (force?: boolean) => Promise<void>

  // Dashboard Stats
  dashboardStats: DashboardStats | null
  dashboardStatsLoading: boolean
  dashboardStatsError: string | null
  lastDashboardStatsFetch: number | null
  fetchDashboardStats: (userId: string, force?: boolean) => Promise<void>

  // MLM Tree
  mlmTree: TreeData | null
  mlmTreeLoading: boolean
  mlmTreeError: string | null
  lastMlmTreeFetch: number | null
  fetchMlmTree: (userId: string, force?: boolean) => Promise<void>

  // Commissions
  commissions: Commission[]
  commissionsLoading: boolean
  commissionsError: string | null
  lastCommissionsFetch: number | null
  fetchCommissions: (userId: string, force?: boolean) => Promise<void>

  // User Profile
  userProfile: User | null
  userProfileLoading: boolean
  userProfileError: string | null
  lastUserProfileFetch: number | null
  fetchUserProfile: (userId: string, force?: boolean) => Promise<void>

  // Home Data
  homeData: HomeData | null
  homeDataLoading: boolean
  homeDataError: string | null
  lastHomeDataFetch: number | null
  fetchHomeData: (force?: boolean) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Cache duration in milliseconds (5 seconds)
const CACHE_DURATION = 5000

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Posts state
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)
  const [lastPostsFetch, setLastPostsFetch] = useState<number | null>(null)
  const postsPromiseRef = useRef<Promise<void> | null>(null)

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [lastUsersFetch, setLastUsersFetch] = useState<number | null>(null)
  const usersPromiseRef = useRef<Promise<void> | null>(null)

  // Dashboard Stats state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(false)
  const [dashboardStatsError, setDashboardStatsError] = useState<string | null>(null)
  const [lastDashboardStatsFetch, setLastDashboardStatsFetch] = useState<number | null>(null)
  const dashboardStatsPromiseRef = useRef<Promise<void> | null>(null)

  // MLM Tree state
  const [mlmTree, setMlmTree] = useState<TreeData | null>(null)
  const [mlmTreeLoading, setMlmTreeLoading] = useState(false)
  const [mlmTreeError, setMlmTreeError] = useState<string | null>(null)
  const [lastMlmTreeFetch, setLastMlmTreeFetch] = useState<number | null>(null)
  const mlmTreePromiseRef = useRef<Promise<void> | null>(null)

  // Commissions state
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [commissionsLoading, setCommissionsLoading] = useState(false)
  const [commissionsError, setCommissionsError] = useState<string | null>(null)
  const [lastCommissionsFetch, setLastCommissionsFetch] = useState<number | null>(null)
  const commissionsPromiseRef = useRef<Promise<void> | null>(null)

  // User Profile state
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [userProfileLoading, setUserProfileLoading] = useState(false)
  const [userProfileError, setUserProfileError] = useState<string | null>(null)
  const [lastUserProfileFetch, setLastUserProfileFetch] = useState<number | null>(null)
  const userProfilePromiseRef = useRef<Promise<void> | null>(null)

  // Home Data state
  const [homeData, setHomeData] = useState<HomeData | null>(null)
  const [homeDataLoading, setHomeDataLoading] = useState(false)
  const [homeDataError, setHomeDataError] = useState<string | null>(null)
  const [lastHomeDataFetch, setLastHomeDataFetch] = useState<number | null>(null)
  const homeDataPromiseRef = useRef<Promise<void> | null>(null)

  // Fetch posts with caching and deduplication
  const fetchPosts = useCallback(async (force: boolean = false) => {
    // Check if we need to fetch
    const now = Date.now()
    if (!force && lastPostsFetch && now - lastPostsFetch < CACHE_DURATION) {
      return // Use cached data
    }

    // If already fetching, return the existing promise
    if (postsPromiseRef.current && !force) {
      return postsPromiseRef.current
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
      setPostsLoading(true)
      setPostsError(null)
      try {
        const response = await api.get('/api/posts')
        setPosts(response.data || [])
        setLastPostsFetch(Date.now())
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
  }, [lastPostsFetch])

  // Fetch users with caching and deduplication
  const fetchUsers = useCallback(async (force: boolean = false) => {
    // Check if we need to fetch
    const now = Date.now()
    if (!force && lastUsersFetch && now - lastUsersFetch < CACHE_DURATION) {
      return // Use cached data
    }

    // If already fetching, return the existing promise
    if (usersPromiseRef.current && !force) {
      return usersPromiseRef.current
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
      setUsersLoading(true)
      setUsersError(null)
      try {
        const response = await api.get('/auth/users')
        setUsers(response.data || [])
        setLastUsersFetch(Date.now())
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
  }, [lastUsersFetch])

  // Post management functions
  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev])
    setLastPostsFetch(Date.now()) // Update cache timestamp
  }, [])

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, ...updates } : post
    ))
  }, [])

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }, [])

  // Fetch Dashboard Stats with caching and deduplication
  const fetchDashboardStats = useCallback(async (userId: string, force: boolean = false) => {
    const now = Date.now()
    if (!force && lastDashboardStatsFetch && now - lastDashboardStatsFetch < CACHE_DURATION) {
      return
    }

    if (dashboardStatsPromiseRef.current && !force) {
      return dashboardStatsPromiseRef.current
    }

    const fetchPromise = (async () => {
      setDashboardStatsLoading(true)
      setDashboardStatsError(null)
      try {
        const response = await api.get(`/api/user/dashboard-stats?user_id=${userId}`)
        setDashboardStats(response.data.stats)
        setLastDashboardStatsFetch(Date.now())
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
  }, [lastDashboardStatsFetch])

  // Fetch MLM Tree with caching and deduplication
  const fetchMlmTree = useCallback(async (userId: string, force: boolean = false) => {
    const now = Date.now()
    if (!force && lastMlmTreeFetch && now - lastMlmTreeFetch < CACHE_DURATION) {
      return
    }

    if (mlmTreePromiseRef.current && !force) {
      return mlmTreePromiseRef.current
    }

    const fetchPromise = (async () => {
      setMlmTreeLoading(true)
      setMlmTreeError(null)
      try {
        const response = await api.get(`/api/mlm/tree/${userId}`)
        setMlmTree(response.data.tree)
        setLastMlmTreeFetch(Date.now())
      } catch (error: any) {
        setMlmTreeError(error.response?.data?.error || 'Failed to fetch MLM tree')
        setMlmTree(null)
      } finally {
        setMlmTreeLoading(false)
        mlmTreePromiseRef.current = null
      }
    })()

    mlmTreePromiseRef.current = fetchPromise
    return fetchPromise
  }, [lastMlmTreeFetch])

  // Fetch Commissions with caching and deduplication
  const fetchCommissions = useCallback(async (userId: string, force: boolean = false) => {
    const now = Date.now()
    if (!force && lastCommissionsFetch && now - lastCommissionsFetch < CACHE_DURATION) {
      return
    }

    if (commissionsPromiseRef.current && !force) {
      return commissionsPromiseRef.current
    }

    const fetchPromise = (async () => {
      setCommissionsLoading(true)
      setCommissionsError(null)
      try {
        const response = await api.get('/api/user/commissions', {
          params: { user_id: userId, limit: 50 }
        })
        setCommissions(response.data.commissions || [])
        setLastCommissionsFetch(Date.now())
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
  }, [lastCommissionsFetch])

  // Fetch User Profile with caching and deduplication
  const fetchUserProfile = useCallback(async (userId: string, force: boolean = false) => {
    const now = Date.now()
    if (!force && lastUserProfileFetch && now - lastUserProfileFetch < CACHE_DURATION) {
      return
    }

    if (userProfilePromiseRef.current && !force) {
      return userProfilePromiseRef.current
    }

    const fetchPromise = (async () => {
      setUserProfileLoading(true)
      setUserProfileError(null)
      try {
        const response = await api.get(`/api/user/profile?user_id=${userId}`)
        setUserProfile(response.data.user)
        setLastUserProfileFetch(Date.now())
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
  }, [lastUserProfileFetch])

  // Fetch Home Data with caching and deduplication
  const fetchHomeData = useCallback(async (force: boolean = false) => {
    const now = Date.now()
    if (!force && lastHomeDataFetch && now - lastHomeDataFetch < CACHE_DURATION) {
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
        setHomeData(response.data.data)
        setLastHomeDataFetch(Date.now())
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
  }, [lastHomeDataFetch])

  const value: DataContextType = {
    // Posts
    posts,
    postsLoading,
    postsError,
    lastPostsFetch,
    fetchPosts,
    addPost,
    updatePost,
    deletePost,

    // Users
    users,
    usersLoading,
    usersError,
    lastUsersFetch,
    fetchUsers,

    // Dashboard Stats
    dashboardStats,
    dashboardStatsLoading,
    dashboardStatsError,
    lastDashboardStatsFetch,
    fetchDashboardStats,

    // MLM Tree
    mlmTree,
    mlmTreeLoading,
    mlmTreeError,
    lastMlmTreeFetch,
    fetchMlmTree,

    // Commissions
    commissions,
    commissionsLoading,
    commissionsError,
    lastCommissionsFetch,
    fetchCommissions,

    // User Profile
    userProfile,
    userProfileLoading,
    userProfileError,
    lastUserProfileFetch,
    fetchUserProfile,

    // Home Data
    homeData,
    homeDataLoading,
    homeDataError,
    lastHomeDataFetch,
    fetchHomeData,
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