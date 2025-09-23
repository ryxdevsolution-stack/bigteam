import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { userService } from '../../services/userService'
import { User } from '../../types/user'

interface UserState {
  users: User[]
  selectedUser: User | null
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
}

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const response = await userService.getAllUsers()
  return response.data
})

export const createUser = createAsyncThunk(
  'users/create',
  async (userData: Partial<User>) => {
    const response = await userService.createUser(userData)
    return response.data
  }
)

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: Partial<User> }) => {
    const response = await userService.updateUser(id, data)
    return response.data
  }
)

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string) => {
    await userService.deleteUser(id)
    return id
  }
)

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch users'
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload)
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload)
      })
  },
})

export const { setSelectedUser } = userSlice.actions
export default userSlice.reducer