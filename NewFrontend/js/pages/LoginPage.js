import authService from '../services/auth.js'
import APP_CONFIG from '../config/app.js'

export default class LoginPage {
  constructor(container) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.isLoginMode = true
    this.isLoading = false
    this.errors = {}

    this.init()
  }

  init() {
    this.render()
    this.bindEvents()
  }

  render() {
    this.container.innerHTML = `
      <div class="login-page">
        <div class="login-container">
          <div class="login-header">
            <div class="login-logo">🏛️</div>
            <h1 class="login-title">红色文化AR游览</h1>
            <p class="login-subtitle">${this.isLoginMode ? '欢迎回来，请登录您的账号' : '创建新账号开始探索'}</p>
          </div>

          <form class="login-form" id="login-form" novalidate>
            ${!this.isLoginMode ? `
              <div class="form-group">
                <span class="form-icon">👤</span>
                <input 
                  type="text" 
                  class="form-input" 
                  id="nickname"
                  placeholder="昵称（选填）"
                  autocomplete="nickname"
                >
              </div>
            ` : ''}

            <div class="form-group">
              <span class="form-icon">📧</span>
              <input 
                type="text" 
                class="form-input" 
                id="username"
                placeholder="请输入用户名"
                autocomplete="username"
                required
              >
              <div class="form-error" id="username-error"></div>
            </div>

            <div class="form-group">
              <span class="form-icon">🔒</span>
              <input 
                type="password" 
                class="form-input" 
                id="password"
                placeholder="请输入密码"
                autocomplete="${this.isLoginMode ? 'current-password' : 'new-password'}"
                required
              >
              <div class="form-error" id="password-error"></div>
            </div>

            <button type="submit" class="login-btn" id="submit-btn">
              ${this.isLoading ? '<div class="loading-spinner"></div>' : (this.isLoginMode ? '登 录' : '注 册')}
            </button>
          </form>

          <div class="login-footer">
            ${this.isLoginMode ? '还没有账号？' : '已有账号？'}
            <span class="login-toggle" id="mode-toggle">${this.isLoginMode ? '立即注册' : '返回登录'}</span>
          </div>
        </div>
      </div>
    `
  }

  bindEvents() {
    const form = document.getElementById('login-form')
    
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e))
    }

    const modeToggle = document.getElementById('mode-toggle')
    if (modeToggle) {
      modeToggle.addEventListener('click', () => this.toggleMode())
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode
    this.errors = {}
    this.render()
    this.bindEvents()
  }

  async handleSubmit(e) {
    e.preventDefault()

    if (this.isLoading) return

    const username = document.getElementById('username')?.value?.trim()
    const password = document.getElementById('password')?.value
    const nickname = document.getElementById('nickname')?.value?.trim()

    if (!this.validateForm(username, password)) return

    this.isLoading = true
    this.updateSubmitButton(true)

    try {
      if (this.isLoginMode) {
        await authService.login(username, password)
        this.showToast('登录成功！', 'success')
        
        setTimeout(() => {
          window.location.hash = '#/'
        }, 1000)
      } else {
        await authService.register({
          username,
          password,
          nickname: nickname || undefined
        })
        
        this.showToast('注册成功！', 'success')
        
        setTimeout(() => {
          window.location.hash = '#/'
        }, 1000)
      }
    } catch (error) {
      console.error(`${this.isLoginMode ? 'Login' : 'Register'} failed:`, error)
      this.showToast(error.message || `${this.isLoginMode ? '登录' : '注册'}失败，请重试`, 'error')
    } finally {
      this.isLoading = false
      this.updateSubmitButton(false)
    }
  }

  validateForm(username, password) {
    this.errors = {}
    let isValid = true

    if (!username || username.length < APP_CONFIG.VALIDATION.USERNAME_MIN_LENGTH) {
      this.errors.username = `用户名至少${APP_CONFIG.VALIDATION.USERNAME_MIN_LENGTH}个字符`
      isValid = false
    } else if (username.length > APP_CONFIG.VALIDATION.USERNAME_MAX_LENGTH) {
      this.errors.username = `用户名最多${APP_CONFIG.VALIDATION.USERNAME_MAX_LENGTH}个字符`
      isValid = false
    }

    if (!password || password.length < APP_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
      this.errors.password = `密码至少${APP_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH}个字符`
      isValid = false
    }

    this.showErrors()

    return isValid
  }

  showErrors() {
    const usernameError = document.getElementById('username-error')
    const passwordError = document.getElementById('password-error')

    if (usernameError) {
      usernameError.textContent = this.errors.username || ''
    }

    if (passwordError) {
      passwordError.textContent = this.errors.password || ''
    }
  }

  updateSubmitButton(isLoading) {
    const btn = document.getElementById('submit-btn')
    
    if (btn) {
      btn.disabled = isLoading
      btn.innerHTML = isLoading 
        ? '<div class="loading-spinner"></div>'
        : (this.isLoginMode ? '登 录' : '注 册')
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 32px;
      background: ${type === 'success' ? '#52C41A' : type === 'error' ? '#F5222D' : '#1890FF'};
      color: white;
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: fadeInOut 2s ease-in-out forwards;
    `
    toast.textContent = message

    document.body.appendChild(toast)

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 2000)
  }

  destroy() {
    this.isLoginMode = true
    this.isLoading = false
    this.errors = {}
  }
}