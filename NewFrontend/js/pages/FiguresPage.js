import figuresService from '../services/figures.js'
import FigureCard from '../components/FigureCard.js'

export default class FiguresPage {
  constructor(container) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.figures = []
    this.filteredFigures = []
    this.searchKeyword = ''

    this.init()
  }

  async init() {
    try {
      await this.render()
      await this.fetchFigures()
      this.bindEvents()
    } catch (error) {
      console.error('Failed to initialize figures page:', error)
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="figures-page">
        <div class="search-bar">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              class="search-input" 
              id="search-input"
              placeholder="搜索历史人物..."
              value="${this.searchKeyword}"
            >
          </div>
        </div>

        <div class="figures-grid" id="figures-grid"></div>
      </div>
    `
  }

  async fetchFigures() {
    try {
      this.figures = await figuresService.getFigures({ skip: 0, limit: 100 })
      this.applyFilter()
      this.renderFiguresList()
    } catch (error) {
      console.error('Failed to fetch figures:', error)
      this.showError()
    }
  }

  applyFilter() {
    if (!this.searchKeyword.trim()) {
      this.filteredFigures = [...this.figures]
      return
    }

    const keyword = this.searchKeyword.toLowerCase().trim()

    this.filteredFigures = this.figures.filter(figure => {
      const nameMatch = (figure.name || '').toLowerCase().includes(keyword)
      const titleMatch = (figure.title || '').toLowerCase().includes(keyword)
      const locationMatch = (figure.location || '').toLowerCase().includes(keyword)

      return nameMatch || titleMatch || locationMatch
    })
  }

  renderFiguresList() {
    const gridContainer = document.getElementById('figures-grid')
    
    if (!gridContainer) return

    if (!this.filteredFigures || this.filteredFigures.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>暂无${this.searchKeyword ? '匹配的' : ''}历史人物数据</p>
        </div>
      `
      return
    }

    gridContainer.innerHTML = ''

    this.filteredFigures.forEach(figure => {
      const cardWrapper = document.createElement('div')
      gridContainer.appendChild(cardWrapper)

      const figureCard = new FigureCard(cardWrapper, figure)
      cardWrapper.innerHTML = figureCard.render()
      
      figureCard.bindEvents((selectedFigure) => {
        this.selectFigure(selectedFigure)
      })
    })
  }

  selectFigure(figure) {
    if (figure && figure.id) {
      window.location.hash = `#/chat?id=${figure.id}`
    }
  }

  bindEvents() {
    const searchInput = document.getElementById('search-input')
    
    if (searchInput) {
      let debounceTimer

      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer)
        
        debounceTimer = setTimeout(() => {
          this.searchKeyword = e.target.value
          this.applyFilter()
          this.renderFiguresList()
        }, 300)
      })
    }
  }

  showError() {
    const gridContainer = document.getElementById('figures-grid')
    
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>加载失败，请重试</p>
        </div>
      `
    }
  }

  destroy() {
    this.figures = []
    this.filteredFigures = []
    this.searchKeyword = ''
  }
}