export default class Footer {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.options = {
      activeTab: 'home',
      onTabChange: null,
      ...options
    }

    this.tabs = [
      { id: 'home', path: '/', icon: 'explore', label: '探索' },
      { id: 'map', path: '/map', icon: 'map', label: '地图' },
      { id: 'figures', path: '/figures', icon: 'groups', label: '人物' },
      { id: 'stats', path: '/stats', icon: 'bar_chart', label: '统计' },
      { id: 'profile', path: '/profile', icon: 'person', label: '我的' }
    ]

    this.init()
  }

  init() {
    if (this.container) {
      this.container.innerHTML = this.render()
      this.bindEvents()
    }
  }

  render() {
    const tabsHtml = this.tabs.map(tab => {
      const isActive = tab.id === this.options.activeTab
      return `
        <button 
          class="nav-tab ${isActive ? 'nav-tab--active' : ''}"
          data-tab-id="${tab.id}"
          data-tab-path="${tab.path}"
          aria-label="${tab.label}"
        >
          <span class="nav-tab__icon-wrap">
            <span class="material-symbols-outlined ${isActive ? 'filled' : ''}">${tab.icon}</span>
            ${isActive ? '<span class="nav-tab__dot"></span>' : ''}
          </span>
          <span class="nav-tab__label">${tab.label}</span>
        </button>
      `
    }).join('')

    return `
      <nav class="app-nav">
        <div class="app-nav__inner">
          ${tabsHtml}
        </div>
      </nav>
    `
  }

  bindEvents() {
    const tabs = this.container.querySelectorAll('.nav-tab')
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tabId
        const tabPath = tab.dataset.tabPath

        this.setActiveTab(tabId)

        if (this.options.onTabChange && typeof this.options.onTabChange === 'function') {
          this.options.onTabChange(tabId, tabPath)
        } else {
          window.location.hash = `#${tabPath}`
        }
      })
    })
  }

  setActiveTab(tabId) {
    this.options.activeTab = tabId

    const tabs = this.container.querySelectorAll('.nav-tab')
    
    tabs.forEach(tab => {
      const isActive = tab.dataset.tabId === tabId
      tab.classList.toggle('nav-tab--active', isActive)
      
      const icon = tab.querySelector('.material-symbols-outlined')
      if (icon) {
        icon.classList.toggle('filled', isActive)
      }

      const existingDot = tab.querySelector('.nav-tab__dot')
      if (isActive && !existingDot) {
        const iconWrap = tab.querySelector('.nav-tab__icon-wrap')
        if (iconWrap) {
          const dot = document.createElement('span')
          dot.className = 'nav-tab__dot'
          iconWrap.appendChild(dot)
        }
      } else if (!isActive && existingDot) {
        existingDot.remove()
      }
    })
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}