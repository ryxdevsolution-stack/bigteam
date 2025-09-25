import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { Post } from '../types/post'
import { User } from '../types/user'
import api from '../services/api'

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