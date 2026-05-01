export default class Header {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.options = {
      title: '',
      showBack: false,
      backUrl: null,
      rightContent: null,
      onBack: null,
      transparent: false,
      ...options
    }

    this.init()
  }

  init() {
    if (this.container) {
      this.container.innerHTML = this.render()
      this.bindEvents()
    }
  }

  render() {
    const headerClass = this.options.transparent 
      ? 'app-header app-header--transparent' 
      : 'app-header'

    return `
      <header class="${headerClass}">
        <div class="app-header__inner">
          <div class="app-header__left">
            ${this.options.showBack ? `
              <button class="app-header__back" id="header-back-btn" aria-label="返回">
                <span class="material-symbols-outlined">arrow_back</span>
              </button>
            ` : ''}
          </div>

          <h1 class="app-header__title">${this.escapeHtml(this.options.title)}</h1>

          <div class="app-header__right">
            ${this.options.rightContent || ''}
          </div>
        </div>
      </header>
    `
  }

  bindEvents() {
    const backBtn = document.getElementById('header-back-btn')
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.options.onBack && typeof this.options.onBack === 'function') {
          this.options.onBack()
        } else if (this.options.backUrl) {
          window.location.hash = this.options.backUrl
        } else {
          window.history.back()
        }
      })
    }
  }

  setTitle(title) {
    this.options.title = title
    
    const titleEl = this.container.querySelector('.app-header__title')
    
    if (titleEl) {
      titleEl.textContent = title
    }
  }

  setRightContent(content) {
    this.options.rightContent = content

    const rightEl = this.container.querySelector('.app-header__right')
    
    if (rightEl) {
      rightEl.innerHTML = content
    }
  }

  escapeHtml(str) {
    if (!str) return ''
    
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }

    return str.replace(/[&<>"']/g, char => escapeMap[char])
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}