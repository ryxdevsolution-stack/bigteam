import api from './api'
import { Post } from '../types/post'

export const postService = {
  getAllPosts: () => api.get<Post[]>('/api/posts'),

  getPost: (id: string) => api.get<Post>(`/api/posts/${id}`),

  createPost: (data: FormData) =>
    api.post<Post>('/api/admin/posts', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  updatePost: (id: string, data: Partial<Post>) =>
    api.put<Post>(`/api/admin/posts/${id}`, data),

  deletePost: (id: string) =>
    api.delete(`/api/admin/posts/${id}`),

  interactWithPost: (id: string, type: 'like' | 'share' | 'view') =>
    api.post(`/api/posts/${id}/interact`, { interaction_type: type }),
}