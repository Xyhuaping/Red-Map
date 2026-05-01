import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('admin_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username, password) {
    const res = await authApi.login({ username, password })
    token.value = res.data.access_token
    user.value = res.data.user
    localStorage.setItem('admin_token', res.data.access_token)
    localStorage.setItem('admin_user', JSON.stringify(res.data.user))
    return res.data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  async function fetchCurrentUser() {
    try {
      const res = await authApi.me()
      user.value = res.data
      localStorage.setItem('admin_user', JSON.stringify(res.data))
    } catch {
      logout()
    }
  }

  return { token, user, isAuthenticated, isAdmin, login, logout, fetchCurrentUser }
})
