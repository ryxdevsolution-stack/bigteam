export interface User {
  id: string
  full_name: string
  username?: string
  email: string
  role: 'admin' | 'customer'
  is_active?: boolean
  created_at?: string
  updated_at?: string
  profile_picture?: string
}