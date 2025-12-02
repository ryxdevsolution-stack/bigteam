/**
 * Auth Slice - Redux state management for authentication
 * Handles login, logout, and session restoration
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import authService, { AuthUser, LoginCredentials, RegisterData } from '../../services/authService'
import { tokenUtils } from '../../services/api'

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Initialize state from localStorage
const storedUser = tokenUtils.getUser()
const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: tokenUtils.isAuthenticated(),
  loading: false,
  error: null,
}

// Login thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed')
    }
  }
)

// Register thunk
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authService.register(data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed')
    }
  }
)

// Logout thunk
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout()
  }
)

// Refresh user profile thunk
export const refreshProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getProfile()
      return user
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to refresh profile')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.error = action.payload as string
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails on server, clear local state
        state.loading = false
        state.user = null
        state.isAuthenticated = false
      })

      // Refresh Profile
      .addCase(refreshProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { clearError, setUser, clearAuth } = authSlice.actions
export default authSlice.reducer
