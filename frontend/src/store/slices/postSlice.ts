import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { postService } from '../../services/postService'
import { Post } from '../../types/post'

interface PostState {
  posts: Post[]
  selectedPost: Post | null
  loading: boolean
  error: string | null
}

const initialState: PostState = {
  posts: [],
  selectedPost: null,
  loading: false,
  error: null,
}

export const fetchPosts = createAsyncThunk('posts/fetchAll', async () => {
  const response = await postService.getAllPosts()
  return response.data
})

export const createPost = createAsyncThunk(
  'posts/create',
  async (postData: FormData) => {
    const response = await postService.createPost(postData)
    return response.data
  }
)

export const updatePost = createAsyncThunk(
  'posts/update',
  async ({ id, data }: { id: string; data: Partial<Post> }) => {
    const response = await postService.updatePost(id, data)
    return response.data
  }
)

export const deletePost = createAsyncThunk(
  'posts/delete',
  async (id: string) => {
    await postService.deletePost(id)
    return id
  }
)

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch posts'
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload)
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.posts[index] = action.payload
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p.id !== action.payload)
      })
  },
})

export const { setSelectedPost } = postSlice.actions
export default postSlice.reducer