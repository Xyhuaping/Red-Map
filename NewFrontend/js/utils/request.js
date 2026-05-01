import API_CONFIG from '../config/api.js'

class Request {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }

    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  async request(url, options = {}) {
    const { method = 'GET', data, params, isRefresh = false } = options

    let finalUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value)
        }
      }
      const queryString = searchParams.toString()
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(finalUrl, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401 && !isRefresh) {
          return await this.handleUnauthorized(url, options)
        }

        const errorData = await response.json().catch(() => ({ message: '请求失败' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.code === 200 || result.code === 201) {
        return result.data !== undefined ? result.data : result
      } else {
        throw new Error(result.message || '请求失败')
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('请求超时')
      }

      if (error.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查网络设置')
      }

      throw error
    }
  }

  async handleUnauthorized(originalUrl, originalOptions) {
    const refreshToken = localStorage.getItem(API_CONFIG.REFRESH_TOKEN_KEY)

    if (!refreshToken) {
      this.clearAuth()
      window.location.hash = '#/login'
      throw new Error('登录已过期，请重新登录')
    }

    try {
      const refreshResponse = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!refreshResponse.ok) {
        throw new Error('Token 刷新失败')
      }

      const refreshData = await refreshResponse.json()

      if (refreshData.data?.access_token) {
        localStorage.setItem(API_CONFIG.TOKEN_KEY, refreshData.data.access_token)

        if (refreshData.data.refresh_token) {
          localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, refreshData.data.refresh_token)
        }

        return this.request(originalUrl, { ...originalOptions, isRefresh: true })
      } else {
        throw new Error('Token 刷新失败')
      }
    } catch (error) {
      this.clearAuth()
      window.location.hash = '#/login'
      throw new Error('登录已过期，请重新登录')
    }
  }

  clearAuth() {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY)
    localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY)
  }

  get(url, params = {}) {
    return this.request(url, { method: 'GET', params })
  }

  post(url, data = {}) {
    return this.request(url, { method: 'POST', data })
  }

  put(url, data = {}) {
    return this.request(url, { method: 'PUT', data })
  }

  delete(url, data = {}) {
    return this.request(url, { method: 'DELETE', data })
  }

  patch(url, data = {}) {
    return this.request(url, { method: 'PATCH', data })
  }

  upload(url, formData, onProgress) {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
      
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (onProgress && event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          onProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response.data || response)
          } catch (error) {
            reject(new Error('响应解析失败'))
          }
        } else if (xhr.status === 401) {
          this.clearAuth()
          window.location.hash = '#/login'
          reject(new Error('登录已过期'))
        } else {
          reject(new Error(`上传失败: HTTP ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('网络错误')))
      xhr.addEventListener('abort', () => reject(new Error('上传已取消')))

      xhr.open('POST', `${this.baseURL}${url}`)
      xhr.timeout = this.timeout

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.send(formData)
    })
  }
}

const request = new Request()
export default request