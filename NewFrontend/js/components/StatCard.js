export default class StatCard {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.options = {
      icon: '📊',
      label: '',
      value: 0,
      unit: '',
      color: 'primary',
      showProgress: false,
      progress: 0,
      trend: null,
      ...options
    }

    this.init()
  }

  init() {
    if (this.container) {
      this.container.innerHTML = this.render()
    }
  }

  render() {
    const colorClass = `stat-card--${this.options.color}`

    return `
      <div class="stat-card ${colorClass}">
        <div class="stat-card__icon">${this.options.icon}</div>
        
        <div class="stat-card__content">
          <div class="stat-card__value">
            <span class="stat-card__number">${this.formatValue(this.options.value)}</span>
            <span class="stat-card__unit">${this.escapeHtml(this.options.unit)}</span>
            
            ${this.options.trend ? `
              <span class="stat-card__trend stat-card__trend--${this.options.trend > 0 ? 'up' : 'down'}">
                ${this.options.trend > 0 ? '↑' : '↓'} ${Math.abs(this.options.trend)}%
              </span>
            ` : ''}
          </div>
          
          <div class="stat-card__label">${this.escapeHtml(this.options.label)}</div>
          
          ${this.options.showProgress ? `
            <div class="stat-card__progress">
              <div 
                class="stat-card__progress-bar" 
                style="width: ${Math.min(100, Math.max(0, this.options.progress))}%"
              ></div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  formatValue(value) {
    if (typeof value === 'number') {
      return value.toLocaleString('zh-CN')
    }
    
    return String(value || 0)
  }

  setValue(value) {
    this.options.value = value
    this.update()
  }

  setProgress(progress) {
    this.options.showProgress = true
    this.options.progress = progress
    this.update()
  }

  setTrend(trend) {
    this.options.trend = trend
    this.update()
  }

  update() {
    if (this.container) {
      this.container.innerHTML = this.render()
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