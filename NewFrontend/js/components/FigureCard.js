export default class FigureCard {
  constructor(container, figure = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.figure = figure
  }

  render() {
    if (!this.figure) return ''

    return `
      <div class="figure-card" data-figure-id="${this.figure.id || ''}">
        <div class="figure-card__avatar">
          ${this.figure.avatar_url 
            ? `<img src="${this.figure.avatar_url}" alt="${this.escapeHtml(this.figure.name)}">` 
            : `<span>${(this.figure.name || '未')[0]}</span>`
          }
        </div>
        <div class="figure-card__info">
          <h3 class="figure-card__name">${this.escapeHtml(this.figure.name)}</h3>
          <p class="figure-card__title">${this.escapeHtml(this.figure.title || '')}</p>
          <p class="figure-card__location">
            📍 ${this.escapeHtml(this.figure.location || '未知地点')}
          </p>
        </div>
        <div class="figure-card__arrow">→</div>
      </div>
    `
  }

  bindEvents(onClick) {
    const card = this.container.querySelector('.figure-card')
    
    if (card && onClick) {
      card.addEventListener('click', () => onClick(this.figure))
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