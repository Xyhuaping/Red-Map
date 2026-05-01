import MapView from '../components/MapView.js'
import request from '../utils/request.js'
import { mapStore } from '../store/index.js'

export default class MapPage {
  constructor(container) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.mapView = null
    this.fences = []
    this.selectedFence = null

    this.init()
  }

  async init() {
    try {
      await this.render()
      await this.initMap()
      await this.fetchFences()
      this.bindEvents()
    } catch (error) {
      console.error('Failed to initialize map page:', error)
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="map-page">
        <div class="map-container">
          <div id="map-page-map" class="map-element"></div>
        </div>

        <div class="fence-panel" id="fence-panel">
          <div id="fence-list" class="fence-list"></div>
        </div>

        <div class="fence-detail-card" id="fence-detail" style="display: none;">
        </div>
      </div>
    `
  }

  async initMap() {
    const mapContainer = document.getElementById('map-page-map')
    
    if (!mapContainer) return

    try {
      this.mapView = new MapView(mapContainer, {
        showLocation: true,
        onMarkerClick: (fence) => this.handleMarkerClick(fence)
      })
    } catch (error) {
      console.error('Failed to initialize map:', error)
    }
  }

  async fetchFences() {
    try {
      const data = await request.get('/api/fences', {
        is_active: '',
        skip: 0,
        limit: 100
      })

      this.fences = Array.isArray(data) ? data : []
      
      if (this.mapView) {
        this.mapView.setFences(this.fences)
      }
      
      this.renderFenceList()
    } catch (error) {
      console.error('Failed to fetch fences:', error)
    }
  }

  renderFenceList() {
    const fenceListContainer = document.getElementById('fence-list')
    
    if (!fenceListContainer) return

    if (!this.fences || this.fences.length === 0) {
      fenceListContainer.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-xl); color: var(--color-text-muted);">
          暂无围栏数据
        </div>
      `
      return
    }

    fenceListContainer.innerHTML = this.fences.map(fence => `
      <div class="fence-item" data-fence-id="${fence.id}">
        <div class="fence-icon">📍</div>
        <div class="fence-info">
          <div class="fence-name">${this.escapeHtml(fence.name)}</div>
          <div class="fence-location">${fence.figure ? this.escapeHtml(fence.figure.name || '') : '未关联人物'}</div>
        </div>
        ${fence.shape_type === 'circle' ? `<span class="fence-distance">${(fence.radius || 0).toFixed(0)}m</span>` : ''}
      </div>
    `).join('')
  }

  handleMarkerClick(fence) {
    this.selectedFence = fence
    this.showFenceDetail(fence)

    const fenceItems = document.querySelectorAll('.fence-item')
    fenceItems.forEach(item => {
      item.classList.toggle('fence-item--active', item.dataset.fenceId === String(fence.id))
    })
  }

  showFenceDetail(fence) {
    const detailContainer = document.getElementById('fence-detail')
    
    if (!detailContainer || !fence) return

    detailContainer.style.display = 'block'
    detailContainer.innerHTML = `
      <button class="close-btn" id="close-fence-detail">✕</button>
      
      <div class="fence-detail-header">
        <img class="fence-detail-avatar" src="${fence.figure?.avatar_url || ''}" alt="${this.escapeHtml(fence.name)}">
        <div>
          <div class="fence-detail-title">${this.escapeHtml(fence.name)}</div>
          <div class="fence-detail-subtitle">${fence.figure ? this.escapeHtml(fence.figure.title || '') : ''}</div>
        </div>
      </div>

      <div class="fence-detail-desc">
        ${this.escapeHtml(fence.description || '暂无描述')}
      </div>

      <div class="fence-detail-actions">
        <button class="ar-start-btn" data-figure-id="${fence.figure?.id || ''}">
          开始AR游览
        </button>
      </div>
    `

    const closeBtn = detailContainer.querySelector('#close-fence-detail')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideFenceDetail())
    }

    const arBtn = detailContainer.querySelector('.ar-start-btn')
    if (arBtn) {
      arBtn.addEventListener('click', (e) => {
        const figureId = e.target.dataset.figureId
        this.startARExploration(figureId)
      })
    }
  }

  hideFenceDetail() {
    const detailContainer = document.getElementById('fence-detail')
    
    if (detailContainer) {
      detailContainer.style.display = 'none'
    }

    this.selectedFence = null

    const fenceItems = document.querySelectorAll('.fence-item')
    fenceItems.forEach(item => item.classList.remove('fence-item--active'))
  }

  startARExploration(figureId) {
    window.location.hash = `#/chat?id=${figureId || ''}`
  }

  bindEvents() {
    const fenceListContainer = document.getElementById('fence-list')
    
    if (fenceListContainer) {
      fenceListContainer.addEventListener('click', (e) => {
        const fenceItem = e.target.closest('.fence-item')
        
        if (fenceItem) {
          const fenceId = parseInt(fenceItem.dataset.fenceId)
          const fence = this.fences.find(f => f.id === fenceId)
          
          if (fence) {
            this.handleMarkerClick(fence)
            
            if (this.mapView && fence.center_lng && fence.center_lat) {
              this.mapView.centerToLocation({
                lng: fence.center_lng,
                lat: fence.center_lat
              }, 16)
            }
          }
        }
      })
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
    if (this.mapView) {
      this.mapView.destroy()
      this.mapView = null
    }

    this.fences = []
    this.selectedFence = null
  }
}