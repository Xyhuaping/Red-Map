import MapView from '../components/MapView.js'
import locationService from '../utils/location.js'
import request from '../utils/request.js'
import { mapStore, userStore } from '../store/index.js'
import { formatDate } from '../utils/helpers.js'

export default class IndexPage {
  constructor(container) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.mapView = null
    this.figures = []
    this.recentTracks = []
    this.currentAddress = '正在获取位置...'
    this.isLocating = false
    this.selectedFigure = null

    this.init()
  }

  async init() {
    try {
      await this.render()
      await this.initMap()
      await this.fetchFigures()
      await this.fetchRecentTracks()
      this.bindEvents()
    } catch (error) {
      console.error('Failed to initialize index page:', error)
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="home-page">
        <!-- Main Map Canvas -->
        <main class="map-main">
          <div class="map-container">
            <div id="index-map" class="map-element"></div>
          </div>

          <!-- TopAppBar: Location + Search + Notifications -->
          <header class="top-app-bar">
            <div class="app-bar-location">
              <span class="material-symbols-outlined location-icon">location_on</span>
              <span class="location-name" id="current-address">${this.currentAddress}</span>
            </div>
            <div class="app-bar-actions">
              <button class="icon-btn" id="search-btn" aria-label="搜索">
                <span class="material-symbols-outlined">search</span>
              </button>
              <button class="icon-btn icon-btn--discover" id="notify-btn" aria-label="发现周边">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">explore</span>
                <span class="icon-badge" id="figure-count-badge">${this.figures.length || 0}</span>
              </button>
            </div>
          </header>

          <div class="discover-popup" id="discover-popup">
            <div class="discover-popup__header">
              <span class="material-symbols-outlined discover-popup__icon" style="font-variation-settings: 'FILL' 1;">explore</span>
              <h3 class="discover-popup__title">发现周边</h3>
            </div>
            <p class="discover-popup__desc" id="fence-info">当前区域有 ${this.figures.length || 0} 个历史人物标记点</p>
            <button class="discover-popup__action" id="ar-btn">详情</button>
          </div>

          <!-- Map Controls (Right Side) -->
          <div class="map-controls">
            <button class="control-btn" id="zoom-in-btn" aria-label="放大">
              <span class="material-symbols-outlined">add</span>
            </button>
            <button class="control-btn" id="zoom-out-btn" aria-label="缩小">
              <span class="material-symbols-outlined">remove</span>
            </button>
            <div class="control-divider"></div>
            <button class="control-btn control-btn--primary" id="relocate-btn" aria-label="重新定位">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">my_location</span>
            </button>
          </div>

          <!-- Recent Tracks Preview (Optional - below summary card) -->
          <div class="tracks-preview" id="tracks-preview">
            <div id="tracks-list"></div>
          </div>
        </main>



        <!-- Bottom Navigation Bar -->
        <nav class="bottom-nav">
          <a class="nav-item nav-item--active" href="#/" data-route="/">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">home</span>
            <span class="nav-label">首页</span>
          </a>
          <a class="nav-item" href="#/stats" data-route="/stats">
            <span class="material-symbols-outlined">bar_chart</span>
            <span class="nav-label">统计</span>
          </a>
          <a class="nav-item" href="#/profile" data-route="/profile">
            <span class="material-symbols-outlined">person</span>
            <span class="nav-label">我的</span>
          </a>
        </nav>

      </div>
    `
  }

  async initMap() {
    const mapContainer = document.getElementById('index-map')
    
    if (!mapContainer) return

    try {
      this.mapView = new MapView(mapContainer, {
        showLocation: true,
        onLocationUpdate: (location) => this.handleLocationUpdate(location),
        onMarkerClick: (figure) => this.handleMarkerClick(figure)
      })

      const location = mapStore.state.currentLocation
      
      if (location && location.address) {
        this.updateAddress(location.address)
      }
    } catch (error) {
      console.error('Failed to initialize map:', error)
      this.updateAddress('地图加载失败，使用默认位置')
    }
  }

  async fetchFigures() {
    try {
      const data = await request.get('/api/figures', { 
        skip: 0, 
        limit: 100 
      })
      
      this.figures = Array.isArray(data) ? data : []

      this.updateFigureCount()

      if (this.mapView) {
        this.renderFigureMarkers()
      }
    } catch (error) {
      console.error('Failed to fetch figures:', error)
    }
  }

  renderFigureMarkers() {
    if (!this.mapView || !Array.isArray(this.figures)) return

    const markersData = this.figures.map(figure => ({
      lng: figure.location?.lng || 0,
      lat: figure.location?.lat || 0,
      title: figure.name,
      icon: figure.avatar_url || '',
      onClick: () => this.handleMarkerClick(figure)
    })).filter(marker => marker.lng !== 0 && marker.lat !== 0)

    if (markersData.length > 0) {
      markersData.forEach(markerData => {
        this.mapView.addMarker(
          { lng: markerData.lng, lat: markerData.lat },
          {
            title: markerData.title,
            icon: markerData.icon,
            onClick: markerData.onClick
          }
        )
      })
    }
  }

  async fetchRecentTracks() {
    if (!userStore.state.isLoggedIn) return

    try {
      const data = await request.get('/api/tracks/my', {
        page: 1,
        page_size: 5
      })

      this.recentTracks = Array.isArray(data?.items) ? data.items : []
      this.renderTracksList()
    } catch (error) {
      console.error('Failed to fetch recent tracks:', error)
    }
  }

  renderTracksList() {
    const tracksContainer = document.getElementById('tracks-list')
    const tracksPreview = document.getElementById('tracks-preview')

    if (!tracksContainer) return

    if (!this.recentTracks || this.recentTracks.length === 0) {
      if (tracksPreview) {
        tracksPreview.style.display = 'none'
      }
      return
    }

    if (tracksPreview) {
      tracksPreview.style.display = 'block'
    }

    tracksContainer.innerHTML = this.recentTracks.slice(0, 2).map(track => `
      <div class="track-item" data-track-id="${track.id}">
        <div class="track-info">
          <span class="track-title">${this.escapeHtml(track.figure_name || '未知景点')}</span>
          <span class="track-meta">${formatDate(track.triggered_at)} · ${track.interaction_duration || 0}分钟</span>
        </div>
        <span class="material-symbols-outlined track-arrow">chevron_right</span>
      </div>
    `).join('')
  }

  bindEvents() {
    const notifyBtn = document.getElementById('notify-btn')
    const discoverPopup = document.getElementById('discover-popup')

    // AR/Details Button
    const arBtn = document.getElementById('ar-btn')
    if (arBtn) {
      arBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (discoverPopup) discoverPopup.classList.remove('discover-popup--visible')
        if (notifyBtn) notifyBtn.classList.remove('icon-btn--active')
        this.startARExploration()
      })
    }

    // Relocate Button (in map controls)
    const relocateBtn = document.getElementById('relocate-btn')
    if (relocateBtn) {
      relocateBtn.addEventListener('click', () => this.relocate())
    }

    // Zoom Controls
    const zoomInBtn = document.getElementById('zoom-in-btn')
    const zoomOutBtn = document.getElementById('zoom-out-btn')

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => this.zoomIn())
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.zoomOut())
    }

    // Search Button (placeholder)
    const searchBtn = document.getElementById('search-btn')
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.showToast('搜索功能开发中...', 'info')
      })
    }

    // Discover Popup Toggle
    if (notifyBtn && discoverPopup) {
      notifyBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        discoverPopup.classList.toggle('discover-popup--visible')
        notifyBtn.classList.toggle('icon-btn--active')
      })
      document.addEventListener('click', (e) => {
        if (!discoverPopup.contains(e.target) && !notifyBtn.contains(e.target)) {
          discoverPopup.classList.remove('discover-popup--visible')
          notifyBtn.classList.remove('icon-btn--active')
        }
      })
    }

    // Bottom Navigation
    const navItems = document.querySelectorAll('.nav-item')
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const route = item.dataset.route
        if (route) {
          window.location.hash = `#${route}`
        }
      })
    })

    // Track Items (if rendered)
    const trackItems = document.querySelectorAll('.track-item')
    trackItems.forEach(item => {
      item.addEventListener('click', () => {
        const trackId = item.dataset.trackId
        this.viewTrack(trackId)
      })
    })
  }

  handleLocationUpdate(location) {
    if (location && location.address) {
      this.updateAddress(location.address)
    }
  }

  handleMarkerClick(figure) {
    this.selectedFigure = figure
    
    if (this.mapView && figure.location) {
      this.mapView.centerToLocation(figure.location)
    }
  }

  updateAddress(address) {
    const addressElement = document.getElementById('current-address')
    
    if (addressElement) {
      addressElement.textContent = address || '位置信息获取中...'
    }
  }

  updateFigureCount() {
    const count = this.figures.length || 0
    const badge = document.getElementById('figure-count-badge')
    const fenceInfo = document.getElementById('fence-info')

    if (badge) {
      badge.textContent = count
      badge.style.display = count > 0 ? 'flex' : 'none'
    }
    if (fenceInfo) {
      fenceInfo.textContent = `当前区域有 ${count} 个历史人物标记点`
    }
  }

  async relocate() {
    if (this.isLocating) return

    this.isLocating = true
    const relocateBtn = document.getElementById('relocate-btn')
    if (relocateBtn) {
      relocateBtn.classList.add('control-btn--loading')
      relocateBtn.innerHTML = '<div class="loading-spinner"></div>'
    }
    this.updateAddress('正在重新定位...')

    try {
      const location = await locationService.getCurrentLocation({
        fallbackToDefault: true,
        fallbackToBrowser: true
      })

      if (location) {
        this.updateAddress(location.address || '定位成功')

        if (this.mapView) {
          this.mapView.centerToLocation(location)
        }

        this.showToast('定位成功', 'success')
      } else {
        this.updateAddress('定位失败，请重试')
        this.showToast('定位失败', 'error')
      }
    } catch (error) {
      console.error('Relocation failed:', error)
      this.updateAddress('定位失败，请重试')
      this.showToast('定位失败', 'error')
    } finally {
      this.isLocating = false
      if (relocateBtn) {
        relocateBtn.classList.remove('control-btn--loading')
        relocateBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">my_location</span>'
      }
    }
  }

  zoomIn() {
    if (this.mapView) {
      const currentZoom = this.mapView.getZoom()
      this.mapView.setZoom(Math.min(currentZoom + 1, 18))
    }
  }

  zoomOut() {
    if (this.mapView) {
      const currentZoom = this.mapView.getZoom()
      this.mapView.setZoom(Math.max(currentZoom - 1, 3))
    }
  }

  startARExploration() {
    const figureId = this.selectedFigure?.id || ''
    window.location.hash = `#/chat?id=${figureId}`
  }

  viewTrack(trackId) {
    window.location.hash = '#/stats'
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast toast--${type}`
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: ${type === 'success' ? '#52C41A' : type === 'error' ? '#F5222D' : '#1890FF'};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideDown 0.3s ease-out;
    `
    toast.textContent = message

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease-in forwards'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 2000)
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

    this.figures = []
    this.recentTracks = []
    this.selectedFigure = null
  }
}