import request from '../utils/request.js'
import { userStore } from '../store/index.js'

class AuthService {
  async register(data) {
    const result = await request.post('/api/auth/register', {
      username: data.username,
      password: data.password,
      nickname: data.nickname || ''
    })

    if (result.access_token) {
      userStore.login(
        result.access_token,
        result.refresh_token,
        result.user
      )
    }

    return result
  }

  async login(username, password) {
    const result = await request.post('/api/auth/login', { username, password })

    if (result.access_token) {
      userStore.login(
        result.access_token,
        result.refresh_token,
        result.user
      )
    }

    return result
  }

  async getMe() {
    try {
      const user = await request.get('/api/auth/me')
      
      if (user) {
        userStore.updateUserInfo(user)
      }
      
      return user
    } catch (error) {
      console.error('Failed to get user info:', error)
      throw error
    }
  }

  async changePassword(oldPassword, newPassword) {
    const result = await request.put('/api/auth/password', {
      old_password: oldPassword,
      new_password: newPassword
    })
    
    return result
  }

  async refreshToken(refreshToken) {
    try {
      const result = await request.post('/api/auth/refresh', {
        refresh_token: refreshToken
      })

      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token)
        
        if (result.refresh_token) {
          localStorage.setItem('refresh_token', result.refresh_token)
          userStore.state.refreshToken = result.refresh_token
        }
        
        userStore.state.token = result.access_token
        
        if (result.user) {
          userStore.updateUserInfo(result.user)
        }
      }

      return result
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  async logout() {
    try {
      await request.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      userStore.logout()
    }
  }

  isLoggedIn() {
    return userStore.state.isLoggedIn && !!localStorage.getItem('access_token')
  }

  getToken() {
    return localStorage.getItem('access_token')
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token')
  }
}

const authService = new AuthService()
export default authService