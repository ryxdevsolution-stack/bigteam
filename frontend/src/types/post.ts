export interface Post {
  id: string
  title: string
  content: string
  media_type: 'video' | 'image'
  media_url: string
  thumbnail_url?: string
  created_by: string
  is_published: boolean
  created_at: string
  updated_at: string
  likes_count: number
  shares_count: number
  views_count: number
}