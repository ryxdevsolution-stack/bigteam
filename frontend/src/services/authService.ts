import api from './api'

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials)
    // Backend doesn't return tokens yet, just user data
    // Will need JWT implementation in backend later
    if (response.data.user) {
      // Store user data temporarily
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  },

  logout: async () => {
    // Backend doesn't have logout endpoint yet
    // Just clear local storage for now
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  refreshToken: async () => {
    // Backend doesn't have refresh token endpoint yet
    // Will need JWT implementation in backend later
    return Promise.reject(new Error('Refresh token not implemented'))
  },
}